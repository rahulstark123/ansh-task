"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import posthog from "posthog-js";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying session...");

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        // Wait for session to resolve
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        let currentUser = session?.user;

        if (!currentUser) {
          // If no session is found, check if supabase can extract the user directly
          setStatus("Establishing authentication...");
          const { data: { user } } = await supabase.auth.getUser();
          currentUser = user || undefined;
        }

        if (!currentUser) {
          router.push("/login");
          return;
        }

        setStatus("Checking workspace status...");
        const email = currentUser.email;
        if (!email) {
          router.push("/login");
          return;
        }

        // Identify OAuth users and track successful callback login.
        posthog.identify(currentUser.id, {
          email,
          provider: "google",
        });
        posthog.capture("user_logged_in", {
          method: "google_oauth",
          email,
        });

        // Fetch user from DB to check if they have a workspace
        const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
        const json = await res.json();

        if (json.success && json.user && json.user.workspaceId) {
          sessionStorage.setItem("ansh_onboarding_wid", String(json.user.workspaceId));
          sessionStorage.setItem("ansh_user_role", (json.user.role || "editor").toLowerCase());
          // Existing user with workspace -> redirect to dashboard
          setStatus("Workspace found, redirecting to Dashboard...");
          router.push("/dashboard");
        } else {
          // New user -> prepare onboarding state in sessionStorage and redirect to onboarding
          setStatus("Setting up onboarding wizard...");
          sessionStorage.removeItem("ansh_onboarding_wid");
          sessionStorage.removeItem("ansh_user_role");
          sessionStorage.setItem("ansh_onboarding_name", currentUser.user_metadata?.full_name || email.split("@")[0]);
          sessionStorage.setItem("ansh_onboarding_email", email);
          sessionStorage.setItem("ansh_onboarding_uid", currentUser.id);
          router.push("/onboarding");
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        router.push(`/login?error=${encodeURIComponent(err.message || "Authentication failed")}`);
      }
    }

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-zinc-150">
      <div className="flex flex-col items-center gap-4 text-center p-6">
        <ArrowPathIcon className="h-10 w-10 animate-spin text-teal-400" />
        <h3 className="font-heading text-lg font-bold text-white">Completing authentication</h3>
        <p className="text-xs text-zinc-400 max-w-xs">{status}</p>
      </div>
    </div>
  );
}
