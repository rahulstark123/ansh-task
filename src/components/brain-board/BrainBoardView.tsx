"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SparklesIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ViewfinderCircleIcon,
  MinusIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import { usePermissionAccess } from "@/lib/usePermissionAccess";
import { AnshStickyCopilotModal } from "@/components/copilot/AnshStickyCopilotModal";

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

type Note = {
  id: string;
  title: string;
  body: string;
  color: string;
  x: number;
  y: number;
  rotation: number;
};

const COLOR_OPTIONS = [
  {
    name: "Yellow",
    value: "bg-amber-50 border-amber-350 text-amber-950 dark:bg-amber-950/30 dark:border-amber-700/50 dark:text-amber-100 shadow-[0_6px_20px_rgba(245,158,11,0.08)]",
    dotClass: "bg-amber-400 dark:bg-amber-800",
  },
  {
    name: "Blue",
    value: "bg-sky-50 border-sky-350 text-sky-950 dark:bg-sky-950/30 dark:border-sky-700/50 dark:text-sky-100 shadow-[0_6px_20px_rgba(14,165,233,0.08)]",
    dotClass: "bg-sky-400 dark:bg-sky-800",
  },
  {
    name: "Purple",
    value: "bg-violet-50 border-violet-350 text-violet-950 dark:bg-violet-950/30 dark:border-violet-700/50 dark:text-violet-100 shadow-[0_6px_20px_rgba(139,92,246,0.08)]",
    dotClass: "bg-violet-400 dark:bg-violet-800",
  },
  {
    name: "Green",
    value: "bg-emerald-50 border-emerald-350 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-700/50 dark:text-emerald-100 shadow-[0_6px_20px_rgba(16,185,129,0.08)]",
    dotClass: "bg-emerald-400 dark:bg-emerald-800",
  },
  {
    name: "Rose",
    value: "bg-rose-50 border-rose-350 text-rose-950 dark:bg-rose-950/30 dark:border-rose-700/50 dark:text-rose-100 shadow-[0_6px_20px_rgba(244,63,94,0.08)]",
    dotClass: "bg-rose-400 dark:bg-rose-800",
  },
];

export function BrainBoardView() {
  const { can, alertNoPermission } = usePermissionAccess();
  const canCreateStickyNotes = can("create_sticky_notes");
  const canEditNotes = can("edit_notes");
  const canDeleteNotes = can("delete_notes");

  const enforcePermission = (allowed: boolean) => {
    if (allowed) return true;
    alertNoPermission();
    return false;
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [scale, setScale] = useState(1);

  // User and Workspace state
  const [userId, setUserId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // Sticky Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stickyTitle, setStickyTitle] = useState("");
  const [stickyBody, setStickyBody] = useState("");
  const [stickyColor, setStickyColor] = useState(COLOR_OPTIONS[0].value);

  // Edit Sticky Note State
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Delete Confirmation Dialog State
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const handleStickyGenerated = (genTitle: string, genContent: string, genColor: string) => {
    setStickyTitle(genTitle);
    setStickyBody(genContent);

    // Map color name to COLOR_OPTIONS value
    const matchedOption = COLOR_OPTIONS.find(c => c.name.toLowerCase() === genColor.toLowerCase());
    setStickyColor(matchedOption?.value || COLOR_OPTIONS[0].value);
    
    setEditingNote(null);
    setIsModalOpen(true);
  };

  // Close modal and reset fields helper
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setStickyTitle("");
    setStickyBody("");
    setStickyColor(COLOR_OPTIONS[0].value);
  };

  // Center scroll position on page load
  const centerCanvas = () => {
    if (containerRef.current) {
      const container = containerRef.current;
      container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
      container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
    }
  };

  // Load user details and fetch notes from database
  useEffect(() => {
    const fetchUserAndNotes = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);

          const onboardingWid = sessionStorage.getItem("ansh_onboarding_wid");
          let wid = onboardingWid ? parseInt(onboardingWid, 10) : 1;

          // Fetch user details from team to obtain actual workspaceId
          const teamRes = await fetch(`/api/team?email=${encodeURIComponent(user.email || "")}`);
          const teamJson = await teamRes.json();
          if (teamJson.success && teamJson.workspaceId) {
            wid = teamJson.workspaceId;
          }
          setWorkspaceId(wid);

          // Retrieve brainboard notes for this user and workspace
          const res = await fetch(`/api/brain-board?userId=${user.id}&workspaceId=${wid}`);
          const json = await res.json();
          if (json.success) {
            setNotes(json.notes);
          }
        }
      } catch (err) {
        console.error("Error loading user and brainboard notes:", err);
      } finally {
        setLoading(false);
        // Timeout to ensure elements have finished rendering before centering canvas scroll
        setTimeout(centerCanvas, 100);
      }
    };

    fetchUserAndNotes();
  }, []);

  const handleRecenter = () => {
    setScale(1);
    if (containerRef.current) {
      const container = containerRef.current;
      const targetLeft = (container.scrollWidth - container.clientWidth) / 2;
      const targetTop = (container.scrollHeight - container.clientHeight) / 2;

      container.scrollTo({
        left: targetLeft,
        top: targetTop,
        behavior: "smooth",
      });
    }
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.1, 2));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.1, 0.5));

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stickyTitle.trim() || !stickyBody.trim() || !userId) return;
    if (!enforcePermission(editingNote ? canEditNotes : canCreateStickyNotes)) return;

    if (editingNote) {
      // Edit existing note
      try {
        const res = await fetch("/api/brain-board", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingNote.id,
            title: stickyTitle.trim(),
            body: stickyBody.trim(),
            color: stickyColor,
          }),
        });

        const json = await res.json();
        if (json.success && json.note) {
          setNotes((prev) =>
            prev.map((n) => (n.id === editingNote.id ? json.note : n))
          );
        }
      } catch (err) {
        console.error("Error updating note:", err);
      }
    } else {
      // Create new note
      let x = 1500;
      let y = 1000;
      if (containerRef.current) {
        const container = containerRef.current;
        x = container.scrollLeft + container.clientWidth / 2 - 128; // offset half sticky width (128px)
        y = container.scrollTop + container.clientHeight / 2 - 80;
      }

      const rotation = Math.random() * 6 - 3; // random rotation

      try {
        const res = await fetch("/api/brain-board", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: stickyTitle.trim(),
            body: stickyBody.trim(),
            color: stickyColor,
            x,
            y,
            rotation,
            workspaceId,
            userId,
          }),
        });

        const json = await res.json();
        if (json.success && json.note) {
          setNotes((prev) => [...prev, json.note]);
        }
      } catch (err) {
        console.error("Error creating note:", err);
      }
    }

    handleCloseModal();
  };

  // Persistent drag end positioning
  const handleDragEnd = async (noteId: string, offset: { x: number; y: number }) => {
    if (!enforcePermission(canEditNotes)) return;
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const newX = Math.max(0, Math.min(3000 - 256, n.x + offset.x));
          const newY = Math.max(0, Math.min(2000 - 180, n.y + offset.y));

          // Save position back to database in the background
          fetch("/api/brain-board", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: noteId, x: newX, y: newY }),
          }).catch((err) => console.error("Error saving drag position:", err));

          return { ...n, x: newX, y: newY };
        }
        return n;
      })
    );
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!enforcePermission(canDeleteNotes)) return;
    try {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      await fetch(`/api/brain-board?id=${noteId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.75rem)] w-full items-center justify-center bg-transparent dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
          <span className="text-sm font-semibold text-zinc-500">Connecting to your brain board...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.75rem)] w-full flex-col overflow-hidden bg-transparent dark:bg-zinc-950 relative">
      
      {/* HEADER BAR */}
      <div className="shrink-0 border-b border-zinc-200/80 bg-white px-6 py-4 dark:border-white/[0.06] dark:bg-zinc-950/80 backdrop-blur-sm z-20 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-md">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Brain Board
              </h1>
              <p className="text-[11px] font-medium text-zinc-500">
                Your infinite second brain
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative group">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-[var(--app-primary)] transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="h-9 w-48 rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs outline-none transition-all focus:border-[var(--app-primary)] focus:bg-white focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-950"
              />
            </div>
            
            <button
              onClick={handleRecenter}
              className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ViewfinderCircleIcon className="h-4 w-4 text-zinc-400" />
              Recenter
            </button>

            {canCreateStickyNotes && (
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

            <button
              onClick={() => {
                if (!enforcePermission(canCreateStickyNotes)) return;
                setIsModalOpen(true);
              }}
              disabled={!canCreateStickyNotes}
              className="flex h-9 items-center gap-2 rounded-lg bg-[var(--app-primary)] px-3 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-45"
            >
              <PlusIcon className="h-4 w-4" />
              New Sticky
            </button>
          </div>
        </div>
      </div>

      {/* INFINITE CANVAS AREA */}
      <div 
        ref={containerRef}
        className="relative flex-1 overflow-auto cursor-grab active:cursor-grabbing scrollbar-thin brain-board-canvas"
        style={{
          backgroundSize: "24px 24px",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent dark:from-zinc-950/10 z-0" />
        
        {/* Canvas Content Plane */}
        <div 
          className="relative h-[2000px] w-[3000px] p-10 z-10 origin-center transition-transform duration-200 ease-out"
          style={{ transform: `scale(${scale})` }}
        >
          {filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              drag={canEditNotes}
              dragConstraints={{ left: 0, right: 3000 - 256, top: 0, bottom: 2000 - 180 }}
              dragMomentum={false}
              initial={{ x: note.x, y: note.y, rotate: note.rotation }}
              whileDrag={{ scale: 1.05, rotate: 0, zIndex: 50, cursor: "grabbing" }}
              onDragEnd={(event, info) => handleDragEnd(note.id, info.offset)}
              className={`absolute flex w-64 flex-col rounded-xl border p-5 shadow-lg backdrop-blur-md cursor-grab transition-shadow hover:shadow-xl ${note.color}`}
            >
              <div className="mb-3 flex items-center justify-between border-b border-black/5 pb-2 dark:border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 truncate max-w-[140px]">
                  {note.title}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={!canEditNotes}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!enforcePermission(canEditNotes)) return;
                      setEditingNote(note);
                      setStickyTitle(note.title);
                      setStickyBody(note.body);
                      setStickyColor(note.color);
                      setIsModalOpen(true);
                    }}
                    className="rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10 opacity-45 hover:opacity-100 transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
                    title="Edit Note"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!canDeleteNotes}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!enforcePermission(canDeleteNotes)) return;
                      setNoteToDelete(note.id);
                    }}
                    className="rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10 opacity-45 hover:opacity-100 transition-opacity text-rose-650 dark:text-rose-400 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Delete Note"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs font-semibold leading-relaxed break-words whitespace-pre-wrap">
                {note.body}
              </p>
              <div className="mt-4 flex justify-end">
                <div className="h-2 w-2 rounded-full bg-black/10 dark:bg-white/20" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* EMPTY STATE MESSAGE */}
      {filteredNotes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-md text-center p-8 rounded-2xl border border-zinc-250 bg-white shadow-2xl shadow-zinc-950/10 dark:border-white/10 dark:bg-zinc-900/90 pointer-events-auto"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/20 mb-5">
              <SparklesIcon className="h-7 w-7 animate-pulse" />
            </div>
            <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Your Brain Board is empty
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              This is your infinite space to map thoughts, ideas, and strategies. Create your first sticky note to start brainstorming!
            </p>
            <button
              onClick={() => {
                if (!enforcePermission(canCreateStickyNotes)) return;
                setIsModalOpen(true);
              }}
              disabled={!canCreateStickyNotes}
              className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--app-primary)] px-4 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-45"
            >
              <PlusIcon className="h-4 w-4" />
              Place First Sticky
            </button>
          </motion.div>
        </div>
      )}

      {/* FLOATING ZOOM CONTROL PANEL */}
      <div className="absolute bottom-6 right-6 z-30 flex items-center gap-1 rounded-xl border border-zinc-200 bg-white/85 p-1 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/85">
        <button
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 active:scale-95 transition-all dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <MinusIcon className="h-4 w-4" />
        </button>
        
        <span className="min-w-[48px] text-center text-[10px] font-black text-zinc-600 dark:text-zinc-300 select-none uppercase tracking-wider">
          {Math.round(scale * 100)}%
        </span>

        <button
          onClick={handleZoomIn}
          title="Zoom In (+)"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 active:scale-95 transition-all dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <PlusIcon className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-zinc-200 dark:bg-white/10 mx-1" />

        <button
          onClick={handleRecenter}
          title="Recenter Canvas"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 active:scale-95 transition-all dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <ViewfinderCircleIcon className="h-4 w-4" />
        </button>
      </div>

      {/* NEW STICKY MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-0 z-50 m-auto flex h-fit w-full max-w-[420px] flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121418]"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-pink-500" />
                  <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                    {editingNote ? "Edit Sticky Note" : "Create Sticky Note"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Title / Header
                  </label>
                  <input
                    type="text"
                    required
                    value={stickyTitle}
                    onChange={(e) => setStickyTitle(e.target.value)}
                    placeholder="e.g. Brainstorm idea"
                    className="mt-2 block w-full rounded-xl border border-zinc-200 px-4 py-3 text-xs text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Content
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={stickyBody}
                    onChange={(e) => setStickyBody(e.target.value)}
                    placeholder="Write details for your sticky note..."
                    className="mt-2 block w-full rounded-xl border border-zinc-200 px-4 py-3 text-xs text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 resize-none"
                  />
                </div>

                {/* Sticky Color Picker */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Color Theme
                  </label>
                  <div className="mt-3 flex items-center gap-3">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        disabled={editingNote ? !canEditNotes : !canCreateStickyNotes}
                        onClick={() => setStickyColor(color.value)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                          stickyColor === color.value
                            ? "border-[var(--app-primary)] scale-110 shadow-sm"
                            : "border-transparent hover:scale-105"
                        } disabled:cursor-not-allowed disabled:opacity-45`}
                        title={color.name}
                      >
                        <div className={`h-6.5 w-6.5 rounded-full ${color.dotClass} flex items-center justify-center text-white`}>
                          {stickyColor === color.value && (
                            <CheckIcon className="h-3 w-3 text-zinc-900 dark:text-zinc-50" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 rounded-xl border border-zinc-200 py-3 text-xs font-bold text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editingNote ? !canEditNotes : !canCreateStickyNotes}
                    className="flex-1 rounded-xl bg-[var(--app-primary)] py-3 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-98 transition-all disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {editingNote ? "Save Changes" : "Place Sticky"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {noteToDelete && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNoteToDelete(null)}
              className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-0 z-50 m-auto flex h-fit w-full max-w-[380px] flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121418]"
            >
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <TrashIcon className="h-6 w-6 shrink-0" />
                <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Delete Sticky Note
                </h3>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                Are you sure you want to delete this sticky note? This action cannot be undone and the note will be permanently removed.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setNoteToDelete(null)}
                  className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-xs font-bold text-zinc-650 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!canDeleteNotes}
                  onClick={async () => {
                    if (!enforcePermission(canDeleteNotes)) return;
                    if (noteToDelete) {
                      await handleDeleteNote(noteToDelete);
                      setNoteToDelete(null);
                    }
                  }}
                  className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-700 active:scale-98 transition-all disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnshStickyCopilotModal
        open={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onGenerated={handleStickyGenerated}
      />
    </div>
  );
}
