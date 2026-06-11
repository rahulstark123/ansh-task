import type { Metadata } from "next";
import { buildSiteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSiteMetadata({
  title: "Sign Up Free",
  description:
    "Create your free ANSH Tasks workspace. Kanban task boards, brain boards, and project management built for MSME teams in India.",
  path: "/signup",
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
