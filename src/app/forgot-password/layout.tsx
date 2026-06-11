import type { Metadata } from "next";
import { buildSiteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSiteMetadata({
  title: "Forgot Password",
  description: "Reset your ANSH Tasks account password.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
