import Link from "next/link";
import { ShieldCheck } from "lucide-react";

type MsmeBadgeProps = {
  href?: string;
  className?: string;
};

export function MsmeBadge({
  href = "/#trust-compliance",
  className = "",
}: MsmeBadgeProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-start gap-2 rounded-lg border border-zinc-200/80 bg-zinc-100/70 px-2.5 py-2 text-left transition-colors hover:bg-zinc-100 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:hover:bg-zinc-900 ${className}`}
      aria-label="View MSME trust and compliance details"
    >
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-violet-400" />
      <span className="space-y-0.5">
        <span className="block text-[10px] font-semibold leading-tight text-zinc-700 dark:text-zinc-200">
          MSME Registered Enterprise
        </span>
        <span className="block text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">
          Government of India Udyam Registered
        </span>
      </span>
    </Link>
  );
}
