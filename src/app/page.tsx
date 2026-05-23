import type { Metadata } from "next";
import { LandingPageClient } from "@/components/landing/LandingPageClient";

export const metadata: Metadata = {
  title: "ANSH Task - The Ultimate Task Management App & Project Workspace",
  description: "Streamline team workflows with ANSH Task, a modern project management app. Coordinate tasks with Kanban boards, brainstorm on Brain Boards, and write specs in the Docs Hub. Try it for free!",
  keywords: [
    "task app",
    "project management apps",
    "task management apps",
    "best project management tools",
    "collaborative workspace",
    "kanban board app",
    "team collaboration software",
    "free task tracker",
    "brain board app",
    "remote team organization tool",
  ],
  openGraph: {
    title: "ANSH Task - The Ultimate Task Management App & Project Workspace",
    description: "Merges tasks, projects, collaborative brain boards, and documents into a single, high-performance command center.",
    type: "website",
  },
};

export default function LandingPage() {
  return <LandingPageClient />;
}
