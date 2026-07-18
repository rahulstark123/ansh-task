"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArchiveBoxIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { supabase } from "@/lib/supabase";
import { readSessionWorkspaceId } from "@/lib/workspace-session";
import { useToast } from "@/context/ToastContext";
import { usePermissionAccess } from "@/lib/usePermissionAccess";
import { AnshAnnouncementCopilotModal } from "@/components/copilot/AnshAnnouncementCopilotModal";

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

type Announcement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  authorName: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function AnnouncementCardSkeleton() {
  return (
    <div className="flex h-full min-h-[280px] animate-pulse flex-col rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/70">
      <div className="flex items-start justify-between gap-3">
        <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="mt-4 h-5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800/80" />
        <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800/80" />
        <div className="h-3 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800/80" />
      </div>
      <div className="mt-auto space-y-2 border-t border-zinc-100 pt-4 dark:border-white/[0.06]">
        <div className="h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800/80" />
        <div className="h-3 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800/80" />
      </div>
    </div>
  );
}

function AnnouncementCard({
  item,
  canManage,
  canModerate,
  onEdit,
  onPin,
  onArchive,
  onRestore,
  onDelete,
}: {
  item: Announcement;
  canManage: boolean;
  canModerate: boolean;
  onEdit: (item: Announcement) => void;
  onPin: (id: string, pinned: boolean) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (item: Announcement) => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex h-full min-h-[280px] flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-zinc-900/70 ${
        item.pinned && !item.archived
          ? "border-teal-500/30 ring-1 ring-teal-500/10 dark:border-teal-600/40"
          : "border-zinc-200 dark:border-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
          <MegaphoneIcon className="h-5 w-5" />
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {item.pinned && !item.archived && (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-300">
              <BookmarkSolidIcon className="h-3 w-3" />
              Pinned
            </span>
          )}
          {item.archived && (
            <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:bg-zinc-800">
              Archived
            </span>
          )}
        </div>
      </div>

      <h2 className="mt-4 line-clamp-2 font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
        {item.title}
      </h2>

      <p className="mt-3 line-clamp-6 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        {item.body}
      </p>

      <div className="mt-5 space-y-2 border-t border-zinc-100 pt-4 dark:border-white/[0.06]">
        <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          <UserCircleIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.authorName}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          <CalendarDaysIcon className="h-4 w-4 shrink-0" />
          <span>{formatDate(item.createdAt)}</span>
        </div>
      </div>

      {canModerate && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4 dark:border-white/[0.06]">
          {!item.archived && (
            <button
              type="button"
              onClick={() => onPin(item.id, !item.pinned)}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <BookmarkIcon className="h-3.5 w-3.5" />
              {item.pinned ? "Unpin" : "Pin"}
            </button>
          )}
          {canManage && (
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <PencilSquareIcon className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
          {!item.archived ? (
            <button
              type="button"
              onClick={() => onArchive(item.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ArchiveBoxIcon className="h-3.5 w-3.5" />
              Archive
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onRestore(item.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Restore
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}
    </motion.article>
  );
}

export function AnnouncementsView() {
  const { showToast } = useToast();
  const { can } = usePermissionAccess();
  const canManage = can("post_announcements");
  const canModerate = can("manage_announcements");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const handleAnnouncementGenerated = (genTitle: string, genBody: string) => {
    setTitle(genTitle);
    setBody(genBody);
    setPinned(false);
    setEditingId(null);
    setModalOpen(true);
  };

  const fetchAnnouncements = useCallback(
    async (wid: number, archived: boolean, signal?: AbortSignal) => {
      const params = new URLSearchParams({ wid: String(wid) });
      if (archived) params.set("includeArchived", "true");

      const res = await fetch(`/api/announcements?${params.toString()}`, {
        cache: "no-store",
        signal,
      });
      const json = await res.json();
      if (json.success && json.announcements) {
        return json.announcements as Announcement[];
      }
      return [];
    },
    []
  );

  const reloadAnnouncements = useCallback(async () => {
    const wid = workspaceId ?? readSessionWorkspaceId();
    setRefreshing(true);
    try {
      const data = await fetchAnnouncements(wid, showArchived);
      setAnnouncements(data);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Failed to reload announcements:", err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAnnouncements, showArchived, workspaceId]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setInitialLoading(true);
      const wid = readSessionWorkspaceId();
      setWorkspaceId(wid);

      try {
        const [userResult, data] = await Promise.all([
          supabase.auth.getUser(),
          fetchAnnouncements(wid, showArchived, controller.signal),
        ]);

        if (cancelled) return;

        if (userResult.data.user?.email) {
          setUserEmail(userResult.data.user.email);
        }
        setAnnouncements(data);
      } catch (err) {
        if (cancelled || (err instanceof Error && err.name === "AbortError")) return;
        console.error("Failed to load announcements:", err);
        setAnnouncements([]);
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [fetchAnnouncements, showArchived]);

  const visibleAnnouncements = useMemo(
    () =>
      showArchived
        ? announcements.filter((a) => a.archived)
        : announcements.filter((a) => !a.archived),
    [announcements, showArchived]
  );

  const pinnedCount = visibleAnnouncements.filter((a) => a.pinned && !a.archived).length;

  const openCreateModal = () => {
    setEditingId(null);
    setTitle("");
    setBody("");
    setPinned(false);
    setModalOpen(true);
  };

  const openEditModal = (item: Announcement) => {
    setEditingId(item.id);
    setTitle(item.title);
    setBody(item.body);
    setPinned(item.pinned);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim() || !userEmail || workspaceId == null) return;
    setSubmitting(true);
    try {
      const payload = {
        workspaceId,
        email: userEmail,
        title: title.trim(),
        body: body.trim(),
        pinned,
        ...(editingId ? { id: editingId } : {}),
      };

      const res = await fetch("/api/announcements", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save announcement");
      }

      showToast(editingId ? "Announcement updated" : "Announcement posted");
      closeModal();
      await reloadAnnouncements();
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : "Failed to save announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const patchAnnouncement = async (id: string, patch: Record<string, boolean>) => {
    if (!userEmail) return;
    try {
      const res = await fetch("/api/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email: userEmail, ...patch }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Update failed");
      }
      await reloadAnnouncements();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Update failed");
    }
  };

  const requestDeleteAnnouncement = (item: Announcement) => {
    setAnnouncementToDelete(item);
  };

  const confirmDeleteAnnouncement = async () => {
    if (!userEmail || !announcementToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/announcements?id=${encodeURIComponent(announcementToDelete.id)}&email=${encodeURIComponent(userEmail)}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Delete failed");
      }
      showToast("Announcement deleted");
      setAnnouncementToDelete(null);
      await reloadAnnouncements();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.75rem)] w-full flex-col overflow-hidden bg-zinc-50/40 dark:bg-zinc-950">
      <div className="shrink-0 border-b border-zinc-200/80 bg-white px-6 py-5 dark:border-white/[0.06] dark:bg-zinc-950/90 backdrop-blur-sm z-20 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md">
              <MegaphoneIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Announcements
              </h1>
              <p className="text-xs font-medium text-zinc-500">
                {initialLoading
                  ? "Loading…"
                  : `${visibleAnnouncements.length} notice${visibleAnnouncements.length === 1 ? "" : "s"}`}
                {!initialLoading && !showArchived && pinnedCount > 0 ? ` · ${pinnedCount} pinned` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowArchived((prev) => !prev)}
              className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition-all ${
                showArchived
                  ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-300"
                  : "border-zinc-200 bg-white text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200"
              }`}
            >
              <ArchiveBoxIcon className="h-4 w-4" />
              {showArchived ? "Showing archived" : "View archived"}
            </button>

            {canManage && (
              <button
                type="button"
                onClick={() => setIsCopilotOpen(true)}
                className="relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-lg bg-white px-3.5 text-xs font-bold text-zinc-800 shadow-sm transition-all hover:bg-stone-50/50 hover:scale-105 active:scale-95 dark:bg-zinc-900 dark:text-zinc-100 cursor-pointer border border-indigo-400/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 animate-pulse" />
                <RobotIcon className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                <span className="relative bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                  ANSH Copilot
                </span>
              </button>
            )}

            {canManage && (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--app-primary)] px-3 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                <PlusIcon className="h-4 w-4" />
                New announcement
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`flex-1 overflow-auto p-6 ${refreshing ? "opacity-60 pointer-events-none transition-opacity" : ""}`}>
        {initialLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <AnnouncementCardSkeleton key={index} />
            ))}
          </div>
        ) : visibleAnnouncements.length === 0 ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white py-24 text-center dark:border-white/10 dark:bg-zinc-900/40 px-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
              <MegaphoneIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {showArchived ? "No archived announcements" : "No announcements yet"}
            </p>
            <p className="max-w-md text-xs text-zinc-500 dark:text-zinc-400">
              {canManage
                ? "Post company-wide notices, deadlines, and policy updates for your team."
                : "Owners and admins can post workspace announcements here."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visibleAnnouncements.map((item) => (
              <AnnouncementCard
                key={item.id}
                item={item}
                canManage={canManage}
                canModerate={canModerate}
                onEdit={openEditModal}
                onPin={(id, nextPinned) => void patchAnnouncement(id, { pinned: nextPinned })}
                onArchive={(id) => void patchAnnouncement(id, { archived: true })}
                onRestore={(id) => void patchAnnouncement(id, { archived: false })}
                onDelete={requestDeleteAnnouncement}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="fixed inset-x-4 top-[10vh] z-50 mx-auto flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#121418]"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-white/[0.06]">
                <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                  {editingId ? "Edit announcement" : "New announcement"}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 px-5 py-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. GST filing deadline reminder"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Message
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={5}
                    placeholder="Write the announcement your team should read…"
                    className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                    className="rounded border-zinc-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]"
                  />
                  Pin to top of announcements
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-4 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitting || !title.trim() || !body.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--app-primary)] px-4 py-2 text-sm font-bold text-white shadow-md hover:brightness-110 disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                  {submitting ? "Saving…" : editingId ? "Save changes" : "Post announcement"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {announcementToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !deleting && setAnnouncementToDelete(null)}
              className="fixed inset-0 z-[60] bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-0 z-[60] m-auto flex h-fit max-w-[400px] flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121418] overflow-hidden"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500 shadow-sm dark:bg-rose-950/30 dark:text-rose-400">
                  <ExclamationTriangleIcon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Delete announcement
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    &quot;{announcementToDelete.title}&quot;
                  </span>
                  ? This action cannot be undone and the notice will be permanently removed from your workspace.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setAnnouncementToDelete(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-650 hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void confirmDeleteAnnouncement()}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnshAnnouncementCopilotModal
        open={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onGenerated={handleAnnouncementGenerated}
      />
    </div>
  );
}
