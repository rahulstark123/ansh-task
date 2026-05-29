import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | ANSH Task",
  description: "Terms and Conditions for using ANSH Task.",
};

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content: (
      <p>
        These Terms &amp; Conditions govern your use of ANSH Task, including our website, web
        application, and related services. By using ANSH Task, you agree to these terms.
      </p>
    ),
  },
  {
    title: "2. Service Description",
    content: (
      <p>
        ANSH Task is a task management and team collaboration platform for individuals and
        businesses. Features may include projects, Kanban boards, Brain Boards, documents, Team
        Space, permissions, subscription billing, support tickets, and analytics.
      </p>
    ),
  },
  {
    title: "3. Account Responsibility",
    content: (
      <p>
        You are responsible for all activity under your account, including the security of your
        credentials and the accuracy of information you provide. You must promptly report
        unauthorized access.
      </p>
    ),
  },
  {
    title: "4. Subscription, Billing, and Renewal",
    content: (
      <p>
        Paid plans are billed in advance via our payment partner. You authorize us (and our payment
        processor) to charge applicable subscription fees, taxes, and related charges. Pricing,
        feature limits, and plan terms may be updated with prior notice.
      </p>
    ),
  },
  {
    title: "5. Cancellation and No-Refund Policy",
    content: (
      <>
        <p>
          You may cancel your subscription at any time. Your access to paid features continues
          until the end of the current billing cycle. However, all fees paid are non-refundable.
        </p>
        <p className="mt-3 font-semibold text-slate-800">No refunds are provided for:</p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Subscription cancellation by the user.</li>
          <li>Account deletion by the user.</li>
          <li>Partial usage or non-usage during an active billing period.</li>
        </ul>
      </>
    ),
  },
  {
    title: "6. Acceptable Use",
    content: (
      <p>
        You must not misuse the service, attempt unauthorized access, reverse engineer critical
        components, distribute malware, or use the platform in violation of applicable law.
      </p>
    ),
  },
  {
    title: "7. Data, Privacy, and Compliance",
    content: (
      <p>
        Your use of the service is also governed by our{" "}
        <Link
          href="/privacy"
          className="font-semibold text-teal-700 underline decoration-teal-700/30 underline-offset-2 hover:text-teal-800"
        >
          Privacy Policy
        </Link>
        . We follow applicable Indian legal requirements, including relevant provisions under the
        Information Technology Act, 2000 and evolving requirements under India&apos;s Digital
        Personal Data Protection framework.
      </p>
    ),
  },
  {
    title: "8. Service Availability",
    content: (
      <p>
        We aim for reliable availability but do not guarantee uninterrupted service. We may perform
        maintenance, updates, and emergency fixes that can temporarily affect access.
      </p>
    ),
  },
  {
    title: "9. Limitation of Liability",
    content: (
      <p>
        To the maximum extent permitted by law, ANSH Task is not liable for indirect, incidental,
        special, or consequential damages. Our aggregate liability for claims related to paid
        services is limited to the subscription fees paid by you for the affected billing cycle.
      </p>
    ),
  },
  {
    title: "10. Governing Law and Jurisdiction",
    content: (
      <p>
        These terms are governed by the laws of India. Courts with competent jurisdiction in India
        will have jurisdiction over disputes arising out of these terms.
      </p>
    ),
  },
  {
    title: "11. Contact",
    content: (
      <p>
        For legal, billing, or policy questions, contact us at{" "}
        <a
          href="mailto:support@anshapps.com"
          className="font-semibold text-teal-700 underline decoration-teal-700/30 underline-offset-2 hover:text-teal-800"
        >
          support@anshapps.com
        </a>
        .
      </p>
    ),
  },
] as const;

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f4f6f8] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 text-center text-xs font-medium text-slate-500">
          <Link href="/" className="hover:text-teal-700">
            ← Back to ANSH Task
          </Link>
        </p>

        <article className="rounded-2xl border border-slate-200/80 bg-white px-6 py-10 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:px-10 sm:py-12">
          <header className="border-b border-slate-100 pb-8">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
              Terms &amp; Conditions
            </h1>
            <p className="mt-2 text-sm text-slate-500">Last updated: 16 April 2026</p>
          </header>

          <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-slate-600">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="mb-3 text-base font-bold text-[#0f172a]">{section.title}</h2>
                <div>{section.content}</div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
