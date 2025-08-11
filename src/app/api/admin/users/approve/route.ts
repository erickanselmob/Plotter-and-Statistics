import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { isAdminEmail } from "@/lib/admin";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  // @ts-ignore - next-auth getToken accepts the Web Request in App Router
  const token: any = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const adminEmail = token?.email as string | undefined;
  if (!adminEmail || !isAdminEmail(adminEmail)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const userId = String(body?.userId || "");
  const approved = Boolean(body?.approved ?? true);
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  await prisma.user.update({ where: { id: userId }, data: { approved } });
  return NextResponse.json({ ok: true });
}


