import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);
    const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existing) {
      return new NextResponse("Email already in use", { status: 400 });
    }
    const passwordHash = await hash(parsed.password, 10);
    await prisma.user.create({
      data: { name: parsed.name, email: parsed.email, passwordHash },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return new NextResponse(e.message || "Invalid payload", { status: 400 });
  }
}



