import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const schema = z.object({
  rows: z.array(z.object({ id: z.string().optional(), label: z.string(), value: z.number() })),
});

export async function POST(req: Request, { params }: { params: Promise<{ chartId: string }> }) {
  const { chartId } = await params;
  const body = await req.json();
  const { rows } = schema.parse(body);
  // Replace existing
  await prisma.barDatum.deleteMany({ where: { chartId } });
  await prisma.barDatum.createMany({ data: rows.map((r) => ({ chartId, label: r.label, value: r.value })) });
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request, { params }: { params: Promise<{ chartId: string }> }) {
  const { chartId } = await params;
  const rows = await prisma.barDatum.findMany({ where: { chartId }, select: { id: true, label: true, value: true } });
  return NextResponse.json({ rows });
}


