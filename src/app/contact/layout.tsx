import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | ANSH Task",
  description: "Get in touch with the ANSH Task team at support@anshapps.com.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
