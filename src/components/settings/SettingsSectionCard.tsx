import type { ReactNode } from "react";

export function SettingsPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-zinc-200/70 pb-6 dark:border-white/5 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--app-primary)]">
          {eyebrow}
        </p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

export function SettingsSectionCard({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/[0.06] dark:bg-zinc-900/40">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          {icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
              {icon}
            </span>
          )}
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function SettingsInfoGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">{children}</div>
  );
}

export function SettingsInfoItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-4 py-3 dark:border-white/[0.04] dark:bg-zinc-950/20">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">{value}</p>
    </div>
  );
}

export function SettingsSubheading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
      {children}
    </h3>
  );
}

export function SettingsFieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
      {children}
    </label>
  );
}

export const settingsInputClass =
  "w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 px-3 text-xs font-semibold text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-[var(--app-primary)] focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100";
