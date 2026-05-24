import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* ──────────────────────────────────────────────────────────────────────────
   GET /api/message?chatId=<id>&type=<channel|dm>&email=<email>&workspaceId=<id>
   Returns all messages for a specific channel or direct message thread.
   ────────────────────────────────────────────────────────────────────────── */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const type = searchParams.get("type");
    const email = searchParams.get("email");
    const widParam = searchParams.get("workspaceId");

    if (!chatId || !type) {
      return NextResponse.json(
        { success: false, error: "chatId and type are required parameters" },
        { status: 400 }
      );
    }

    const workspaceId = widParam ? parseInt(widParam, 10) : 1;

    if (type === "channel") {
      const messages = await prisma.message.findMany({
        where: { channelId: chatId },
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
      });
      return NextResponse.json({ success: true, messages });
    }

    if (type === "dm") {
      if (!email) {
        return NextResponse.json(
          { success: false, error: "User email parameter is required for DMs" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: "Authenticated user record not found" },
          { status: 404 }
        );
      }

      // Locate DM conversation between active user and selected teammate
      const conversation = await prisma.conversation.findFirst({
        where: {
          workspaceId,
          AND: [
            { participants: { some: { userId: user.id } } },
            { participants: { some: { userId: chatId } } },
          ],
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      if (!conversation) {
        return NextResponse.json({ success: true, messages: [] });
      }

      return NextResponse.json({ success: true, messages: conversation.messages });
    }

    return NextResponse.json(
      { success: false, error: "Invalid type parameter" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Message GET API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve messages" },
      { status: 500 }
    );
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   POST /api/message
   Body: { content, type, targetId, email, workspaceId }
   Saves message to channel or direct message conversation.
   ────────────────────────────────────────────────────────────────────────── */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, type, targetId, email, workspaceId } = body;

    if (!content?.trim() || !type || !targetId || !email) {
      return NextResponse.json(
        { success: false, error: "content, type, targetId, and email are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authenticated user record not found" },
        { status: 404 }
      );
    }

    const wid = workspaceId ? parseInt(workspaceId, 10) : 1;
    let newMessage;

    if (type === "channel") {
      newMessage = await prisma.message.create({
        data: {
          content: content.trim(),
          senderId: user.id,
          channelId: targetId,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
      });
    } else if (type === "dm") {
      // 1. Locate existing conversation or instantiate a new one (lazy instantiation)
      let conversation = await prisma.conversation.findFirst({
        where: {
          workspaceId: wid,
          AND: [
            { participants: { some: { userId: user.id } } },
            { participants: { some: { userId: targetId } } },
          ],
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            workspaceId: wid,
            participants: {
              create: [
                { userId: user.id },
                { userId: targetId },
              ],
            },
          },
        });
      }

      // 2. Create message associated with this conversation
      newMessage = await prisma.message.create({
        data: {
          content: content.trim(),
          senderId: user.id,
          conversationId: conversation.id,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid type parameter" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error: any) {
    console.error("Message POST API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save message" },
      { status: 500 }
    );
  }
}
