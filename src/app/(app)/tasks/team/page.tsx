import { redirect } from "next/navigation";
import { TEAM_SPACE_ENABLED } from "@/config/features";
import { TeamSpaceView } from "@/components/team-space/TeamSpaceView";

export default function TeamSpacePage() {
  if (!TEAM_SPACE_ENABLED) {
    redirect("/tasks");
  }

  return <TeamSpaceView />;
}
