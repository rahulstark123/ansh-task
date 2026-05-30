"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";

export type SettingsSelectOption = { value: string; label: string };

type SettingsSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SettingsSelectOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
};

export function SettingsSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  icon,
  className = "",
}: SettingsSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption?.label ?? (value || placeholder);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-stone-50/50 pl-9 pr-3 text-left text-xs font-semibold text-zinc-700 outline-none transition-[border-color,box-shadow] hover:bg-zinc-50 focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
      >
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate">
          {displayLabel}
        </span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl scrollbar-thin dark:border-white/10 dark:bg-zinc-900"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors ${
                    isSelected
                      ? "bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                      : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <CheckIcon className="h-3.5 w-3.5 shrink-0 stroke-[2.5] text-[var(--app-primary)]" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
