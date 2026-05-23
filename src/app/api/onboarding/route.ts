import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user, workspace, project, tasks } = body;

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
      // 1. Create Workspace
      const createdWorkspace = await tx.workspace.create({
        data: {
          name: workspace.name,
          industry: workspace.industry,
          size: workspace.size,
          domain: workspace.domain || null,
        }
      });

      // Seed default workspace roles
      const defaultRoles = ["Admin", "Manager", "Team Member", "Observer"];
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

      // 2. Create User
      const createdUser = await tx.user.create({
        data: {
          id: user.id || undefined,
          email: user.email || "ansh@example.com",
          firstName: user.firstName,
          lastName: user.lastName,
          jobTitle: user.jobTitle,
          department: user.department,
          avatar: user.avatar,
          workspaceId: createdWorkspace.id,
        }
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
      const tasksData = tasks
        .filter((taskTitle: any) => taskTitle && taskTitle.trim())
        .map((taskTitle: any) => ({
          title: taskTitle.trim(),
          due: "May 30",
          priority: "medium",
          category: project.category || "General",
          assignee: "Me",
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
        tasksCount: tasksData.length
      };
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
