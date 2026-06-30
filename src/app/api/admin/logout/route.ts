import { NextResponse } from "next/server";
import { ADMIN_PASSCODE_COOKIE, ADMIN_PIN_COOKIE } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const clearCookie = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
  response.cookies.set(ADMIN_PASSCODE_COOKIE, "", clearCookie);
  response.cookies.set(ADMIN_PIN_COOKIE, "", clearCookie);
  return response;
}
