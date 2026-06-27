"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";

export type AppSelectOption = {
  value: string;
  label: string;
};

function normalizeOptions(options: string[] | AppSelectOption[]): AppSelectOption[] {
  if (!options.length) return [];
  if (typeof options[0] === "string") {
    return (options as string[]).map((value) => ({ value, label: value }));
  }
  return options as AppSelectOption[];
}

const triggerSizes = {
  md: "px-4 py-3 text-sm font-medium min-h-[48px]",
  sm: "h-10 px-3 text-xs font-semibold",
} as const;

export function AppSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  size = "md",
  emptyMessage = "No options available",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[] | AppSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  size?: keyof typeof triggerSizes;
  emptyMessage?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const normalized = normalizeOptions(options);
  const selected = normalized.find((option) => option.value === value);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight ?? 240;
      const gap = 6;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const openUp = spaceBelow < Math.min(menuHeight, 240) && spaceAbove > spaceBelow;

      setMenuStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        top: openUp ? rect.top - gap : rect.bottom + gap,
        transform: openUp ? "translateY(-100%)" : undefined,
        zIndex: 10000,
      });
    };

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, normalized.length]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const menu = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.12 }}
          style={menuStyle}
          className="max-h-60 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-2xl scrollbar-thin dark:border-white/10 dark:bg-[#121418]"
        >
          {normalized.length === 0 ? (
            <div className="px-3 py-2.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
              {emptyMessage}
            </div>
          ) : (
            normalized.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={`${option.value}-${option.label}`}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-[var(--app-primary-soft)] text-[var(--app-primary)]"
                      : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/70"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <CheckIcon className="h-4 w-4 shrink-0 stroke-[2.5] text-[var(--app-primary)]" />
                  )}
                </button>
              );
            })
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all hover:border-zinc-300 focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-white/20 ${triggerSizes[size]}`}
      >
        <span
          className={`truncate ${
            selected ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"
          }`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {mounted && typeof document !== "undefined" ? createPortal(menu, document.body) : null}
    </div>
  );
}
