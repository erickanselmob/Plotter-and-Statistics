import { NextResponse } from "next/server";
import { PrismaClient, ChartType } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const schema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
  type: z.nativeEnum(ChartType).default(ChartType.BAR).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);
    const chart = await prisma.chart.create({
      data: { projectId: parsed.projectId, name: parsed.name, type: parsed.type ?? ChartType.BAR },
      select: { id: true },
    });
    return NextResponse.json(chart, { status: 201 });
  } catch (e: any) {
    return new NextResponse(e.message || "Invalid payload", { status: 400 });
  }
}


