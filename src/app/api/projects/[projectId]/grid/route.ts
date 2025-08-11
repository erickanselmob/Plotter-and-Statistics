import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Lightweight validation without zod to avoid bundler interop issues
type Column = { key: string; name: string };

export async function GET(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const grid = await prisma.projectGrid.findUnique({ where: { projectId } });
  return NextResponse.json({
    columns: (grid?.columns as any) ?? null,
    rows: (grid?.rows as any) ?? null,
    defaultStyle: (grid?.defaultStyle as any) ?? null,
    rowStyles: (grid?.rowStyles as any) ?? null,
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const body = await req.json();
  const columns = Array.isArray(body?.columns) ? (body.columns as Column[]).map((c) => ({ key: String(c.key), name: String(c.name) })) : [];
  const rows = Array.isArray(body?.rows) ? (body.rows as any[]) : [];
  const defaultStyle = body?.defaultStyle ?? undefined;
  const rowStyles = body?.rowStyles ?? undefined;
  await prisma.projectGrid.upsert({
    where: { projectId },
    update: { columns, rows, ...(defaultStyle !== undefined ? { defaultStyle } : {}), ...(rowStyles !== undefined ? { rowStyles } : {}) },
    create: { projectId, columns, rows, ...(defaultStyle !== undefined ? { defaultStyle } : {}), ...(rowStyles !== undefined ? { rowStyles } : {}) },
  });
  return NextResponse.json({ ok: true });
}


