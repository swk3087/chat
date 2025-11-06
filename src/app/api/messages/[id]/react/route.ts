// src/app/api/messages/[id]/react/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 });
  const { type } = await req.json();
  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  const msg = await prisma.message.findUnique({ where: { id: params.id }, include: { reactions: true } });
  if (!me || !msg) return NextResponse.json({}, { status: 404 });

  const existing = await prisma.reaction.findUnique({
    where: { messageId_userId_type: { messageId: msg.id, userId: me.id, type } }
  });
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { messageId: msg.id, userId: me.id, type } });
  }

  const refreshed = await prisma.message.findUnique({
    where: { id: msg.id },
    include: { reactions: true }
  });
  await pusherServer.trigger(`conversation-${msg.conversationId}`, "reaction:toggle", {
    messageId: msg.id,
    reactions: refreshed!.reactions
  });
  return NextResponse.json({ ok: true });
}

