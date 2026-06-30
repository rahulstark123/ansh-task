import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ANSH Admin | Support Desk",
  robots: "noindex, nofollow",
};

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0b0f1a] text-zinc-100">
      {children}
    </div>
  );
}
