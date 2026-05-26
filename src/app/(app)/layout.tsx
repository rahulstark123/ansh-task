import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { AppTopBar } from "@/components/dashboard/AppTopBar";
import { AppearanceDrawer } from "@/components/dashboard/AppearanceDrawer";
import { PermissionRouteGuard } from "@/components/permissions/PermissionRouteGuard";
import { PermissionDeniedModal } from "@/components/permissions/PermissionDeniedModal";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1">
      <AppSidebar />
      <div className="app-main-column flex min-w-0 flex-1 flex-col dark:bg-transparent">
        <AppTopBar />
        <PermissionRouteGuard />
        <main className="flex-1">{children}</main>
      </div>
      <AppearanceDrawer />
      <PermissionDeniedModal />
    </div>
  );
}
