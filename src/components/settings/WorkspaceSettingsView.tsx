"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BriefcaseIcon,
  BuildingOffice2Icon,
  CheckIcon,
  MapPinIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/context/ToastContext";
import {
  SettingsPageHeader,
  SettingsSectionCard,
  settingsInputClass,
} from "@/components/settings/SettingsSectionCard";
import type { WorkspaceLookupType } from "@/app/api/workspace/lookups/route";

type LookupItem = { id: string; name: string };

type LookupSectionConfig = {
  type: WorkspaceLookupType;
  title: string;
  description: string;
  icon: React.ReactNode;
  placeholder: string;
};

const SECTIONS: LookupSectionConfig[] = [
  {
    type: "department",
    title: "Departments",
    description: "Organize teammates by department for profiles, reporting, and team filters.",
    icon: <BuildingOffice2Icon className="h-4 w-4" />,
    placeholder: "e.g. Engineering",
  },
  {
    type: "designation",
    title: "Designations",
    description: "Job titles used when adding or editing teammates in your workspace.",
    icon: <BriefcaseIcon className="h-4 w-4" />,
    placeholder: "e.g. Software Engineer",
  },
  {
    type: "location",
    title: "Work Locations",
    description: "Remote, hybrid, on-site, or custom office locations for teammates.",
    icon: <MapPinIcon className="h-4 w-4" />,
    placeholder: "e.g. Remote",
  },
];

function getWorkspaceId(): number {
  if (typeof window === "undefined") return 1;
  return parseInt(sessionStorage.getItem("ansh_onboarding_wid") ?? "1", 10);
}

function LookupListSection({
  config,
  items,
  loading,
  onAdd,
  onEdit,
  onDelete,
}: {
  config: LookupSectionConfig;
  items: LookupItem[];
  loading: boolean;
  onAdd: (type: WorkspaceLookupType, name: string) => Promise<boolean>;
  onEdit: (type: WorkspaceLookupType, id: string, name: string) => Promise<boolean>;
  onDelete: (type: WorkspaceLookupType, id: string, name: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    setSubmitting(true);
    const ok = await onAdd(config.type, name);
    setSubmitting(false);
    if (ok) setDraft("");
  };

  const startEdit = (item: LookupItem) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const name = editingName.trim();
    if (!name) return;
    setSubmitting(true);
    const ok = await onEdit(config.type, editingId, name);
    setSubmitting(false);
    if (ok) cancelEdit();
  };

  return (
    <SettingsSectionCard title={config.title} icon={config.icon}>
      <p className="mb-5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {config.description}
      </p>

      <form onSubmit={handleAdd} className="mb-5 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={config.placeholder}
          className={`${settingsInputClass} sm:flex-1`}
          disabled={submitting || loading}
        />
        <button
          type="submit"
          disabled={submitting || loading || !draft.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-60"
        >
          <PlusIcon className="h-4 w-4" />
          Add
        </button>
      </form>

      <div className="space-y-2">
        {loading ? (
          <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-400 dark:border-white/10">
            Loading {config.title.toLowerCase()}…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-400 dark:border-white/10">
            No {config.title.toLowerCase()} yet. Add your first one above.
          </div>
        ) : (
          items.map((item) => {
            const isEditing = editingId === item.id;
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/60 px-3 py-2.5 dark:border-white/[0.06] dark:bg-zinc-900/40"
              >
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void saveEdit();
                        }
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className={`${settingsInputClass} min-w-0 flex-1`}
                      autoFocus
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={() => void saveEdit()}
                      disabled={submitting || !editingName.trim()}
                      className="rounded-lg bg-[var(--app-primary)] p-2 text-white hover:brightness-110 disabled:opacity-60"
                      title="Save"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={submitting}
                      className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-white dark:border-white/10 dark:hover:bg-zinc-800"
                      title="Cancel"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                      {item.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="rounded-lg p-2 text-zinc-400 hover:bg-white hover:text-[var(--app-primary)] dark:hover:bg-zinc-800"
                      title="Edit"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete(config.type, item.id, item.name)}
                      className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </SettingsSectionCard>
  );
}

export function WorkspaceSettingsView() {
  const { showToast } = useToast();
  const [workspaceId, setWorkspaceId] = useState(1);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<LookupItem[]>([]);
  const [designations, setDesignations] = useState<LookupItem[]>([]);
  const [locations, setLocations] = useState<LookupItem[]>([]);
  const [showToastLocal, setShowToastLocal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const notify = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      if (type === "error") {
        showToast(message, "error");
        return;
      }
      setToastMessage(message);
      setShowToastLocal(true);
      setTimeout(() => setShowToastLocal(false), 3500);
    },
    [showToast]
  );

  const loadLookups = useCallback(async (wid: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspace/lookups?wid=${wid}`, { cache: "no-store" });
      const json = await res.json();
      if (!json.success) {
        notify(json.error || "Failed to load workspace settings", "error");
        return;
      }
      setDepartments(json.departments ?? []);
      setDesignations(json.designations ?? []);
      setLocations(json.locations ?? []);
    } catch {
      notify("Failed to load workspace settings", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    const wid = getWorkspaceId();
    setWorkspaceId(wid);
    void loadLookups(wid);
  }, [loadLookups]);

  const getSetter = (type: WorkspaceLookupType) => {
    if (type === "department") return setDepartments;
    if (type === "designation") return setDesignations;
    return setLocations;
  };

  const getItems = (type: WorkspaceLookupType) => {
    if (type === "department") return departments;
    if (type === "designation") return designations;
    return locations;
  };

  const handleAdd = async (type: WorkspaceLookupType, name: string) => {
    try {
      const res = await fetch("/api/workspace/lookups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, type, name }),
      });
      const json = await res.json();
      if (!json.success) {
        notify(json.error || "Failed to add item", "error");
        return false;
      }
      const setter = getSetter(type);
      setter((prev) =>
        [...prev, json.item].sort((a, b) => a.name.localeCompare(b.name))
      );
      notify(`"${name}" added successfully`);
      return true;
    } catch {
      notify("Failed to add item", "error");
      return false;
    }
  };

  const handleEdit = async (type: WorkspaceLookupType, id: string, name: string) => {
    try {
      const res = await fetch("/api/workspace/lookups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, type, id, name }),
      });
      const json = await res.json();
      if (!json.success) {
        notify(json.error || "Failed to update item", "error");
        return false;
      }
      const setter = getSetter(type);
      setter((prev) =>
        prev
          .map((item) => (item.id === id ? json.item : item))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      notify("Updated successfully");
      return true;
    } catch {
      notify("Failed to update item", "error");
      return false;
    }
  };

  const handleDelete = async (type: WorkspaceLookupType, id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" from workspace settings?`)) return false;

    try {
      const res = await fetch("/api/workspace/lookups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, type, id }),
      });
      const json = await res.json();
      if (!json.success) {
        notify(json.error || "Failed to delete item", "error");
        return false;
      }
      const setter = getSetter(type);
      setter((prev) => prev.filter((item) => item.id !== id));
      notify(`"${name}" deleted`);
      return true;
    } catch {
      notify("Failed to delete item", "error");
      return false;
    }
  };

  return (
    <div className="relative space-y-6">
      <SettingsPageHeader
        eyebrow="Workspace Settings"
        title="Departments, Designations & Locations"
        description="Manage the lookup values used across teammate profiles, add-member flows, and workspace organization."
      />

      <div className="grid gap-6 xl:grid-cols-1">
        {SECTIONS.map((section) => (
          <LookupListSection
            key={section.type}
            config={section}
            items={getItems(section.type)}
            loading={loading}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <AnimatePresence>
        {showToastLocal && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg dark:border-emerald-900/40 dark:bg-emerald-950/50 dark:text-emerald-300"
          >
            <CheckIcon className="h-4 w-4" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
