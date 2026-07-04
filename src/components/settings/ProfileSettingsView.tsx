"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  CheckIcon,
  SparklesIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  PhoneIcon,
  HeartIcon,
  BuildingOffice2Icon,
  IdentificationIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import { resolveStorageUrl } from "@/lib/storage/public-url";
import {
  CLIENT_COMPRESSION_TARGETS,
  compressImageForUpload,
} from "@/lib/storage/compress-attachment.client";
import {
  BLOOD_GROUP_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  displayOrFallback,
  formatDisplayDate,
  roleLabelFromDb,
  toDateInputValue,
} from "@/lib/user-profile-fields";
import {
  SettingsFieldLabel,
  SettingsInfoGrid,
  SettingsInfoItem,
  SettingsPageHeader,
  SettingsSectionCard,
  SettingsSubheading,
  settingsInputClass,
} from "@/components/settings/SettingsSectionCard";
import { AppSelect } from "@/components/ui/AppSelect";
import {
  buildReportingEmployeeChoices,
  getEmployeeDisplayName,
  type EmployeeOption,
} from "@/lib/team/employee-options";

const FALLBACK_DEPARTMENTS = [
  "Engineering",
  "Design",
  "Product Management",
  "Operations",
  "Marketing",
  "Human Resources",
];

function getWorkspaceId(): number {
  if (typeof window === "undefined") return 1;
  return parseInt(sessionStorage.getItem("ansh_onboarding_wid") ?? "1", 10);
}

function withCurrentValue(options: string[], current: string) {
  const trimmed = current.trim();
  if (!trimmed || options.includes(trimmed)) return options;
  return [trimmed, ...options];
}

export function ProfileSettingsView() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("editor");
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("English");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [officeBranch, setOfficeBranch] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("Active");
  const [reportsTo, setReportsTo] = useState("");
  const [reportingHr, setReportingHr] = useState("");
  const [userId, setUserId] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>(FALLBACK_DEPARTMENTS);
  const [designationOptions, setDesignationOptions] = useState<string[]>([]);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.email) return;

        setEmail(user.email);
        const res = await fetch(`/api/profile?email=${encodeURIComponent(user.email)}`);
        const json = await res.json();
        if (!json.success || !json.user) return;

        const u = json.user;
        setUserId(u.id || "");
        setFirstName(u.firstName || "");
        setLastName(u.lastName || "");
        setPhone(u.phone || "");
        setJobTitle(u.jobTitle || "");
        setDesignation(u.designation || "");
        setDepartment(u.department || "");
        setRole(u.role || "editor");
        setTimezone(u.timezone || "UTC");
        setLanguage(u.language || "English");
        setBio(u.bio || "");
        setAvatar(u.avatar || "");
        setDateOfBirth(toDateInputValue(u.dateOfBirth));
        setBloodGroup(u.bloodGroup || "");
        setPersonalEmail(u.personalEmail || "");
        setEmergencyContactName(u.emergencyContactName || "");
        setEmergencyContactPhone(u.emergencyContactPhone || "");
        setEmployeeCode(u.employeeCode || "");
        setOfficeBranch(u.officeBranch || "");
        setWorkLocation(u.workLocation || "");
        setJoiningDate(toDateInputValue(u.joiningDate));
        setEmploymentStatus(u.employmentStatus || "Active");
        setReportsTo(u.reportsTo || "");
        setReportingHr(u.reportingHr || "");

        try {
          const lookupRes = await fetch(`/api/workspace/lookups?wid=${getWorkspaceId()}`, {
            cache: "no-store",
          });
          const lookupJson = await lookupRes.json();
          if (lookupJson.success) {
            setDepartmentOptions(
              (lookupJson.departments ?? []).map((item: { name: string }) => item.name)
            );
            setDesignationOptions(
              (lookupJson.designations ?? []).map((item: { name: string }) => item.name)
            );
            setLocationOptions(
              (lookupJson.locations ?? []).map((item: { name: string }) => item.name)
            );
          }
        } catch (lookupError) {
          console.error("Workspace lookup load error:", lookupError);
        }

        try {
          const teamRes = await fetch(
            `/api/team?email=${encodeURIComponent(user.email)}&wid=${getWorkspaceId()}`,
            { cache: "no-store" }
          );
          const teamJson = await teamRes.json();
          if (teamJson.success && Array.isArray(teamJson.members)) {
            setEmployeeOptions(
              teamJson.members
                .map((member: { id: string; firstName?: string; lastName?: string; email?: string }) => ({
                  id: member.id,
                  name: getEmployeeDisplayName(member),
                }))
                .filter((member: EmployeeOption) => member.name)
            );
          }
        } catch (teamError) {
          console.error("Team lookup load error:", teamError);
        }
      } catch (error) {
        console.error("Profile load error:", error);
        showToast("Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [showToast]);

  const fullName = useMemo(
    () => `${firstName} ${lastName}`.trim() || email.split("@")[0],
    [firstName, lastName, email]
  );

  const initials = useMemo(
    () =>
      fullName
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "U",
    [fullName]
  );

  const managerChoices = useMemo(
    () =>
      buildReportingEmployeeChoices(employeeOptions, {
        excludeId: userId,
        includeValues: [reportsTo || "None"],
      }),
    [employeeOptions, reportsTo, userId]
  );

  const hrChoices = useMemo(
    () =>
      buildReportingEmployeeChoices(employeeOptions, {
        excludeId: userId,
        includeValues: [reportingHr || "None"],
      }),
    [employeeOptions, reportingHr, userId]
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          phone,
          jobTitle,
          designation,
          department,
          timezone,
          language,
          bio,
          avatar,
          dateOfBirth: dateOfBirth || null,
          bloodGroup,
          personalEmail,
          emergencyContactName,
          emergencyContactPhone,
          employeeCode,
          officeBranch,
          workLocation,
          joiningDate: joiningDate || null,
          employmentStatus,
          reportsTo,
          reportingHr,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Profile updated successfully", "success");
        setIsEditing(false);
      } else {
        showToast(json.error || "Failed to save profile", "error");
      }
    } catch (error) {
      console.error("Profile save error:", error);
      showToast("Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showToast("Avatar image is too large. Please use an image under 15 MB.", "error");
      return;
    }

    try {
      setUploading(true);
      const compressed = await compressImageForUpload(
        file,
        CLIENT_COMPRESSION_TARGETS.profiles
      );
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("email", email);
      const wid = sessionStorage.getItem("ansh_onboarding_wid");
      if (wid) formData.append("workspaceId", wid);

      const res = await fetch("/api/profile/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success && json.url) {
        setAvatar(json.url);
        showToast("Avatar uploaded successfully", "success");
      } else {
        showToast(json.error || "Failed to upload avatar", "error");
      }
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-[var(--app-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SettingsPageHeader
        eyebrow="Account Settings"
        title="Profile Setting"
        description="Manage your account profile details, contact info, emergency contacts, and view your professional workspace parameters."
        action={
          !isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <PencilSquareIcon className="h-4 w-4" />
              Edit Profile
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
          <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-[var(--app-primary-soft)] text-3xl font-extrabold text-[var(--app-primary)]">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveStorageUrl(avatar)}
                alt={fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="mt-4 text-center">
            <h2 className="font-heading text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {fullName}
            </h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--app-primary)]">
              {roleLabelFromDb(role)}
            </p>
          </div>
          <div className="mt-5 space-y-3 border-t border-zinc-100 pt-5 dark:border-white/[0.05]">
            <SummaryRow icon={<BriefcaseIcon className="h-4 w-4" />} label="Department" value={displayOrFallback(department, "NOT ASSIGNED")} />
            <SummaryRow icon={<BuildingOffice2Icon className="h-4 w-4" />} label="Office Branch" value={displayOrFallback(officeBranch, "NOT ASSIGNED")} />
            <SummaryRow icon={<IdentificationIcon className="h-4 w-4" />} label="Employee Code" value={displayOrFallback(employeeCode, "N/A")} />
            <SummaryRow icon={<HeartIcon className="h-4 w-4" />} label="Blood Group" value={displayOrFallback(bloodGroup, "NOT SPECIFIED")} />
          </div>
          {isEditing && (
            <div className="mt-5 space-y-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={uploading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-3 py-2 text-[11px] font-bold text-zinc-600 dark:border-white/10 dark:text-zinc-300"
              >
                <ArrowUpTrayIcon className="h-4 w-4" />
                {uploading ? "Uploading..." : "Upload Photo"}
              </button>
            </div>
          )}
        </aside>

        <div className="space-y-6">
          <SettingsSectionCard
            title="Personal & Contact Information"
            icon={<UserIcon className="h-4 w-4" />}
          >
            <SettingsSubheading>
              <UserIcon className="h-4 w-4" />
              Identity Details
            </SettingsSubheading>
            {!isEditing ? (
              <SettingsInfoGrid>
                <SettingsInfoItem label="Full Name" value={fullName} />
                <SettingsInfoItem label="Date of Birth" value={formatDisplayDate(dateOfBirth)} />
                <SettingsInfoItem label="Blood Group" value={displayOrFallback(bloodGroup, "NOT SPECIFIED")} />
                <SettingsInfoItem label="Work Email" value={email} />
              </SettingsInfoGrid>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput label="First Name" value={firstName} onChange={setFirstName} />
                <FieldInput label="Last Name" value={lastName} onChange={setLastName} />
                <FieldInput label="Date of Birth" type="date" value={dateOfBirth} onChange={setDateOfBirth} />
                <div>
                  <SettingsFieldLabel>Blood Group</SettingsFieldLabel>
                  <AppSelect
                    value={bloodGroup}
                    onChange={setBloodGroup}
                    options={[...BLOOD_GROUP_OPTIONS]}
                    placeholder="Select blood group"
                    size="sm"
                  />
                </div>
              </div>
            )}

            <div className="mt-6">
              <SettingsSubheading>
                <PhoneIcon className="h-4 w-4" />
                Contact Coordinates
              </SettingsSubheading>
              {!isEditing ? (
                <SettingsInfoGrid>
                  <SettingsInfoItem label="Phone Number" value={displayOrFallback(phone)} />
                  <SettingsInfoItem label="Personal Email" value={displayOrFallback(personalEmail)} />
                </SettingsInfoGrid>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <SettingsFieldLabel>Phone Number</SettingsFieldLabel>
                    <PhoneInput country="in" value={phone} onChange={(value) => setPhone(value ? `+${value}` : "")} enableSearch countryCodeEditable={false} />
                  </div>
                  <FieldInput label="Personal Email" type="email" value={personalEmail} onChange={setPersonalEmail} />
                </div>
              )}
            </div>

            <div className="mt-6">
              <SettingsSubheading>
                <HeartIcon className="h-4 w-4" />
                Emergency Contact Details
              </SettingsSubheading>
              {!isEditing ? (
                <SettingsInfoGrid>
                  <SettingsInfoItem label="Contact Name" value={displayOrFallback(emergencyContactName)} />
                  <SettingsInfoItem label="Contact Phone" value={displayOrFallback(emergencyContactPhone)} />
                </SettingsInfoGrid>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldInput label="Contact Name" value={emergencyContactName} onChange={setEmergencyContactName} />
                  <div>
                    <SettingsFieldLabel>Contact Phone</SettingsFieldLabel>
                    <PhoneInput country="in" value={emergencyContactPhone} onChange={(value) => setEmergencyContactPhone(value ? `+${value}` : "")} enableSearch countryCodeEditable={false} />
                  </div>
                </div>
              )}
            </div>
          </SettingsSectionCard>

          <SettingsSectionCard
            title="Professional Details & Employment Status"
            icon={<BriefcaseIcon className="h-4 w-4" />}
          >
            {!isEditing ? (
              <SettingsInfoGrid>
                <SettingsInfoItem label="Designation" value={displayOrFallback(designation || jobTitle)} />
                <SettingsInfoItem label="Department" value={displayOrFallback(department)} />
                <SettingsInfoItem label="Employee Code" value={displayOrFallback(employeeCode, "N/A")} />
                <SettingsInfoItem label="Joining Date" value={formatDisplayDate(joiningDate)} />
                <SettingsInfoItem label="Employment Status" value={displayOrFallback(employmentStatus)} />
                <SettingsInfoItem label="Work Location" value={displayOrFallback(workLocation)} />
                <SettingsInfoItem label="Office Branch" value={displayOrFallback(officeBranch, "NOT ASSIGNED")} />
                <SettingsInfoItem label="Reporting Manager" value={displayOrFallback(reportsTo, "None")} />
                <SettingsInfoItem label="Reporting HR" value={displayOrFallback(reportingHr, "None")} />
                <SettingsInfoItem label="Timezone" value={displayOrFallback(timezone)} />
                <SettingsInfoItem label="Preferred Language" value={displayOrFallback(language)} />
              </SettingsInfoGrid>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <SettingsFieldLabel>Designation</SettingsFieldLabel>
                  <AppSelect
                    value={designation}
                    onChange={setDesignation}
                    options={withCurrentValue(designationOptions, designation)}
                    placeholder="Select designation"
                    size="sm"
                  />
                </div>
                <div>
                  <SettingsFieldLabel>Department</SettingsFieldLabel>
                  <AppSelect
                    value={department}
                    onChange={setDepartment}
                    options={withCurrentValue(departmentOptions, department)}
                    placeholder="Select department"
                    size="sm"
                  />
                </div>
                <FieldInput label="Employee Code" value={employeeCode} onChange={setEmployeeCode} />
                <FieldInput label="Joining Date" type="date" value={joiningDate} onChange={setJoiningDate} />
                <div>
                  <SettingsFieldLabel>Employment Status</SettingsFieldLabel>
                  <AppSelect
                    value={employmentStatus}
                    onChange={setEmploymentStatus}
                    options={[...EMPLOYMENT_STATUS_OPTIONS]}
                    placeholder="Select status"
                    size="sm"
                  />
                </div>
                <div>
                  <SettingsFieldLabel>Work Location</SettingsFieldLabel>
                  <AppSelect
                    value={workLocation}
                    onChange={setWorkLocation}
                    options={withCurrentValue(locationOptions, workLocation)}
                    placeholder="Select work location"
                    size="sm"
                  />
                </div>
                <FieldInput label="Office Branch" value={officeBranch} onChange={setOfficeBranch} />
                <div>
                  <SettingsFieldLabel>Reporting Manager</SettingsFieldLabel>
                  <AppSelect
                    value={reportsTo || "None"}
                    onChange={setReportsTo}
                    options={managerChoices}
                    placeholder="Select manager"
                    size="sm"
                  />
                </div>
                <div>
                  <SettingsFieldLabel>Reporting HR</SettingsFieldLabel>
                  <AppSelect
                    value={reportingHr || "None"}
                    onChange={setReportingHr}
                    options={hrChoices}
                    placeholder="Select HR manager"
                    size="sm"
                  />
                </div>
                <FieldInput label="Timezone" value={timezone} onChange={setTimezone} />
                <FieldInput label="Preferred Language" value={language} onChange={setLanguage} />
                <div className="sm:col-span-2">
                  <SettingsFieldLabel>Bio</SettingsFieldLabel>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={`${settingsInputClass} h-auto py-2`} />
                </div>
              </div>
            )}
          </SettingsSectionCard>
        </div>
      </div>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <SettingsFieldLabel>{label}</SettingsFieldLabel>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={settingsInputClass} />
    </div>
  );
}
