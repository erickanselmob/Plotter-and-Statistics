import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const token: any = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const typeRaw = String(body?.type || "").toUpperCase();
  const type = (typeRaw === "BUG" ? "BUG" : "SUGGESTION") as any;
  const title = String(body?.title || "").slice(0, 200).trim();
  const message = String(body?.message || "").trim();
  if (!title || !message) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const fb = await prisma.feedback.create({ data: { userId: token.id as string, type, title, message } });
  return NextResponse.json({ ok: true, id: fb.id });
}


