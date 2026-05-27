"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  CheckCircleIcon,
  BriefcaseIcon,
  LightBulbIcon,
  DocumentDuplicateIcon,
  UsersIcon,
  QuestionMarkCircleIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ArrowRightIcon,
  PaintBrushIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  CheckIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

// Define accent options to showcase the app's dynamic styling
const ACCENTS = [
  { id: "teal", name: "Teal", color: "#0d9488", class: "bg-teal-600 focus:ring-teal-400" },
  { id: "blue", name: "Blue", color: "#2563eb", class: "bg-blue-600 focus:ring-blue-400" },
  { id: "indigo", name: "Indigo", color: "#4f46e5", class: "bg-indigo-600 focus:ring-indigo-400" },
  { id: "violet", name: "Violet", color: "#7c3aed", class: "bg-violet-600 focus:ring-violet-400" },
  { id: "rose", name: "Rose", color: "#e11d48", class: "bg-rose-600 focus:ring-rose-400" },
];

const PRICING_PLANS = [
  {
    id: "free",
    name: "Free",
    badge: "Start free",
    price: "₹0",
    cadence: "/ workspace",
    description:
      "Great for trying the product, managing small teams, and getting real work done without paying upfront.",
    features: [
      { label: "Up to 2 team members", included: true },
      { label: "Up to 3 projects", included: true },
      { label: "50 tasks per month", included: true },
      { label: "Brain Board included", included: true },
      { label: "Team Space not included", included: false },
      { label: "Advanced Analytics not included", included: false },
    ],
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Most popular",
    price: "₹199",
    cadence: "/ user / month",
    description:
      "Best for growing teams that want seat-based scaling, deeper visibility, and full collaboration in one workspace.",
    features: [
      { label: "Add team members based on paid seats", included: true },
      { label: "Unlimited projects", included: true },
      { label: "Unlimited tasks", included: true },
      { label: "Brain Board included", included: true },
      { label: "Team Space channels and DMs", included: true },
      { label: "Advanced Analytics included", included: true },
    ],
    note: "Yearly billing saves 19%",
    highlighted: true,
  },
] as const;

const COMPETITOR_COMPARISONS = [
  {
    title: "Compared to Zoho Projects",
    summary: "Cleaner daily execution for teams that want less suite complexity.",
    points: [
      "Tasks, Brain Board, docs, and support workflows stay in one focused workspace.",
      "Faster onboarding for smaller teams that do not want a bulky business suite feel.",
    ],
  },
  {
    title: "Compared to monday.com",
    summary: "More built-in workflow depth without forcing extra tools for brainstorming and structured execution.",
    points: [
      "Brain Board turns ideas into action without leaving the product.",
      "Free plan still gives real room to work with 2 members, 3 projects, and 50 tasks each month.",
    ],
  },
  {
    title: "Compared to Jira",
    summary: "Easier for mixed teams beyond engineering-heavy workflows.",
    points: [
      "Product, design, operations, and founders can move fast without admin-heavy setup.",
      "You keep collaboration, planning, and execution in one place instead of managing complex workflow layers.",
    ],
  },
] as const;

export function LandingPageClient() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<"kanban" | "brain" | "docs">("kanban");
  const [selectedAccent, setSelectedAccent] = useState("teal");
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleFaq = (index: number) => {
    setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const getAccentColor = () => {
    const accent = ACCENTS.find((a) => a.id === selectedAccent);
    return accent ? accent.color : "#0d9488";
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-50 text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100 selection:bg-teal-500/20 selection:text-teal-600 dark:selection:text-teal-400">

      {/* Background Gradients */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[30%] -left-[10%] h-[70%] w-[50%] rounded-full bg-teal-500/10 blur-[120px] dark:bg-teal-500/5" />
        <div className="absolute top-[20%] -right-[10%] h-[60%] w-[40%] rounded-full bg-blue-500/10 blur-[100px] dark:bg-blue-500/5" />
        <div className="absolute bottom-[10%] left-[20%] h-[50%] w-[50%] rounded-full bg-indigo-500/10 blur-[130px] dark:bg-indigo-500/5" />
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/50 bg-zinc-50/80 backdrop-blur-md transition-colors dark:border-zinc-800/50 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-0.5 group">
            <img 
              src="/logoAnshapps.png" 
              alt="ANSH Logo" 
              className="h-10 w-10 shrink-0 object-contain group-hover:scale-105 transition-transform duration-200 -mr-1.5" 
            />
            <span className="font-heading text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-700 bg-clip-text text-transparent dark:from-zinc-50 dark:to-zinc-300">
              ANSH Task
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#features" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Pricing</a>
            <a href="#compare" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Why ANSH</a>
            <a href="#preview" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Interactive Hub</a>
            <a href="#customization" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Themes</a>
            <a href="#faq" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">FAQ</a>
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Selector */}
            <div className="flex items-center rounded-lg bg-zinc-200/60 p-1 dark:bg-zinc-900 border border-zinc-300/30 dark:border-zinc-800">
              <button
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-md transition-all ${theme === "light" ? "bg-white text-teal-600 shadow-sm dark:bg-zinc-800 dark:text-teal-400" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"}`}
                title="Light Mode"
              >
                <SunIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`p-1.5 rounded-md transition-all ${theme === "system" ? "bg-white text-teal-600 shadow-sm dark:bg-zinc-800 dark:text-teal-400" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"}`}
                title="System Theme"
              >
                <ComputerDesktopIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-md transition-all ${theme === "dark" ? "bg-white text-teal-600 shadow-sm dark:bg-zinc-800 dark:text-teal-400" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"}`}
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
            className="md:hidden absolute top-20 left-0 right-0 z-40 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-6 space-y-4 shadow-xl"
          >
            <nav className="flex flex-col gap-4 text-base font-semibold">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-zinc-600 dark:text-zinc-400 hover:text-teal-600">Features</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-zinc-600 dark:text-zinc-400 hover:text-teal-600">Pricing</a>
              <a href="#compare" onClick={() => setMobileMenuOpen(false)} className="text-zinc-600 dark:text-zinc-400 hover:text-teal-600">Why ANSH</a>
              <a href="#preview" onClick={() => setMobileMenuOpen(false)} className="text-zinc-600 dark:text-zinc-400 hover:text-teal-600">Interactive Hub</a>
              <a href="#customization" onClick={() => setMobileMenuOpen(false)} className="text-zinc-600 dark:text-zinc-400 hover:text-teal-600">Themes</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-zinc-600 dark:text-zinc-400 hover:text-teal-600">FAQ</a>
            </nav>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-4" />
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-zinc-500">Theme</span>
                <div className="flex items-center rounded-lg bg-zinc-200/60 p-1 dark:bg-zinc-900 border border-zinc-300/30 dark:border-zinc-800">
                  <button onClick={() => setTheme("light")} className={`p-1.5 rounded-md ${theme === "light" ? "bg-white text-teal-600 dark:bg-zinc-800" : "text-zinc-500"}`}><SunIcon className="h-4 w-4" /></button>
                  <button onClick={() => setTheme("system")} className={`p-1.5 rounded-md ${theme === "system" ? "bg-white text-teal-600 dark:bg-zinc-800" : "text-zinc-500"}`}><ComputerDesktopIcon className="h-4 w-4" /></button>
                  <button onClick={() => setTheme("dark")} className={`p-1.5 rounded-md ${theme === "dark" ? "bg-white text-teal-600 dark:bg-zinc-800" : "text-zinc-500"}`}><MoonIcon className="h-4 w-4" /></button>
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
      <section className="relative z-10 pt-8 pb-16 md:pt-16 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-8 text-center lg:text-left">

              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 text-xs font-semibold tracking-wide border border-teal-500/20">
                <SparklesIcon className="h-3.5 w-3.5" />
                Next-Gen Workspace
              </div>

              {/* Main Headline */}
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.1] text-zinc-900 dark:text-white">
                The Next-Gen{" "}
                <span className="bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent dark:from-teal-400 dark:to-emerald-500">
                  Task & Project Management App
                </span>{" "}
                for Fast Teams
              </h1>

              {/* Description */}
              <p className="text-zinc-600 dark:text-zinc-300 text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
                ANSH Task combines project management tools, Kanban task boards, collaborative brain boards, and documents into a unified, high-performance workspace.
              </p>

              {/* Value Props: What ANSH Task Does (Crisp & Clear) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto lg:mx-0 text-left bg-zinc-200/40 dark:bg-zinc-900/50 border border-zinc-300/20 dark:border-zinc-800/40 p-5 rounded-2xl">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 mt-0.5">
                    <CheckIcon className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Task Management</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Drag-and-drop Kanban list and team spaces.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 mt-0.5">
                    <CheckIcon className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Brain Boards</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Freeform ideation & visual brainstorming.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 mt-0.5">
                    <CheckIcon className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Documents Hub</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Shared rich docs directly linked to projects.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 mt-0.5">
                    <CheckIcon className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Unified Analytics</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Track stats, velocities, and company activity.</p>
                  </div>
                </div>
              </div>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold px-8 py-4 shadow-lg shadow-teal-600/20 active:scale-[0.98] transition-all"
                >
                  Get Started For Free
                  <ArrowRightIcon className="h-5 w-5" />
                </Link>
              </div>

              {/* Trust Section */}
              <div className="pt-6 space-y-2">
                <p className="text-lg sm:text-xl font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">
                  Built from Bharat for the World
                </p>
                <p className="text-sm sm:text-base font-semibold text-teal-600 dark:text-teal-400 tracking-wide">
                  encouraging Vasudhaiva Kutumbakam
                </p>
              </div>

            </div>

            {/* Right Interactive Mockup Column */}
            <div id="preview" className="lg:col-span-6 relative scroll-mt-24">
              <div className="absolute inset-0 bg-teal-500/10 rounded-3xl blur-2xl transform rotate-2 pointer-events-none" />

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
                    <button
                      onClick={() => setActivePreviewTab("docs")}
                      className={`px-3 py-1 rounded-md transition-all ${activePreviewTab === "docs" ? "bg-white text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50 shadow-xs" : "hover:text-zinc-700"}`}
                    >
                      Documents
                    </button>
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
                          <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold">Product</span>
                          <h5 className="text-xs font-semibold leading-tight text-zinc-800 dark:text-zinc-200">Setup system variables & billing limits</h5>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-zinc-400 font-medium">May 24</span>
                            <div className="w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-700 text-[8px] flex items-center justify-center font-bold">JS</div>
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
                          <span className="inline-block px-2 py-0.5 rounded bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 text-[10px] font-bold" style={{ backgroundColor: `${getAccentColor()}20`, color: getAccentColor() }}>Design</span>
                          <h5 className="text-xs font-semibold leading-tight text-zinc-800 dark:text-zinc-200">Design dynamic accent picker & dashboard themes</h5>
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
                          <span className="inline-block px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] font-bold">Engineering</span>
                          <h5 className="text-xs font-semibold leading-tight line-through text-zinc-500 dark:text-zinc-400">Initialize Prisma DB & setup contacts schema</h5>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
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
                        <span className="text-[10px] font-semibold text-yellow-800 dark:text-yellow-400">Idea #1</span>
                        <h6 className="text-xs font-bold text-zinc-900 dark:text-zinc-150">Gamified Task Streaks</h6>
                        <p className="text-[10px] text-zinc-600 dark:text-zinc-300 leading-tight">Reward users with badges for completing tasks on time 3 days in a row.</p>
                      </div>

                      <div className="absolute top-[40%] right-4 w-48 bg-purple-100 dark:bg-purple-950/40 p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/30 shadow-sm rotate-[1deg] space-y-1">
                        <span className="text-[10px] font-semibold text-purple-800 dark:text-purple-400">Growth Note</span>
                        <h6 className="text-xs font-bold text-zinc-900 dark:text-zinc-150">Slack Integration</h6>
                        <p className="text-[10px] text-zinc-600 dark:text-zinc-300 leading-tight">Send summary logs automatically to channels when project board updates.</p>
                      </div>

                      <div className="absolute bottom-2 left-6 w-52 bg-teal-100 dark:bg-teal-950/40 p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/30 shadow-sm rotate-[-1deg] space-y-1" style={{ borderColor: `${getAccentColor()}30` }}>
                        <span className="text-[10px] font-semibold text-teal-800 dark:text-teal-400" style={{ color: getAccentColor() }}>UX Research</span>
                        <h6 className="text-xs font-bold text-zinc-900 dark:text-zinc-150">Appearance drawer</h6>
                        <p className="text-[10px] text-zinc-600 dark:text-zinc-300 leading-tight">Allow workspace-wide accent color customization. Keep it dynamic!</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Documents View Content */}
                  {activePreviewTab === "docs" && (
                    <motion.div
                      key="docs-preview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 h-full shadow-xs text-left"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <DocumentDuplicateIcon className="h-4 w-4 text-teal-600" style={{ color: getAccentColor() }} />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Document Editor</span>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2 pb-2 border-b border-zinc-150 dark:border-zinc-800">
                        ANSH Task Product Specification & Guidelines
                      </h4>
                      <div className="space-y-2 text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">1. Core Architecture</p>
                        <p>Our app provides high performance dashboard features. We map routes seamlessly using Next.js app groups. All internal views are nested inside (app) ensuring unified topbar, sidebar and appearance controls.</p>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">2. Realtime Collaboration</p>
                        <p>Database queries are loaded via Prisma ORM. Live activity tracking hooks feed recent changes directly to team workspaces.</p>
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

      {/* Feature Deep-Dive Grid (Section 2) */}
      <section id="features" className="py-20 border-t border-zinc-200/50 dark:border-zinc-800/40 bg-zinc-100/40 dark:bg-zinc-950/20 relative z-10 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Powerful Task Management Features for High-Performing Teams
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base sm:text-lg">
              Say goodbye to fragmented SaaS apps. ANSH Task integrates productivity tools into one hyper-fast, customizable platform.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Feature 1 */}
            <div className="group bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 p-8 rounded-2xl shadow-xs hover:border-teal-500/30 dark:hover:border-teal-500/20 hover:shadow-md transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                <ClipboardDocumentListIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Dynamic Kanban Board</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Organize projects, assign deadlines, and update status columns. Interactive lists let you track bottlenecks, assign team leads, and log work subtasks.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 p-8 rounded-2xl shadow-xs hover:border-teal-500/30 dark:hover:border-teal-500/20 hover:shadow-md transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                <LightBulbIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Collaborative Brain Boards</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Sketch flows, cluster sticky notes, and plan sprints. An visual ideation hub designed to turn abstract project thoughts into concrete, assignable tasks.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 p-8 rounded-2xl shadow-xs hover:border-teal-500/30 dark:hover:border-teal-500/20 hover:shadow-md transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                <DocumentDuplicateIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Document Workspace</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Create specifications, process docs, and guidelines directly inside the project context. Built-in editing keeps knowledge readily accessible to all.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 p-8 rounded-2xl shadow-xs hover:border-teal-500/30 dark:hover:border-teal-500/20 hover:shadow-md transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                <UsersIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Granular Team Management</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Setup team spaces, control group access rights, manage profile roles, and monitor recent logs. Seamlessly coordinate complex organizations with ease.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 p-8 rounded-2xl shadow-xs hover:border-teal-500/30 dark:hover:border-teal-500/20 hover:shadow-md transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                <PaintBrushIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Beautiful Accent customization</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Switch accent colors in real-time. From cool teals to royal blues and rich purples, make the workspace feel like home, supporting light, system, and dark modes.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 p-8 rounded-2xl shadow-xs hover:border-teal-500/30 dark:hover:border-teal-500/20 hover:shadow-md transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-6 group-hover:scale-105 transition-transform duration-200">
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 text-xs font-semibold tracking-wide border border-teal-500/20">
              <BriefcaseIcon className="h-3.5 w-3.5" />
              Simple Pricing
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Clear plans for teams that want to move fast
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base sm:text-lg">
              Start free, then upgrade only when your team needs more seats, Team Space, and Advanced Analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-3xl border p-8 shadow-sm transition-all ${
                  plan.highlighted
                    ? "border-teal-500/30 bg-zinc-900 text-white shadow-xl shadow-teal-950/15 dark:bg-zinc-900"
                    : "border-zinc-200/80 bg-white dark:border-zinc-800/60 dark:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                        plan.highlighted
                          ? "bg-teal-500/20 text-teal-300"
                          : "bg-teal-500/10 text-teal-700 dark:text-teal-400"
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
                    <div className={`font-heading text-4xl font-extrabold tracking-tight ${plan.highlighted ? "text-white" : "text-zinc-900 dark:text-white"}`}>
                      {plan.price}
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
                              ? "bg-teal-500/20 text-teal-300"
                              : "bg-teal-500/10 text-teal-600 dark:text-teal-400"
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
                  <p className={`text-xs font-semibold ${plan.highlighted ? "text-teal-300" : "text-zinc-500 dark:text-zinc-400"}`}>
                    {"note" in plan ? plan.note : "No credit card needed to start"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="compare" className="py-20 border-t border-zinc-200/50 dark:border-zinc-800/40 bg-zinc-100/40 dark:bg-zinc-950/20 relative z-10 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-semibold tracking-wide border border-indigo-500/20">
              <SparklesIcon className="h-3.5 w-3.5" />
              Why Teams Switch
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Why ANSH Task feels better than Zoho Projects, monday.com, and Jira for growing teams
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base sm:text-lg">
              We are built for teams that want real work execution, cleaner collaboration, and less setup friction in one product.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {COMPETITOR_COMPARISONS.map((item, index) => (
              <div
                key={item.title}
                className="rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/60"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-5">
                  {index === 0 ? (
                    <BriefcaseIcon className="h-6 w-6" />
                  ) : index === 1 ? (
                    <ChatBubbleLeftRightIcon className="h-6 w-6" />
                  ) : (
                    <ClipboardDocumentListIcon className="h-6 w-6" />
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
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
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
              <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-5">
                <h4 className="text-sm font-black uppercase tracking-widest text-teal-700 dark:text-teal-400">
                  ANSH Task
                </h4>
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  One workspace for tasks, Brain Board, docs, Team Space, permissions, and support. Less switching. Faster adoption. Better clarity for everyday teams.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/40">
                <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Typical competitor experience
                </h4>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  More admin overhead, more configuration, or more add-on tools before teams get the same planning, collaboration, and execution flow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Accent Customization Feature (Section 3) */}
      <section id="customization" className="py-20 border-t border-zinc-200/50 dark:border-zinc-800/40 relative z-10 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Image/Mockup Showcase */}
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-teal-500/10 rounded-2xl blur-3xl pointer-events-none" />
              <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 overflow-hidden">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Appearance Settings</span>
                </div>

                <div className="space-y-6">
                  {/* Theme buttons showcase */}
                  <div>
                    <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Accent Color</h5>
                    <div className="flex flex-wrap gap-2">
                      {ACCENTS.map((accent) => (
                        <button
                          key={accent.id}
                          onClick={() => setSelectedAccent(accent.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${selectedAccent === accent.id ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 scale-105" : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"}`}
                        >
                          <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ backgroundColor: accent.color }} />
                          {accent.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* UI Preview Card */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-950/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: getAccentColor() }}>
                          <CheckCircleIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Task Action Complete</p>
                          <p className="text-[10px] text-zinc-500">Workspace dynamic state</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${getAccentColor()}15`, color: getAccentColor() }}>Active</span>
                    </div>

                    <div className="h-2 rounded-full w-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: getAccentColor(), width: "70%" }} />
                    </div>

                    <div className="flex justify-between items-center mt-3 text-[10px] text-zinc-500">
                      <span>Tasks: 7/10 completed</span>
                      <span className="font-bold" style={{ color: getAccentColor() }}>70% efficiency</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Left Content Column */}
            <div className="space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-semibold tracking-wide border border-indigo-500/20">
                <PaintBrushIcon className="h-3.5 w-3.5" />
                Themeable Workspace
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                A Customizable Workspace That Fits Your Project Workflows
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-base sm:text-lg leading-relaxed">
                ANSH Task includes a global, theme-aware appearance controller. Instantly toggle light, system default, or true midnight dark modes. Update the primary accent token to dynamically restyle the sidebar highlight pills, progress trackers, buttons, and custom badges.
              </p>
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <CheckIcon className="h-4 w-4 stroke-[3]" />
                  </div>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Synchronized dark mode presets with system checks</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <CheckIcon className="h-4 w-4 stroke-[3]" />
                  </div>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">5+ dynamic accent colors integrated globally</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <CheckIcon className="h-4 w-4 stroke-[3]" />
                  </div>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Clean visual consistency with custom HSL values</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SEO Optimized FAQ Accordion (Section 4) */}
      <section id="faq" className="py-20 border-t border-zinc-200/50 dark:border-zinc-800/40 bg-zinc-100/40 dark:bg-zinc-950/20 relative z-10 scroll-mt-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

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
                q: "How does ANSH Task compare to other task management apps and project management tools?",
                a: "ANSH Task is a unified collaborative productivity hub designed to stand out among task management apps. Unlike standalone project management tools, it integrates tasks (Kanban boards), visual whiteboards (Brain Boards), specs/wikis (Documents Hub), and support desks in one tab. This prevents context switching and maximizes team efficiency.",
              },
              {
                q: "Can I customize the design system and theme accent colors?",
                a: "Yes. ANSH Task comes with a built-in Appearance Drawer. You can select custom accent colors (Teal, Indigo, Blue, Violet, Rose) and toggle between dark, light, or system themes. These modifications apply globally across all sub-pages in your workspace.",
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

      {/* CTA Footer Section (Section 5) */}
      <section className="py-20 bg-zinc-900 text-white relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-teal-900/10 pointer-events-none" />
        <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] rounded-full bg-teal-500/5 blur-[80px]" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-8 relative">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 mb-2 border border-teal-500/30">
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
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-zinc-950 font-bold px-8 py-4 shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-[0.98] transition-all"
            >
              Sign Up For Free
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Giant Brand Text Section */}
      <section className="bg-zinc-50 dark:bg-zinc-950 pt-16 pb-8 overflow-hidden relative z-10 border-t border-zinc-200/60 dark:border-zinc-800/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-4 text-center">
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                <li><a href="#features" className="hover:text-teal-600">Kanban Board</a></li>
                <li><a href="#pricing" className="hover:text-teal-600">Pricing</a></li>
                <li><a href="#features" className="hover:text-teal-600">Brain Board</a></li>
                <li><a href="#features" className="hover:text-teal-600">Doc Sharing</a></li>
                <li><a href="#features" className="hover:text-teal-600">Team Spaces</a></li>
              </ul>
            </div>

            {/* Links 2 */}
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Account</h4>
              <ul className="space-y-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                <li><Link href="/login" className="hover:text-teal-600">Sign In</Link></li>
                <li><Link href="/signup" className="hover:text-teal-600">Sign Up</Link></li>
                <li><Link href="/support" className="hover:text-teal-600">Support Desk</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Get in Touch</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
                Have questions or need custom business plans? Talk to our creators.
              </p>
              <a
                href="mailto:support@ansh-task.com"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
              >
                <EnvelopeIcon className="h-4 w-4" />
                support@ansh-task.com
              </a>
            </div>

          </div>

          <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-6" />

          {/* Copyrights */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <p>© {new Date().getFullYear()} ANSH Task. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-zinc-700 dark:hover:text-zinc-300">Privacy Policy</a>
              <a href="#" className="hover:text-zinc-700 dark:hover:text-zinc-300">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
