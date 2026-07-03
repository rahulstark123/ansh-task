"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";

export type AppMultiSelectOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

export function AppMultiSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  emptyMessage = "No options available",
  className = "",
}: {
  value: string[];
  onChange: (value: string[]) => void;
  options: AppMultiSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
  }, [open, options.length]);

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

  const toggleOption = (optValue: string) => {
    onChange(
      value.includes(optValue)
        ? value.filter((v) => v !== optValue)
        : [...value, optValue]
    );
  };

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
          className="max-h-52 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-2xl scrollbar-thin dark:border-white/10 dark:bg-[#121418]"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
              {emptyMessage}
            </div>
          ) : (
            options.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <button
                  key={`${option.value}-${option.label}`}
                  type="button"
                  onClick={() => toggleOption(option.value)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                    isSelected
                      ? "bg-zinc-50 text-zinc-900 dark:bg-zinc-800/50 dark:text-white"
                      : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/30"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    {option.icon}
                    <span className="truncate">{option.label}</span>
                  </div>
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      isSelected
                        ? "border-[var(--app-primary)] bg-[var(--app-primary)] text-white"
                        : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                    }`}
                  >
                    {isSelected && <CheckIcon className="h-3 w-3 stroke-[3]" />}
                  </div>
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
        className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-700 outline-none transition-[border-color,box-shadow] hover:bg-zinc-50 focus:border-[var(--app-primary)] focus:shadow-[0_0_0_3px_var(--app-ring)] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5 text-left">
          {value.length === 0 ? (
            <span className="text-zinc-400">{placeholder}</span>
          ) : (
            value.map((selectedValue) => {
              const option = options.find((o) => o.value === selectedValue);
              const label = option?.label ?? selectedValue;
              return (
                <span
                  key={selectedValue}
                  className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-[var(--app-primary-soft-border)] bg-[var(--app-primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--app-primary-soft-text)]"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--app-primary)]/20 text-[8px] font-bold text-[var(--app-primary)]">
                    {label[0]?.toUpperCase() ?? "?"}
                  </span>
                  <span className="truncate">{label}</span>
                </span>
              );
            })
          )}
        </div>
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
