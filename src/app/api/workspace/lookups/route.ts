import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export type WorkspaceLookupType = "department" | "designation" | "location";

const DEFAULT_DEPARTMENTS = ["Engineering", "Product", "Design", "Sales", "Marketing"];
const DEFAULT_DESIGNATIONS = [
  "Software Engineer",
  "Senior Software Engineer",
  "Product Manager",
  "Designer",
  "HR Executive",
  "Member",
];
const DEFAULT_LOCATIONS = ["Remote", "Hybrid", "On-site"];

type LookupRecord = { id: string; name: string };

function parseWorkspaceId(value: unknown): number | null {
  const parsed = parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeName(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function isLookupType(value: unknown): value is WorkspaceLookupType {
  return value === "department" || value === "designation" || value === "location";
}

async function seedDefaults(workspaceId: number) {
  await Promise.all([
    prisma.workspaceDepartment.createMany({
      data: DEFAULT_DEPARTMENTS.map((name) => ({ name, workspaceId })),
      skipDuplicates: true,
    }),
    prisma.workspaceDesignation.createMany({
      data: DEFAULT_DESIGNATIONS.map((name) => ({ name, workspaceId })),
      skipDuplicates: true,
    }),
    prisma.workspaceLocation.createMany({
      data: DEFAULT_LOCATIONS.map((name) => ({ name, workspaceId })),
      skipDuplicates: true,
    }),
  ]);
}

async function syncDesignationsFromUsers(workspaceId: number) {
  const members = await prisma.user.findMany({
    where: { workspaceId },
    select: { designation: true, jobTitle: true },
  });

  const names = Array.from(
    new Set(
      members
        .flatMap((member) => [member.designation, member.jobTitle])
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => value.trim())
    )
  );

  if (!names.length) return;

  await prisma.workspaceDesignation.createMany({
    data: names.map((name) => ({ name, workspaceId })),
    skipDuplicates: true,
  });
}

async function fetchLookups(workspaceId: number) {
  let [departments, designations, locations] = await Promise.all([
    prisma.workspaceDepartment.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.workspaceDesignation.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.workspaceLocation.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!departments.length || !designations.length || !locations.length) {
    await seedDefaults(workspaceId);
    [departments, designations, locations] = await Promise.all([
      prisma.workspaceDepartment.findMany({
        where: { workspaceId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.workspaceDesignation.findMany({
        where: { workspaceId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.workspaceLocation.findMany({
        where: { workspaceId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
  }

  if (!designations.length) {
    await syncDesignationsFromUsers(workspaceId);
    designations = await prisma.workspaceDesignation.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  }

  return { departments, designations, locations };
}

async function findLookup(type: WorkspaceLookupType, workspaceId: number, id: string) {
  if (type === "department") {
    return prisma.workspaceDepartment.findFirst({ where: { id, workspaceId } });
  }
  if (type === "designation") {
    return prisma.workspaceDesignation.findFirst({ where: { id, workspaceId } });
  }
  return prisma.workspaceLocation.findFirst({ where: { id, workspaceId } });
}

async function duplicateExists(
  type: WorkspaceLookupType,
  workspaceId: number,
  name: string,
  excludeId?: string
) {
  const where = {
    workspaceId,
    name: { equals: name, mode: "insensitive" as const },
    ...(excludeId ? { NOT: { id: excludeId } } : {}),
  };

  if (type === "department") {
    return prisma.workspaceDepartment.findFirst({ where });
  }
  if (type === "designation") {
    return prisma.workspaceDesignation.findFirst({ where });
  }
  return prisma.workspaceLocation.findFirst({ where });
}

async function countUsage(type: WorkspaceLookupType, workspaceId: number, name: string) {
  if (type === "department") {
    return prisma.user.count({ where: { workspaceId, department: name } });
  }
  if (type === "designation") {
    return prisma.user.count({
      where: {
        workspaceId,
        OR: [{ designation: name }, { jobTitle: name }],
      },
    });
  }
  return prisma.user.count({ where: { workspaceId, workLocation: name } });
}

async function renameUsage(type: WorkspaceLookupType, workspaceId: number, oldName: string, newName: string) {
  if (type === "department") {
    await prisma.user.updateMany({
      where: { workspaceId, department: oldName },
      data: { department: newName },
    });
    return;
  }

  if (type === "designation") {
    await prisma.user.updateMany({
      where: { workspaceId, designation: oldName },
      data: { designation: newName },
    });
    await prisma.user.updateMany({
      where: { workspaceId, jobTitle: oldName },
      data: { jobTitle: newName },
    });
    return;
  }

  await prisma.user.updateMany({
    where: { workspaceId, workLocation: oldName },
    data: { workLocation: newName },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = parseWorkspaceId(searchParams.get("wid"));

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: "Workspace ID (wid) is required" },
        { status: 400 }
      );
    }

    const lookups = await fetchLookups(workspaceId);

    return NextResponse.json({
      success: true,
      workspaceId,
      ...lookups,
    });
  } catch (error: unknown) {
    console.error("Workspace lookups GET error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch workspace lookups";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const workspaceId = parseWorkspaceId(body.workspaceId);
    const type = body.type;
    const name = normalizeName(body.name);

    if (!workspaceId || !isLookupType(type)) {
      return NextResponse.json(
        { success: false, error: "Workspace ID and valid lookup type are required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (await duplicateExists(type, workspaceId, name)) {
      return NextResponse.json(
        { success: false, error: "An item with this name already exists" },
        { status: 400 }
      );
    }

    let created: LookupRecord;
    if (type === "department") {
      created = await prisma.workspaceDepartment.create({
        data: { workspaceId, name },
        select: { id: true, name: true },
      });
    } else if (type === "designation") {
      created = await prisma.workspaceDesignation.create({
        data: { workspaceId, name },
        select: { id: true, name: true },
      });
    } else {
      created = await prisma.workspaceLocation.create({
        data: { workspaceId, name },
        select: { id: true, name: true },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Item added successfully",
      item: created,
      type,
    });
  } catch (error: unknown) {
    console.error("Workspace lookups POST error:", error);
    const message = error instanceof Error ? error.message : "Failed to add item";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const workspaceId = parseWorkspaceId(body.workspaceId);
    const type = body.type;
    const id = typeof body.id === "string" ? body.id : "";
    const name = normalizeName(body.name);

    if (!workspaceId || !isLookupType(type) || !id) {
      return NextResponse.json(
        { success: false, error: "Workspace ID, type, and item ID are required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    const existing = await findLookup(type, workspaceId, id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    if (existing.name.toLowerCase() === name.toLowerCase()) {
      return NextResponse.json({
        success: true,
        message: "No changes made",
        item: { id: existing.id, name: existing.name },
        type,
      });
    }

    if (await duplicateExists(type, workspaceId, name, id)) {
      return NextResponse.json(
        { success: false, error: "An item with this name already exists" },
        { status: 400 }
      );
    }

    await renameUsage(type, workspaceId, existing.name, name);

    let updated: LookupRecord;
    if (type === "department") {
      updated = await prisma.workspaceDepartment.update({
        where: { id },
        data: { name },
        select: { id: true, name: true },
      });
    } else if (type === "designation") {
      updated = await prisma.workspaceDesignation.update({
        where: { id },
        data: { name },
        select: { id: true, name: true },
      });
    } else {
      updated = await prisma.workspaceLocation.update({
        where: { id },
        data: { name },
        select: { id: true, name: true },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Item updated successfully",
      item: updated,
      type,
    });
  } catch (error: unknown) {
    console.error("Workspace lookups PATCH error:", error);
    const message = error instanceof Error ? error.message : "Failed to update item";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const workspaceId = parseWorkspaceId(body.workspaceId);
    const type = body.type;
    const id = typeof body.id === "string" ? body.id : "";

    if (!workspaceId || !isLookupType(type) || !id) {
      return NextResponse.json(
        { success: false, error: "Workspace ID, type, and item ID are required" },
        { status: 400 }
      );
    }

    const existing = await findLookup(type, workspaceId, id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    const usageCount = await countUsage(type, workspaceId, existing.name);
    if (usageCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete "${existing.name}" because ${usageCount} teammate${usageCount === 1 ? "" : "s"} still use it.`,
        },
        { status: 400 }
      );
    }

    if (type === "department") {
      await prisma.workspaceDepartment.delete({ where: { id } });
    } else if (type === "designation") {
      await prisma.workspaceDesignation.delete({ where: { id } });
    } else {
      await prisma.workspaceLocation.delete({ where: { id } });
    }

    return NextResponse.json({
      success: true,
      message: "Item deleted successfully",
      type,
      id,
    });
  } catch (error: unknown) {
    console.error("Workspace lookups DELETE error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete item";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
