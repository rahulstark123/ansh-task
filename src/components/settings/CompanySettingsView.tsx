"use client";

import { useCallback, useEffect, useState } from "react";
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
import {
  SettingsFieldLabel,
  SettingsInfoGrid,
  SettingsInfoItem,
  SettingsPageHeader,
  SettingsSectionCard,
  settingsInputClass,
} from "@/components/settings/SettingsSectionCard";
import { displayOrFallback } from "@/lib/user-profile-fields";

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

export function CompanySettingsView() {
  const { showToast } = useToast();
  const [workspaceId, setWorkspaceId] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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

  const handleSave = async () => {
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
        setIsEditing(false);
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
    <div className="relative space-y-8">
      <SettingsPageHeader
        eyebrow="Workspace Settings"
        title="Company Profile"
        description="Organization details from onboarding are stored on your workspace and can be updated here."
        action={
          !isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Edit Company
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-600 dark:border-white/10 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-zinc-900/40">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-zinc-100 text-4xl dark:bg-zinc-800">
            {companyLogo}
          </div>
          <div className="mt-4 text-center">
            <h2 className="font-heading text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {displayOrFallback(companyName, "Company")}
            </h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--app-primary)]">
              Workspace
            </p>
          </div>
          <div className="mt-5 space-y-3 border-t border-zinc-100 pt-5 dark:border-white/[0.05]">
            <SummaryRow icon={<BriefcaseIcon className="h-4 w-4" />} label="Industry" value={displayOrFallback(industry)} />
            <SummaryRow icon={<UsersIcon className="h-4 w-4" />} label="Team Size" value={displayOrFallback(companySize, "NOT SET")} />
            <SummaryRow icon={<GlobeAltIcon className="h-4 w-4" />} label="Domain" value={displayOrFallback(domain, "NOT SET")} />
            <SummaryRow icon={<MapPinIcon className="h-4 w-4" />} label="Location" value={displayOrFallback(cityCountry, "NOT SET")} />
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={handleCycleLogo}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-3 py-2 text-[11px] font-bold text-zinc-600 dark:border-white/10 dark:text-zinc-300"
            >
              <SparklesIcon className="h-4 w-4" />
              Cycle Logo
            </button>
          )}
        </aside>

        <div className="space-y-6">
          <SettingsSectionCard title="Organization Details" icon={<BuildingOffice2Icon className="h-4 w-4" />}>
            {!isEditing ? (
              <SettingsInfoGrid>
                <SettingsInfoItem label="Company Name" value={displayOrFallback(companyName)} />
                <SettingsInfoItem label="Verified Domain" value={displayOrFallback(domain, "NOT SET")} />
                <SettingsInfoItem label="Primary Industry" value={displayOrFallback(industry)} />
                <SettingsInfoItem label="Organization Size" value={displayOrFallback(companySize, "NOT SET")} />
                <SettingsInfoItem label="Street Address" value={displayOrFallback(address)} />
                <SettingsInfoItem label="City, Country" value={displayOrFallback(cityCountry)} />
                <SettingsInfoItem label="Website URL" value={displayOrFallback(website)} />
                <SettingsInfoItem label="Billing/Contact Email" value={displayOrFallback(billingEmail)} />
              </SettingsInfoGrid>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput label="Company Name" value={companyName} onChange={setCompanyName} required />
                <FieldInput label="Verified Domain" value={domain} onChange={setDomain} />
                <div>
                  <SettingsFieldLabel>Primary Industry</SettingsFieldLabel>
                  <SettingsSelect value={industry} onChange={setIndustry} options={[...INDUSTRY_OPTIONS]} icon={<BriefcaseIcon className="h-4 w-4" />} />
                </div>
                <div>
                  <SettingsFieldLabel>Organization Size</SettingsFieldLabel>
                  <SettingsSelect value={companySize} onChange={setCompanySize} options={sizeOptions} icon={<UsersIcon className="h-4 w-4" />} />
                </div>
                <FieldInput label="Street Address" value={address} onChange={setAddress} />
                <FieldInput label="City, Country" value={cityCountry} onChange={setCityCountry} />
                <FieldInput label="Website URL" value={website} onChange={setWebsite} />
                <FieldInput label="Billing/Contact Email" type="email" value={billingEmail} onChange={setBillingEmail} />
              </div>
            )}
          </SettingsSectionCard>
        </div>
      </div>

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

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-zinc-400">{icon}</span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{value}</p>
      </div>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <SettingsFieldLabel>{label}</SettingsFieldLabel>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={settingsInputClass}
      />
    </div>
  );
}
