"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

const DashboardRealData = dynamic(
  () =>
    import("./DashboardRealData").then((mod) => mod.DashboardRealData),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 w-full flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        <span className="mt-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          Gathering database analytics...
        </span>
      </div>
    ),
  },
);

export function MainDashboardView() {
  const [firstName, setFirstName] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");

  useEffect(() => {
    // Determine the standard time-of-day greeting
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Good Morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }

    // Fetch profile details to show the first name
    async function fetchUserProfile() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.email) {
          const res = await fetch(`/api/profile?email=${encodeURIComponent(authUser.email)}`);
          const data = await res.json();
          if (data.success && data.user) {
            const rawName = data.user.firstName || "";
            const firstWord = rawName.trim().split(" ")[0];
            if (firstWord) {
              setFirstName(firstWord.charAt(0).toUpperCase() + firstWord.slice(1));
            } else {
              const fallback = authUser.email.split("@")[0];
              setFirstName(fallback.charAt(0).toUpperCase() + fallback.slice(1));
            }
          } else {
            const fallback = authUser.email.split("@")[0];
            setFirstName(fallback.charAt(0).toUpperCase() + fallback.slice(1));
          }
        }
      } catch (err) {
        console.error("Error fetching user profile for dashboard greeting:", err);
      }
    }

    fetchUserProfile();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10"
    >
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Dashboard</p>
        <h1 className="mt-1.5 font-heading text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[1.75rem] dark:text-zinc-50">
          {greeting || "Welcome"}{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-650 dark:text-zinc-400">
          Real-time metrics, project progression trackers, and support tickets from your current workspace. Expand advanced analytics to see priority allocation, workload depth, and status distributions.
        </p>
      </div>

      <DashboardRealData />
    </motion.div>
  );
}
