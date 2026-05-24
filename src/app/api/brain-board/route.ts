import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const workspaceIdParam = searchParams.get("workspaceId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    const workspaceId = workspaceIdParam ? parseInt(workspaceIdParam, 10) : 1;

    const notes = await prisma.brainboardNote.findMany({
      where: {
        userId,
        workspaceId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      notes,
    });
  } catch (error: any) {
    console.error("Brainboard GET API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch brainboard notes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, body: noteBody, color, x, y, rotation, workspaceId, userId } = body;

    if (!title || !noteBody || !userId) {
      return NextResponse.json(
        { success: false, error: "Title, content, and userId are required" },
        { status: 400 }
      );
    }

    const wid = workspaceId ? parseInt(workspaceId, 10) : 1;

    const newNote = await prisma.brainboardNote.create({
      data: {
        title,
        body: noteBody,
        color,
        x: parseFloat(x) || 1500,
        y: parseFloat(y) || 1000,
        rotation: parseFloat(rotation) || 0,
        workspaceId: wid,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      note: newNote,
    });
  } catch (error: any) {
    console.error("Brainboard POST API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create note" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, x, y, title, body: noteBody, color } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Note ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (x !== undefined) updateData.x = parseFloat(x);
    if (y !== undefined) updateData.y = parseFloat(y);
    if (title !== undefined) updateData.title = title;
    if (noteBody !== undefined) updateData.body = noteBody;
    if (color !== undefined) updateData.color = color;

    const updatedNote = await prisma.brainboardNote.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      note: updatedNote,
    });
  } catch (error: any) {
    console.error("Brainboard PATCH API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update note" },
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
        { success: false, error: "Note ID is required" },
        { status: 400 }
      );
    }

    await prisma.brainboardNote.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error: any) {
    console.error("Brainboard DELETE API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete note" },
      { status: 500 }
    );
  }
}
