import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function assertTaskNoteClient() {
  if (!prisma.taskNote || typeof prisma.taskNote.findMany !== "function") {
    throw new Error(
      "Prisma client is missing TaskNote. Stop the dev server, run: npx prisma generate && npx prisma db push, then restart."
    );
  }
}

function displayName(user: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return name || user.email.split("@")[0];
}

function mapNote(note: {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  taskId: string;
  userId: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatar: string | null;
  };
}) {
  return {
    id: note.id,
    content: note.content,
    taskId: note.taskId,
    userId: note.userId,
    authorName: displayName(note.user),
    authorEmail: note.user.email,
    authorAvatar: note.user.avatar,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

const userSelect = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    avatar: true,
  },
} as const;

/* GET /api/task/notes?taskId= */
export async function GET(request: Request) {
  try {
    assertTaskNoteClient();
    const taskId = new URL(request.url).searchParams.get("taskId");
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "taskId is required" },
        { status: 400 }
      );
    }

    let notes = await prisma.taskNote.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
      include: { user: userSelect },
    });

    // Migrate legacy single `Task.notes` text into first TaskNote row
    if (notes.length === 0) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { notes: true, workspaceId: true },
      });
      if (task?.notes?.trim()) {
        const author = await prisma.user.findFirst({
          where: { workspaceId: task.workspaceId },
          orderBy: { createdAt: "asc" },
        });
        if (author) {
          const migrated = await prisma.taskNote.create({
            data: {
              taskId,
              userId: author.id,
              content: task.notes.trim(),
            },
            include: { user: userSelect },
          });
          await prisma.task.update({
            where: { id: taskId },
            data: { notes: null },
          });
          notes = [migrated];
        }
      }
    }

    return NextResponse.json({
      success: true,
      notes: notes.map(mapNote),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch notes";
    console.error("Task notes GET error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/* POST /api/task/notes — body: { taskId, content, email } */
export async function POST(request: Request) {
  try {
    assertTaskNoteClient();
    const body = await request.json();
    const { taskId, content, email } = body;

    if (!taskId || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: "taskId and content are required" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: "User email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const note = await prisma.taskNote.create({
      data: {
        taskId,
        userId: user.id,
        content: content.trim(),
      },
      include: { user: userSelect },
    });

    return NextResponse.json({
      success: true,
      note: mapNote(note),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create note";
    console.error("Task notes POST error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/* PATCH /api/task/notes — body: { id, content } */
export async function PATCH(request: Request) {
  try {
    assertTaskNoteClient();
    const body = await request.json();
    const { id, content } = body;

    if (!id || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: "id and content are required" },
        { status: 400 }
      );
    }

    const note = await prisma.taskNote.update({
      where: { id },
      data: { content: content.trim() },
      include: { user: userSelect },
    });

    return NextResponse.json({
      success: true,
      note: mapNote(note),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update note";
    console.error("Task notes PATCH error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/* DELETE /api/task/notes?id= */
export async function DELETE(request: Request) {
  try {
    assertTaskNoteClient();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Note id is required" },
        { status: 400 }
      );
    }

    await prisma.taskNote.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete note";
    console.error("Task notes DELETE error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
