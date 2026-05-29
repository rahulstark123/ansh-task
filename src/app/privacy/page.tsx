import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | ANSH Task",
  description: "Privacy Policy for ANSH Task — how we collect, use, and protect your data.",
};

const SECTIONS = [
  {
    title: "1. Introduction",
    content: (
      <p>
        This Privacy Policy explains how ANSH Task collects, uses, stores, and protects personal
        data when you use our website and services.
      </p>
    ),
  },
  {
    title: "2. Information We Collect",
    content: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <span className="font-semibold text-slate-800">Account information:</span> name, email
          address, profile details.
        </li>
        <li>
          <span className="font-semibold text-slate-800">Workspace information:</span> projects,
          tasks, team members, documents, support tickets, and collaboration activity.
        </li>
        <li>
          <span className="font-semibold text-slate-800">Payment metadata:</span> transaction IDs,
          subscription status, billing timestamps.
        </li>
        <li>
          <span className="font-semibold text-slate-800">Technical data:</span> device/browser data,
          IP-derived region, logs, and diagnostics.
        </li>
      </ul>
    ),
  },
  {
    title: "3. How We Use Data",
    content: (
      <ul className="list-disc space-y-2 pl-5">
        <li>To provide task management, collaboration, and account features.</li>
        <li>To process subscriptions and payment verification.</li>
        <li>To send confirmations, service updates, and support communications.</li>
        <li>To improve reliability, security, and product experience.</li>
      </ul>
    ),
  },
  {
    title: "4. Legal Basis and Consent",
    content: (
      <p>
        Where required, we process personal data based on consent, contractual necessity, legal
        obligations, or legitimate business interests. You may withdraw consent where applicable.
      </p>
    ),
  },
  {
    title: "5. Data Sharing",
    content: (
      <p>
        We may share data with trusted service providers required to deliver core features (for
        example, authentication, hosting, email, calendar, or payments), subject to contractual
        safeguards.
      </p>
    ),
  },
  {
    title: "6. Data Retention",
    content: (
      <p>
        We retain personal data only as long as necessary for service delivery, legal compliance,
        dispute resolution, and security. Data may be deleted or anonymized when no longer
        required.
      </p>
    ),
  },
  {
    title: "7. Your Rights",
    content: (
      <>
        <p>
          Subject to applicable law, you may request access, correction, or deletion of your
          personal data.
        </p>
        <p className="mt-3">
          For requests, contact{" "}
          <a
            href="mailto:support@anshapps.com"
            className="font-semibold text-teal-700 underline decoration-teal-700/30 underline-offset-2 hover:text-teal-800"
          >
            support@anshapps.com
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "8. Security",
    content: (
      <p>
        We implement reasonable technical and organizational safeguards to protect personal data
        from unauthorized access, loss, misuse, or alteration.
      </p>
    ),
  },
  {
    title: "9. India-Specific Compliance Note",
    content: (
      <p>
        We aim to align privacy operations with applicable Indian law, including relevant
        requirements under the Information Technology Act, 2000 and India&apos;s evolving digital
        personal data protection framework.
      </p>
    ),
  },
  {
    title: "10. Billing and Refund Clarification",
    content: (
      <p>
        Payment and subscription terms (including cancellation and refund position) are described
        in our{" "}
        <Link
          href="/terms"
          className="font-semibold text-teal-700 underline decoration-teal-700/30 underline-offset-2 hover:text-teal-800"
        >
          Terms &amp; Conditions
        </Link>
        . For clarity, ANSH Task does not provide refunds for
        user-initiated subscription cancellation or account deletion.
      </p>
    ),
  },
  {
    title: "11. Policy Updates",
    content: (
      <p>
        We may update this policy from time to time. Material updates will be reflected on this
        page with a revised &quot;Last updated&quot; date.
      </p>
    ),
  },
] as const;

export default function PrivacyPolicyPage() {
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
              Privacy Policy
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
