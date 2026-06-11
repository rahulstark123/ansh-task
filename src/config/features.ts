/** Disabled temporarily — Team Space realtime chat drives high Supabase egress. */
export const TEAM_SPACE_ENABLED = false;

export const TEAM_SPACE_PATH = "/tasks/team";

export function isTeamSpacePath(pathname: string) {
  return pathname === TEAM_SPACE_PATH || pathname.startsWith(`${TEAM_SPACE_PATH}/`);
}
