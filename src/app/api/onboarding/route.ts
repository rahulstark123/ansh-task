import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PERMISSION_MATRIX } from "@/lib/permissions";
import { TRIAL_PLAN, getTrialEndsAt } from "@/lib/plans";
import { captureServerEvent } from "@/lib/posthog-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user, workspace, project, tasks } = body;

    const phoneRaw =
      typeof user?.phone === "string" ? user.phone.trim() : "";
    const phoneDigits = phoneRaw.replace(/\D/g, "");
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      return NextResponse.json(
        { success: false, error: "A valid phone number is required." },
        { status: 400 }
      );
    }

    // Check if DATABASE_URL contains placeholder password
    const dbUrl = process.env.DATABASE_URL || "";
    const isMockMode = dbUrl.includes("[YOUR-PASSWORD]") || !dbUrl;

    if (isMockMode) {
      console.log("Onboarding API received payload (MOCK MODE):", { user, workspace, project, tasks });
      return NextResponse.json({
        success: true,
        message: "Onboarding completed successfully in Mock Mode. Set your database password in .env to persist to Supabase.",
        data: {
          workspace: { id: 1, name: workspace.name },
          user: { id: "mock-user-id", email: "user@example.com", workspaceId: 1, ...user }
        }
      });
    }

    // Database is configured! Let's persist using a Prisma transaction.
    const result = await prisma.$transaction(async (tx: any) => {
      const trialEndsAt = getTrialEndsAt();

      // 1. Create Workspace
      const createdWorkspace = await tx.workspace.create({
        data: {
          name: workspace.name,
          industry: workspace.industry,
          size: workspace.size,
          domain: workspace.domain || null,
          plan: TRIAL_PLAN,
          planExpiresAt: trialEndsAt,
        }
      });

      await tx.workspacePermissionSettings.create({
        data: {
          workspaceId: createdWorkspace.id,
          matrix: DEFAULT_PERMISSION_MATRIX as Prisma.InputJsonValue,
        },
      });

      // Seed default workspace roles
      const defaultRoles = ["Admin", "Editor", "Observer"];
      await tx.workspaceRole.createMany({
        data: defaultRoles.map((r) => ({ name: r, workspaceId: createdWorkspace.id })),
        skipDuplicates: true,
      });

      // Seed default workspace departments
      const defaultDepts = ["Engineering", "Product", "Design", "Sales", "Marketing"];
      await tx.workspaceDepartment.createMany({
        data: defaultDepts.map((d) => ({ name: d, workspaceId: createdWorkspace.id })),
        skipDuplicates: true,
      });

      const defaultDesignations = [
        "Software Engineer",
        "Senior Software Engineer",
        "Product Manager",
        "Designer",
        "HR Executive",
        "Member",
      ];
      await tx.workspaceDesignation.createMany({
        data: defaultDesignations.map((d) => ({ name: d, workspaceId: createdWorkspace.id })),
        skipDuplicates: true,
      });

      const defaultLocations = ["Remote", "Hybrid", "On-site"];
      await tx.workspaceLocation.createMany({
        data: defaultLocations.map((l) => ({ name: l, workspaceId: createdWorkspace.id })),
        skipDuplicates: true,
      });

      // 2. Ensure the workspace creator becomes the owner of the new workspace
      const ownerEmail = user.email || "ansh@example.com";
      const createdUser = await tx.user.upsert({
        where: { email: ownerEmail },
        create: {
          id: user.id || undefined,
          email: ownerEmail,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: phoneRaw,
          jobTitle: user.jobTitle,
          designation: user.jobTitle,
          role: "owner",
          department: user.department,
          avatar: user.avatar,
          workspaceId: createdWorkspace.id,
          acceptedTerms: user.acceptedTerms || false,
        },
        update: {
          firstName: user.firstName,
          lastName: user.lastName,
          phone: phoneRaw,
          jobTitle: user.jobTitle,
          designation: user.jobTitle,
          role: "owner",
          department: user.department,
          avatar: user.avatar,
          workspaceId: createdWorkspace.id,
          acceptedTerms: user.acceptedTerms || false,
        },
      });

      // 3. Create Project
      const createdProject = await tx.project.create({
        data: {
          name: project.name,
          description: `First project created during onboarding: ${project.name}`,
          priority: project.priority || "Normal",
          status: "Active",
          health: "good",
          owner: `${user.firstName} ${user.lastName}`,
          category: project.category || "General",
          due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days due date
          workspaceId: createdWorkspace.id,
        }
      });

      // 4. Create Tasks
      const ownerName =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        ownerEmail.split("@")[0];
      const defaultDueLabel = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric", year: "numeric" }
      );

      const tasksData = tasks
        .filter((taskTitle: any) => taskTitle && taskTitle.trim())
        .map((taskTitle: any) => ({
          title: taskTitle.trim(),
          due: defaultDueLabel,
          priority: "medium",
          category: project.category || "General",
          assignee: ownerName,
          assignees: [ownerName],
          status: "todo",
          done: false,
          workspaceId: createdWorkspace.id,
          projectId: createdProject.id,
        }));

      if (tasksData.length > 0) {
        await tx.task.createMany({
          data: tasksData,
        });
      }

      return {
        user: createdUser,
        workspace: createdWorkspace,
        project: createdProject,
        tasksCount: tasksData.length,
        trialEndsAt,
      };
    });

    await captureServerEvent({
      distinctId: result.user.id || result.user.email,
      event: "workspace_created",
      properties: {
        workspace_id: result.workspace.id,
        workspace_name: result.workspace.name,
        workspace_industry: workspace.industry,
        workspace_size: workspace.size,
        tasks_seeded: result.tasksCount,
        user_email: result.user.email,
        user_job_title: user.jobTitle,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Onboarding completed and persisted to Supabase!",
      data: result
    });
  } catch (error: any) {
    console.error("Onboarding API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process onboarding details" },
      { status: 500 }
    );
  }
}
export async function GET() {
  return NextResponse.json({ message: "Onboarding service active" });
}
