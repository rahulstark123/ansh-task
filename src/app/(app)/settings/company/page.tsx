"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BuildingOffice2Icon,
  GlobeAltIcon,
  EnvelopeIcon,
  MapPinIcon,
  UsersIcon,
  BriefcaseIcon,
  CheckIcon,
  SparklesIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { SettingsSelect } from "@/components/settings/SettingsSelect";
import { useToast } from "@/context/ToastContext";

const INDUSTRY_OPTIONS = [
  { value: "Technology", label: "Technology & SaaS" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Finance", label: "Finance & Banking" },
  { value: "Education", label: "Education" },
  { value: "Construction", label: "Construction" },
  { value: "Marketing", label: "Marketing & Sales" },
  { value: "Retail", label: "Retail & E-commerce" },
  { value: "General", label: "General / Other" },
] as const;

/** Matches onboarding workspace size values; legacy employee labels kept for older rows. */
const COMPANY_SIZE_OPTIONS = [
  { value: "Only me", label: "Only me" },
  { value: "2-10 people", label: "2-10 people" },
  { value: "11-50 people", label: "11-50 people" },
  { value: "51-100 people", label: "51-100 people" },
  { value: "101-200 people", label: "101-200 people" },
  { value: "200+ people", label: "200+ people" },
  { value: "1-10 employees", label: "1-10 employees" },
  { value: "11-50 employees", label: "11-50 employees" },
  { value: "51-200 employees", label: "51-200 employees" },
  { value: "201-500 employees", label: "201-500 employees" },
  { value: "500+ employees", label: "500+ employees" },
] as const;

function getWorkspaceId(): number {
  if (typeof window === "undefined") return 1;
  return parseInt(sessionStorage.getItem("ansh_onboarding_wid") ?? "1", 10);
}

function withSizeOption(size: string, options: { value: string; label: string }[]) {
  if (!size || options.some((o) => o.value === size)) return options;
  return [{ value: size, label: size }, ...options];
}

export default function CompanySettingsPage() {
  const { showToast } = useToast();
  const [workspaceId, setWorkspaceId] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [companySize, setCompanySize] = useState("");
  const [address, setAddress] = useState("");
  const [cityCountry, setCityCountry] = useState("");
  const [website, setWebsite] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [companyLogo, setCompanyLogo] = useState("🏢");
  const [showToastLocal, setShowToastLocal] = useState(false);

  const sizeOptions = withSizeOption(companySize, [...COMPANY_SIZE_OPTIONS]);

  const applyCompany = useCallback(
    (c: {
      name: string;
      domain: string;
      logo: string;
      industry: string;
      size: string;
      website: string;
      billingEmail: string;
      address: string;
      cityCountry: string;
    }) => {
      setCompanyName(c.name);
      setDomain(c.domain);
      setIndustry(c.industry || "Technology");
      setCompanySize(c.size);
      setWebsite(c.website);
      setBillingEmail(c.billingEmail);
      setAddress(c.address);
      setCityCountry(c.cityCountry);
      setCompanyLogo(c.logo || "🏢");
    },
    []
  );

  useEffect(() => {
    const wid = getWorkspaceId();
    setWorkspaceId(wid);

    async function loadCompany() {
      try {
        setLoading(true);
        const res = await fetch(`/api/workspace/company?wid=${wid}`);
        const json = await res.json();
        if (json.success && json.company) {
          applyCompany(json.company);
        } else if (!json.success) {
          showToast(json.error || "Could not load company profile", "error");
        }
      } catch (error) {
        console.error("Error loading company profile:", error);
        showToast("Error loading company profile", "error");
      } finally {
        setLoading(false);
      }
    }

    loadCompany();
  }, [applyCompany, showToast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showToast("Company name is required", "error");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/workspace/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: companyName.trim(),
          domain: domain.trim() || null,
          logo: companyLogo,
          industry,
          size: companySize || null,
          website: website.trim() || null,
          billingEmail: billingEmail.trim() || null,
          address: address.trim() || null,
          cityCountry: cityCountry.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.success && json.company) {
        applyCompany(json.company);
        setShowToastLocal(true);
        setTimeout(() => setShowToastLocal(false), 4000);
        showToast("Company settings saved", "success");
      } else {
        showToast(json.error || "Failed to save company settings", "error");
      }
    } catch (error) {
      console.error("Error saving company profile:", error);
      showToast("Failed to save company settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCycleLogo = () => {
    const emojis = ["🏢", "🚀", "⚡", "🔮", "🛠️", "🧩", "🎯", "🌐"];
    const currentIdx = emojis.indexOf(companyLogo);
    const nextIdx = (currentIdx + 1) % emojis.length;
    setCompanyLogo(emojis[nextIdx]);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex flex-col gap-1.5 pb-6 border-b border-zinc-200/60 dark:border-white/5">
        <h1 className="font-heading text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
          Company Profile
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Organization details from onboarding are stored on your workspace and can be updated here.
        </p>
      </div>

      <form onSubmit={handleSave} className="mt-8 space-y-8 max-w-3xl">
        
        {/* Logo/Icon Section */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative group overflow-hidden h-20 w-20 shrink-0 rounded-2xl bg-zinc-150 ring-2 ring-zinc-200/50 flex items-center justify-center text-4xl dark:bg-zinc-800 dark:ring-white/5">
            {companyLogo}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={handleCycleLogo}>
              <SparklesIcon className="h-5 w-5 text-white animate-pulse" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Organization Logo</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Workspace avatar badge displayed in your navigation sidebar. Click to cycle icons.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleCycleLogo}
                className="inline-flex h-7 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-[11px] font-bold text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-350 dark:hover:bg-zinc-800"
              >
                <SparklesIcon className="h-3.5 w-3.5" />
                Cycle Icon
              </button>
            </div>
          </div>
        </div>

        {/* Company Details Grid */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Company Name
            </label>
            <div className="relative">
              <BuildingOffice2Icon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 pl-9 pr-3 text-xs font-semibold text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Verified Domain
            </label>
            <div className="relative">
              <GlobeAltIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="domain.com"
                className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 pl-9 pr-3 text-xs font-semibold text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        {/* Industry & Size */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Primary Industry
            </label>
            <SettingsSelect
              value={industry}
              onChange={setIndustry}
              options={[...INDUSTRY_OPTIONS]}
              icon={<BriefcaseIcon className="h-4 w-4" />}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Organization Size
            </label>
            <SettingsSelect
              value={companySize}
              onChange={setCompanySize}
              options={sizeOptions}
              icon={<UsersIcon className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Address Location */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Street Address
            </label>
            <div className="relative">
              <MapPinIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 pl-9 pr-3 text-xs font-semibold text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              City, Country
            </label>
            <div className="relative">
              <MapPinIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={cityCountry}
                onChange={(e) => setCityCountry(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 pl-9 pr-3 text-xs font-semibold text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        {/* Contact Defaults */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Website URL
            </label>
            <div className="relative">
              <GlobeAltIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
                className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 pl-9 pr-3 text-xs font-semibold text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Billing/Contact Email
            </label>
            <div className="relative">
              <EnvelopeIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 pl-9 pr-3 text-xs font-semibold text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-zinc-100 dark:border-white/5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--app-primary)] px-6 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[var(--app-primary-hover)] disabled:opacity-60"
          >
            {saving ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save company changes"
            )}
          </button>
        </div>
      </form>

      {/* Floating success toast */}
      <AnimatePresence>
        {showToastLocal && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3.5 rounded-2xl border border-emerald-500/10 bg-emerald-500 px-4 py-3 text-xs font-semibold text-white shadow-xl shadow-emerald-950/20"
          >
            <CheckIcon className="h-5 w-5 shrink-0" />
            <span>Company settings updated successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
