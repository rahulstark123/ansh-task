import { NextResponse } from "next/server";
import {
  ADMIN_PASSCODE_COOKIE,
  verifyAdminPasscode,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const passcode = typeof body.passcode === "string" ? body.passcode : "";

    if (!verifyAdminPasscode(passcode)) {
      return NextResponse.json(
        { success: false, error: "Invalid passcode" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_PASSCODE_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
