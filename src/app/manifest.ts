import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Task & Project Management`,
    short_name: SITE_NAME,
    description:
      "All-in-one task and project workspace for MSME teams by ANSH Apps.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/anshFavicon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    scope: SITE_URL,
    id: SITE_URL,
  };
}
