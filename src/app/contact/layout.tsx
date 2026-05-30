import type { Metadata } from "next";
import { buildSiteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSiteMetadata({
  title: "Contact Us",
  description: "Get in touch with the ANSH Tasks team at support@anshapps.com.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
