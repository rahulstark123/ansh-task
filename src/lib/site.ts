export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://tasks.anshapps.com";

export const SITE_NAME = "ANSH Tasks";
export const COMPANY_NAME = "ANSH Apps";
export const COMPANY_URL = "https://anshapps.com";

export const DEFAULT_TITLE =
  "ANSH Tasks — Task & Project Management App for Teams";
export const DEFAULT_DESCRIPTION =
  "ANSH Tasks is a modern workspace for Kanban task boards, brain boards, activity feed, announcements, and project management. Free to start — built for fast teams in India and worldwide.";

/** Used for link previews (WhatsApp, Slack, LinkedIn, Google). Must be a public file in /public. */
export const OG_IMAGE_PATH = "/logoAnshapps.png";
export const OG_IMAGE_ALT = "ANSH Tasks logo — task and project management workspace";

export const SEO_KEYWORDS = [
  "task management app",
  "project management software",
  "kanban board",
  "team collaboration tool",
  "task tracker for teams",
  "project workspace",
  "activity feed",
  "workspace announcements",
  "ANSH Tasks",
  "ANSH Apps",
  "MSME task manager",
  "free task management",
] as const;
