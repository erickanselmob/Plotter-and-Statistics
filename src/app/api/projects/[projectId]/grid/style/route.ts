import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const body = await req.json();
  const rowKey: string | undefined = body?.rowKey;
  const style: any = body?.style ?? {};
  const reset: boolean = !!body?.reset;
  const resetAll: boolean = !!body?.resetAll;
  if (resetAll) {
    await prisma.projectGrid.update({ where: { projectId }, data: { rowStyles: {} } });
    return NextResponse.json({ ok: true, rowStyles: {} });
  }
  if (!rowKey) {
    // Update default style for all plots
    await prisma.projectGrid.update({ where: { projectId }, data: { defaultStyle: style } });
    return NextResponse.json({ ok: true, defaultStyle: style });
  } else {
    const existing = await prisma.projectGrid.findUnique({ where: { projectId }, select: { rowStyles: true } });
    const rowStyles = (existing?.rowStyles as any) ?? {};
    if (reset) {
      delete rowStyles[rowKey];
    } else {
      rowStyles[rowKey] = { ...(rowStyles[rowKey] ?? {}), ...style };
    }
    await prisma.projectGrid.update({ where: { projectId }, data: { rowStyles } });
    return NextResponse.json({ ok: true, rowStyles });
  }
}


