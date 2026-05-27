import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import {
  FREE_PLAN_TEAM_MEMBERS_LIMIT,
  getEffectiveWorkspacePlan,
  getWorkspaceMemberCount,
} from "@/lib/planLimits";
import { UPGRADE_REQUIRED_CODE } from "@/lib/plans";
import { captureServerEvent } from "@/lib/posthog-server";

export const dynamic = "force-dynamic";

const FIXED_TEAM_ROLES = ["Owner", "Admin", "Editor", "Observer"] as const;

function normalizeRole(role: unknown): "owner" | "admin" | "editor" | "observer" {
  const value = typeof role === "string" ? role.trim().toLowerCase() : "";
  if (value === "owner") return "owner";
  if (value === "admin") return "admin";
  if (value === "observer") return "observer";
  return "editor";
}

function toRoleLabel(role: "owner" | "admin" | "editor" | "observer") {
  if (role === "owner") return "Owner";
  return role === "admin" ? "Admin" : role === "observer" ? "Observer" : "Editor";
}

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

    // Parallel fetch roles, departments, members, and tasks in one roundtrip
    let [dbRoles, dbDepts, members, dbTasks] = await Promise.all([
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
      prisma.task.findMany({
        where: { workspaceId },
        include: {
          project: {
            select: {
              name: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const defaultRoles = [...FIXED_TEAM_ROLES];
    const defaultDepts = ["Engineering", "Product", "Design", "Sales", "Marketing"];

    // Optimistically check if defaults are missing to avoid unnecessary DB writes
    const missingRoles = defaultRoles.filter(
      (r) => !dbRoles.some((role) => role.name.toLowerCase() === r.toLowerCase())
    );
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

    // Map tasks to members based on assignee matching name or email
    const membersWithTasks = members.map((member) => {
      const memberName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.email.split("@")[0];
      const memberTasks = dbTasks.filter(
        (task) =>
          task.assignees.some((a) => a.toLowerCase() === memberName.toLowerCase()) ||
          task.assignees.some((a) => a.toLowerCase() === member.email.toLowerCase()) ||
          (task.assignee && task.assignee.toLowerCase() === memberName.toLowerCase()) ||
          (task.assignee && task.assignee.toLowerCase() === member.email.toLowerCase())
      );
      return {
        ...member,
        tasks: memberTasks.map((t) => ({
          id: t.id,
          title: t.title,
          project: t.project?.name || "General",
          projectId: t.projectId,
          priority: t.priority,
          category: t.category,
          assignee: t.assignee,
          assignees: t.assignees || [],
          status: t.status === "done"
            ? "Completed"
            : t.status === "in_progress"
            ? "In Progress"
            : t.status === "blocked"
            ? "Blocked"
            : "Todo",
          progress: t.status === "done"
            ? 100
            : t.status === "in_progress"
            ? 60
            : t.status === "blocked"
            ? 20
            : 0,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      members: membersWithTasks,
      roles: FIXED_TEAM_ROLES.filter((fixedRole) =>
        dbRoles.some((r) => r.name.toLowerCase() === fixedRole.toLowerCase())
      ),
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
    const { name, email, role, designation, dept, reportsTo, password, phone, workspaceId } = body;
    const safeRole = normalizeRole(role);
    const safeRoleLabel = toRoleLabel(safeRole);
 
    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: "Name and Email are required fields" },
        { status: 400 }
      );
    }
 
    const wid = workspaceId ? parseInt(workspaceId, 10) : 1;

    const currentPlan = await getEffectiveWorkspacePlan(wid);
    if (currentPlan === "free") {
      const memberCount = await getWorkspaceMemberCount(wid);
      if (memberCount >= FREE_PLAN_TEAM_MEMBERS_LIMIT) {
        return NextResponse.json(
          {
            success: false,
            code: UPGRADE_REQUIRED_CODE,
            feature: "teamMembersLimit",
            error: `Free plan workspaces can have up to ${FREE_PLAN_TEAM_MEMBERS_LIMIT} team members. Upgrade to PRO to add more teammates.`,
          },
          { status: 403 }
        );
      }
    }
 
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
      prisma.workspaceRole.upsert({
        where: { workspaceId_name: { workspaceId: wid, name: safeRoleLabel } },
        create: { workspaceId: wid, name: safeRoleLabel },
        update: {},
      }),
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
        phone: phone?.trim() ? phone.trim() : null,
        firstName,
        lastName,
        jobTitle: designation || "Member",
        designation: designation || "Member",
        role: safeRole,
        department: dept || "Engineering",
        reportsTo: reportsTo || "None",
        workspaceId: wid,
      },
    });
 
    await captureServerEvent({
      distinctId: `workspace_${wid}`,
      event: "team_member_added",
      properties: {
        workspace_id: wid,
        member_role: safeRole,
        member_department: dept || "Engineering",
        has_password: Boolean(password),
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
    const { id, name, email, role, designation, dept, reportsTo, password, phone, workspaceId } = body;
    const safeRole = role !== undefined ? normalizeRole(role) : undefined;
    const safeRoleLabel = safeRole ? toRoleLabel(safeRole) : null;
 
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Member ID is required for update" },
        { status: 400 }
      );
    }
 
    const wid = workspaceId ? parseInt(workspaceId, 10) : 1;
 
    // Upsert role and department in parallel to save a DB roundtrip
    await Promise.all([
      safeRoleLabel
        ? prisma.workspaceRole.upsert({
            where: { workspaceId_name: { workspaceId: wid, name: safeRoleLabel } },
            create: { workspaceId: wid, name: safeRoleLabel },
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
        jobTitle: designation !== undefined ? designation : undefined,
        designation: designation !== undefined ? designation : undefined,
        role: safeRole,
        department: dept || undefined,
        reportsTo: reportsTo || undefined,
        password: password || undefined,
        phone:
          phone !== undefined
            ? phone?.trim()
              ? phone.trim()
              : null
            : undefined,
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

    await captureServerEvent({
      distinctId: `member_${id}`,
      event: "team_member_removed",
      properties: { member_id: id },
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
