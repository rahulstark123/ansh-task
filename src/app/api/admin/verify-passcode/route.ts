import { NextResponse } from "next/server";
import {
  ADMIN_PASSCODE_COOKIE,
  ADMIN_PIN_COOKIE,
  verifyAdminPasscode,
  verifyAdminPin,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const passcode = typeof body.passcode === "string" ? body.passcode : "";
    const pin = typeof body.pin === "string" ? body.pin : "";

    if (!verifyAdminPasscode(passcode)) {
      return NextResponse.json(
        { success: false, error: "Invalid passcode" },
        { status: 401 }
      );
    }

    if (!verifyAdminPin(pin)) {
      return NextResponse.json(
        { success: false, error: "Invalid PIN" },
        { status: 401 }
      );
    }

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    };

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_PASSCODE_COOKIE, "1", cookieOptions);
    response.cookies.set(ADMIN_PIN_COOKIE, "1", cookieOptions);
    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
