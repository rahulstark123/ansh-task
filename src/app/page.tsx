import { buildSiteMetadata, buildLandingJsonLd } from "@/lib/seo";
import { LandingPageClient } from "@/components/landing/LandingPageClient";

const LANDING_TITLE =
  "ANSH Tasks — All-in-One Task & Project Management for MSMEs";
const LANDING_DESCRIPTION =
  "Affordable task management, visual brainstorming, and built-in team chat tailored for Micro, Small & Medium Enterprises (MSMEs). Consolidate your tools and move faster.";

export const metadata = buildSiteMetadata({
  title: LANDING_TITLE,
  description: LANDING_DESCRIPTION,
  path: "",
});

export default function LandingPage() {
  const jsonLd = buildLandingJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageClient />
    </>
  );
}
