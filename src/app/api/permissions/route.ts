import { Prisma, PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PERMISSION_MATRIX,
  sanitizePermissionMatrix,
} from "@/lib/permissions";

export const dynamic = "force-dynamic";

function getPermissionSettingsClient(client: PrismaClient) {
  const permissionSettingsClient = (client as PrismaClient & {
    workspacePermissionSettings?: {
      findUnique: typeof client.$queryRaw;
      upsert: typeof client.$executeRaw;
    };
  }).workspacePermissionSettings;

  if (
    !permissionSettingsClient ||
    typeof permissionSettingsClient.findUnique !== "function" ||
    typeof permissionSettingsClient.upsert !== "function"
  ) {
    throw new Error(
      "Prisma client is missing WorkspacePermissionSettings. Stop the dev server, run: npm run db:sync, then restart."
    );
  }

  return permissionSettingsClient as typeof prisma.workspacePermissionSettings;
}

async function resolveWorkspaceId({
  wid,
  email,
}: {
  wid?: string | null;
  email?: string | null;
}) {
  if (wid) {
    const parsedWid = Number.parseInt(wid, 10);
    if (Number.isFinite(parsedWid)) {
      return parsedWid;
    }
  }

  if (email) {
    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { workspaceId: true },
    });

    if (dbUser?.workspaceId) {
      return dbUser.workspaceId;
    }
  }

  return 1;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = await resolveWorkspaceId({
      wid: searchParams.get("wid"),
      email: searchParams.get("email"),
    });

    const permissionSettingsClient = getPermissionSettingsClient(prisma);
    const settings = await permissionSettingsClient.findUnique({
      where: { workspaceId },
    });

    return NextResponse.json({
      success: true,
      workspaceId,
      matrix: settings?.matrix
        ? sanitizePermissionMatrix(settings.matrix)
        : DEFAULT_PERMISSION_MATRIX,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch permissions";
    console.error("Permissions GET API Error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const workspaceId = await resolveWorkspaceId({
      wid:
        typeof body?.workspaceId === "number" || typeof body?.workspaceId === "string"
          ? String(body.workspaceId)
          : null,
      email: typeof body?.email === "string" ? body.email : null,
    });

    const matrix = sanitizePermissionMatrix(body?.matrix);
    const permissionSettingsClient = getPermissionSettingsClient(prisma);

    const settings = await permissionSettingsClient.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        matrix: matrix as Prisma.InputJsonValue,
      },
      update: {
        matrix: matrix as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      success: true,
      workspaceId,
      matrix: sanitizePermissionMatrix(settings.matrix),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update permissions";
    console.error("Permissions PATCH API Error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
