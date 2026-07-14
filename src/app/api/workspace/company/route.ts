import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const COMPANY_SELECT = {
  id: true,
  name: true,
  domain: true,
  logo: true,
  industry: true,
  size: true,
  website: true,
  billingEmail: true,
  address: true,
  cityCountry: true,
  saathiCode: true,
} as const;

function mapCompany(workspace: {
  id: number;
  name: string;
  domain: string | null;
  logo: string | null;
  industry: string | null;
  size: string | null;
  website: string | null;
  billingEmail: string | null;
  address: string | null;
  cityCountry: string | null;
  saathiCode: string | null;
}) {
  return {
    id: workspace.id,
    name: workspace.name,
    domain: workspace.domain ?? "",
    logo: workspace.logo ?? "🏢",
    industry: workspace.industry ?? "",
    size: workspace.size ?? "",
    website: workspace.website ?? "",
    billingEmail: workspace.billingEmail ?? "",
    address: workspace.address ?? "",
    cityCountry: workspace.cityCountry ?? "",
    saathiCode: workspace.saathiCode ?? null,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const widParam = searchParams.get("wid");

    if (!widParam) {
      return NextResponse.json(
        { success: false, error: "Workspace ID (wid) is required" },
        { status: 400 }
      );
    }

    const workspaceId = parseInt(widParam, 10);
    if (Number.isNaN(workspaceId)) {
      return NextResponse.json(
        { success: false, error: "Invalid workspace ID" },
        { status: 400 }
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: COMPANY_SELECT,
    });

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      company: mapCompany(workspace),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch company profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const widParam =
      body.workspaceId != null ? String(body.workspaceId) : body.wid != null ? String(body.wid) : null;

    if (!widParam) {
      return NextResponse.json(
        { success: false, error: "workspaceId is required" },
        { status: 400 }
      );
    }

    const workspaceId = parseInt(widParam, 10);
    if (Number.isNaN(workspaceId)) {
      return NextResponse.json(
        { success: false, error: "Invalid workspace ID" },
        { status: 400 }
      );
    }

    const existing = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 }
      );
    }

    const data: Record<string, string | null> = {};

    if (typeof body.name === "string") data.name = body.name.trim() || "Workspace";
    if (body.domain !== undefined) data.domain = body.domain ? String(body.domain).trim() : null;
    if (body.logo !== undefined) data.logo = body.logo ? String(body.logo) : null;
    if (body.industry !== undefined) data.industry = body.industry ? String(body.industry) : null;
    if (body.size !== undefined) data.size = body.size ? String(body.size) : null;
    if (body.website !== undefined) data.website = body.website ? String(body.website).trim() : null;
    if (body.billingEmail !== undefined) {
      data.billingEmail = body.billingEmail ? String(body.billingEmail).trim() : null;
    }
    if (body.address !== undefined) data.address = body.address ? String(body.address).trim() : null;
    if (body.cityCountry !== undefined) {
      data.cityCountry = body.cityCountry ? String(body.cityCountry).trim() : null;
    }

    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data,
      select: COMPANY_SELECT,
    });

    return NextResponse.json({
      success: true,
      company: mapCompany(updated),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update company profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
