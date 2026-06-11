import type { Metadata } from "next";
import { buildSiteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSiteMetadata({
  title: "Reset Password",
  description: "Set a new password for your ANSH Tasks account.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
