"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { authFetch } from "@/lib/admin-client";

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

function statusBadgeClass(status: TicketStatus) {
  if (status === "Open") return "bg-sky-500/15 text-sky-300";
  if (status === "In Progress") return "bg-amber-500/15 text-amber-300";
  return "bg-emerald-500/15 text-emerald-300";
}

export function AdminTicketsView() {
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
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (!selectedId) return;
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

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

  return (
    <>
      <header className="border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-violet-400" />
          <div>
            <h1 className="text-lg font-bold text-white">Support Tickets</h1>
            <p className="text-xs text-zinc-500">All workspaces · select a ticket to reply</p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="w-full border-b border-white/10 lg:w-80 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap gap-1 border-b border-white/5 p-3">
            {(["All", "Open", "In Progress", "Resolved"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                  statusFilter === tab
                    ? "bg-violet-500/20 text-violet-300"
                    : "text-zinc-500 hover:bg-white/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
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
                  className={`block w-full border-b border-white/5 px-4 py-3.5 text-left transition-colors ${
                    selectedId === t.id
                      ? "bg-violet-500/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-zinc-500">{t.ticketId}</span>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${statusBadgeClass(t.status)}`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-zinc-100">{t.subject}</p>
                  <p className="mt-0.5 truncate text-[11px] text-zinc-500">{t.workspace.name}</p>
                  <p className="mt-1 truncate text-[10px] text-zinc-600">{t.description}</p>
                  <p className="mt-1 text-[10px] text-zinc-600">{formatDateTime(t.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="flex-1 p-4">
          {!selectedId ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-zinc-700" />
              <p className="mt-3 text-sm text-zinc-500">Select a ticket to view the conversation</p>
            </div>
          ) : loadingDetail || !detail ? (
            <div className="flex h-full min-h-[400px] items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      {detail.ticketId} · {detail.workspace.name}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-white">{detail.subject}</h2>
                    <p className="mt-1 text-xs text-zinc-500">
                      {detail.category} · {detail.priority} · {formatDateTime(detail.createdAt)}
                    </p>
                  </div>
                  <select
                    value={detail.status}
                    disabled={updating}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    className="rounded-xl border border-white/10 bg-[#0b0f1a] px-3 py-2 text-xs font-semibold text-zinc-200"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div className="mt-4 rounded-xl bg-[#0b0f1a] p-4 text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap">
                  <p className="mb-1 text-[10px] font-bold uppercase text-zinc-500">Original request</p>
                  {detail.description}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  Conversation
                </h3>

                <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
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
                              ? "bg-violet-500/15 text-zinc-200"
                              : "bg-white/5 text-zinc-200"
                          }`}
                        >
                          <p className="text-[11px] font-bold">
                            {r.authorName || (r.authorRole === "admin" ? "Support" : "Customer")}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap leading-relaxed">{r.message}</p>
                          <p className="mt-1 text-[9px] text-zinc-500">{formatDateTime(r.createdAt)}</p>
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
                    className="flex-1 resize-none rounded-xl border border-white/10 bg-[#0b0f1a] p-3 text-xs text-zinc-100 outline-none focus:border-violet-500"
                  />
                  <button
                    type="button"
                    disabled={sending || !replyText.trim()}
                    onClick={handleSendReply}
                    className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50"
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
        </section>
      </div>
    </>
  );
}
