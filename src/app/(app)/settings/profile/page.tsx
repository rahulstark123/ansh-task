"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  CheckIcon,
  SparklesIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import { resolveStorageUrl } from "@/lib/storage/public-url";

// Phone Input Imports
import "react-phone-input-2/lib/style.css";
import PhoneInput from "react-phone-input-2";

interface SelectOption {
  value: string;
  label: string;
}

const DEPARTMENT_OPTIONS = [
  { value: "Engineering", label: "Engineering" },
  { value: "Design", label: "Design" },
  { value: "Product", label: "Product Management" },
  { value: "Operations", label: "Operations" },
  { value: "Marketing", label: "Marketing" },
  { value: "HR", label: "Human Resources" },
];

const TIMEZONE_FALLBACK = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New_York (EST/EDT)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST/AEDT)" },
];

const LANGUAGE_FALLBACK = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Español" },
  { value: "French", label: "Français" },
  { value: "German", label: "Deutsch" },
  { value: "Japanese", label: "日本語" },
  { value: "Chinese", label: "中文" },
  { value: "Italian", label: "Italiano" },
  { value: "Portuguese", label: "Português" },
];

interface SearchableSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

function SearchableSelect({ value, onChange, options, placeholder = "Select...", icon, className = "" }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    opt.value.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(o => o.value === value);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-stone-50/50 px-3 text-xs font-semibold text-zinc-700 outline-none hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-200 dark:hover:bg-zinc-800/80 transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-zinc-400 dark:text-zinc-500 shrink-0">{icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDownIcon className={`h-3.5 w-3.5 text-zinc-450 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 z-40 mt-1 max-h-64 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#121418] scrollbar-thin min-w-[200px] flex flex-col"
          >
            {/* Search Input */}
            <div className="relative p-1 border-b border-zinc-100 dark:border-white/[0.04] mb-1">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-2 text-[11px] font-semibold text-zinc-805 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06] rounded-lg outline-none focus:border-indigo-500 dark:text-zinc-150"
              />
            </div>
            
            {/* Options List */}
            <div className="overflow-y-auto max-h-48 scrollbar-thin">
              {filteredOptions.length === 0 ? (
                <div className="px-2.5 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  No results found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-300"
                          : "text-zinc-655 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <CheckIcon className="h-3.5 w-3.5 stroke-[2.5] text-indigo-500" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProfileSettingsPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form States
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("English");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");

  // Select Option Lists
  const [timezoneOptions, setTimezoneOptions] = useState<SelectOption[]>(TIMEZONE_FALLBACK);
  const [languageOptions, setLanguageOptions] = useState<SelectOption[]>(LANGUAGE_FALLBACK);

  // Fetch current profile & dynamic data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Get user from Supabase auth
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
          setEmail(user.email);

          // Get profile from backend DB
          const res = await fetch(`/api/profile?email=${encodeURIComponent(user.email)}`);
          const json = await res.json();
          if (json.success && json.user) {
            const u = json.user;
            setFirstName(u.firstName || "");
            setLastName(u.lastName || "");
            setPhone(u.phone || "");
            setJobTitle(u.jobTitle || "");
            setDepartment(u.department || "Engineering");
            setTimezone(u.timezone || "UTC");
            setLanguage(u.language || "English");
            setBio(u.bio || "");
            setAvatar(u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email)}`);
          }
        }
      } catch (error) {
        console.error("Error loading profile settings details:", error);
        showToast("Error loading user profile details.", "error");
      } finally {
        setLoading(false);
      }
    }

    async function loadTimezonesAndLanguages() {
      try {
        // Fetch Timezones
        const tzRes = await fetch("https://worldtimeapi.org/api/timezone");
        if (tzRes.ok) {
          const list = await tzRes.json();
          if (Array.isArray(list)) {
            const formatted = list.map((tz: string) => ({
              value: tz,
              label: tz.replace(/_/g, " "),
            }));
            setTimezoneOptions(formatted);
          }
        }
      } catch (err) {
        console.warn("Using local timezone list fallback", err);
      }

      try {
        // Fetch Languages
        const langRes = await fetch("https://raw.githubusercontent.com/umpirsky/language-list/master/data/en/language.json");
        if (langRes.ok) {
          const map = await langRes.json();
          const sortedNames = Object.values(map).sort() as string[];
          const formatted = sortedNames.map((name: string) => ({
            value: name,
            label: name,
          }));
          setLanguageOptions(formatted);
        }
      } catch (err) {
        console.warn("Using local language list fallback", err);
      }
    }

    loadData();
    loadTimezonesAndLanguages();
  }, [showToast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          phone,
          jobTitle,
          department,
          timezone,
          language,
          bio,
          avatar,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Profile settings updated successfully!", "success");
      } else {
        showToast(json.error || "Failed to update profile", "error");
      }
    } catch (err: any) {
      console.error("Error patching profile:", err);
      showToast(err.message || "Something went wrong", "error");
    }
  };

  const handleRandomAvatar = () => {
    const seeds = ["task", "collaborate", "ansh", "build", "design", "agile", "flow", "stark", "graffiti"];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)] + Math.floor(Math.random() * 100);
    setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Enforce 500KB client-side size check
    if (file.size > 500 * 1024) {
      showToast("Avatar image must be less than 500KB.", "error");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("email", email);
      const wid = sessionStorage.getItem("ansh_onboarding_wid");
      if (wid) {
        formData.append("workspaceId", wid);
      }

      const res = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.url) {
        setAvatar(json.url);
        showToast("Avatar image uploaded successfully!", "success");
      } else {
        showToast(json.error || "Failed to upload image", "error");
      }
    } catch (err: any) {
      console.error("Error uploading avatar:", err);
      showToast(err.message || "Failed to upload image", "error");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-[var(--app-primary)]" />
          <p className="text-xs font-semibold text-zinc-400">Loading user profile...</p>
        </div>
      </div>
    );
  }

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
          <div 
            onClick={handleAvatarClick}
            className="relative group overflow-hidden h-20 w-20 shrink-0 rounded-2xl bg-zinc-100 ring-2 ring-zinc-200/50 dark:bg-zinc-800 dark:ring-white/5 cursor-pointer"
          >
            {uploading ? (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                <ArrowPathIcon className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <img src={avatar ? resolveStorageUrl(avatar) : "https://api.dicebear.com/7.x/bottts/svg?seed=Ansh"} alt="Profile Avatar" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpTrayIcon className="h-5 w-5 text-white mb-1" />
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">Upload</span>
                </div>
              </>
            )}
          </div>
          
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Profile Picture</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Upload custom photo (Max 500KB) or generate a matching bot seed.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={uploading}
                className="inline-flex h-7 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-[11px] font-bold text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-350 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <ArrowUpTrayIcon className="h-3.5 w-3.5" />
                Upload Photo
              </button>
              <button
                type="button"
                onClick={handleRandomAvatar}
                disabled={uploading}
                className="inline-flex h-7 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-[11px] font-bold text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-350 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <SparklesIcon className="h-3.5 w-3.5" />
                Regenerate Bot
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
                className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 pl-9 pr-3 text-xs font-semibold text-zinc-805 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
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
                className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 pl-9 pr-3 text-xs font-semibold text-zinc-805 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
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
            <div>
              <PhoneInput
                country="us"
                value={phone}
                onChange={(value) => setPhone(value ? `+${value}` : "")}
                enableSearch={true}
                countryCodeEditable={false}
                inputProps={{
                  name: "phone",
                  required: true,
                  placeholder: "Enter phone number",
                }}
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
                className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 pl-9 pr-3 text-xs font-semibold text-zinc-805 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Department
            </label>
            <SearchableSelect
              value={department}
              onChange={setDepartment}
              options={DEPARTMENT_OPTIONS}
              placeholder="Select Department"
              icon={<BriefcaseIcon className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Localization & Timezone */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Timezone
            </label>
            <SearchableSelect
              value={timezone}
              onChange={setTimezone}
              options={timezoneOptions}
              placeholder="Select Timezone"
              icon={<GlobeAltIcon className="h-4 w-4" />}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Preferred Language
            </label>
            <SearchableSelect
              value={language}
              onChange={setLanguage}
              options={languageOptions}
              placeholder="Select Language"
              icon={<GlobeAltIcon className="h-4 w-4" />}
            />
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
            className="w-full rounded-xl border border-zinc-200 bg-stone-50/50 p-3 text-xs font-semibold text-zinc-805 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100 resize-none"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-zinc-100 dark:border-white/5">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--app-primary)] px-6 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[var(--app-primary-hover)] cursor-pointer"
          >
            Save profile changes
          </button>
        </div>
      </form>
    </div>
  );
}
