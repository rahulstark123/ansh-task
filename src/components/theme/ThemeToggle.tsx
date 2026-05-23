"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setDark((d) => !d)}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/90 bg-white/90 text-zinc-600 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-colors hover:border-zinc-300 hover:text-[var(--app-primary)] dark:border-white/[0.08] dark:bg-zinc-900/50 dark:text-zinc-300"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </motion.button>
  );
}
