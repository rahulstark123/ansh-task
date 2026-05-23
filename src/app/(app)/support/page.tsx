"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifebuoyIcon,
  PlusIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftEllipsisIcon,
  ExclamationCircleIcon,
  ClockIcon,
  CheckIcon,
  PaperClipIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

interface Ticket {
  id: string;
  subject: string;
  category: "Technical" | "Billing" | "General" | "Feedback";
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Open" | "In Progress" | "Resolved";
  date: string;
  description: string;
}

const INITIAL_TICKETS: Ticket[] = [
  {
    id: "TCK-1002",
    subject: "Workspace dashboard not loading board view",
    category: "Technical",
    priority: "High",
    status: "Open",
    date: "2026-05-19",
    description: "When opening the board view of the main task dashboard, it displays a blank white screen. Console shows a TypeError: Cannot read properties of undefined."
  },
  {
    id: "TCK-1001",
    subject: "Change invoice billing address",
    category: "Billing",
    priority: "Low",
    status: "Resolved",
    date: "2026-05-15",
    description: "Please update the invoice billing address to 123 Main Street, Suite 400."
  },
  {
    id: "TCK-1000",
    subject: "Feature request: CSV export for tasks list",
    category: "Feedback",
    priority: "Medium",
    status: "In Progress",
    date: "2026-05-10",
    description: "It would be great if we could download our task board as a CSV file to share with stakeholders outside the organization."
  }
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<Ticket["category"]>("Technical");
  const [priority, setPriority] = useState<Ticket["priority"]>("Medium");
  const [description, setDescription] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Open" | "In Progress" | "Resolved">("All");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    const newTicket: Ticket = {
      id: `TCK-${1000 + tickets.length + 1}`,
      subject,
      category,
      priority,
      status: "Open",
      date: new Date().toISOString().split("T")[0],
      description
    };

    setTickets([newTicket, ...tickets]);
    setSubject("");
    setCategory("Technical");
    setPriority("Medium");
    setDescription("");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
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
        
        {/* Background decorative vector */}
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-radial-gradient opacity-10 pointer-events-none" />
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
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Ticket["category"])}
                    className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 px-3 text-xs font-semibold text-zinc-700 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-200"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Billing">Billing</option>
                    <option value="General">General</option>
                    <option value="Feedback">Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Ticket["priority"])}
                    className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 px-3 text-xs font-semibold text-zinc-700 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-200"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
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

              <div className="rounded-xl border border-dashed border-zinc-200 bg-stone-50/30 p-4 text-center dark:border-white/10 dark:bg-zinc-900/20">
                <PaperClipIcon className="mx-auto h-5 w-5 text-zinc-400" />
                <span className="mt-1 block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Attach screenshots or log files
                </span>
                <span className="block text-[9px] text-zinc-400">
                  PDF, PNG, JPG, or TXT up to 5MB
                </span>
              </div>

              <button
                type="submit"
                className="inline-flex w-full h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--app-primary)] text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[var(--app-primary-hover)]"
              >
                <PlusIcon className="h-4 w-4" />
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
                        ? "bg-white text-zinc-800 shadow-sm dark:bg-zinc-855 dark:text-zinc-200"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="mt-4 divide-y divide-zinc-100 dark:divide-white/5">
              {filteredTickets.length === 0 ? (
                <div className="py-12 text-center">
                  <ChatBubbleLeftEllipsisIcon className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-650" />
                  <p className="mt-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
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
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                          {ticket.id}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded dark:bg-zinc-800 dark:text-zinc-300">
                          {ticket.category}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:text-[var(--app-primary)] transition-colors">
                        {ticket.subject}
                      </h3>
                      <p className="text-[10px] text-zinc-400">{ticket.date}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(ticket.status)}
                        <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                          {ticket.status}
                        </span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
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

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-x-4 top-24 z-50 mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121418] max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-zinc-400">{selectedTicket.id}</span>
                  <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded dark:bg-zinc-800 dark:text-zinc-300">
                    {selectedTicket.category}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Title & Stats */}
              <h3 className="mt-4 text-sm font-black text-zinc-900 dark:text-zinc-50">
                {selectedTicket.subject}
              </h3>
              
              <div className="mt-3 flex flex-wrap gap-4 text-xs">
                <div>
                  <span className="text-zinc-400">Created:</span>{" "}
                  <span className="font-semibold text-zinc-750 dark:text-zinc-300">{selectedTicket.date}</span>
                </div>
                <div>
                  <span className="text-zinc-400">Priority:</span>{" "}
                  <span className={`rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400">Status:</span>{" "}
                  <span className="inline-flex items-center gap-1 font-semibold text-zinc-750 dark:text-zinc-300">
                    {getStatusIcon(selectedTicket.status)}
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              {/* Message Details */}
              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Original Message</h4>
                  <div className="rounded-xl border border-zinc-150 bg-stone-50/50 p-4 text-xs text-zinc-700 leading-relaxed dark:border-white/5 dark:bg-zinc-900/30 dark:text-zinc-300 whitespace-pre-wrap">
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Simulated Conversation Feed */}
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Replies</h4>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--app-primary)] text-[9px] font-black text-white">
                        AN
                      </div>
                      <div className="rounded-xl bg-zinc-100 p-3 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        <p className="font-semibold text-zinc-850 dark:text-zinc-100">Ansh Helpdesk</p>
                        <p className="mt-1 text-[11px]">We have received your ticket. A support engineer has been assigned and is reviewing your request.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
