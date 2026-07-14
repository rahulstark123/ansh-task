import { BadgeCheck, Building2, ShieldCheck } from "lucide-react";
import { GSTIN, UDYAM_REGISTRATION_NUMBER } from "@/lib/site";

type TrustComplianceProps = {
  showDescription?: boolean;
  compact?: boolean;
};

export function TrustCompliance({
  showDescription = true,
  compact = false,
}: TrustComplianceProps) {
  if (compact) {
    return (
      <section
        id="trust-compliance"
        className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/40"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-violet-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Trust & Compliance
            </p>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              MSME Registered Enterprise
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              Government of India Udyam Registered
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="trust-compliance"
      className="rounded-3xl border border-zinc-200/80 bg-white/75 p-6 shadow-sm backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-900/45 sm:p-8"
    >
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-violet-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Trust & Compliance
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Trust & Compliance
          </h2>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-700 dark:text-violet-400">
            <Building2 className="h-3.5 w-3.5" />
            MSME Compliance
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            MSME Registered Enterprise
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Government of India Udyam Registered
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <div className="w-fit max-w-full rounded-xl border border-zinc-200/70 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Udyam Registration Number
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {UDYAM_REGISTRATION_NUMBER}
              </p>
            </div>
            <div className="w-fit max-w-full rounded-xl border border-zinc-200/70 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                GSTIN
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {GSTIN}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-700 dark:text-violet-400">
            <BadgeCheck className="h-3.5 w-3.5" />
            Brand Positioning
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Built for Bharat, Ready for the World
          </h3>
          {showDescription && (
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              ANSH Apps is a Government of India MSME-registered software company
              building simple, affordable, and modern business software for teams,
              startups, and growing businesses.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
