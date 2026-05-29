"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  EnvelopeIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const SUBJECT_OPTIONS = [
  "General inquiry",
  "Billing & subscriptions",
  "Technical support",
  "Account & access",
  "Partnership",
  "Other",
] as const;

const SUPPORT_EMAIL = "support@anshapps.com";

function ContactSuccessView({ onSendAnother }: { onSendAnother: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center px-4 py-12 text-center sm:py-16"
    >
      <div className="relative">
        <div className="absolute inset-0 scale-150 rounded-full bg-teal-400/20 blur-2xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/30">
          <CheckCircleIcon className="h-10 w-10 text-white" strokeWidth={2} />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mt-8 max-w-md"
      >
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-700 ring-1 ring-teal-100">
          <SparklesIcon className="h-3.5 w-3.5" />
          Message received
        </div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-[#0f172a] sm:text-3xl">
          Thank you for contacting us
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
          We will contact you shortly. Our team typically responds within{" "}
          <span className="font-semibold text-slate-800">1–2 business days</span>.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          A confirmation has been recorded. For urgent matters, email{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-semibold text-teal-700 hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-10 flex flex-col gap-3 sm:flex-row"
      >
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-teal-600/20 transition hover:bg-teal-700"
        >
          Back to home
        </Link>
        <button
          type="button"
          onClick={onSendAnother}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Send another message
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<string>(SUBJECT_OPTIONS[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setSubject(SUBJECT_OPTIONS[0]);
    setMessage("");
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(json.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      resetForm();
      setSubmitted(true);
    } catch {
      setErrorMsg(
        `Could not submit right now. Please try again or email ${SUPPORT_EMAIL} directly.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 text-center text-xs font-medium text-slate-500">
          <Link href="/" className="hover:text-teal-700">
            ← Back to ANSH Task
          </Link>
        </p>

        <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <AnimatePresence mode="wait">
            {submitted ? (
              <ContactSuccessView
                key="success"
                onSendAnother={() => {
                  setSubmitted(false);
                  resetForm();
                }}
              />
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-6 py-10 sm:px-10 sm:py-12"
              >
                <header className="border-b border-slate-100 pb-8">
                  <h1 className="font-heading text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
                    Contact Us
                  </h1>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                    Have a question about ANSH Task, billing, or your workspace? Send us a message
                    and our team will get back to you.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-2.5 text-sm text-teal-900 ring-1 ring-teal-100">
                    <EnvelopeIcon className="h-5 w-5 shrink-0 text-teal-600" />
                    <span>
                      All inquiries go to{" "}
                      <a
                        href={`mailto:${SUPPORT_EMAIL}`}
                        className="font-semibold underline decoration-teal-600/40 underline-offset-2 hover:text-teal-800"
                      >
                        {SUPPORT_EMAIL}
                      </a>
                    </span>
                  </div>
                </header>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                      >
                        Full name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                      >
                        Email address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      Topic <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="contact-subject"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    >
                      {SUBJECT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      Message <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us how we can help…"
                      className="mt-2 block w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  {errorMsg && (
                    <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60 sm:w-auto sm:px-8"
                  >
                    {loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-4 w-4" />
                        Send message
                      </>
                    )}
                  </button>

                  <p className="text-xs leading-relaxed text-slate-500">
                    By submitting this form, you agree that we may use your details to respond to
                    your request. See our{" "}
                    <Link href="/privacy" className="font-semibold text-teal-700 hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </form>

                <div className="mt-10 border-t border-slate-100 pt-6 text-sm text-slate-600">
                  <p className="font-semibold text-slate-800">Prefer email directly?</p>
                  <p className="mt-1">
                    Write to{" "}
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="font-semibold text-teal-700 underline decoration-teal-700/30 underline-offset-2"
                    >
                      {SUPPORT_EMAIL}
                    </a>{" "}
                    for legal, billing, or policy questions.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </article>
      </div>
    </div>
  );
}
