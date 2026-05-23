"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";
import { useAppearance, PrimaryColor, PALETTES } from "@/context/AppearanceContext";

export function AppearanceDrawer() {
  const { isAppearanceOpen, setIsAppearanceOpen, primaryColor, setPrimaryColor } = useAppearance();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen to Escape key to close
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAppearanceOpen(false)}
            className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-[850px] flex-col border-l border-zinc-200 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-zinc-900 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-heading text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                  Appearance
                </h2>
                <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  Optimize visual clarity across light and dark modes with carefully balanced colors and typography.
                </p>
              </div>
              <button
                onClick={() => setIsAppearanceOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Split Content */}
            <div className="mt-8 flex flex-col gap-8 md:flex-row">
              
              {/* Left Column - Controls */}
              <div className="flex-1 space-y-8">
                
                {/* Color Mode */}
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    Color mode
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Choose whether the app follows light, dark, or your system preference.
                  </p>
                  
                  <div className="mt-3 flex gap-2">
                    {(["light", "dark", "system"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setTheme(mode)}
                        className={`flex-1 rounded-xl border py-2.5 text-xs font-bold capitalize transition-all ${
                          currentTheme === mode
                            ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)] text-[var(--app-primary)] ring-1 ring-[var(--app-primary)]"
                            : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Color Palette */}
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    Primary color
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Handpicked palettes for strong readability and low eye strain.
                  </p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {(Object.keys(PALETTES) as PrimaryColor[]).map((colorKey) => {
                      const palette = PALETTES[colorKey];
                      const isSelected = primaryColor === colorKey;

                      return (
                        <button
                          key={colorKey}
                          onClick={() => setPrimaryColor(colorKey)}
                          className={`flex items-center gap-3 rounded-xl border p-3.5 text-left text-xs font-bold transition-all ${
                            isSelected
                              ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)] text-[var(--app-primary)] ring-1 ring-[var(--app-primary)]"
                              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          }`}
                        >
                          <span
                            className="h-4 w-4 shrink-0 rounded-full"
                            style={{ backgroundColor: palette.primary }}
                          />
                          {colorKey}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column - Live Preview */}
              <div className="w-full md:w-[320px] shrink-0">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-3">
                  Preview
                </h3>
                
                {/* Preview Card */}
                <div className="flex min-h-[340px] rounded-2xl border border-zinc-200/80 bg-zinc-50/50 shadow-sm dark:border-white/10 dark:bg-zinc-950/40 overflow-hidden">
                  
                  {/* Left Color Accent Strip */}
                  <div 
                    className="w-16 transition-colors duration-300"
                    style={{ backgroundColor: PALETTES[primaryColor].primary }}
                  />

                  {/* Right Content */}
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Task Workspace
                      </span>
                      <h4 className="mt-1 font-heading text-lg font-bold text-zinc-950 dark:text-zinc-50">
                        Product Discovery Call
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                        Discuss your goals and set clear next steps. Theme + font updates render here live.
                      </p>
                    </div>

                    <div className="mt-6 space-y-4">
                      {/* Fake Tags */}
                      <div className="flex flex-wrap gap-2">
                        <span 
                          className="rounded-md px-2.5 py-1 text-[10px] font-bold transition-all duration-300"
                          style={{
                            backgroundColor: currentTheme === "dark" ? PALETTES[primaryColor].softDark : PALETTES[primaryColor].softLight,
                            color: currentTheme === "dark" ? PALETTES[primaryColor].softTextDark : PALETTES[primaryColor].softTextLight,
                            border: `1px solid ${currentTheme === "dark" ? PALETTES[primaryColor].softBorderDark : PALETTES[primaryColor].softBorderLight}`
                          }}
                        >
                          30 minutes
                        </span>
                        <span className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-bold text-zinc-600 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300">
                          Google Meet
                        </span>
                      </div>

                      {/* Main Action Button */}
                      <button
                        className="w-full rounded-xl py-2.5 text-xs font-bold text-white shadow-md transition-all duration-300 active:scale-95"
                        style={{ backgroundColor: PALETTES[primaryColor].primary }}
                      >
                        Confirm booking
                      </button>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
