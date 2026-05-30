import { buildSiteMetadata, buildLandingJsonLd } from "@/lib/seo";
import { LandingPageClient } from "@/components/landing/LandingPageClient";

const LANDING_TITLE =
  "ANSH Tasks — Task & Project Management App for Fast Teams";
const LANDING_DESCRIPTION =
  "Organize work with Kanban boards, brain boards, and team chat in one workspace. ANSH Tasks helps startups and teams plan projects, track tasks, and collaborate — free to get started.";

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
