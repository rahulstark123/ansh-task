import type { Metadata } from "next";
import { buildSiteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSiteMetadata({
  title: "Log In",
  description:
    "Sign in to ANSH Tasks — your workspace for Kanban boards, brain boards, activity feed, and project management.",
  path: "/login",
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
