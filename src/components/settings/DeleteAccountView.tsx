"use client";

import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { SettingsPageHeader } from "@/components/settings/SettingsSectionCard";

export function DeleteAccountView() {
  return (
    <div className="space-y-8">
      <SettingsPageHeader
        eyebrow="Account Settings"
        title="Delete Account"
        description="Request permanent deletion of your ANSH Task account and associated data."
      />

      <div className="max-w-4xl">
        <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/[0.06] dark:bg-zinc-900/40">
          {/* Card Header */}
          <div className="flex items-center gap-3.5 border-b border-zinc-100 px-6 py-5 dark:border-white/[0.05]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/20 dark:text-red-400">
              <UserXIcon className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
              DELETE YOUR ANSH TASK ACCOUNT
            </h2>
          </div>

          {/* Card Content */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                If you would like to delete your ANSH Task account and associated data, please send an email from your registered email address to:
              </p>

              <div>
                <a
                  href="mailto:support@anshapps.com?subject=Account%20Deletion%20Request"
                  className="inline-flex items-center gap-2 rounded-2xl border border-teal-200/80 bg-teal-50/30 px-5 py-3 text-sm font-bold text-teal-600 transition-all hover:bg-teal-50/70 hover:border-teal-300 dark:border-teal-500/20 dark:bg-teal-950/10 dark:text-teal-400 dark:hover:bg-teal-950/20"
                >
                  <EnvelopeIcon className="h-4.5 w-4.5" />
                  support@anshapps.com
                </a>
              </div>

              <div className="space-y-1.5 text-sm">
                <p className="text-zinc-600 dark:text-zinc-400">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">Subject:</span> Account Deletion Request
                </p>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                  Our team will verify your request and process account deletion within 7 business days.
                </p>
              </div>
            </div>

            <hr className="border-zinc-200/60 dark:border-white/5" />

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                UPON SUCCESSFUL DELETION:
              </h3>
              <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                  Your account will be permanently deleted.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                  Your profile information will be removed.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                  Your authentication credentials will be deleted.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                  Any active subscription will be cancelled and revoked.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                  Any personal data associated with your account will be removed from our systems.
                </li>
              </ul>
            </div>

            <hr className="border-zinc-200/60 dark:border-white/5" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                If you have any questions regarding account deletion, please contact us at{" "}
                <a
                  href="mailto:support@anshapps.com"
                  className="font-semibold text-teal-600 hover:underline dark:text-teal-400"
                >
                  support@anshapps.com
                </a>
                .
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 shrink-0 self-start sm:self-center">
                LAST UPDATED: JUNE 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserXIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className={className}
    >
      {/* Head */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
      />
      {/* Body with gap on right for the X */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 20.118a7.5 7.5 0 0 1 11.233-6.24"
      />
      {/* X symbol */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.25 16.5l4.5 4.5m0-4.5l-4.5 4.5"
      />
    </svg>
  );
}
