import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const widParam = searchParams.get("wid");
    const emailParam = searchParams.get("email");

    let workspaceId: number | null = null;

    if (widParam) {
      workspaceId = parseInt(widParam, 10);
    } else if (emailParam) {
      const dbUser = await prisma.user.findUnique({
        where: { email: emailParam },
        select: { workspaceId: true },
      });
      if (dbUser) {
        workspaceId = dbUser.workspaceId;
      }
    }

    if (!workspaceId) {
      workspaceId = 1;
    }

    // Parallel fetch roles, departments, and members in one roundtrip
    let [dbRoles, dbDepts, members] = await Promise.all([
      prisma.workspaceRole.findMany({
        where: { workspaceId },
        orderBy: { name: "asc" },
      }),
      prisma.workspaceDepartment.findMany({
        where: { workspaceId },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const defaultRoles = ["Admin", "Manager", "Team Member", "Observer"];
    const defaultDepts = ["Engineering", "Product", "Design", "Sales", "Marketing"];

    // Optimistically check if defaults are missing to avoid unnecessary DB writes
    const missingRoles = defaultRoles.filter((r) => !dbRoles.some((role) => role.name === r));
    const missingDepts = defaultDepts.filter((d) => !dbDepts.some((dept) => dept.name === d));

    if (missingRoles.length > 0 || missingDepts.length > 0) {
      await Promise.all([
        missingRoles.length > 0
          ? prisma.workspaceRole.createMany({
              data: missingRoles.map((r) => ({ name: r, workspaceId: workspaceId! })),
              skipDuplicates: true,
            })
          : Promise.resolve(),
        missingDepts.length > 0
          ? prisma.workspaceDepartment.createMany({
              data: missingDepts.map((d) => ({ name: d, workspaceId: workspaceId! })),
              skipDuplicates: true,
            })
          : Promise.resolve(),
      ]);

      // Re-fetch only after seeding
      [dbRoles, dbDepts] = await Promise.all([
        prisma.workspaceRole.findMany({
          where: { workspaceId },
          orderBy: { name: "asc" },
        }),
        prisma.workspaceDepartment.findMany({
          where: { workspaceId },
          orderBy: { name: "asc" },
        }),
      ]);
    }

    return NextResponse.json({
      success: true,
      members,
      roles: dbRoles.map((r) => r.name),
      departments: dbDepts.map((d) => d.name),
      workspaceId,
    });
  } catch (error: any) {
    console.error("Team GET API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch team details" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role, dept, reportsTo, password, phone, workspaceId } = body;

    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: "Name and Email are required fields" },
        { status: 400 }
      );
    }

    const wid = workspaceId ? parseInt(workspaceId, 10) : 1;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "A user with this email address already exists" },
        { status: 400 }
      );
    }

    // Upsert role and department in parallel to save a DB roundtrip
    await Promise.all([
      role
        ? prisma.workspaceRole.upsert({
            where: { workspaceId_name: { workspaceId: wid, name: role } },
            create: { workspaceId: wid, name: role },
            update: {},
          })
        : Promise.resolve(),
      dept
        ? prisma.workspaceDepartment.upsert({
            where: { workspaceId_name: { workspaceId: wid, name: dept } },
            create: { workspaceId: wid, name: dept },
            update: {},
          })
        : Promise.resolve(),
    ]);

    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    let supabaseUserId: string | undefined = undefined;
    if (password) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });
      if (authError) {
        if (!authError.message.includes("already registered")) {
          return NextResponse.json(
            { success: false, error: authError.message },
            { status: 400 }
          );
        }
      } else if (authData?.user?.id) {
        supabaseUserId = authData.user.id;
      }
    }

    const newUser = await prisma.user.create({
      data: {
        id: supabaseUserId || undefined,
        email,
        password: password || null,
        phone: phone || null,
        firstName,
        lastName,
        jobTitle: role || "Member",
        department: dept || "Engineering",
        reportsTo: reportsTo || "None",
        workspaceId: wid,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Team member added successfully",
      member: newUser,
    });
  } catch (error: any) {
    console.error("Team POST API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add team member" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, role, dept, reportsTo, password, phone, workspaceId } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Member ID is required for update" },
        { status: 400 }
      );
    }

    const wid = workspaceId ? parseInt(workspaceId, 10) : 1;

    // Upsert role and department in parallel to save a DB roundtrip
    await Promise.all([
      role
        ? prisma.workspaceRole.upsert({
            where: { workspaceId_name: { workspaceId: wid, name: role } },
            create: { workspaceId: wid, name: role },
            update: {},
          })
        : Promise.resolve(),
      dept
        ? prisma.workspaceDepartment.upsert({
            where: { workspaceId_name: { workspaceId: wid, name: dept } },
            create: { workspaceId: wid, name: dept },
            update: {},
          })
        : Promise.resolve(),
    ]);

    const nameParts = name ? name.trim().split(/\s+/) : [];
    const firstName = nameParts[0] || undefined;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        email: email || undefined,
        firstName,
        lastName,
        jobTitle: role || undefined,
        department: dept || undefined,
        reportsTo: reportsTo || undefined,
        password: password || undefined,
        phone: phone !== undefined ? phone : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Team member updated successfully",
      member: updatedUser,
    });
  } catch (error: any) {
    console.error("Team PATCH API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update team member" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Member ID is required for deletion" },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Team member removed successfully",
    });
  } catch (error: any) {
    console.error("Team DELETE API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete team member" },
      { status: 500 }
    );
  }
}
