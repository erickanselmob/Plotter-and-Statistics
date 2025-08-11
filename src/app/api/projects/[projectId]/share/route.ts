import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  // @ts-ignore
  const token: any = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const ownerEmail = token?.email as string | undefined;
  if (!ownerEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const targetEmail = String(body?.email || "").toLowerCase();
  if (!targetEmail) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { user: { select: { email: true } } } });
  if (!project || project.user.email?.toLowerCase() !== ownerEmail.toLowerCase()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const target = await prisma.user.findUnique({ where: { email: targetEmail } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  await prisma.projectShare.upsert({
    where: { projectId_userId: { projectId: project.id, userId: target.id } },
    update: {},
    create: { projectId: project.id, userId: target.id },
  });
  return NextResponse.json({ ok: true });
}


