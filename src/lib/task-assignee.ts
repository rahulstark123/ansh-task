/** Identity strings used to match tasks to a workspace member. */
export function getMemberAssigneeKeys(member: {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}): string[] {
  const keys = new Set<string>();
  const first = (member.firstName || "").trim();
  const last = (member.lastName || "").trim();
  const full = `${first} ${last}`.trim();
  const email = (member.email || "").trim().toLowerCase();
  const local = email.includes("@") ? email.split("@")[0] : email;

  if (full) keys.add(full.toLowerCase());
  if (first) keys.add(first.toLowerCase());
  if (email) keys.add(email);
  if (local) keys.add(local.toLowerCase());

  return Array.from(keys);
}

export function taskAssignedToMember(
  task: { assignee?: string | null; assignees?: string[] },
  memberKeys: string[],
  options?: { treatMeAsMatch?: boolean }
): boolean {
  const candidates = [task.assignee, ...(task.assignees ?? [])]
    .filter((v): v is string => Boolean(v && String(v).trim()))
    .map((v) => v.trim().toLowerCase());

  if (candidates.length === 0) return false;

  return candidates.some((candidate) => {
    if (candidate === "me" && options?.treatMeAsMatch) return true;
    if (memberKeys.includes(candidate)) return true;
    return false;
  });
}
