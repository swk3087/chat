
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ ok: false }, { status: 401 });
  const { conversationId, body } = await req.json();
  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me || !conversationId || !body?.trim()) return NextResponse.json({}, { status: 400 });
  const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!convo || (convo.aId !== me.id && convo.bId !== me.id)) return NextResponse.json({}, { status: 403 });
  const msg = await prisma.message.create({ data: { conversationId, senderId: me.id, body: body.trim() } });
  await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  await pusherServer.trigger(`conversation-${conversationId}`, "message:new", msg);
  return NextResponse.json(msg);
}
