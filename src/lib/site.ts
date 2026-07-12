export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://tasks.anshapps.com";

export const SITE_NAME = "ANSH Tasks";
export const COMPANY_NAME = "ANSH Apps";
export const COMPANY_URL = "https://anshapps.com";

/** Government of India Udyam registration for ANSH Apps. */
export const UDYAM_REGISTRATION_NUMBER = "UDYAM-BR-23-0127857";

export const DEFAULT_TITLE =
  "ANSH Tasks — Task & Project Management App for MSME Teams";
export const DEFAULT_DESCRIPTION =
  "ANSH Tasks by ANSH Apps is an all-in-one task and project workspace for MSMEs — Kanban boards, Brain Boards, activity feed, announcements, and support. Free to start at tasks.anshapps.com.";

/** Used when file-based opengraph-image is unavailable. */
export const OG_IMAGE_PATH = "/logoAnshapps.png";
export const OG_IMAGE_ALT =
  "ANSH Tasks — task and project management workspace for MSME teams by ANSH Apps";

export const SEO_KEYWORDS = [
  "ANSH Tasks",
  "ANSH Task",
  "ansh tasks",
  "ansh task app",
  "ANSH Apps",
  "tasks.anshapps.com",
  "task management app",
  "project management software",
  "MSME task manager",
  "MSME project management",
  "kanban board",
  "team collaboration tool",
  "task tracker for teams",
  "project workspace India",
  "brain board whiteboard",
  "activity feed",
  "workspace announcements",
  "free task management",
  "Zoho Projects alternative",
  "Monday.com alternative India",
] as const;

/** Subdomain hostname for Google site-name alternateName fallback (must be lowercase). */
export const SITE_HOSTNAME = "tasks.anshapps.com";

/** Optional: set GOOGLE_SITE_VERIFICATION in env for Search Console. */
export const GOOGLE_SITE_VERIFICATION =
  process.env.GOOGLE_SITE_VERIFICATION ?? undefined;
