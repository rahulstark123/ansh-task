"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";
import { useAppearance, PrimaryColor, PALETTES } from "@/context/AppearanceContext";

export function AppearanceDrawer() {
  const { isAppearanceOpen, setIsAppearanceOpen, primaryColor, setPrimaryColor } = useAppearance();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsAppearanceOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsAppearanceOpen]);

  if (!mounted) return null;

  const currentTheme = theme || "system";

  return (
    <AnimatePresence>
      {isAppearanceOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAppearanceOpen(false)}
            className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-[480px] flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-100 px-6 py-5 dark:border-white/5">
              <div>
                <h2 className="font-heading text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
                  Appearance
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Theme & accent color for your workspace
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAppearanceOpen(false)}
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 px-6 py-6">
              {/* Color mode */}
              <section>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                  Color mode
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Light, dark, or match your system
                </p>
                <div className="mt-3 flex gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1.5 dark:border-white/10 dark:bg-zinc-950/50">
                  {(["light", "dark", "system"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTheme(mode)}
                      className={`flex-1 rounded-lg py-2.5 text-xs font-bold capitalize transition-all ${
                        currentTheme === mode
                          ? "bg-white text-[var(--app-primary)] shadow-sm ring-1 ring-[var(--app-primary)] dark:bg-zinc-800"
                          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </section>

              {/* Primary color */}
              <section>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                  Primary color
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Accent for buttons, links, and highlights
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  {(Object.keys(PALETTES) as PrimaryColor[]).map((colorKey) => {
                    const palette = PALETTES[colorKey];
                    const isSelected = primaryColor === colorKey;

                    return (
                      <button
                        key={colorKey}
                        type="button"
                        onClick={() => setPrimaryColor(colorKey)}
                        className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all ${
                          isSelected
                            ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)] ring-1 ring-[var(--app-primary)]"
                            : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <span className="relative shrink-0">
                          <span
                            className="block h-6 w-6 rounded-full ring-1 ring-black/5 dark:ring-white/10"
                            style={{ backgroundColor: palette.primary }}
                          />
                          {isSelected && (
                            <CheckIcon className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow-sm" />
                          )}
                        </span>
                        <span
                          className={`min-w-0 truncate text-xs font-bold ${
                            isSelected
                              ? "text-[var(--app-primary)]"
                              : "text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {colorKey}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Preview */}
              <section>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                  Preview
                </h3>
                <div className="mt-3 flex overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50/80 shadow-sm dark:border-white/10 dark:bg-zinc-950/40">
                  <div
                    className="w-4 shrink-0 transition-colors duration-300"
                    style={{ backgroundColor: PALETTES[primaryColor].primary }}
                  />
                  <div className="min-w-0 flex-1 p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Task workspace
                    </span>
                    <h4 className="mt-1 text-base font-bold text-zinc-950 dark:text-zinc-50">
                      Product Discovery Call
                    </h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      See how your accent looks on tags and actions.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors duration-300"
                        style={{
                          backgroundColor:
                            currentTheme === "dark"
                              ? PALETTES[primaryColor].softDark
                              : PALETTES[primaryColor].softLight,
                          color:
                            currentTheme === "dark"
                              ? PALETTES[primaryColor].softTextDark
                              : PALETTES[primaryColor].softTextLight,
                          border: `1px solid ${
                            currentTheme === "dark"
                              ? PALETTES[primaryColor].softBorderDark
                              : PALETTES[primaryColor].softBorderLight
                          }`,
                        }}
                      >
                        30 minutes
                      </span>
                      <span className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-600 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300">
                        Google Meet
                      </span>
                    </div>
                    <button
                      type="button"
                      className="mt-3 w-full rounded-xl py-2.5 text-xs font-bold text-white shadow-md transition-colors duration-300"
                      style={{ backgroundColor: PALETTES[primaryColor].primary }}
                    >
                      Confirm booking
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
