import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/contact", "/privacy", "/terms", "/login", "/signup"],
        disallow: [
          "/api/",
          "/adminpanel/",
          "/auth/",
          "/onboarding",
          "/dashboard",
          "/tasks/",
          "/projects",
          "/brain-board",
          "/documents",
          "/management/",
          "/settings/",
          "/support",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
