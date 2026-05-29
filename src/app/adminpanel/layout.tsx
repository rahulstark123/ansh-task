import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Admin | ANSH Task",
  robots: "noindex, nofollow",
};

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {children}
    </div>
  );
}
