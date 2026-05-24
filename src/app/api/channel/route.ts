import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────
   GET /api/channel?wid=<id>
   Returns all channels for a workspace.
───────────────────────────────────────── */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const channel = await prisma.channel.findUnique({
        where: { id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                  jobTitle: true,
                },
              },
            },
          },
        },
      });
      return NextResponse.json({ success: true, channel });
    }

    const widParam = searchParams.get("wid");
    const workspaceId = widParam ? parseInt(widParam, 10) : 1;
    const email = searchParams.get("email");

    let channels;
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }

      channels = await prisma.channel.findMany({
        where: {
          workspaceId,
          OR: [
            { isPrivate: false },
            {
              isPrivate: true,
              members: {
                some: { userId: user.id },
              },
            },
          ],
        },
        orderBy: { createdAt: "asc" },
      });
    } else {
      channels = await prisma.channel.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" },
      });
    }

    return NextResponse.json({ success: true, channels });
  } catch (error: any) {
    console.error("Channel GET API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch channels" },
      { status: 500 }
    );
  }
}

/* ─────────────────────────────────────────
   POST /api/channel
   Body: { name, topic?, isPrivate?, workspaceId?, email?, memberIds? }
───────────────────────────────────────── */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, topic, isPrivate, workspaceId, email, memberIds } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Channel name is required" },
        { status: 400 }
      );
    }

    const wid = workspaceId ? parseInt(workspaceId, 10) : 1;

    const newChannel = await prisma.channel.create({
      data: {
        name: name.trim().toLowerCase().replace(/\s+/g, "-").replace(/#/g, ""),
        topic: topic || null,
        isPrivate: !!isPrivate,
        workspaceId: wid,
      },
    });

    if (email) {
      const creator = await prisma.user.findUnique({ where: { email } });
      if (creator) {
        const userIdsToAdd = new Set<string>();
        userIdsToAdd.add(creator.id);

        if (Array.isArray(memberIds)) {
          memberIds.forEach((id) => {
            if (id) userIdsToAdd.add(id);
          });
        }

        await prisma.channelMember.createMany({
          data: Array.from(userIdsToAdd).map((userId) => ({
            channelId: newChannel.id,
            userId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Channel created successfully",
      channel: newChannel,
    });
  } catch (error: any) {
    console.error("Channel POST API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create channel" },
      { status: 500 }
    );
  }
}

/* ─────────────────────────────────────────
   PATCH /api/channel
   Body: { id, name, topic, isPrivate }
───────────────────────────────────────── */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, topic, isPrivate, email, memberIds } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Channel ID is required" },
        { status: 400 }
      );
    }

    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Channel name cannot be empty" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/#/g, "");
    }
    if (topic !== undefined) {
      updateData.topic = topic ? topic.trim() : null;
    }
    if (isPrivate !== undefined) {
      updateData.isPrivate = !!isPrivate;
    }

    const updatedChannel = await prisma.channel.update({
      where: { id },
      data: updateData,
    });

    // If channel is private, update memberships
    if (isPrivate && Array.isArray(memberIds)) {
      // 1. Delete all current members of the channel
      await prisma.channelMember.deleteMany({
        where: { channelId: id },
      });

      const userIdsToAdd = new Set<string>(memberIds.filter(Boolean));
      if (email) {
        const requester = await prisma.user.findUnique({ where: { email } });
        if (requester) {
          userIdsToAdd.add(requester.id);
        }
      }

      if (userIdsToAdd.size > 0) {
        await prisma.channelMember.createMany({
          data: Array.from(userIdsToAdd).map((userId) => ({
            channelId: id,
            userId,
          })),
          skipDuplicates: true,
        });
      }
    } else if (isPrivate === false) {
      // If it changed from private to public, we can clean up the members table if we want, or keep it.
      // Let's delete channel member entries to keep it clean.
      await prisma.channelMember.deleteMany({
        where: { channelId: id },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Channel updated successfully",
      channel: updatedChannel,
    });
  } catch (error: any) {
    console.error("Channel PATCH API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update channel" },
      { status: 500 }
    );
  }
}

/* ─────────────────────────────────────────
   DELETE /api/channel?id=<id>
───────────────────────────────────────── */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Channel ID is required" },
        { status: 400 }
      );
    }

    const channel = await prisma.channel.findUnique({
      where: { id },
    });

    if (!channel) {
      return NextResponse.json(
        { success: false, error: "Channel not found" },
        { status: 404 }
      );
    }

    if (channel.name === "general") {
      return NextResponse.json(
        { success: false, error: "Default #general channel cannot be deleted" },
        { status: 400 }
      );
    }

    await prisma.channel.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Channel deleted successfully",
    });
  } catch (error: any) {
    console.error("Channel DELETE API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete channel" },
      { status: 500 }
    );
  }
}
