import { COMPANY_NAME, COMPANY_URL, SITE_NAME, SITE_URL } from "@/lib/site";

/** Crawlable copy describing what ANSH Tasks does — used in JSON-LD, noscript, and meta. */
export const WHAT_ANSH_TASKS_DOES =
  "ANSH Tasks is the task and project management app from ANSH Apps, built for Micro, Small & Medium Enterprises (MSMEs) in India and worldwide. It combines Kanban task boards, visual Brain Boards for brainstorming, team activity feed, workspace announcements, role-based permissions, and integrated support ticketing in one affordable workspace — so teams stop paying for separate tools like Zoho Projects, Monday.com, ClickUp, Trello, Slack, and Miro.";

export const LANDING_FAQS = [
  {
    question: "What is ANSH Tasks and what does it do?",
    answer:
      "ANSH Tasks (tasks.anshapps.com) is a task and project management workspace by ANSH Apps. It helps MSME teams assign work on Kanban boards, brainstorm on Brain Boards, track progress in an activity feed, post pinned announcements, manage teams with granular permissions, and raise support tickets — all in one app. Free plan available; Pro is ₹199/user/month + GST 18%.",
  },
  {
    question: "How does ANSH Tasks benefit MSMEs compared to other task management apps?",
    answer:
      "Micro, Small & Medium Enterprises (MSMEs) often pay for multiple tools like Zoho or Trello (tasks), Slack (chat), Miro (whiteboards), and Zendesk (support). ANSH Tasks integrates these core functions under one roof at an affordable price, saving MSMEs up to 80% on software subscriptions and reducing admin complexity.",
  },
  {
    question: "Can I customize the design system and theme accent colors?",
    answer:
      "Yes. ANSH Tasks includes a built-in Appearance Drawer. Select accent colors (Blue, Indigo, Violet, Teal, Rose) and toggle dark, light, or system themes. Changes apply globally across your workspace.",
  },
  {
    question: "Is there built-in customer support ticketing?",
    answer:
      "Yes. ANSH Tasks has an integrated Support Center. Users can submit and track support tickets from the dashboard sidebar without external email or helpdesk tools.",
  },
  {
    question: "How does the Brain Board feature work?",
    answer:
      "Brain Board is a visual ideation whiteboard. Place sticky notes, capture sketches, cluster ideas, and map project scopes before turning them into Kanban tasks.",
  },
  {
    question: "Is ANSH Tasks part of ANSH Apps?",
    answer:
      `Yes. ANSH Tasks is one product in the ANSH Apps ecosystem alongside ANSH HR (hr.anshapps.com), ANSH Expense (expense.anshapps.com), and ANSH Visitor (visitor.anshapps.com). The parent company is ${COMPANY_NAME} (${COMPANY_URL}), a Government of India Udyam-registered MSME.`,
  },
] as const;

export const ECOSYSTEM_LINKS = [
  { name: "ANSH Apps (parent)", url: COMPANY_URL },
  { name: SITE_NAME, url: SITE_URL },
  { name: "ANSH HR", url: "https://hr.anshapps.com" },
  { name: "ANSH Expense", url: "https://expense.anshapps.com" },
  { name: "ANSH Visitor", url: "https://visitor.anshapps.com" },
] as const;
