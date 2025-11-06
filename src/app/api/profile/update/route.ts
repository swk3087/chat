// src/app/api/profile/update/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ ok: false }, { status: 401 });
  const { displayName, username, image } = await req.json();

  if (!username || !/^[a-z0-9_-]{3,20}$/.test(username))
    return NextResponse.json({ message: "username invalid" }, { status: 400 });

  const existing = await prisma.user.findFirst({
    where: { username, NOT: { email: session.user.email } }
  });
  if (existing) return NextResponse.json({ message: "username taken" }, { status: 409 });

  await prisma.user.update({
    where: { email: session.user.email },
    data: { displayName, username, image }
  });
  return NextResponse.json({ ok: true });
}

