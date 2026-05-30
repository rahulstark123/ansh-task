import type { Metadata } from "next";
import {
  COMPANY_NAME,
  COMPANY_URL,
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  OG_IMAGE_ALT,
  OG_IMAGE_PATH,
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
    publisher: COMPANY_NAME,
    alternates: {
      canonical: canonicalUrl,
    },
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
      images: [
        {
          url: OG_IMAGE_PATH,
          alt: OG_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE_PATH],
    },
    icons: {
      icon: "/anshFavicon.png",
      shortcut: "/anshFavicon.png",
      apple: "/anshFavicon.png",
    },
  };
}

export function buildLandingJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${COMPANY_URL}/#organization`,
        name: COMPANY_NAME,
        url: COMPANY_URL,
        logo: `${SITE_URL}${OG_IMAGE_PATH}`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description: DEFAULT_DESCRIPTION,
        publisher: { "@id": `${COMPANY_URL}/#organization` },
        inLanguage: "en-IN",
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        description: DEFAULT_DESCRIPTION,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
          description: "Free plan available with upgrade options",
        },
        publisher: { "@id": `${COMPANY_URL}/#organization` },
      },
    ],
  };
}
