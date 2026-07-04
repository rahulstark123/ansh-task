"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  CheckCircleIcon,
  BriefcaseIcon,
  LightBulbIcon,
  UsersIcon,
  QuestionMarkCircleIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  PaintBrushIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  CheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  HashtagIcon,
  LockClosedIcon,
  BoltIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";
import type { BillingLocaleInfo } from "@/lib/billing/charge-region";
import { formatChargeAmount } from "@/lib/billing/charge-region";
import { TEAM_SPACE_ENABLED } from "@/config/features";
import { TrustCompliance } from "@/components/shared/trust-compliance";

// Define accent options to showcase the app's dynamic styling
const ACCENTS = [
  { id: "blue", name: "Blue", color: "#0078FF", class: "bg-blue-600 focus:ring-blue-400" },
  { id: "indigo", name: "Indigo", color: "#6366F1", class: "bg-indigo-600 focus:ring-indigo-400" },
  { id: "violet", name: "Violet", color: "#9333EA", class: "bg-violet-600 focus:ring-violet-400" },
  { id: "teal", name: "Teal", color: "#0d9488", class: "bg-teal-600 focus:ring-teal-400" },
  { id: "rose", name: "Rose", color: "#e11d48", class: "bg-rose-600 focus:ring-rose-400" },
];

/** Ansh Apps logo palette — electric blue → violet → magenta */
const BRAND_GRADIENT_TEXT =
  "bg-gradient-to-r from-[#00c6ff] via-[#7000ff] to-[#e040fb] bg-clip-text text-transparent";
const BRAND_GRADIENT_TEXT_DARK =
  "dark:from-[#4dc4ff] dark:via-[#8b5cf6] dark:to-[#e879f9]";

const CONTACT_PHONE = "+919625727372";
const WHATSAPP_URL = `https://wa.me/919625727372?text=${encodeURIComponent("Hi")}`;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
const BRAND_PRIMARY_BTN =
  "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-lg shadow-violet-600/25";
const BRAND_ACCENT_ICON =
  "bg-blue-500/10 text-blue-600 dark:text-violet-400";
const BRAND_ACCENT_PILL =
  "bg-blue-500/10 text-blue-700 dark:text-violet-400 border border-blue-500/20";
const BRAND_LINK_HOVER =
  "hover:text-blue-600 dark:hover:text-violet-400";

const PRICING_PLANS = [
  {
    id: "free",
    name: "Free Plan",
    badge: "For micro teams",
    priceInr: 0,
    cadence: "/ workspace",
    description:
      "Ideal for micro-enterprises and founders trying the product to run small daily task lists and whiteboard planning.",
    features: [
      { label: "Up to 2 team members", included: true },
      { label: "Up to 3 projects", included: true },
      { label: "50 tasks per month", included: true },
      { label: "Brain Board included", included: true },
      { label: "Activity feed not included", included: false },
      { label: "Announcements not included", included: false },
      ...(TEAM_SPACE_ENABLED ? [{ label: "Team Space not included", included: false }] : []),
      { label: "Advanced Analytics not included", included: false },
    ],
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro Plan",
    badge: "Best for MSMEs",
    priceInr: 199,
    cadence: "/ user / month",
    description:
      "Best for small and medium businesses that need unlimited tasks, brain boards, and advanced reporting.",
    features: [
      { label: "Add team members based on paid seats", included: true },
      { label: "Unlimited projects", included: true },
      { label: "Unlimited tasks", included: true },
      { label: "Brain Board included", included: true },
      { label: "Activity feed included", included: true },
      { label: "Announcements (post & pin)", included: true },
      ...(TEAM_SPACE_ENABLED ? [{ label: "Team Space channels and DMs", included: true }] : []),
      { label: "Advanced Analytics included", included: true },
    ],
    note: "Yearly billing saves 19%",
    highlighted: true,
  },
] as const;

const ACTIVITY_PREVIEW = [
  {
    title: "Task updated: GST filing Q1",
    description: "Status is now in progress · Finance project",
    time: "12m ago",
  },
  {
    title: "Announcement: GST deadline May 31",
    description: "Posted by Ansh K. · Pinned notice for all staff",
    time: "1h ago",
  },
  {
    title: "Priya Sharma joined the workspace",
    description: "Role: Editor",
    time: "2h ago",
  },
  {
    title: "Project updated: Diwali Campaign",
    description: "45% complete · Active",
    time: "3h ago",
  },
] as const;

const TEAM_SPACE_PREVIEW = [
  {
    id: "general",
    name: "general",
    isPrivate: false,
    topic: "Company announcements and daily operational updates",
    messages: [
      { author: "Ansh K.", initials: "AK", time: "10:24 AM", text: "Morning team — please update your daily Kanban lists by 11 AM so we can check dispatched orders." },
      { author: "Priya S.", initials: "PS", time: "10:31 AM", text: "I have uploaded this month's draft GST invoice folder in Documents. Flag any missing vendor bills." },
      { author: "Jay D.", initials: "JD", time: "10:45 AM", text: "I'll review them now. I'll post the remaining supplier receipts in #operations." },
    ],
  },
  {
    id: "operations",
    name: "operations",
    isPrivate: false,
    topic: "Stock logs, dispatch tracking, and supplier updates",
    messages: [
      { author: "Jay D.", initials: "JD", time: "9:12 AM", text: "New raw materials batch arrived at warehouse. Stock count has been logged in Tasks." },
      { author: "Riya M.", initials: "RM", time: "9:18 AM", text: "Awesome. I'll inspect the batch and update the supplier invoice payment status by EOD." },
    ],
  },
  {
    id: "admin-finance",
    name: "admin-finance",
    isPrivate: true,
    topic: "Compliance, budgets, and leadership updates",
    messages: [
      { author: "Ansh K.", initials: "AK", time: "8:05 AM", text: "Diwali bonus sheet draft is ready. Please review the budget allocation in Documents." },
    ],
  },
] as const;

const COMPETITOR_COMPARISONS = [
  {
    title: "Compared to Zoho Projects",
    summary: "Built for modern execution, not rigid corporate suites.",
    points: [
      "Zoho Projects has a stuffy enterprise interface with rigid, complex workflow setups.",
      "ANSH Task is visual, lightweight, and combines tasks with visual whiteboards and support natively.",
    ],
  },
  {
    title: "Compared to ClickUp & Monday",
    summary: "Save thousands on seat licenses without dashboard lag.",
    points: [
      "ClickUp & Monday are highly customizable but get expensive quickly and suffer from heavy loading lag.",
      "ANSH Task is lightweight, highly performant, and packs tasks, brain boards, activity feed, and support under one fixed-rate plan.",
    ],
  },
  {
    title: "Compared to Trello & Slack",
    summary: "No more paying for multiple tools to get tasks and docs.",
    points: [
      "Trello is too basic (no docs/support), while Slack is just messaging (no task boards)—leading to double subscriptions.",
      "ANSH Task integrates Kanban boards, brain boards, activity feed, announcements, and support in one unified workspace.",
    ],
  },
] as const;

const ECOSYSTEM_APPS = [
  {
    name: "ANSH TASKS",
    title: "Team task & project tracker",
    description: "Assign, track and close tasks across teams",
    image: "/Ansh Task.jpg",
    dotColor: "#3b82f6",
    url: "https://tasks.anshapps.com",
  },
  {
    name: "ANSH HR",
    title: "Human resource management",
    description: "Employee records, leaves, payroll & more",
    image: "/ANSH HR.jpg",
    dotColor: "#a855f7",
    url: "https://hr.anshapps.com",
  },
  {
    name: "ANSH EXPENSE",
    title: "Expense & reimbursement tracking",
    description: "Submit, approve and audit business expenses",
    image: "/ANSH Expense.jpg",
    dotColor: "#f97316",
    url: "https://expense.anshapps.com",
  },
  {
    name: "ANSH VISITOR",
    title: "Smart lobby & guest management",
    description: "QR passes, ID verification, check-in logs",
    image: "/ANSH Visitor.jpg",
    dotColor: "#0078FF",
    url: "https://visitor.anshapps.com",
  },
];

/** Full-width shell with modern responsive side gutters (not edge-to-edge). */
const LANDING_SHELL =
  "mx-auto w-full px-8 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32";

export function LandingPageClient() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<"kanban" | "brain" | "team" | "activity">("kanban");
  const [selectedAccent, setSelectedAccent] = useState("blue");
  const [selectedTeamChannel, setSelectedTeamChannel] = useState("general");
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({});
  const [billingLocale, setBillingLocale] = useState<BillingLocaleInfo | null>(
    null
  );

  useEffect(() => {
    if (!localStorage.getItem("theme")) {
      setTheme("light");
    }
    setMounted(true);
  }, [setTheme]);

  useEffect(() => {
    async function loadFx() {
      try {
        const res = await fetch("/api/billing/fx", { cache: "no-store" });
        const json = await res.json();
        if (json.success) {
          setBillingLocale({
            countryCode: json.countryCode,
            chargeCurrency: json.chargeCurrency,
            monthlyPriceMajor: json.monthlyPriceMajor,
            yearlyPriceMajorPerSeat: json.yearlyPriceMajorPerSeat,
            yearlyPriceTotalPerSeat: json.yearlyPriceTotalPerSeat,
            monthlyMinorPerSeat: json.monthlyMinorPerSeat,
            disclaimer: json.disclaimer,
          });
        }
      } catch {
        /* INR-only fallback */
      }
    }
    loadFx();
  }, []);

  const toggleFaq = (index: number) => {
    setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const getAccentColor = () => {
    const accent = ACCENTS.find((a) => a.id === selectedAccent);
    return accent ? accent.color : "#0078FF";
  };

  const activeTeamChannel =
    TEAM_SPACE_PREVIEW.find((channel) => channel.id === selectedTeamChannel) ?? TEAM_SPACE_PREVIEW[0];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-50 text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100 selection:bg-violet-500/20 selection:text-blue-700 dark:selection:text-violet-400">

      {/* Background Gradients */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[30%] -left-[10%] h-[70%] w-[50%] rounded-full bg-[#00c6ff]/10 blur-[120px] dark:bg-[#00c6ff]/5" />
        <div className="absolute top-[20%] -right-[10%] h-[60%] w-[40%] rounded-full bg-[#7000ff]/10 blur-[100px] dark:bg-[#7000ff]/5" />
        <div className="absolute bottom-[10%] left-[20%] h-[50%] w-[50%] rounded-full bg-[#e040fb]/10 blur-[130px] dark:bg-[#e040fb]/5" />
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/50 bg-zinc-50/80 backdrop-blur-md transition-colors dark:border-zinc-800/50 dark:bg-zinc-950/80">
        <div className={`${LANDING_SHELL} flex items-center justify-between h-16`}>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-0.5 group">
            <img 
              src="/logoAnshapps.png" 
              alt="ANSH Logo" 
              className="h-12 w-12 shrink-0 object-contain group-hover:scale-105 transition-transform duration-200 -mr-1.5 mt-1" 
            />
            <span className="font-heading text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              ANSH Task
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-violet-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-blue-600 dark:hover:text-violet-400 transition-colors">Pricing</a>
            <a href="#compare" className="hover:text-blue-600 dark:hover:text-violet-400 transition-colors">Why ANSH</a>
            <a href="#faq" className="hover:text-blue-600 dark:hover:text-violet-400 transition-colors">FAQ</a>
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Selector */}
            <div className="flex items-center rounded-lg bg-zinc-200/60 p-1 dark:bg-zinc-900 border border-zinc-300/30 dark:border-zinc-800">
              <button
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-md transition-all ${theme === "light" ? "bg-white text-blue-600 shadow-sm dark:bg-zinc-800 dark:text-violet-400" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"}`}
                title="Light Mode"
              >
                <SunIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`p-1.5 rounded-md transition-all ${theme === "system" ? "bg-white text-blue-600 shadow-sm dark:bg-zinc-800 dark:text-violet-400" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"}`}
                title="System Theme"
              >
                <ComputerDesktopIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-md transition-all ${theme === "dark" ? "bg-white text-blue-600 shadow-sm dark:bg-zinc-800 dark:text-violet-400" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"}`}
                title="Dark Mode"
              >
                <MoonIcon className="h-4 w-4" />
              </button>
            </div>

            <Link
              href="/login"
              className="text-[14px] font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-900"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-16 left-0 right-0 z-40 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-6 space-y-4 shadow-xl"
          >
            <nav className="flex flex-col gap-4 text-base font-semibold">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-violet-400">Features</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-violet-400">Pricing</a>
              <a href="#compare" onClick={() => setMobileMenuOpen(false)} className="text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-violet-400">Why ANSH</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-violet-400">FAQ</a>
            </nav>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-4" />
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-zinc-500">Theme</span>
                <div className="flex items-center rounded-lg bg-zinc-200/60 p-1 dark:bg-zinc-900 border border-zinc-300/30 dark:border-zinc-800">
                  <button onClick={() => setTheme("light")} className={`p-1.5 rounded-md ${theme === "light" ? "bg-white text-blue-600 dark:bg-zinc-800 dark:text-violet-400" : "text-zinc-500"}`}><SunIcon className="h-4 w-4" /></button>
                  <button onClick={() => setTheme("system")} className={`p-1.5 rounded-md ${theme === "system" ? "bg-white text-blue-600 dark:bg-zinc-800 dark:text-violet-400" : "text-zinc-500"}`}><ComputerDesktopIcon className="h-4 w-4" /></button>
                  <button onClick={() => setTheme("dark")} className={`p-1.5 rounded-md ${theme === "dark" ? "bg-white text-blue-600 dark:bg-zinc-800 dark:text-violet-400" : "text-zinc-500"}`}><MoonIcon className="h-4 w-4" /></button>
                </div>
              </div>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-semibold py-3"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section (1st Section - Crisp and Clear) */}
      <section className="relative z-10 pt-3 pb-16 md:pt-6 md:pb-24">
        <div className={LANDING_SHELL}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-8 text-center lg:text-left">

              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-violet-400 text-xs font-semibold tracking-wide border border-violet-500/20">
                <SparklesIcon className="h-3.5 w-3.5" />
                Built for MSMEs & Growing Businesses
              </div>

              {/* Main Headline */}
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.1] text-zinc-900 dark:text-white">
                Run Your Entire{" "}
                <span className="bg-gradient-to-r from-[#00c6ff] via-[#7000ff] to-[#e040fb] bg-clip-text text-transparent dark:from-[#4dc4ff] dark:via-[#8b5cf6] dark:to-[#e879f9]">
                  MSME Tasks & Operations
                </span>{" "}
                in One Simple Workspace
              </h1>

              {/* Description */}
              <p className="text-zinc-600 dark:text-zinc-300 text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
                ANSH Task combines project management tools, Kanban task boards, collaborative brain boards, activity feed, and workspace announcements into a unified, high-performance workspace.
              </p>

              {/* Value Props: What ANSH Task Does (Crisp & Clear) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto lg:mx-0 text-left bg-zinc-200/40 dark:bg-zinc-900/50 border border-zinc-300/20 dark:border-zinc-800/40 p-5 rounded-2xl">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-violet-400 mt-0.5">
                    <CheckIcon className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">MSME-Friendly Tasks</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Simple drag-and-drop Kanban to track inventory, client orders, GST filings, and daily checklists.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-violet-400 mt-0.5">
                    <CheckIcon className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Visual Brain Boards</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Map warehouse layouts, Diwali discount campaigns, & logistics flows.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-violet-400 mt-0.5">
                    <CheckIcon className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Activity Feed</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">See task, project, and team updates in one timeline — no separate chat app needed.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-violet-400 mt-0.5">
                    <CheckIcon className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Workspace Announcements</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Pin GST deadlines, holiday notices, and policy updates for your whole team.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-violet-400 mt-0.5">
                    <CheckIcon className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Integrated Support</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage client tickets and supplier claims natively inside the portal.</p>
                  </div>
                </div>

                {TEAM_SPACE_ENABLED && (
                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-violet-400 mt-0.5">
                    <CheckIcon className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Built-in Team Chat</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Channels & DMs to coordinate operations without extra Slack bills.</p>
                  </div>
                </div>
                )}
              </div>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-lg shadow-violet-600/25 font-semibold px-8 py-4 active:scale-[0.98] transition-all"
                >
                  Start 14-Day Free Trial
                  <ArrowRightIcon className="h-5 w-5" />
                </Link>
                <a
                  href="https://anshapps.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-8 py-4 text-sm font-semibold text-zinc-800 shadow-sm transition-all hover:bg-zinc-50 active:scale-[0.98] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  Visit ANSH
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                </a>
              </div>

              {/* Trust Section */}
              <div className="pt-6 space-y-2">
                <p className="text-lg sm:text-xl font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">
                  Built from Bharat for the World
                </p>
                <p className="text-sm sm:text-base font-semibold text-blue-600 dark:text-violet-400 tracking-wide">
                  encouraging Vasudhaiva Kutumbakam
                </p>
              </div>

            </div>

            {/* Right Interactive Mockup Column */}
            <div id="preview" className="lg:col-span-6 relative scroll-mt-24">
              <div className="absolute inset-0 bg-violet-500/10 rounded-3xl blur-2xl transform rotate-2 pointer-events-none" />

              {/* Main Mockup Window */}
              <div className="relative border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">

                {/* Mockup Title bar */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
                  </div>

                  {/* Tab Selector */}
                  <div className="flex rounded-lg bg-zinc-200/70 p-0.5 dark:bg-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    <button
                      onClick={() => setActivePreviewTab("kanban")}
                      className={`px-3 py-1 rounded-md transition-all ${activePreviewTab === "kanban" ? "bg-white text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50 shadow-xs" : "hover:text-zinc-700"}`}
                    >
                      Kanban
                    </button>
                    <button
                      onClick={() => setActivePreviewTab("brain")}
                      className={`px-3 py-1 rounded-md transition-all ${activePreviewTab === "brain" ? "bg-white text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50 shadow-xs" : "hover:text-zinc-700"}`}
                    >
                      Brain Board
                    </button>
                    {TEAM_SPACE_ENABLED ? (
                    <button
                      onClick={() => setActivePreviewTab("team")}
                      className={`px-3 py-1 rounded-md transition-all ${activePreviewTab === "team" ? "bg-white text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50 shadow-xs" : "hover:text-zinc-700"}`}
                    >
                      Team Space
                    </button>
                    ) : (
                    <button
                      onClick={() => setActivePreviewTab("activity")}
                      className={`px-3 py-1 rounded-md transition-all ${activePreviewTab === "activity" ? "bg-white text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50 shadow-xs" : "hover:text-zinc-700"}`}
                    >
                      Activity
                    </button>
                    )}
                  </div>

                  <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">ansh-task.app</span>
                </div>

                {/* Mockup Canvas */}
                <div className="p-5 min-h-[380px] bg-zinc-50/50 dark:bg-zinc-950/40 relative">

                  {/* Kanban View Content */}
                  {activePreviewTab === "kanban" && (
                    <motion.div
                      key="kanban-preview"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-3 gap-3 h-full"
                    >
                      {/* Column 1 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          <span>To Do</span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px]">1</span>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2.5">
                          <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold">Finance</span>
                          <h5 className="text-xs font-semibold leading-tight text-zinc-800 dark:text-zinc-200">GST filing & Q1 tax auditing</h5>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-zinc-400 font-medium">May 24</span>
                            <div className="w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-700 text-[8px] flex items-center justify-center font-bold">PS</div>
                          </div>
                        </div>
                      </div>

                      {/* Column 2 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          <span>In Progress</span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px]">1</span>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2.5">
                          <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-violet-900/30 dark:text-violet-400 text-[10px] font-bold" style={{ backgroundColor: `${getAccentColor()}20`, color: getAccentColor() }}>Marketing</span>
                          <h5 className="text-xs font-semibold leading-tight text-zinc-800 dark:text-zinc-200">Launch Diwali promo campaign</h5>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-zinc-400 font-medium">May 21</span>
                            <div className="w-5 h-5 rounded-full text-white text-[8px] flex items-center justify-center font-bold" style={{ backgroundColor: getAccentColor() }}>AK</div>
                          </div>
                        </div>
                      </div>

                      {/* Column 3 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          <span>Completed</span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px]">1</span>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2.5 opacity-75">
                          <span className="inline-block px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] font-bold">Operations</span>
                          <h5 className="text-xs font-semibold leading-tight line-through text-zinc-500 dark:text-zinc-400">Inventory restock & supplier setup</h5>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-0.5">
                              <CheckIcon className="h-3 w-3 stroke-[3]" /> Done
                            </span>
                            <div className="w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-700 text-[8px] flex items-center justify-center font-bold">JD</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Brain Board View Content */}
                  {activePreviewTab === "brain" && (
                    <motion.div
                      key="brain-preview"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative h-full min-h-[300px]"
                    >
                      <div className="absolute top-2 left-2 w-44 bg-yellow-100 dark:bg-yellow-950/40 p-3.5 rounded-xl border border-yellow-200 dark:border-yellow-900/30 shadow-sm rotate-[-2deg] space-y-1">
                        <span className="text-[10px] font-semibold text-yellow-800 dark:text-yellow-400">Warehouse Layout</span>
                        <h6 className="text-xs font-bold text-zinc-900 dark:text-zinc-150">Optimize packaging space</h6>
                        <p className="text-[10px] text-zinc-600 dark:text-zinc-300 leading-tight">Rearrange packing racks closer to shipping dock to speed up operational dispatches.</p>
                      </div>

                      <div className="absolute top-[40%] right-4 w-48 bg-purple-100 dark:bg-purple-950/40 p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/30 shadow-sm rotate-[1deg] space-y-1">
                        <span className="text-[10px] font-semibold text-purple-800 dark:text-purple-400">Diwali Campaign</span>
                        <h6 className="text-xs font-bold text-zinc-900 dark:text-zinc-150">Discount codes setup</h6>
                        <p className="text-[10px] text-zinc-600 dark:text-zinc-300 leading-tight">Draft 10% coupon codes for regular wholesale distributors and bulk buyers.</p>
                      </div>

                      <div className="absolute bottom-2 left-6 w-52 bg-blue-100 dark:bg-violet-950/40 p-3.5 rounded-xl border border-blue-200/80 dark:border-violet-900/30 shadow-sm rotate-[-1deg] space-y-1" style={{ borderColor: `${getAccentColor()}30` }}>
                        <span className="text-[10px] font-semibold text-blue-800 dark:text-violet-400" style={{ color: getAccentColor() }}>Operations</span>
                        <h6 className="text-xs font-bold text-zinc-900 dark:text-zinc-150">Onboard new supplier</h6>
                        <p className="text-[10px] text-zinc-600 dark:text-zinc-300 leading-tight">Verify GST details, business registration, and bank routing before placing first order.</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Activity Feed Preview */}
                  {!TEAM_SPACE_ENABLED && activePreviewTab === "activity" && (
                    <motion.div
                      key="activity-preview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-2.5 text-left"
                    >
                      {ACTIVITY_PREVIEW.map((item) => (
                        <div
                          key={item.title}
                          className="flex gap-3 rounded-xl border border-zinc-200/80 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                        >
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-[10px] font-bold"
                            style={{ backgroundColor: getAccentColor() }}
                          >
                            <BoltIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{item.title}</p>
                            <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">{item.description}</p>
                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{item.time}</p>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* Team Space View Content */}
                  {TEAM_SPACE_ENABLED && activePreviewTab === "team" && (
                    <motion.div
                      key="team-preview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-3 h-full min-h-[300px] text-left"
                    >
                      <div className="w-[36%] shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-xs">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Channels</p>
                        <div className="space-y-1">
                          {TEAM_SPACE_PREVIEW.map((channel) => (
                            <button
                              key={channel.id}
                              type="button"
                              onClick={() => setSelectedTeamChannel(channel.id)}
                              className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold transition-all ${
                                selectedTeamChannel === channel.id
                                  ? "bg-blue-500/15 text-blue-700 dark:text-violet-300"
                                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              }`}
                            >
                              {channel.isPrivate ? (
                                <LockClosedIcon className="h-3.5 w-3.5 shrink-0" />
                              ) : (
                                <HashtagIcon className="h-3.5 w-3.5 shrink-0" />
                              )}
                              {channel.name}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-3 mb-2">Direct Messages</p>
                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[8px] font-bold text-white">PS</div>
                          Priya Sharma
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 mb-3 dark:border-zinc-800">
                          <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-600" style={{ color: getAccentColor() }} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {activeTeamChannel.isPrivate ? (
                                <LockClosedIcon className="h-3.5 w-3.5 text-zinc-500" />
                              ) : (
                                <HashtagIcon className="h-3.5 w-3.5 text-zinc-500" />
                              )}
                              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{activeTeamChannel.name}</p>
                            </div>
                            <p className="truncate text-[10px] text-zinc-500">{activeTeamChannel.topic}</p>
                          </div>
                        </div>

                        <div className="flex-1 space-y-2.5 overflow-hidden">
                          {activeTeamChannel.messages.map((message) => (
                            <div key={`${message.author}-${message.time}`} className="flex gap-2">
                              <div
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[8px] font-bold text-white"
                                style={{ backgroundColor: getAccentColor() }}
                              >
                                {message.initials}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">{message.author}</span>
                                  <span className="text-[10px] text-zinc-400">{message.time}</span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">{message.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950/50">
                          Message #{activeTeamChannel.name}...
                        </div>
                      </div>
                    </motion.div>
                  )}

                </div>

                {/* Mockup Accent customization bar */}
                <div className="px-5 py-3.5 bg-zinc-100/60 dark:bg-zinc-900/60 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <PaintBrushIcon className="h-4 w-4" /> Try live color picker:
                  </span>

                  {/* Dynamic Color Dots */}
                  <div className="flex gap-2">
                    {ACCENTS.map((accent) => (
                      <button
                        key={accent.id}
                        onClick={() => setSelectedAccent(accent.id)}
                        className={`w-5 h-5 rounded-full border-2 ${selectedAccent === accent.id ? "border-zinc-900 dark:border-zinc-100 scale-110" : "border-transparent"} transition-all`}
                        style={{ backgroundColor: accent.color }}
                        title={accent.name}
                      />
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Ecosystem Section (The full Ansh Apps suite marquee) */}
      <section className="py-16 md:py-20 border-t border-zinc-200/50 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-950/20 relative z-10">
        <div className={LANDING_SHELL}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-blue-600 dark:text-violet-400 text-xs font-semibold tracking-wider uppercase mb-2 block">
                Ecosystem
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                The full <span className="bg-gradient-to-r from-[#00c6ff] via-[#7000ff] to-[#e040fb] bg-clip-text text-transparent dark:from-[#4dc4ff] dark:via-[#8b5cf6] dark:to-[#e879f9]">Ansh Apps</span> suite
              </h2>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base max-w-md md:text-right md:leading-relaxed">
              One ecosystem, every business operation — manage tasks, HR, expenses, bookings and visitors from connected apps.
            </p>
          </div>
        </div>

        {/* Infinite Marquee Container */}
        <div className="w-full overflow-hidden relative py-4 animate-marquee-hover-pause">
          {/* Horizontal Gradient Overlays for smooth fading on edges */}
          <div className="absolute top-0 left-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-zinc-50 to-transparent dark:from-zinc-950 pointer-events-none z-10" />
          <div className="absolute top-0 right-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-zinc-50 to-transparent dark:from-zinc-950 pointer-events-none z-10" />

          {/* Scrolling track */}
          <div className="animate-marquee flex gap-6">
            {/* Render cards twice for seamless looping */}
            {[...ECOSYSTEM_APPS, ...ECOSYSTEM_APPS].map((app, index) => (
              <a
                key={`${app.name}-${index}`}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-[280px] sm:w-[320px] md:w-[350px] shrink-0 flex flex-col bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 p-3 rounded-[24px] shadow-sm hover:border-blue-500/30 dark:hover:border-violet-500/20 hover:scale-[1.01] transition-all duration-300 cursor-pointer block hover:no-underline"
              >
                {/* Image browser mockup */}
                <div className="relative overflow-hidden rounded-[16px] bg-zinc-950 p-1 border border-zinc-200/50 dark:border-zinc-800 aspect-[16/10]">
                  <img
                    src={app.image}
                    alt={app.title}
                    className="rounded-[12px] w-full h-full object-cover object-top hover:scale-[1.02] transition-transform duration-500"
                  />
                  {/* Live Badge */}
                  <div className="absolute top-3.5 right-3.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-500/10 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 text-[10px] font-extrabold tracking-wider uppercase border border-violet-500/30 backdrop-blur-md">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500"></span>
                    </span>
                    Live
                  </div>
                </div>

                {/* Details */}
                <div className="pt-3.5 px-1 pb-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: app.dotColor }}
                    />
                    <span className="text-[10px] font-extrabold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                      {app.name}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1 leading-tight">
                    {app.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                    {app.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Deep-Dive Grid (Section 2) */}
      <section id="features" className="py-20 border-t border-zinc-200/50 dark:border-zinc-800/40 bg-zinc-100/40 dark:bg-zinc-950/20 relative z-10 scroll-mt-24">
        <div className={LANDING_SHELL}>

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Streamline Your Entire MSME Operations Natively
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base sm:text-lg">
              No need to pay for 4-5 different software tools. ANSH Task consolidates your core business collaboration under one affordable billing plan.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Feature 1 */}
            <div className="group bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 p-8 rounded-2xl shadow-xs hover:border-blue-500/30 dark:hover:border-violet-500/20 hover:shadow-md transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-violet-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                <ClipboardDocumentListIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Dynamic Kanban Board</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Organize projects, assign deadlines, and update status columns. Interactive lists let you track bottlenecks, assign team leads, and log work subtasks.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 p-8 rounded-2xl shadow-xs hover:border-blue-500/30 dark:hover:border-violet-500/20 hover:shadow-md transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-violet-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                <LightBulbIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Collaborative Brain Boards</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Sketch flows, cluster sticky notes, and plan sprints. An visual ideation hub designed to turn abstract project thoughts into concrete, assignable tasks.
              </p>
            </div>

            {/* Feature 3 — Activity Feed */}
            {!TEAM_SPACE_ENABLED && (
            <div className="group bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 p-8 rounded-2xl shadow-xs hover:border-blue-500/30 dark:hover:border-violet-500/20 hover:shadow-md transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-violet-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                <BoltIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Activity Feed</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                A live timeline of task updates, new projects, team joins, support tickets, and announcements — all in one place without realtime chat overhead.
              </p>
            </div>
            )}

            {/* Feature — Announcements */}
            {!TEAM_SPACE_ENABLED && (
            <div className="group bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 p-8 rounded-2xl shadow-xs hover:border-blue-500/30 dark:hover:border-violet-500/20 hover:shadow-md transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-violet-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                <MegaphoneIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Workspace Announcements</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Owners and admins can pin company-wide notices — GST deadlines, holiday closures, and policy updates — so every teammate stays aligned.
              </p>
            </div>
            )}

            {/* Feature 3 — Team Space (when enabled) */}
            {TEAM_SPACE_ENABLED && (
            <div className="group bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 p-8 rounded-2xl shadow-xs hover:border-blue-500/30 dark:hover:border-violet-500/20 hover:shadow-md transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-violet-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Team Space</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Chat in shared channels, private rooms, and direct messages without leaving your workspace. Keep project updates, decisions, and team coordination in one place.
              </p>
            </div>
            )}

            {/* Feature 4 */}
            <div className="group bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 p-8 rounded-2xl shadow-xs hover:border-blue-500/30 dark:hover:border-violet-500/20 hover:shadow-md transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-violet-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                <UsersIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Granular Team Management</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Setup teams, control group access rights, manage profile roles, and monitor recent logs. Seamlessly coordinate complex organizations with ease.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 p-8 rounded-2xl shadow-xs hover:border-blue-500/30 dark:hover:border-violet-500/20 hover:shadow-md transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-violet-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                <PaintBrushIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Beautiful Accent customization</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Switch accent colors in real-time. From electric blues to rich indigos and vibrant violets, make the workspace feel like home, supporting light, system, and dark modes.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 p-8 rounded-2xl shadow-xs hover:border-blue-500/30 dark:hover:border-violet-500/20 hover:shadow-md transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-violet-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                <QuestionMarkCircleIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Integrated Support Hub</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Submit help tickets and track responses directly within the app workspace. Our dedicated help center guarantees issues get resolved without blocking productivity.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 border-t border-zinc-200/50 dark:border-zinc-800/40 relative z-10 scroll-mt-24">
        <div className={LANDING_SHELL}>
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-violet-400 text-xs font-semibold tracking-wide border border-violet-500/20">
              <BriefcaseIcon className="h-3.5 w-3.5" />
              Simple Pricing
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Affordable plans tailored for MSMEs
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base sm:text-lg">
              Start free with tasks, projects, and Brain Board — upgrade to Pro for activity feed, announcements, and Advanced Analytics.
            </p>
            {billingLocale && billingLocale.chargeCurrency === "USD" && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
                {billingLocale.disclaimer}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {PRICING_PLANS.map((plan) => {
              const priceMajor =
                plan.id === "pro"
                  ? (billingLocale?.monthlyPriceMajor ?? plan.priceInr)
                  : 0;
              const priceLabel = formatChargeAmount(
                priceMajor,
                billingLocale?.chargeCurrency ?? "INR"
              );
              return (
              <div
                key={plan.id}
                className={`relative rounded-3xl border p-8 shadow-sm transition-all ${
                  plan.highlighted
                    ? "border-violet-500/30 bg-zinc-900 text-white shadow-xl shadow-violet-950/15 dark:bg-zinc-900"
                    : "border-zinc-200/80 bg-white dark:border-zinc-800/60 dark:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                        plan.highlighted
                          ? "bg-blue-500/20 text-violet-300"
                          : "bg-blue-500/10 text-blue-700 dark:text-violet-400"
                      }`}
                    >
                      {plan.badge}
                    </span>
                    <h3 className={`mt-4 text-2xl font-bold ${plan.highlighted ? "text-white" : "text-zinc-900 dark:text-white"}`}>
                      {plan.name}
                    </h3>
                    <p className={`mt-2 max-w-md text-sm leading-relaxed ${plan.highlighted ? "text-zinc-300" : "text-zinc-500 dark:text-zinc-400"}`}>
                      {plan.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`font-heading text-4xl font-extrabold tracking-tight ${plan.highlighted ? "text-white" : "text-zinc-900 dark:text-white"}`}
                    >
                      {priceLabel}
                    </div>
                    <div className={`mt-1 text-xs font-semibold ${plan.highlighted ? "text-zinc-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                      {plan.cadence}
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature.label} className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          feature.included
                            ? plan.highlighted
                              ? "bg-blue-500/20 text-violet-300"
                              : "bg-blue-500/10 text-blue-600 dark:text-violet-400"
                            : "bg-zinc-200/70 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
                        }`}
                      >
                        {feature.included ? (
                          <CheckIcon className="h-3.5 w-3.5 stroke-[3]" />
                        ) : (
                          <XMarkIcon className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${plan.highlighted ? "text-zinc-200" : "text-zinc-700 dark:text-zinc-300"}`}>
                        {feature.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 border-t border-zinc-200/10 pt-6">
                  <p className={`text-xs font-semibold ${plan.highlighted ? "text-violet-300" : "text-zinc-500 dark:text-zinc-400"}`}>
                    {"note" in plan ? plan.note : "No credit card needed to start"}
                  </p>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="compare" className="py-20 border-t border-zinc-200/50 dark:border-zinc-800/40 bg-zinc-100/40 dark:bg-zinc-950/20 relative z-10 scroll-mt-24">
        <div className={LANDING_SHELL}>
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-semibold tracking-wide border border-indigo-500/20">
              <SparklesIcon className="h-3.5 w-3.5" />
              Why Teams Switch
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Why MSMEs choose ANSH Task over Zoho Projects, Monday, ClickUp, and Trello
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base sm:text-lg">
              We are built for small & medium businesses that want real work execution, cleaner collaboration, and zero setup friction in one product.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {COMPETITOR_COMPARISONS.map((item, index) => (
              <div
                key={item.title}
                className="rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/60"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-violet-400 mb-5">
                  {index === 0 ? (
                    <ClipboardDocumentListIcon className="h-6 w-6" />
                  ) : index === 1 ? (
                    <BriefcaseIcon className="h-6 w-6" />
                  ) : (
                    <ChatBubbleLeftRightIcon className="h-6 w-6" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-5">
                  {item.summary}
                </p>
                <div className="space-y-3">
                  {item.points.map((point) => (
                    <div key={point} className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-violet-400">
                        <CheckIcon className="h-3.5 w-3.5 stroke-[3]" />
                      </div>
                      <span className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {point}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/60">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-violet-500/20 bg-blue-500/5 p-5">
                <h4 className="text-sm font-black uppercase tracking-widest text-blue-700 dark:text-violet-400">
                  The ANSH Task Model for MSMEs
                </h4>
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  A unified tool that any non-technical employee can adopt in minutes. Tasks, whiteboards, activity feed, announcements, and support desks all live together. No hidden setups or extra license costs.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/40">
                <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  The bloated enterprise tool model
                </h4>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Steep learning curves, complicated configuration (e.g. Zoho setup / Monday boards), expensive per-user licenses, and separate bills for Slack, whiteboards, and client ticketing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workspace Updates — Activity Feed & Announcements */}
      {!TEAM_SPACE_ENABLED && (
      <section id="workspace-updates" className="py-20 border-t border-zinc-200/50 dark:border-zinc-800/40 relative z-10 scroll-mt-24">
        <div className={LANDING_SHELL}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-violet-500/10 to-indigo-500/10 rounded-2xl blur-3xl pointer-events-none" />
              <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 overflow-hidden">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Activity Feed</span>
                </div>
                <div className="space-y-3">
                  {ACTIVITY_PREVIEW.map((item) => (
                    <div key={item.title} className="flex gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                        <BoltIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{item.title}</p>
                        <p className="mt-0.5 text-[10px] text-zinc-500">{item.description}</p>
                        <p className="mt-1 text-[10px] font-semibold text-zinc-400">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-violet-400 text-xs font-semibold tracking-wide border border-violet-500/20">
                <BoltIcon className="h-3.5 w-3.5" />
                Workspace Updates
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                Stay Aligned with Activity Feed & Announcements
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-base sm:text-lg leading-relaxed">
                Replace scattered chat threads with a lightweight update system. The activity feed logs what changed across tasks and projects, while announcements let leaders pin what everyone must read today.
              </p>
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-violet-400">
                    <CheckIcon className="h-4 w-4 stroke-[3]" />
                  </div>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Automatic timeline — tasks, projects, tickets, and team joins</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-violet-400">
                    <CheckIcon className="h-4 w-4 stroke-[3]" />
                  </div>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Pinned announcements for GST deadlines, closures, and policy updates</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-violet-400">
                    <CheckIcon className="h-4 w-4 stroke-[3]" />
                  </div>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Included on Pro — no extra Slack subscription required</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Team Space Feature (Section 3) */}
      {TEAM_SPACE_ENABLED && (
      <section id="team-space" className="py-20 border-t border-zinc-200/50 dark:border-zinc-800/40 relative z-10 scroll-mt-24">
        <div className={LANDING_SHELL}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Image/Mockup Showcase */}
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-violet-500/10 to-indigo-500/10 rounded-2xl blur-3xl pointer-events-none" />
              <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 overflow-hidden">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Team Space</span>
                </div>

                <div className="flex gap-3 min-h-[320px]">
                  {/* Channel sidebar */}
                  <div className="w-[38%] shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Channels</p>
                    <div className="space-y-1">
                      {TEAM_SPACE_PREVIEW.map((channel) => (
                        <button
                          key={channel.id}
                          onClick={() => setSelectedTeamChannel(channel.id)}
                          className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold transition-all ${
                            selectedTeamChannel === channel.id
                              ? "bg-blue-500/15 text-blue-700 dark:text-violet-300"
                              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          }`}
                        >
                          {channel.isPrivate ? (
                            <LockClosedIcon className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <HashtagIcon className="h-3.5 w-3.5 shrink-0" />
                          )}
                          {channel.name}
                        </button>
                      ))}
                    </div>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-4 mb-2">Direct Messages</p>
                    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[8px] font-bold text-white">PS</div>
                      Priya Sharma
                    </div>
                  </div>

                  {/* Chat preview */}
                  <div className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 p-3 flex flex-col">
                    <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        {activeTeamChannel.isPrivate ? (
                          <LockClosedIcon className="h-4 w-4 text-zinc-500" />
                        ) : (
                          <HashtagIcon className="h-4 w-4 text-zinc-500" />
                        )}
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{activeTeamChannel.name}</p>
                      </div>
                      <p className="mt-1 text-[10px] text-zinc-500 leading-snug">{activeTeamChannel.topic}</p>
                    </div>

                    <div className="space-y-3 flex-1">
                      {activeTeamChannel.messages.map((message) => (
                        <div key={`${message.author}-${message.time}`} className="flex gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-[9px] font-bold text-white">
                            {message.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">{message.author}</span>
                              <span className="text-[10px] text-zinc-400">{message.time}</span>
                            </div>
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">{message.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-[10px] text-zinc-400">
                      Message #{activeTeamChannel.name}...
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content Column */}
            <div className="space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-violet-400 text-xs font-semibold tracking-wide border border-violet-500/20">
                <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
                Team Space
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                Built-In Channels and DMs for Real Team Collaboration
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-base sm:text-lg leading-relaxed">
                Keep conversations next to your tasks, docs, and Brain Boards. Team Space gives every workspace shared channels, private rooms, and direct messages so updates stay in context instead of scattered across external chat apps.
              </p>
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-violet-400">
                    <CheckIcon className="h-4 w-4 stroke-[3]" />
                  </div>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Public and private channels with role-based access</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-violet-400">
                    <CheckIcon className="h-4 w-4 stroke-[3]" />
                  </div>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Direct messages for quick 1:1 coordination</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-violet-400">
                    <CheckIcon className="h-4 w-4 stroke-[3]" />
                  </div>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Included on Pro — no extra Slack subscription required</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
      )}

      {/* SEO Optimized FAQ Accordion (Section 4) */}
      <section id="faq" className="py-20 border-t border-zinc-200/50 dark:border-zinc-800/40 bg-zinc-100/40 dark:bg-zinc-950/20 relative z-10 scroll-mt-24">
        <div className={`${LANDING_SHELL} max-w-4xl`}>

          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base">
              Got questions about ANSH Task? Find quick answers below.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How does ANSH Task benefit MSMEs compared to other task management apps?",
                a: "Micro, Small & Medium Enterprises (MSMEs) often end up paying for multiple tools like Zoho/Trello (tasks), Slack (chat), Miro (whiteboards), and Zendesk (support). ANSH Task integrates all of these core functions under one roof at an extremely affordable price point, saving MSMEs up to 80% on software subscriptions and eliminating admin complexity.",
              },
              {
                q: "Can I customize the design system and theme accent colors?",
                a: "Yes. ANSH Task comes with a built-in Appearance Drawer. You can select custom accent colors (Blue, Indigo, Violet, Teal, Rose) and toggle between dark, light, or system themes. These modifications apply globally across all sub-pages in your workspace.",
              },
              {
                q: "Is there built-in customer support ticketing?",
                a: "Absolutely. ANSH Task features an integrated Support Center. Users can write, submit, and track the history of support tickets directly from the dashboard sidebar without needing external emails or helpdesks.",
              },
              {
                q: "How does the Brain Board feature work?",
                a: "The Brain Board is a visual ideation whiteboard. It allows you to place freeform sticky notes, capture sketches, cluster thoughts, and document project scopes. It serves as a creative canvas to map out roadmaps before creating final tasks in the Kanban lists.",
              },
              {
                q: "What database and hosting technologies support ANSH Task?",
                a: "ANSH Task is built on a modern stack using Next.js for high-fidelity frontend routing, Tailwind CSS for adaptive styling, Prisma ORM for type-safe database queries, and is ready for serverless deployments on platforms like Vercel.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-200"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-zinc-800 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <span className="text-sm md:text-base">{faq.q}</span>
                  <ChevronDownIcon className={`h-4.5 w-4.5 shrink-0 text-zinc-400 transition-transform duration-300 ${faqOpen[index] ? "transform rotate-180" : ""}`} />
                </button>

                <AnimatePresence initial={false}>
                  {faqOpen[index] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-6 pb-6 text-xs md:text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-4 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Trust & Compliance Section */}
      <section className="bg-zinc-50/80 py-8 dark:bg-zinc-950/70 relative z-10">
        <div className={LANDING_SHELL}>
          <TrustCompliance showDescription />
        </div>
      </section>

      {/* CTA Footer Section (Section 5) */}
      <section className="py-20 bg-zinc-900 text-white relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0078ff]/10 via-[#7000ff]/10 to-[#e040fb]/10 pointer-events-none" />
        <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] rounded-full bg-[#7000ff]/10 blur-[80px]" />
        <div className="absolute bottom-[5%] right-[15%] w-[250px] h-[250px] rounded-full bg-[#00c6ff]/10 blur-[70px]" />

        <div className={`${LANDING_SHELL} max-w-5xl text-center space-y-8 relative`}>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300 mb-2 border border-violet-500/30">
            <CheckCircleIcon className="h-6 w-6 animate-pulse" />
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto">
            Ready to accelerate your team's workflow?
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Create your free workspace in under two minutes. No credit card required. Enjoy complete access to tasks, brain boards, and documents.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00c6ff] to-[#9333ea] hover:from-[#00b4ea] hover:to-[#7c22d4] text-white font-bold px-8 py-4 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/35 active:scale-[0.98] transition-all"
            >
              Start 14-Day Free Trial
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Giant Brand Text Section */}
      <section className="bg-zinc-50 dark:bg-zinc-950 pt-16 pb-8 overflow-hidden relative z-10 border-t border-zinc-200/60 dark:border-zinc-800/40">
        <div className={`${LANDING_SHELL} flex flex-col items-center justify-center gap-4 text-center`}>
          {/* Handled by placeholder logo */}
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            <span>Handled by</span>
            <img 
              src="/logoAnshapps.png" 
              alt="ANSH Logo" 
              className="h-8 w-8 shrink-0 object-contain -ml-1" 
            />
          </div>
          <h2 className="font-heading text-[10vw] sm:text-[12vw] font-black tracking-tighter leading-none select-none bg-gradient-to-r from-[#00c6ff] via-[#7000ff] to-[#e040fb] bg-clip-text text-transparent pr-4">
            Ansh Apps
          </h2>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-50 dark:bg-zinc-950 relative z-10 pb-12 pt-4">
        <div className={LANDING_SHELL}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">

            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-0.5">
                <img 
                  src="/logoAnshapps.png" 
                  alt="ANSH Logo" 
                  className="h-8 w-8 shrink-0 object-contain -mr-1" 
                />
                <span className="font-heading text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  ANSH Task
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                The ultimate productivity canvas designed for teams who ship software and manage workflows daily.
              </p>
            </div>

            {/* Links 1 */}
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Product</h4>
              <ul className="space-y-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                <li><a href="#features" className="hover:text-blue-600 dark:hover:text-violet-400">Kanban Board</a></li>
                <li><a href="#pricing" className="hover:text-blue-600 dark:hover:text-violet-400">Pricing</a></li>
                <li><a href="#features" className="hover:text-blue-600 dark:hover:text-violet-400">Brain Board</a></li>
                <li><a href="#workspace-updates" className="hover:text-blue-600 dark:hover:text-violet-400">Activity Feed</a></li>
                <li><a href="#workspace-updates" className="hover:text-blue-600 dark:hover:text-violet-400">Announcements</a></li>
                <li><a href="#features" className="hover:text-blue-600 dark:hover:text-violet-400">Doc Sharing</a></li>
                {TEAM_SPACE_ENABLED && (
                <li><a href="#team-space" className="hover:text-blue-600 dark:hover:text-violet-400">Team Spaces</a></li>
                )}
              </ul>
            </div>

            {/* Links 2 */}
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Account</h4>
              <ul className="space-y-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                <li><Link href="/login" className="hover:text-blue-600 dark:hover:text-violet-400">Sign In</Link></li>
                <li><Link href="/signup" className="hover:text-blue-600 dark:hover:text-violet-400">Sign Up</Link></li>
                <li><Link href="/support" className="hover:text-blue-600 dark:hover:text-violet-400">Support Desk</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Get in Touch</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
                Have questions or need custom business plans? Talk to our creators.
              </p>
              <div className="space-y-2">
                <a
                  href="mailto:hello@anshapps.com"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-violet-400 dark:hover:text-violet-300"
                >
                  <EnvelopeIcon className="h-4 w-4" />
                  hello@anshapps.com
                </a>
                <a
                  href={`tel:${CONTACT_PHONE}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-violet-400 dark:hover:text-violet-300"
                >
                  <PhoneIcon className="h-4 w-4" />
                  {CONTACT_PHONE}
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  {CONTACT_PHONE}
                </a>
              </div>
            </div>

          </div>

          <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-6" />

          {/* Copyrights */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <p>© {new Date().getFullYear()} ANSH Task. All rights reserved.</p>
            <div className="flex flex-wrap justify-center sm:justify-end gap-x-4 gap-y-2">
              <Link href="/privacy" className="hover:text-zinc-700 dark:hover:text-zinc-300">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-zinc-700 dark:hover:text-zinc-300">Terms of Service</Link>
              <Link href="/contact" className="hover:text-zinc-700 dark:hover:text-zinc-300">Contact Us</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
