import { buildSiteMetadata, buildLandingJsonLd, buildWebSiteNameJsonLd } from "@/lib/seo";
import { LandingPageClient } from "@/components/landing/LandingPageClient";
import { LandingSeoContent } from "@/components/landing/LandingSeoContent";

const LANDING_TITLE =
  "ANSH Tasks — All-in-One Task & Project Management for MSMEs";
const LANDING_DESCRIPTION =
  "ANSH Tasks by ANSH Apps helps MSME teams manage Kanban boards, Brain Boards, activity feed, and announcements in one workspace. Free plan + 14-day Pro trial at tasks.anshapps.com.";

export const metadata = buildSiteMetadata({
  title: LANDING_TITLE,
  description: LANDING_DESCRIPTION,
  path: "",
});

const LANDING_LIGHT_THEME_SCRIPT = `
(function () {
  try {
    if (!localStorage.getItem("theme")) {
      document.documentElement.classList.remove("dark");
    }
  } catch (_) {}
})();
`;

export default function LandingPage() {
  const webSiteNameJsonLd = buildWebSiteNameJsonLd();
  const jsonLd = buildLandingJsonLd();

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: LANDING_LIGHT_THEME_SCRIPT }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteNameJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingSeoContent />
      <LandingPageClient />
    </>
  );
}
