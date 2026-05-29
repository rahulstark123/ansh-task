"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import { authFetch, ensureAdminSession } from "@/lib/admin-client";

type TicketStatus = "Open" | "In Progress" | "Resolved";
type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

type TicketReply = {
  id: string;
  message: string;
  authorRole: "admin" | "user";
  authorName: string | null;
  authorEmail: string | null;
  createdAt: string;
};

type TicketListItem = {
  id: string;
  ticketId: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
  workspaceId: number;
  workspace: { id: number; name: string };
  _count: { replies: number };
};

type TicketDetail = TicketListItem & {
  attachmentUrls: string[];
  replies: TicketReply[];
  workspace: { id: number; name: string; billingEmail: string | null };
};

export function AdminPanelView() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"All" | TicketStatus>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoadingList(true);
    try {
      const qs = statusFilter !== "All" ? `?status=${encodeURIComponent(statusFilter)}` : "";
      const res = await authFetch(`/api/admin/tickets${qs}`);
      const json = await res.json();
      if (json.success) setTickets(json.tickets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  }, [statusFilter]);

  const loadDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await authFetch(`/api/admin/tickets/${id}`);
      const json = await res.json();
      if (json.success) setDetail(json.ticket);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    ensureAdminSession().then((ok) => {
      if (!ok) {
        router.replace("/adminpanel/login");
        return;
      }
      setAuthReady(true);
    });
  }, [router]);

  useEffect(() => {
    if (!authReady) return;
    loadTickets();
  }, [authReady, loadTickets]);

  useEffect(() => {
    if (!selectedId || !authReady) return;
    loadDetail(selectedId);
  }, [selectedId, authReady, loadDetail]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/adminpanel/login");
  };

  const handleSendReply = async () => {
    if (!selectedId || !replyText.trim()) return;
    setSending(true);
    try {
      const res = await authFetch(`/api/admin/tickets/${selectedId}/replies`, {
        method: "POST",
        body: JSON.stringify({ message: replyText.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setReplyText("");
        await loadDetail(selectedId);
        await loadTickets();
      }
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!selectedId || !detail) return;
    setUpdating(true);
    try {
      const res = await authFetch(`/api/admin/tickets/${selectedId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        setDetail(json.ticket);
        await loadTickets();
      }
    } finally {
      setUpdating(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-900">
        <div>
          <h1 className="font-heading text-lg font-bold text-zinc-900 dark:text-white">
            Support Admin Panel
          </h1>
          <p className="text-xs text-zinc-500">Manage tickets and reply to customers</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-rose-600 hover:bg-rose-50 dark:border-white/10 dark:hover:bg-rose-950/20"
          title="Logout"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
        </button>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Ticket list */}
        <aside className="w-full border-b border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900 lg:w-96 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap gap-1 border-b border-zinc-100 p-3 dark:border-white/5">
            {(["All", "Open", "In Progress", "Resolved"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                  statusFilter === tab
                    ? "bg-teal-500/15 text-teal-700 dark:text-teal-300"
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
            {loadingList ? (
              <p className="p-6 text-center text-xs text-zinc-500">Loading tickets…</p>
            ) : tickets.length === 0 ? (
              <p className="p-6 text-center text-xs text-zinc-500">No tickets found.</p>
            ) : (
              tickets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`block w-full border-b border-zinc-100 px-4 py-3 text-left transition-colors dark:border-white/5 ${
                    selectedId === t.id
                      ? "bg-teal-50/80 dark:bg-teal-950/20"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black text-zinc-400">{t.ticketId}</span>
                    <span className="text-[10px] text-zinc-400">{t._count.replies} replies</span>
                  </div>
                  <p className="mt-1 truncate text-xs font-bold text-zinc-800 dark:text-zinc-100">
                    {t.subject}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-zinc-500">
                    {t.workspace.name} · {t.status}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Ticket detail */}
        <main className="flex-1 bg-zinc-50 p-4 dark:bg-zinc-950">
          {!selectedId ? (
            <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
              <p className="text-sm text-zinc-500">Select a ticket to view and reply</p>
            </div>
          ) : loadingDetail || !detail ? (
            <div className="flex h-full min-h-[320px] items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      {detail.ticketId} · {detail.workspace.name}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
                      {detail.subject}
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500">
                      {detail.category} · {detail.priority} · {formatDateTime(detail.createdAt)}
                    </p>
                  </div>
                  <select
                    value={detail.status}
                    disabled={updating}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold dark:border-white/10 dark:bg-zinc-950"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-300 whitespace-pre-wrap">
                  <p className="mb-1 text-[10px] font-bold uppercase text-zinc-400">Original request</p>
                  {detail.description}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  Conversation
                </h3>

                <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {detail.replies.length === 0 ? (
                    <p className="text-xs text-zinc-500">No replies yet. Send the first response below.</p>
                  ) : (
                    detail.replies.map((r) => (
                      <div
                        key={r.id}
                        className={`flex gap-2.5 ${r.authorRole === "admin" ? "" : "flex-row-reverse"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl px-3 py-2.5 text-xs ${
                            r.authorRole === "admin"
                              ? "bg-teal-500/10 text-zinc-800 dark:text-zinc-200"
                              : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          <p className="font-bold text-[11px]">
                            {r.authorName || (r.authorRole === "admin" ? "Support" : "Customer")}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap leading-relaxed">{r.message}</p>
                          <p className="mt-1 text-[9px] text-zinc-400">{formatDateTime(r.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply to the customer…"
                    className="flex-1 resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs outline-none focus:border-teal-500 dark:border-white/10 dark:bg-zinc-950"
                  />
                  <button
                    type="button"
                    disabled={sending || !replyText.trim()}
                    onClick={handleSendReply}
                    className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                    title="Send reply"
                  >
                    {sending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <PaperAirplaneIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
