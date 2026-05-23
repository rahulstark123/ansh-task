"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  CheckIcon,
  SparklesIcon,
  ArrowUpTrayIcon
} from "@heroicons/react/24/outline";

export default function ProfileSettingsPage() {
  const [firstName, setFirstName] = useState("Ansh");
  const [lastName, setLastName] = useState("Tasker");
  const [email] = useState("ansh@example.com");
  const [phone, setPhone] = useState("+1 (555) 019-2834");
  const [jobTitle, setJobTitle] = useState("Lead Workspace Administrator");
  const [department, setDepartment] = useState("Engineering");
  const [timezone, setTimezone] = useState("UTC - 5:00 (EST)");
  const [language, setLanguage] = useState("English (US)");
  const [bio, setBio] = useState("Productive builder and team collaboration catalyst.");
  const [showToast, setShowToast] = useState(false);
  const [avatar, setAvatar] = useState("https://api.dicebear.com/7.x/bottts/svg?seed=AnshTasker");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handleRandomAvatar = () => {
    const seeds = ["task", "collaborate", "ansh", "build", "design", "agile", "flow"];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)] + Math.floor(Math.random() * 100);
    setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`);
  };

  return (
    <div className="relative">
      <div className="flex flex-col gap-1.5 pb-6 border-b border-zinc-200/60 dark:border-white/5">
        <h1 className="font-heading text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
          Personal Profile
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your personal details, workspace display information, and account identity.
        </p>
      </div>

      <form onSubmit={handleSave} className="mt-8 space-y-8 max-w-3xl">
        
        {/* Avatar Section */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative group overflow-hidden h-20 w-20 shrink-0 rounded-2xl bg-zinc-100 ring-2 ring-zinc-200/50 dark:bg-zinc-800 dark:ring-white/5">
            <img src={avatar} alt="Profile Avatar" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={handleRandomAvatar}>
              <SparklesIcon className="h-5 w-5 text-white animate-spin-slow" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Profile Picture</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Dicebear bot avatar generated for your identity. Click to cycle avatar seeds.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleRandomAvatar}
                className="inline-flex h-7 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-[11px] font-bold text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-350 dark:hover:bg-zinc-800"
              >
                <SparklesIcon className="h-3.5 w-3.5" />
                Regenerate
              </button>
            </div>
          </div>
        </div>

        {/* Identity Details Grid */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              First Name
            </label>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 pl-9 pr-3 text-xs font-semibold text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Last Name
            </label>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 pl-9 pr-3 text-xs font-semibold text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <EnvelopeIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                disabled
                value={email}
                className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-100/50 pl-9 pr-16 text-xs font-semibold text-zinc-500 dark:border-white/[0.08] dark:bg-zinc-900/10 cursor-not-allowed"
              />
              <span className="absolute top-1/2 right-3 -translate-y-1/2 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                VERIFIED
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <PhoneIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 pl-9 pr-3 text-xs font-semibold text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        {/* Job Details Section */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Job Title
            </label>
            <div className="relative">
              <BriefcaseIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 pl-9 pr-3 text-xs font-semibold text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 px-3 text-xs font-semibold text-zinc-700 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-200"
            >
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Product">Product Management</option>
              <option value="Operations">Operations</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">Human Resources</option>
            </select>
          </div>
        </div>

        {/* Localization & Timezone */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Timezone
            </label>
            <div className="relative">
              <GlobeAltIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 pl-9 pr-3 text-xs font-semibold text-zinc-700 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-200"
              >
                <option value="UTC - 8:00 (PST)">UTC - 8:00 (Pacific Time)</option>
                <option value="UTC - 5:00 (EST)">UTC - 5:00 (Eastern Time)</option>
                <option value="UTC + 0:00 (GMT)">UTC + 0:00 (GMT)</option>
                <option value="UTC + 1:00 (CET)">UTC + 1:00 (Central European Time)</option>
                <option value="UTC + 5:30 (IST)">UTC + 5:30 (Indian Standard Time)</option>
                <option value="UTC + 9:00 (JST)">UTC + 9:00 (Japan Standard Time)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Preferred Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 px-3 text-xs font-semibold text-zinc-700 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-200"
            >
              <option value="English (US)">English (US)</option>
              <option value="English (UK)">English (UK)</option>
              <option value="Español">Español</option>
              <option value="Français">Français</option>
              <option value="Deutsch">Deutsch</option>
              <option value="日本語">日本語</option>
            </select>
          </div>
        </div>

        {/* Bio Textarea */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
            Biography / Bio
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            className="w-full rounded-xl border border-zinc-200 bg-stone-50/50 p-3 text-xs font-semibold text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100 resize-none"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-zinc-100 dark:border-white/5">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--app-primary)] px-6 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[var(--app-primary-hover)]"
          >
            Save profile changes
          </button>
        </div>
      </form>

      {/* Floating success toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3.5 rounded-2xl border border-emerald-500/10 bg-emerald-500 px-4 py-3 text-xs font-semibold text-white shadow-xl shadow-emerald-950/20"
          >
            <CheckIcon className="h-5 w-5 shrink-0" />
            <span>Profile settings updated successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
