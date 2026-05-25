"use client";

import { usePathname } from "next/navigation";
import { SettingsSideNav } from "@/components/settings/SettingsSideNav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDefaultsPage = pathname?.startsWith("/settings/defaults");

  return (
    <div className="mx-auto flex max-w-[1600px] w-full flex-col gap-8 px-6 py-10 lg:flex-row lg:px-10">
      {!isDefaultsPage && <SettingsSideNav />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
