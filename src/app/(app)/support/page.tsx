"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifebuoyIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  CheckIcon,
  PaperClipIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import {
  SUPPORT_MAX_IMAGES,
  formatSupportAttachmentSize,
  validateSupportAttachments,
} from "@/lib/support-attachments";

interface Ticket {
  id: string;
  ticketId: string;
  subject: string;
  category: "Technical" | "Billing" | "General" | "Feedback";
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Open" | "In Progress" | "Resolved";
  createdAt: string;
  updatedAt?: string;
  description: string;
  attachmentUrls?: string[];
}

type TicketReply = {
  id: string;
  message: string;
  authorRole: "admin" | "user";
  authorName: string | null;
  createdAt: string;
};

export default function SupportPage() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState(1);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<Ticket["category"]>("Technical");
  const [priority, setPriority] = useState<Ticket["priority"]>("Medium");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [activeTab, setActiveTab] = useState<"All" | "Open" | "In Progress" | "Resolved">("All");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [modalTab, setModalTab] = useState<"details" | "replies">("details");

  // Fetch tickets on mount
  useEffect(() => {
    const wid = typeof window !== "undefined"
      ? parseInt(sessionStorage.getItem("ansh_onboarding_wid") ?? "1", 10)
      : 1;
    setWorkspaceId(wid);

    async function fetchTickets() {
      setLoading(true);
      try {
        const res = await fetch(`/api/support?wid=${wid}`);
        const json = await res.json();
        if (json.success && json.tickets) {
          setTickets(json.tickets);
        }
      } catch (err) {
        console.error("Failed to load tickets:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, []);

  const loadReplies = useCallback(async (ticketId: string, wid: number) => {
    setLoadingReplies(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/replies?wid=${wid}`);
      const json = await res.json();
      if (json.success && json.replies) {
        setReplies(json.replies);
      } else {
        setReplies([]);
      }
    } catch {
      setReplies([]);
    } finally {
      setLoadingReplies(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedTicket) {
      setReplies([]);
      setReplyText("");
      setModalTab("details");
      return;
    }
    setModalTab("details");
    loadReplies(selectedTicket.id, workspaceId);
  }, [selectedTicket, workspaceId, loadReplies]);

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim() || selectedTicket.status === "Resolved") return;

    setSendingReply(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;

      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/replies`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: replyText.trim(),
          workspaceId,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setReplyText("");
        await loadReplies(selectedTicket.id, workspaceId);
      }
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files).filter((file) => file.size > 0);
    const mergedFiles = [...files, ...selectedFiles];
    const validation = validateSupportAttachments(mergedFiles);

    if (!validation.ok) {
      showToast(validation.error, "error");
      e.target.value = "";
      return;
    }

    setFiles(mergedFiles);
    e.target.value = "";
  };

  const totalAttachmentBytes = files.reduce((sum, file) => sum + file.size, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    if (files.length > 0) {
      const validation = validateSupportAttachments(files);
      if (!validation.ok) {
        showToast(validation.error, "error");
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("workspaceId", workspaceId.toString());
      formData.append("subject", subject.trim());
      formData.append("category", category);
      formData.append("priority", priority);
      formData.append("description", description.trim());
      
      if (files.length > 0) {
        files.forEach((file) => {
          formData.append("files", file);
        });
      }

      const res = await fetch("/api/support", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.ticket) {
        setTickets([json.ticket, ...tickets]);
        setSubject("");
        setCategory("Technical");
        setPriority("Medium");
        setDescription("");
        setFiles([]);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        showToast(json.error || "Failed to submit support ticket.", "error");
      }
    } catch (err) {
      console.error("Failed to submit support ticket:", err);
      showToast("Failed to submit support ticket. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter(
    (t) => activeTab === "All" || t.status === activeTab
  );

  const getPriorityColor = (p: Ticket["priority"]) => {
    switch (p) {
      case "Low":
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
      case "Medium":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300";
      case "High":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300";
      case "Urgent":
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300";
    }
  };

  const getStatusIcon = (s: Ticket["status"]) => {
    switch (s) {
      case "Open":
        return <ExclamationCircleIcon className="h-4 w-4 text-emerald-500" />;
      case "In Progress":
        return <ClockIcon className="h-4 w-4 text-amber-500 animate-pulse" />;
      case "Resolved":
        return <CheckCircleIcon className="h-4 w-4 text-zinc-400" />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getAttachmentName = (url: string) =>
    url.split("/").pop()?.replace(/TCK-\d+-/, "") || "Attachment";

  const isImageAttachment = (url: string) =>
    /\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(getAttachmentName(url));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-hover)] p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <LifebuoyIcon className="h-4 w-4" />
            Support Center
          </div>
          <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight md:text-4xl">
            How can we help you today?
          </h1>
          <p className="mt-2 text-sm text-teal-50/80">
            Submit a support request to our engineering team or track the status of your existing requests.
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        {/* Left Side: Submit Ticket Form */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Create New Ticket
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Our engineers typically respond within a few hours.
            </p>

            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 flex items-center gap-2.5 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300"
                >
                  <CheckIcon className="h-4 w-4 shrink-0" />
                  <span>Ticket created successfully! Track status in the list.</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  Subject / Short Title
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Workspace domain settings error"
                  className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 px-3 text-xs font-semibold text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Ticket["category"])}
                      className="w-full h-10 appearance-none rounded-xl border border-zinc-200 bg-stone-50/50 px-3 pr-10 text-xs font-semibold text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
                    >
                      <option value="Technical" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">Technical</option>
                      <option value="Billing" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">Billing</option>
                      <option value="General" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">General</option>
                      <option value="Feedback" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">Feedback</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 dark:text-zinc-500">
                      <ChevronDownIcon className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Ticket["priority"])}
                      className="w-full h-10 appearance-none rounded-xl border border-zinc-200 bg-stone-50/50 px-3 pr-10 text-xs font-semibold text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
                    >
                      <option value="Low" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">Low</option>
                      <option value="Medium" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">Medium</option>
                      <option value="High" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">High</option>
                      <option value="Urgent" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">Urgent</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 dark:text-zinc-500">
                      <ChevronDownIcon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue or feedback in detail..."
                  className="w-full rounded-xl border border-zinc-200 bg-stone-50/50 p-3 text-xs font-semibold text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100 resize-none"
                />
              </div>

              {/* Dynamic File Uploader Box */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  Attachments
                </label>
                
                {files.length > 0 && (
                  <div className="mb-2 space-y-2">
                    {files.map((fileItem, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 dark:border-white/5 dark:bg-zinc-900/40">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <PaperClipIcon className="h-4 w-4 shrink-0 text-indigo-500" />
                          <span
                            className="truncate text-[11px] font-semibold dark:text-zinc-300"
                            title={fileItem.name}
                          >
                            {fileItem.name}
                          </span>
                          <span className="shrink-0 text-[9px] text-zinc-400">
                            ({formatSupportAttachmentSize(fileItem.size)})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800"
                        >
                          <XMarkIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <p className="text-[9px] font-medium text-zinc-500 dark:text-zinc-400">
                      {files.length}/{SUPPORT_MAX_IMAGES} images ·{" "}
                      {formatSupportAttachmentSize(totalAttachmentBytes)} / 10 MB
                    </p>
                  </div>
                )}

                <label
                  className={`block rounded-xl border border-dashed border-zinc-200 bg-stone-50/30 p-4 text-center transition-colors dark:border-white/10 dark:bg-zinc-900/20 ${
                    files.length >= SUPPORT_MAX_IMAGES
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer hover:border-zinc-300 hover:bg-stone-50/50 dark:hover:bg-zinc-900/40"
                  }`}
                >
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
                    multiple
                    disabled={files.length >= SUPPORT_MAX_IMAGES}
                  />
                  <PaperClipIcon className="mx-auto h-5 w-5 text-zinc-400" />
                  <span className="mt-1 block text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    Attach screenshots (images only)
                  </span>
                  <span className="block text-[9px] text-zinc-400">
                    Up to {SUPPORT_MAX_IMAGES} images · Max 10 MB total · PNG, JPG, WEBP, GIF
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting || !subject.trim() || !description.trim()}
                className="inline-flex w-full h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--app-primary)] text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[var(--app-primary-hover)] disabled:opacity-50"
              >
                {submitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <PlusIcon className="h-4 w-4" />
                )}
                Submit request
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Ticket History & Tracking */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-150 dark:border-white/5">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  Ticket History
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Track the status of your queries.
                </p>
              </div>

              {/* Status filtering tabs */}
              <div className="flex rounded-xl bg-stone-100 p-0.5 dark:bg-zinc-900/80">
                {["All", "Open", "In Progress", "Resolved"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      activeTab === tab
                        ? "bg-white text-zinc-800 shadow-sm dark:bg-zinc-800 dark:text-zinc-200"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  <span className="text-xs text-zinc-450">Loading ticket history…</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-zinc-100 dark:divide-white/5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredTickets.length === 0 ? (
                  <div className="py-12 text-center">
                    <LifebuoyIcon className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                    <p className="mt-2 text-xs font-semibold text-zinc-550 dark:text-zinc-400">
                      No tickets found matching this filter
                    </p>
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className="flex cursor-pointer items-start justify-between py-4 hover:bg-stone-50/50 dark:hover:bg-zinc-900/20 px-2 rounded-xl transition-all"
                    >
                      <div className="space-y-1 min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                            {ticket.ticketId}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded dark:bg-zinc-800 dark:text-zinc-350">
                            {ticket.category}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-150 hover:text-[var(--app-primary)] transition-colors truncate">
                          {ticket.subject}
                        </h3>
                        <p className="text-[10px] text-zinc-400">{formatDate(ticket.createdAt)}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(ticket.status)}
                          <span className="text-[11px] font-semibold text-zinc-650 dark:text-zinc-300">
                            {ticket.status}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Details Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
            />

            {/* Modal Box — fixed height, scroll inside body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-x-4 top-[8vh] z-50 mx-auto flex h-[min(560px,82vh)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#121418]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="shrink-0 border-b border-zinc-100 px-5 pb-4 pt-5 dark:border-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="text-xs font-black tracking-wide text-zinc-500 dark:text-zinc-400">
                      {selectedTicket.ticketId}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {getStatusIcon(selectedTicket.status)}
                      {selectedTicket.status}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="shrink-0 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-650 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal tabs */}
                <div className="mt-4 flex rounded-xl bg-stone-100 p-0.5 dark:bg-zinc-900/80">
                  <button
                    type="button"
                    onClick={() => setModalTab("details")}
                    className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold transition-all ${
                      modalTab === "details"
                        ? "bg-white text-zinc-800 shadow-sm dark:bg-zinc-800 dark:text-zinc-200"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab("replies")}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition-all ${
                      modalTab === "replies"
                        ? "bg-white text-zinc-800 shadow-sm dark:bg-zinc-800 dark:text-zinc-200"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    Replies
                    {replies.length > 0 && (
                      <span className="rounded-full bg-teal-500/15 px-1.5 py-0.5 text-[9px] font-black text-teal-700 dark:text-teal-300">
                        {replies.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Scrollable tab content */}
              <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-4 [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-600">
                {modalTab === "details" ? (
                  <div className="min-w-0 space-y-4">
                    {/* Ticket summary */}
                    <div className="min-w-0 rounded-xl border border-zinc-200/80 bg-gradient-to-br from-stone-50 to-zinc-50/80 p-4 dark:border-white/[0.06] dark:from-zinc-900/60 dark:to-zinc-950/40">
                      <dl className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="min-w-0 sm:col-span-2">
                          <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Subject
                          </dt>
                          <dd
                            className="mt-1 line-clamp-2 overflow-hidden break-words text-sm font-bold leading-snug text-zinc-900 [overflow-wrap:anywhere] dark:text-zinc-50"
                            title={selectedTicket.subject}
                          >
                            {selectedTicket.subject}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Category
                          </dt>
                          <dd className="mt-1">
                            <span className="inline-flex rounded-lg bg-white px-2 py-0.5 text-[11px] font-bold text-zinc-700 shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-white/10">
                              {selectedTicket.category}
                            </span>
                          </dd>
                        </div>

                        <div>
                          <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Priority
                          </dt>
                          <dd className="mt-1">
                            <span
                              className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-bold ${getPriorityColor(selectedTicket.priority)}`}
                            >
                              {selectedTicket.priority}
                            </span>
                          </dd>
                        </div>

                        <div>
                          <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Status
                          </dt>
                          <dd className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                            {getStatusIcon(selectedTicket.status)}
                            {selectedTicket.status}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Ticket ID
                          </dt>
                          <dd className="mt-1 font-mono text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                            {selectedTicket.ticketId}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Created
                          </dt>
                          <dd className="mt-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                            {formatDateTime(selectedTicket.createdAt)}
                          </dd>
                        </div>

                        {selectedTicket.updatedAt && (
                          <div className="sm:col-span-2">
                            <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                              Last updated
                            </dt>
                            <dd className="mt-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                              {formatDateTime(selectedTicket.updatedAt)}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div className="min-w-0">
                      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Description
                      </h4>
                      <div
                        className="min-w-0 overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-zinc-900/40"
                        title={selectedTicket.description}
                      >
                        <p className="line-clamp-5 overflow-hidden whitespace-pre-wrap break-words text-xs leading-relaxed text-zinc-700 [overflow-wrap:anywhere] dark:text-zinc-300">
                          {selectedTicket.description}
                        </p>
                      </div>
                    </div>

                    {selectedTicket.attachmentUrls && selectedTicket.attachmentUrls.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          <span>Attachments</span>
                          <span className="font-semibold normal-case text-zinc-500">
                            {selectedTicket.attachmentUrls.length} file
                            {selectedTicket.attachmentUrls.length !== 1 ? "s" : ""}
                          </span>
                        </h4>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {selectedTicket.attachmentUrls.map((url, idx) => {
                            const name = getAttachmentName(url);
                            const isImage = isImageAttachment(url);
                            return (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex overflow-hidden rounded-xl border border-zinc-200/80 bg-white transition-all hover:border-indigo-300 hover:shadow-md dark:border-white/[0.08] dark:bg-zinc-900/50 dark:hover:border-indigo-500/40"
                              >
                                {isImage ? (
                                  <div className="flex w-full flex-col">
                                    <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={url}
                                        alt={name}
                                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2 border-t border-zinc-100 px-3 py-2 dark:border-white/5">
                                      <PaperClipIcon className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                                      <span className="truncate text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                                        {name}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex w-full items-center gap-2.5 px-3 py-3">
                                    <PaperClipIcon className="h-4 w-4 shrink-0 text-indigo-500" />
                                    <span className="truncate text-[11px] font-bold text-zinc-700 group-hover:text-indigo-600 dark:text-zinc-300 dark:group-hover:text-indigo-400">
                                      {name}
                                    </span>
                                  </div>
                                )}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full min-h-[200px] flex-col">
                    {loadingReplies ? (
                      <div className="flex flex-1 items-center justify-center py-8">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                      </div>
                    ) : replies.length === 0 ? (
                      <p className="rounded-xl bg-zinc-50 p-4 text-center text-[11px] text-zinc-500 dark:bg-zinc-900/40">
                        No replies yet. Our team will respond here soon.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {replies.map((r) => (
                          <div
                            key={r.id}
                            className={`flex gap-2.5 ${r.authorRole === "user" ? "flex-row-reverse" : ""}`}
                          >
                            <div
                              className={`min-w-0 max-w-[90%] overflow-hidden rounded-xl p-3 text-xs ${
                                r.authorRole === "admin"
                                  ? "bg-teal-500/10 text-zinc-700 dark:text-zinc-300"
                                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                              }`}
                            >
                              <p className="truncate font-semibold text-zinc-800 dark:text-zinc-100">
                                {r.authorName || (r.authorRole === "admin" ? "ANSH Support" : "You")}
                              </p>
                              <p className="mt-1 break-words text-[11px] leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
                                {r.message}
                              </p>
                              <p className="mt-1 text-[9px] text-zinc-400">{formatDate(r.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="shrink-0 border-t border-zinc-100 px-5 py-4 dark:border-white/5">
                {modalTab === "replies" && selectedTicket.status !== "Resolved" && (
                  <div className="mb-3 flex gap-2">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Add a follow-up message…"
                      className="flex-1 resize-none rounded-xl border border-zinc-200 bg-stone-50/50 p-3 text-xs font-semibold outline-none focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      disabled={sendingReply || !replyText.trim()}
                      onClick={handleSendReply}
                      className="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-xl bg-[var(--app-primary)] text-white disabled:opacity-50"
                      title="Send reply"
                    >
                      {sendingReply ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <PaperAirplaneIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-750 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
