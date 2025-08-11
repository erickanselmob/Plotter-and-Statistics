import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { isAdminEmail } from "@/lib/admin";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  // @ts-ignore
  const token: any = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const adminEmail = token?.email as string | undefined;
  if (!adminEmail || !isAdminEmail(adminEmail)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const userId = String(body?.userId || "");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  // Cascade deletes via Prisma relations (accounts/sessions/projects/feedbacks)
  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}


