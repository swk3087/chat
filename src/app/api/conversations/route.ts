// src/app/api/conversations/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 });
  const { targetUserId } = await req.json();
  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me || !targetUserId) return NextResponse.json({}, { status: 400 });
  const [aId, bId] = [me.id, targetUserId].sort();
  const convo = await prisma.conversation.upsert({
    where: { aId_bId: { aId, bId } },
    update: {},
    create: { aId, bId }
  });
  return NextResponse.json(convo);
}

