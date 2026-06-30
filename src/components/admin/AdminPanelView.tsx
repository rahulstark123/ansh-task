"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ensureAdminSession } from "@/lib/admin-client";
import { AdminShell, type AdminSection } from "@/components/admin/AdminShell";
import { AdminTicketsView } from "@/components/admin/AdminTicketsView";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";
import { AdminBillingView } from "@/components/admin/AdminBillingView";

export function AdminPanelView() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>("tickets");

  useEffect(() => {
    ensureAdminSession().then((ok) => {
      if (!ok) {
        router.replace("/adminpanel/login");
        return;
      }
      setAuthReady(true);
    });
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    await supabase.auth.signOut();
    router.replace("/adminpanel/login");
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <AdminShell
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      onLogout={handleLogout}
    >
      {activeSection === "tickets" && <AdminTicketsView />}
      {activeSection === "dashboard" && <AdminDashboardView />}
      {activeSection === "subscriptions" && <AdminBillingView />}
    </AdminShell>
  );
}
