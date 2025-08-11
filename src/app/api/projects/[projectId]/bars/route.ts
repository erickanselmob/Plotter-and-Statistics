import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const schema = z.object({
  label: z.string().min(1),
  value: z.number(),
});

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const body = await req.json();
  const parsed = schema.parse(body);
  const item = await prisma.barDatum.create({
    data: { projectId, label: parsed.label, value: parsed.value },
  });
  return NextResponse.json(item);
}



