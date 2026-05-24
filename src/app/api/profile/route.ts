import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const email = searchParams.get("email");

    if (!id && !email) {
      return NextResponse.json({ success: false, error: "Either id or email parameter is required" }, { status: 400 });
    }

    let user = null;
    if (id) {
      user = await prisma.user.findUnique({
        where: { id },
      });
    } else if (email) {
      user = await prisma.user.findUnique({
        where: { email },
      });

      // If the user doesn't exist in the database, let's create a placeholder
      // matching their supabase login so we have a record to modify.
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            firstName: email.split("@")[0],
            lastName: "",
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
          },
        });
      }
    }

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    console.error("Error in profile GET API:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, phone, jobTitle, department, timezone, language, bio, avatar } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required to update profile" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        firstName,
        lastName,
        phone,
        jobTitle,
        department,
        timezone,
        language,
        bio,
        avatar,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    console.error("Error in profile PATCH API:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
