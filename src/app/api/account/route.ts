import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { compare, hash } from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  // @ts-ignore - app router Request is fine
  const token: any = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name: string | undefined = typeof body?.name === "string" ? body.name.trim() : undefined;
  const currentPassword: string | undefined = body?.currentPassword;
  const newPassword: string | undefined = body?.newPassword;

  const data: any = {};
  if (name && name.length > 0) data.name = name;

  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: "Current password required" }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) return NextResponse.json({ error: "No password set" }, { status: 400 });
    const ok = await compare(currentPassword, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Invalid current password" }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "Password too short" }, { status: 400 });
    data.passwordHash = await hash(newPassword, 10);
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ ok: true });

  await prisma.user.update({ where: { id: userId }, data });
  return NextResponse.json({ ok: true });
}


