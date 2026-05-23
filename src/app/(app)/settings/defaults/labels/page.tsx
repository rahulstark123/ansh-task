"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckIcon,
  PlusIcon,
  XMarkIcon,
  TagIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useWorkspaceDefaultsStore } from "@/store/workspaceDefaultsStore";

export default function LabelsSettingsPage() {
  const {
    customLabels,
    loading,
    fetchDefaults,
    updateDefaults,
  } = useWorkspaceDefaultsStore();

  const [workspaceId, setWorkspaceId] = useState(1);
  const [newLabelName, setNewLabelName] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Get workspace id from session storage on mount
  useEffect(() => {
    const wid = typeof window !== "undefined"
      ? parseInt(sessionStorage.getItem("ansh_onboarding_wid") ?? "1", 10)
      : 1;
    setWorkspaceId(wid);
    fetchDefaults(wid);
  }, [fetchDefaults]);

  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newLabelName.trim();
    if (!name) return;

    if (customLabels.some((l) => l.toLowerCase() === name.toLowerCase())) {
      setErrorMessage("Label already exists.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const updatedList = [...customLabels, name];
    const success = await updateDefaults(workspaceId, {
      customLabels: updatedList,
    });

    if (success) {
      setNewLabelName("");
      setToastMessage(`Label "${name}" added successfully!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
  };

  const handleDeleteLabel = async (labelToDelete: string) => {
    if (customLabels.length <= 1) {
      setErrorMessage("Workspace must have at least one label.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const updatedList = customLabels.filter((l) => l !== labelToDelete);
    const success = await updateDefaults(workspaceId, {
      customLabels: updatedList,
    });

    if (success) {
      setToastMessage(`Label "${labelToDelete}" deleted.`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-col gap-1.5 pb-6 border-b border-zinc-200/60 dark:border-white/5">
        <h1 className="font-heading text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
          Manage Task Labels
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Create, view, and delete tags/labels for categorizing tasks within the workspace.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12 max-w-4xl">
        {/* Left column: Add label */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/[0.06] dark:bg-zinc-900/50">
            <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <TagIcon className="h-4 w-4 text-indigo-500" />
              Add New Label
            </h3>
            
            <form onSubmit={handleAddLabel} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hotfix"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 px-3.5 text-xs font-semibold text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
                />
              </div>

              {errorMessage && (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-500 bg-rose-50/50 border border-rose-100 p-2.5 rounded-lg dark:bg-rose-950/10 dark:border-rose-900/20">
                  <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !newLabelName.trim()}
                className="w-full inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[var(--app-primary)] text-xs font-semibold text-white shadow-sm transition-all hover:bg-[var(--app-primary-hover)] active:scale-[0.98] disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4" />
                Add Label
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Current labels list */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/[0.06] dark:bg-zinc-900/50">
            <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-4">
              Workspace Labels ({customLabels.length})
            </h3>

            {loading && customLabels.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {customLabels.map((lbl) => (
                  <div
                    key={lbl}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/40 pl-3.5 pr-2 py-1.5 text-xs font-bold text-zinc-650 hover:bg-zinc-50 dark:border-white/[0.06] dark:bg-zinc-900 dark:text-zinc-350 transition-colors"
                  >
                    <span>{lbl}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteLabel(lbl)}
                      disabled={loading}
                      className="rounded p-0.5 text-zinc-450 hover:bg-zinc-150 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
                      title={`Delete ${lbl}`}
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating success toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3.5 rounded-2xl border border-emerald-500/10 bg-emerald-500 px-4 py-3 text-xs font-semibold text-white shadow-xl shadow-emerald-950/20"
          >
            <CheckIcon className="h-5 w-5 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
