"use client";

import { useEffect, useState, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";

function RobotIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 8V4M10 4h4" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M9 13h.01M15 13h.01" />
      <path d="M9 17h6" />
      <path d="M2 13h2M20 13h2" />
    </svg>
  );
}

const SUGGESTIONS = [
  {
    label: "🏪 Retail Store Launch",
    text: "Set up a new retail outlet project including vendor onboarding, store layout, inventory setup, billing system, and grand opening event planning.",
  },
  {
    label: "📣 Marketing Campaign",
    text: "Plan a 30-day digital marketing campaign for our business covering Instagram, Facebook, WhatsApp broadcasts, and Google Ads to drive foot traffic.",
  },
  {
    label: "👥 HR Recruitment Drive",
    text: "Manage end-to-end recruitment for 5 new employees including job posting, resume screening, interview rounds, document collection, and onboarding.",
  },
  {
    label: "💰 Monthly Finance Review",
    text: "Set up a monthly finance project for GST filing, invoice reconciliation, payment tracking, bank statement verification, and P&L report.",
  },
  {
    label: "🌐 Business Website",
    text: "Build a professional website for our MSME business with a homepage, product/service pages, contact form, and WhatsApp chat integration.",
  },
  {
    label: "📦 Inventory Management",
    text: "Create an inventory management project to track stock levels, supplier orders, goods receipt, stock audits, and reorder alerts for our store.",
  },
];

export type GeneratedProject = {
  name: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  health: string;
  estimatedHours: number;
};

type AnshProjectCopilotModalProps = {
  open: boolean;
  onClose: () => void;
  onGenerated: (project: GeneratedProject) => void;
};

export function AnshProjectCopilotModal({
  open,
  onClose,
  onGenerated,
}: AnshProjectCopilotModalProps) {
  const titleId = useId();
  const [modalState, setModalState] = useState<"input" | "loading">("input");
  const [prompt, setPrompt] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (!open) {
      setModalState("input");
      setPrompt("");
      setLoadingStep(0);
    }
  }, [open]);

  useEffect(() => {
    if (modalState !== "loading") return;

    let active = true;
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;
    let t4: ReturnType<typeof setTimeout>;

    const run = async () => {
      t1 = setTimeout(() => { if (active) setLoadingStep(1); }, 400);
      t2 = setTimeout(() => { if (active) setLoadingStep(2); }, 900);
      t3 = setTimeout(() => { if (active) setLoadingStep(3); }, 1400);
      t4 = setTimeout(() => { if (active) setLoadingStep(4); }, 1900);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Unknown User";
        const userEmail = user?.email || "unknown@domain.com";
        const wid = typeof window !== "undefined"
          ? parseInt(sessionStorage.getItem("ansh_onboarding_wid") ?? "1", 10)
          : 1;

        const response = await fetch("/api/ai/project", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, workspaceId: wid, userName, userEmail }),
        });

        if (!response.ok) throw new Error(`API returned ${response.status}`);

        const data = await response.json();
        await new Promise((res) => setTimeout(res, 1600));

        if (active && data.success && data.name) {
          window.dispatchEvent(new Event("update-ai-credits"));
          onGenerated({
            name: data.name,
            description: data.description,
            category: data.category,
            status: data.status,
            priority: data.priority,
            health: data.health,
            estimatedHours: data.estimatedHours,
          });
        } else if (active) {
          // Fallback — pre-fill name/description from prompt
          onGenerated({
            name: prompt.slice(0, 40),
            description: prompt.slice(0, 120),
            category: "Operations",
            status: "Planning",
            priority: "Normal",
            health: "good",
            estimatedHours: 80,
          });
        }
      } catch (err) {
        console.error("Project Copilot error:", err);
        await new Promise((res) => setTimeout(res, 1600));
        if (active) {
          onGenerated({
            name: prompt.slice(0, 40),
            description: prompt.slice(0, 120),
            category: "Operations",
            status: "Planning",
            priority: "Normal",
            health: "good",
            estimatedHours: 80,
          });
        }
      } finally {
        clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
        if (active) onClose();
      }
    };

    run();

    return () => {
      active = false;
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, [modalState, onGenerated, onClose, prompt]);

  if (!open) return null;

  const loadingSteps = [
    "Analyzing your business context...",
    "Generating project structure...",
    "Selecting category & priority...",
    "Estimating timeline...",
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <button
          type="button"
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md dark:bg-black/80"
          aria-label="Close"
        />

        {/* Modal Box */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex w-full max-w-[600px] flex-col overflow-hidden rounded-2xl border border-indigo-500/25 bg-white shadow-[0_20px_50px_rgba(99,102,241,0.15)] dark:border-indigo-500/15 dark:bg-zinc-900/95"
        >
          {/* Neon top bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-600" />

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-150 px-6 py-4 dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50">
                <RobotIcon className="h-5 w-5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
              </div>
              <div>
                <h2 id={titleId} className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Create Project with ANSH Copilot
                </h2>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                  Describe your project — Copilot will set it up for you
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {modalState === "input" && (
              <div className="space-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Describe your project
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., Set up a recruitment project for hiring 3 accountants, including job posting, interviews, and onboarding..."
                    className="h-28 w-full rounded-xl border border-zinc-200 bg-stone-50/50 p-4 text-sm font-medium text-zinc-800 placeholder-zinc-400 outline-none transition-[border-color,box-shadow] focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] dark:border-white/[0.08] dark:bg-zinc-950/40 dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:border-indigo-500 resize-none"
                    rows={4}
                  />
                </div>

                {/* Suggestions */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Quick suggestions for your business:
                  </span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setPrompt(s.text)}
                        className="text-left rounded-xl border border-zinc-200/80 bg-white p-3.5 transition-all hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-white/[0.06] dark:bg-zinc-950/20 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-950/20 hover:scale-[1.01] cursor-pointer"
                      >
                        <div className="font-bold text-xs text-zinc-800 dark:text-zinc-200 mb-0.5">
                          {s.label}
                        </div>
                        <div className="text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-450 line-clamp-2 font-medium">
                          {s.text}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 dark:border-indigo-900/30 dark:bg-indigo-950/20">
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold leading-relaxed">
                    🤖 Copilot will auto-fill the project name, description, category, priority, status, and estimated hours based on your description. You can review and edit everything before saving.
                  </p>
                </div>
              </div>
            )}

            {modalState === "loading" && (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500/10 border-t-indigo-500" />
                  <RobotIcon className="h-7 w-7 text-indigo-500 animate-pulse" />
                </div>

                <div className="w-full max-w-[300px] space-y-3">
                  {loadingSteps.map((step, i) => (
                    <div key={step} className="flex items-center gap-2.5 text-xs font-bold text-zinc-500">
                      {loadingStep > i ? (
                        <CheckIcon className="h-4 w-4 text-emerald-500 stroke-[3] shrink-0" />
                      ) : (
                        <ArrowPathIcon className={`h-4 w-4 shrink-0 text-indigo-400 ${loadingStep === i ? "animate-spin" : "opacity-30"}`} />
                      )}
                      <span className={loadingStep > i ? "text-zinc-800 dark:text-zinc-200" : ""}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-zinc-150 bg-stone-50/50 px-6 py-4 dark:border-white/[0.06] dark:bg-zinc-950/40">
            {modalState === "input" ? (
              <>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400">
                  <RobotIcon className="h-4 w-4 text-indigo-500 animate-pulse" />
                  <span>Credit Cost:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">2 Credits</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-9 rounded-xl border border-zinc-250 bg-white px-4 text-xs font-bold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (prompt.trim()) setModalState("loading"); }}
                    disabled={!prompt.trim()}
                    className="h-9 rounded-xl bg-[var(--app-primary)] hover:bg-[var(--app-primary-hover)] px-5 text-xs font-bold text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Generate Project
                  </button>
                </div>
              </>
            ) : (
              <div className="text-xs font-semibold text-zinc-450 dark:text-zinc-500">
                Copilot is creating your project setup... please wait.
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
