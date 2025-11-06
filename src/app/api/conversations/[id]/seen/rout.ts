// src/app/api/conversations/[id]/seen/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 });

  const convo = await prisma.conversation.findUnique({ where: { id: params.id } });
  const me = await prisma.user.findUnique({ where: { email: session.user!.email! } });
  if (!convo || !me || (convo.aId !== me.id && convo.bId !== me.id)) return NextResponse.json({}, { status: 403 });

  const now = new Date();
  const data =
    convo.aId === me.id ? { aLastSeenAt: now } : { bLastSeenAt: now };

  const updated = await prisma.conversation.update({ where: { id: convo.id }, data });
  await pusherServer.trigger(`conversation-${convo.id}`, "seen:update", {
    userId: me.id,
    at: now.toISOString(),
  });

  return NextResponse.json({ ok: true, at: now.toISOString() });
}
