import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSmtpConfigured, sendContactEmailViaSmtp } from "@/lib/email/smtp";

export const dynamic = "force-dynamic";

const SUPPORT_EMAIL = process.env.CONTACT_TO_EMAIL || "support@anshapps.com";

type ContactBody = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

async function sendViaResend(name: string, email: string, subject: string, message: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from = process.env.CONTACT_FROM_EMAIL || "ANSH Task <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [SUPPORT_EMAIL],
      reply_to: email,
      subject: `[Contact] ${subject}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    }),
  });

  return res.ok;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContactBody;
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const subject = body.subject?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: "Name, email, subject, and message are required." },
        { status: 400 }
      );
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const submission = await prisma.contactUs.create({
      data: { name, email, subject, message },
    });

    let sentViaEmail = false;

    if (isSmtpConfigured()) {
      const smtpResult = await sendContactEmailViaSmtp(name, email, subject, message);
      sentViaEmail = smtpResult.ok;
      if (!smtpResult.ok) {
        console.error("Contact form: SMTP failed but submission saved:", smtpResult.error);
      }
    } else {
      console.warn("Contact form: SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Submission saved to database only.");
    }

    if (!sentViaEmail) {
      sentViaEmail = await sendViaResend(name, email, subject, message);
    }

    if (sentViaEmail) {
      await prisma.contactUs.update({
        where: { id: submission.id },
        data: { emailSent: true },
      });
    }

    return NextResponse.json({
      success: true,
      saved: true,
      sentViaEmail,
      supportEmail: SUPPORT_EMAIL,
    });
  } catch (err: unknown) {
    console.error("Contact API error:", err);
    const message = err instanceof Error ? err.message : "Failed to send message";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
