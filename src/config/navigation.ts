import type { ComponentType } from "react";
import {
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  HomeModernIcon,
  LightBulbIcon,
  MegaphoneIcon,
  QuestionMarkCircleIcon,
  RectangleStackIcon,
  UsersIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import { TEAM_SPACE_ENABLED } from "@/config/features";

export type NavIcon = ComponentType<{ className?: string }>;

export type NavLinkItem = {
  href: string;
  label: string;
  icon: NavIcon;
  match?: "exact" | "prefix";
};

export type NavSection = {
  id: string;
  label: string;
  items: NavLinkItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "home",
    label: "Home",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: HomeModernIcon,
        match: "exact",
      },
    ],
  },
  {
    id: "tasks",
    label: "Tasks",
    items: [
      {
        href: "/tasks",
        label: "Task list",
        icon: ClipboardDocumentListIcon,
        match: "exact",
      },
      { href: "/tasks/my", label: "My tasks", icon: CheckCircleIcon, match: "exact" },
      ...(TEAM_SPACE_ENABLED
        ? [
            {
              href: "/tasks/team",
              label: "Team space",
              icon: ChatBubbleLeftRightIcon,
              match: "exact" as const,
            },
          ]
        : [
            {
              href: "/tasks/activity",
              label: "Activity feed",
              icon: BoltIcon,
              match: "exact" as const,
            },
          ]),
    ],
  },
  {
    id: "work",
    label: "Work",
    items: [
      { href: "/projects", label: "Projects", icon: BriefcaseIcon, match: "prefix" },
      { href: "/brain-board", label: "Brain board", icon: LightBulbIcon, match: "exact" },
    ],
  },
  {
    id: "management",
    label: "Management",
    items: [
      {
        href: "/management/teams",
        label: "Teams",
        icon: UsersIcon,
        match: "prefix",
      },
      {
        href: "/management/announcements",
        label: "Announcements",
        icon: MegaphoneIcon,
        match: "exact",
      },
    ],
  },
  {
    id: "settings",
    label: "Workspace",
    items: [
      {
        href: "/settings",
        label: "Settings",
        icon: Cog6ToothIcon,
        match: "prefix",
      },
      {
        href: "/settings/defaults",
        label: "Task defaults",
        icon: AdjustmentsHorizontalIcon,
        match: "exact",
      },
      {
        href: "/support",
        label: "Support",
        icon: QuestionMarkCircleIcon,
        match: "prefix",
      },
    ],
  },
];

export const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Main dashboard",
  "/tasks": "Task list",
  "/tasks/my": "My tasks",
  "/tasks/all": "All tasks",
  "/tasks/team": "Team space",
  "/tasks/activity": "Activity feed",
  "/projects": "Projects",
  "/brain-board": "Brain board",
  "/documents": "Documents",
  "/management/teams": "Teams",
  "/management/announcements": "Announcements",
  "/settings": "Settings",
  "/settings/profile": "Profile",
  "/settings/company": "Company",
  "/settings/workspace": "Workspace",
  "/settings/permissions": "Permissions",
  "/settings/defaults": "Task Defaults",
  "/settings/billing": "Billing",
  "/support": "Support Center",
};

/** Longest-path-wins label for the top bar. */
export function routeTitle(pathname: string): string {
  const entries = Object.entries(ROUTE_TITLES).sort((a, b) => b[0].length - a[0].length);
  for (const [path, title] of entries) {
    if (pathname === path || pathname.startsWith(`${path}/`)) return title;
  }
  return "Workspace";
}

export function isNavActive(
  pathname: string,
  href: string,
  match: NavLinkItem["match"] = "prefix",
) {
  if (match === "exact") return pathname === href;
  if (pathname === href) return true;
  if (href === "/settings" && pathname === "/settings/defaults") return false;
  return pathname.startsWith(`${href}/`);
}
