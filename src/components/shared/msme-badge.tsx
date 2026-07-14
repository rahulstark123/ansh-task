import Link from "next/link";
import { BadgeCheck, Building2, Receipt } from "lucide-react";
import { GSTIN, UDYAM_REGISTRATION_NUMBER } from "@/lib/site";

export { GSTIN, UDYAM_REGISTRATION_NUMBER };

type MsmeBadgeProps = {
  href?: string;
  className?: string;
};

/** Compact MSME registration chip (footer / trust strip). */
export function MsmeBadge({
  href = "/#trust-compliance",
  className = "",
}: MsmeBadgeProps) {
  return (
    <Link
      href={href}
      className={`inline-flex w-fit max-w-full items-start gap-2.5 rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-900 ${className}`}
      aria-label="View MSME trust and compliance details"
    >
      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
      <span className="space-y-0.5">
        <span className="block text-[11px] font-semibold leading-tight text-zinc-800 dark:text-zinc-100">
          MSME Registered Enterprise
        </span>
        <span className="block text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">
          Government of India Udyam Registered
        </span>
      </span>
    </Link>
  );
}

type UdyamNumberBadgeProps = {
  href?: string;
  className?: string;
};

/** Udyam registration number chip. */
export function UdyamNumberBadge({
  href = "/#trust-compliance",
  className = "",
}: UdyamNumberBadgeProps) {
  return (
    <Link
      href={href}
      className={`inline-flex w-fit max-w-full items-center gap-2.5 rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-900 ${className}`}
      aria-label={`Udyam registration number ${UDYAM_REGISTRATION_NUMBER}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-500 dark:bg-violet-500/20 dark:text-violet-400">
        <BadgeCheck className="h-4 w-4" />
      </span>
      <span className="min-w-0 space-y-0.5">
        <span className="block text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          Udyam Registration Number
        </span>
        <span className="block font-mono text-[12px] font-bold tracking-wide text-zinc-900 dark:text-zinc-50">
          {UDYAM_REGISTRATION_NUMBER}
        </span>
      </span>
    </Link>
  );
}

type GstinBadgeProps = {
  href?: string;
  className?: string;
};

/** GSTIN chip. */
export function GstinBadge({
  href = "/#trust-compliance",
  className = "",
}: GstinBadgeProps) {
  return (
    <Link
      href={href}
      className={`inline-flex w-fit max-w-full items-center gap-2.5 rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-900 ${className}`}
      aria-label={`GSTIN ${GSTIN}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
        <Receipt className="h-4 w-4" />
      </span>
      <span className="min-w-0 space-y-0.5">
        <span className="block text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          GSTIN
        </span>
        <span className="block font-mono text-[12px] font-bold tracking-wide text-zinc-900 dark:text-zinc-50">
          {GSTIN}
        </span>
      </span>
    </Link>
  );
}
