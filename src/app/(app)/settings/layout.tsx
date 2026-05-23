import { SettingsSideNav } from "@/components/settings/SettingsSideNav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row lg:px-10">
      <SettingsSideNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
