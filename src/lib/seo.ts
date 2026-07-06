import type { Metadata } from "next";
import { ECOSYSTEM_LINKS, LANDING_FAQS, WHAT_ANSH_TASKS_DOES } from "@/lib/landing-seo";
import {
  COMPANY_NAME,
  COMPANY_URL,
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  GOOGLE_SITE_VERIFICATION,
  OG_IMAGE_ALT,
  SEO_KEYWORDS,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

type BuildMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export function buildSiteMetadata(options: BuildMetadataOptions = {}): Metadata {
  const title = options.title ?? DEFAULT_TITLE;
  const description = options.description ?? DEFAULT_DESCRIPTION;
  const canonicalPath = options.path ?? "";
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords: [...SEO_KEYWORDS],
    applicationName: SITE_NAME,
    authors: [{ name: COMPANY_NAME, url: COMPANY_URL }],
    creator: COMPANY_NAME,
    publisher: SITE_NAME,
    category: "Business",
    alternates: {
      canonical: canonicalUrl,
    },
    ...(GOOGLE_SITE_VERIFICATION
      ? { verification: { google: GOOGLE_SITE_VERIFICATION } }
      : {}),
    robots: options.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: canonicalUrl,
      siteName: SITE_NAME,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    icons: {
      icon: "/anshFavicon.png",
      shortcut: "/anshFavicon.png",
      apple: "/anshFavicon.png",
    },
    appleWebApp: {
      title: SITE_NAME,
    },
    other: {
      "og:image:alt": OG_IMAGE_ALT,
      "application-name": SITE_NAME,
    },
  };
}

/** Standalone WebSite schema — Google's primary signal for SERP site name. */
export function buildWebSiteNameJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: ["ANSH Task"],
    url: `${SITE_URL}/`,
  };
}

export function buildLandingJsonLd() {
  const faqPage = {
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    mainEntity: LANDING_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logoAnshapps.png`,
        parentOrganization: {
          "@type": "Organization",
          name: COMPANY_NAME,
          url: COMPANY_URL,
        },
      },
      {
        "@type": "Organization",
        "@id": `${COMPANY_URL}/#organization`,
        name: COMPANY_NAME,
        url: COMPANY_URL,
        logo: `${SITE_URL}/logoAnshapps.png`,
        sameAs: ECOSYSTEM_LINKS.map((link) => link.url),
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        headline: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#software` },
        inLanguage: "en-IN",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#software`,
        name: SITE_NAME,
        alternateName: "ANSH Task",
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Project Management",
        operatingSystem: "Web",
        url: SITE_URL,
        description: WHAT_ANSH_TASKS_DOES,
        featureList: [
          "Kanban task boards",
          "Brain Board visual whiteboard",
          "Team activity feed",
          "Workspace announcements",
          "Role-based permissions",
          "Integrated support ticketing",
          "Project management",
        ],
        offers: [
          {
            "@type": "Offer",
            name: "Free Plan",
            price: "0",
            priceCurrency: "INR",
            description: "Up to 2 members, 3 projects, 50 tasks per month",
            url: `${SITE_URL}/signup`,
          },
          {
            "@type": "Offer",
            name: "Pro Plan",
            price: "199",
            priceCurrency: "INR",
            description: "Unlimited tasks and projects, activity feed, announcements",
            url: `${SITE_URL}/signup`,
          },
        ],
        publisher: { "@id": `${SITE_URL}/#organization` },
        brand: {
          "@type": "Brand",
          name: SITE_NAME,
        },
      },
      faqPage,
    ],
  };
}
