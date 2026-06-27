import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parseOptionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const email = searchParams.get("email");

    if (!id && !email) {
      return NextResponse.json(
        { success: false, error: "Either id or email parameter is required" },
        { status: 400 }
      );
    }

    let user = null;
    if (id) {
      user = await prisma.user.findUnique({ where: { id } });
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            firstName: email.split("@")[0],
            lastName: "",
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
          },
        });
      }
    }

    return NextResponse.json({ success: true, user });
  } catch (err: unknown) {
    console.error("Error in profile GET API:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      firstName,
      lastName,
      phone,
      jobTitle,
      designation,
      department,
      timezone,
      language,
      bio,
      avatar,
      dateOfBirth,
      bloodGroup,
      personalEmail,
      emergencyContactName,
      emergencyContactPhone,
      employeeCode,
      officeBranch,
      workLocation,
      joiningDate,
      employmentStatus,
      reportsTo,
      reportingHr,
    } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required to update profile" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        firstName,
        lastName,
        phone,
        jobTitle,
        designation,
        department,
        timezone,
        language,
        bio,
        avatar,
        dateOfBirth: parseOptionalDate(dateOfBirth),
        bloodGroup,
        personalEmail,
        emergencyContactName,
        emergencyContactPhone,
        employeeCode,
        officeBranch,
        workLocation,
        joiningDate: parseOptionalDate(joiningDate),
        employmentStatus,
        reportsTo,
        reportingHr,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: unknown) {
    console.error("Error in profile PATCH API:", err);
    const message = err instanceof Error ? err.message : "Failed to update profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
