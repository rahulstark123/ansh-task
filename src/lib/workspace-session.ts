export function readSessionWorkspaceId(): number {
  if (typeof window === "undefined") return 1;
  return parseInt(sessionStorage.getItem("ansh_onboarding_wid") ?? "1", 10);
}
