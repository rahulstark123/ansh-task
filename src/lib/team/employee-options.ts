export type EmployeeOption = {
  id: string;
  name: string;
};

export function getEmployeeDisplayName(user: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  if (fullName) return fullName;
  const email = user.email?.trim();
  if (email) return email.split("@")[0] || email;
  return "";
}

export function buildReportingEmployeeChoices(
  employees: EmployeeOption[],
  options?: {
    excludeId?: string | null;
    includeValues?: string[];
  }
): string[] {
  const excludeId = options?.excludeId ?? null;
  const includeValues = options?.includeValues ?? [];

  const names = employees
    .filter((employee) => employee.id !== excludeId)
    .map((employee) => employee.name.trim())
    .filter(Boolean);

  const merged = new Set<string>(["None", ...names]);

  for (const value of includeValues) {
    const trimmed = value?.trim();
    if (trimmed && trimmed !== "None") {
      merged.add(trimmed);
    }
  }

  return Array.from(merged).sort((a, b) => {
    if (a === "None") return -1;
    if (b === "None") return 1;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });
}
