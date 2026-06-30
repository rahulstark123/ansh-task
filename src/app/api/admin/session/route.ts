import { NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { user, error } = await getAdminUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: error === "Forbidden" ? "Forbidden" : "Unauthorized" },
      { status: error === "Forbidden" ? 403 : 401 }
    );
  }

  return NextResponse.json({ success: true, email: user.email });
}
