"use client";

import { motion } from "framer-motion";
import {
  DocumentIcon,
  FolderIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";

const TREE = [
  { label: "Company docs", icon: FolderIcon, children: ["Handbook.pdf", "Brand.zip"] },
  { label: "Project docs", icon: FolderIcon, children: ["PRD — ANSH Task", "API spec"] },
  { label: "Attachments", icon: PaperClipIcon, children: ["Invoice — July", "NDA draft"] },
];

export function DocumentsView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[calc(100vh-4rem)] flex-col gap-6 px-6 py-8 lg:flex-row lg:px-10"
    >
      <aside className="w-full shrink-0 rounded-3xl border border-zinc-200 bg-zinc-50/90 p-5 dark:border-white/10 dark:bg-zinc-950/40 lg:w-72">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          Folders
        </p>
        <ul className="mt-4 space-y-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          {TREE.map((f) => (
            <li key={f.label}>
              <div className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white dark:hover:bg-white/5">
                <f.icon className="h-5 w-5 text-[var(--app-primary)]" />
                {f.label}
              </div>
              <ul className="ml-7 mt-1 space-y-1 text-xs text-zinc-500">
                {f.children.map((c) => (
                  <li key={c} className="truncate">
                    {c}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </aside>

      <div className="min-w-0 flex-1">
        <h1 className="font-heading text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
          Shared files
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Company docs, project docs, and attachments — S3 / Drive integrations later.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["Strategy memo", "Design kit", "Sprint retro", "Launch checklist"].map((name) => (
            <div
              key={name}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/40"
            >
              <DocumentIcon className="h-8 w-8 text-zinc-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">{name}</p>
                <p className="text-xs text-zinc-400">Shared · view</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
