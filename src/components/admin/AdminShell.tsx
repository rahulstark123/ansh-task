"use client";

import {
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

export type AdminSection = "tickets" | "dashboard" | "subscriptions";

type AdminShellProps = {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  onLogout: () => void;
  children: React.ReactNode;
};

const NAV_ITEMS: { id: AdminSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "tickets", label: "Support Tickets", icon: ChatBubbleLeftRightIcon },
  { id: "dashboard", label: "Dashboard", icon: Squares2X2Icon },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCardIcon },
];

export function AdminShell({ activeSection, onSectionChange, onLogout, children }: AdminShellProps) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-white/10 bg-[#0f1424]">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
            <ShieldCheckIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">ANSH Admin</p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Support Desk</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onSectionChange(id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                activeSection === id
                  ? "bg-violet-600/20 text-violet-300"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
