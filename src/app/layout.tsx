import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppearanceProvider } from "@/context/AppearanceContext";
import { ToastProvider } from "@/context/ToastContext";
import { ResponsiveLayoutGuard } from "@/components/ResponsiveLayoutGuard";
import { buildSiteMetadata } from "@/lib/seo";
import { DEFAULT_TITLE, SITE_NAME } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  ...buildSiteMetadata(),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col antialiased text-zinc-900 bg-white dark:text-zinc-100 dark:bg-zinc-950 transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppearanceProvider>
            <ToastProvider>
              <ResponsiveLayoutGuard>
                {children}
              </ResponsiveLayoutGuard>
            </ToastProvider>
          </AppearanceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
