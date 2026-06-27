export const BLOOD_GROUP_OPTIONS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

export const EMPLOYMENT_STATUS_OPTIONS = [
  "Active",
  "On Leave",
  "Probation",
  "Inactive",
] as const;

export const DEFAULT_WORK_LOCATIONS = ["Remote", "Hybrid", "On-site"] as const;

export function formatDisplayDate(value?: string | Date | null): string {
  if (!value) return "Not specified";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not specified";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function toDateInputValue(value?: string | Date | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function displayOrFallback(value?: string | null, fallback = "Not specified"): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  return trimmed;
}

export function roleLabelFromDb(role?: string | null): string {
  const normalized = (role || "").toLowerCase();
  if (normalized === "owner") return "Owner";
  if (normalized === "admin") return "Admin";
  if (normalized === "observer") return "Observer";
  return "Editor";
}
