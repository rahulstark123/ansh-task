"use client";

import { useEffect, useState, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { parsePromptToTask, ParsedTask } from "@/lib/copilot-parser";
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
    label: "Retail Shop",
    text: "Create daily tasks for managing a retail store, including stock checking, customer service, billing, inventory updates, supplier follow-ups, and store closing activities.",
  },
  {
    label: "HR",
    text: "Prepare a complete recruitment workflow, including posting the job, screening resumes, scheduling interviews, collecting documents, issuing the offer letter, and onboarding the selected candidate.",
  },
  {
    label: "Marketing",
    text: "Plan a 7-day social media campaign to promote our business, including Instagram, Facebook, LinkedIn posts, short videos, and customer engagement activities.",
  },
  {
    label: "Finance",
    text: "Generate monthly finance tasks, including GST preparation, invoice verification, payment reminders, expense tracking, bank reconciliation, and monthly reporting.",
  },
];

type AnshCopilotModalProps = {
  open: boolean;
  onClose: () => void;
  onGenerated: (data: ParsedTask) => void;
  assignees: string[];
  projects: { id: string; name: string }[];
  customCategories?: string[];
};

export function AnshCopilotModal({
  open,
  onClose,
  onGenerated,
  assignees,
  projects,
  customCategories = [],
}: AnshCopilotModalProps) {
  const titleId = useId();
  const [modalState, setModalState] = useState<"input" | "loading">("input");
  const [prompt, setPrompt] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setModalState("input");
      setPrompt("");
      setLoadingStep(0);
    }
  }, [open]);

  // Call AI API and progress steps
  useEffect(() => {
    if (modalState !== "loading") return;

    let active = true;

    const runParser = async () => {
      // Setup step timers to show animation
      const t1 = setTimeout(() => { if (active) setLoadingStep(1); }, 400);
      const t2 = setTimeout(() => { if (active) setLoadingStep(2); }, 850);
      const t3 = setTimeout(() => { if (active) setLoadingStep(3); }, 1300);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Unknown User";
        const userEmail = user?.email || "unknown@domain.com";
        const wid = typeof window !== "undefined"
          ? parseInt(sessionStorage.getItem("ansh_onboarding_wid") ?? "1", 10)
          : 1;

        const response = await fetch("/api/ai/copilot", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            projects,
            assignees,
            customCategories,
            workspaceId: wid,
            userName,
            userEmail,
          }),
        });

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.task) {
          // Wait a bit to ensure the loading checklist animations are readable
          await new Promise((resolve) => setTimeout(resolve, 1500));
          if (active) {
            window.dispatchEvent(new Event("update-ai-credits"));
            onGenerated(data.task);
          }
          return;
        }
        throw new Error("Invalid response format");
      } catch (err) {
        console.warn("Groq AI failed, falling back to local NLP parser:", err);
        // Fallback
        await new Promise((resolve) => setTimeout(resolve, 1600));
        if (active) {
          const localResult = parsePromptToTask(prompt, projects, assignees, customCategories);
          onGenerated(localResult);
        }
      } finally {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      }
    };

    runParser();

    return () => {
      active = false;
    };
  }, [modalState, prompt, projects, assignees, customCategories, onGenerated]);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setLoadingStep(0);
    setModalState("loading");
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <button
          type="button"
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md dark:bg-black/80"
          aria-label="Close dialog"
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
          className="relative z-10 flex w-full max-w-[580px] flex-col overflow-hidden rounded-2xl border border-indigo-500/25 bg-white shadow-[0_20px_50px_rgba(99,102,241,0.15)] dark:border-indigo-500/15 dark:bg-zinc-900/95 dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
        >
          {/* Neon Top Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-600" />

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-150 px-6 py-4 dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50">
                <RobotIcon className="h-5 w-5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
              </div>
              <h2 id={titleId} className="font-heading text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Create Task with your ANSH Copilot
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {modalState === "input" && (
              <div className="space-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Prompt describing your task
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., Generate monthly finance tasks, including GST preparation, invoice verification, and expense tracking"
                    className="h-28 w-full rounded-xl border border-zinc-200 bg-stone-50/50 p-4 text-sm font-medium text-zinc-800 placeholder-zinc-400 outline-none transition-[border-color,box-shadow] focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] dark:border-white/[0.08] dark:bg-zinc-950/40 dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:border-indigo-500"
                  />
                </div>

                {/* Suggestions Section */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Or select a suggestion:
                  </span>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setPrompt(s.text)}
                        className="text-left rounded-xl border border-zinc-200/80 bg-white p-3.5 transition-all hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-white/[0.06] dark:bg-zinc-950/20 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-950/20 hover:scale-[1.01] cursor-pointer"
                      >
                        <div className="font-bold text-xs text-indigo-650 dark:text-indigo-400 mb-0.5">
                          {s.label}
                        </div>
                        <div className="text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-450 line-clamp-2 font-medium">
                          {s.text}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {modalState === "loading" && (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                {/* Glowing AI Spinner */}
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500/10 border-t-indigo-500" />
                  <RobotIcon className="h-7 w-7 text-indigo-500 animate-pulse" />
                </div>

                {/* Status Messages */}
                <div className="w-full max-w-[280px] space-y-3">
                  <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-500">
                    {loadingStep >= 1 ? (
                      <CheckIcon className="h-4 w-4 text-emerald-500 stroke-[3]" />
                    ) : (
                      <ArrowPathIcon className="h-4 w-4 text-indigo-400 animate-spin" />
                    )}
                    <span className={loadingStep >= 1 ? "text-zinc-800 dark:text-zinc-200" : ""}>
                      Analyzing instructions...
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-500">
                    {loadingStep >= 2 ? (
                      <CheckIcon className="h-4 w-4 text-emerald-500 stroke-[3]" />
                    ) : loadingStep === 1 ? (
                      <ArrowPathIcon className="h-4 w-4 text-indigo-400 animate-spin" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-zinc-200 dark:border-zinc-800" />
                    )}
                    <span className={loadingStep >= 2 ? "text-zinc-800 dark:text-zinc-200" : ""}>
                      Matching team & projects...
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-500">
                    {loadingStep >= 3 ? (
                      <CheckIcon className="h-4 w-4 text-emerald-500 stroke-[3]" />
                    ) : loadingStep === 2 ? (
                      <ArrowPathIcon className="h-4 w-4 text-indigo-400 animate-spin" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-zinc-200 dark:border-zinc-800" />
                    )}
                    <span className={loadingStep >= 3 ? "text-zinc-800 dark:text-zinc-200" : ""}>
                      Constructing task preview...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex shrink-0 items-center justify-between border-t border-zinc-150 bg-stone-50/50 px-6 py-4 dark:border-white/[0.06] dark:bg-zinc-950/40">
            {modalState === "input" ? (
              <>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400">
                  <RobotIcon className="h-4 w-4 text-indigo-500 animate-pulse" />
                  <span>Credit Cost:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">1 Credit</span>
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
                    onClick={handleGenerate}
                    disabled={!prompt.trim()}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.01] hover:shadow-indigo-500/25 active:scale-95 disabled:scale-100 disabled:opacity-45 disabled:shadow-none cursor-pointer"
                  >
                    <RobotIcon className="h-4 w-4" />
                    Generate with Copilot
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full flex justify-end">
                <button
                  type="button"
                  onClick={() => setModalState("input")}
                  className="h-9 rounded-xl border border-zinc-250 bg-white px-4 text-xs font-bold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
