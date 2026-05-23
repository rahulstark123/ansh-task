import type { Metadata } from "next";
import { LandingPageClient } from "@/components/landing/LandingPageClient";

export const metadata: Metadata = {
  title: "ANSH Task - The Modern Collaborative Workspace for Fast Teams",
  description: "Organize tasks using interactive Kanban boards, map thoughts on freeform Brain Boards, write process specs in the Documents Hub, and customize your layout color themes. Built for high-performance teams.",
  keywords: [
    "task management",
    "kanban board",
    "brain board",
    "collaboration workspace",
    "document sharing",
    "team space",
    "project tracker",
  ],
  openGraph: {
    title: "ANSH Task - The Modern Collaborative Workspace for Fast Teams",
    description: "Merges tasks, projects, collaborative brain boards, and documents into a single, high-performance command center.",
    type: "website",
  },
};

export default function LandingPage() {
  return <LandingPageClient />;
}
