// src/app/api/messages/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

// --- 기존 POST(생성) 그대로 유지 ---
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ ok: false }, { status: 401 });
  const { conversationId, body } = await req.json();
  const me = await prisma.user.findUnique({ where: { email: session.user!.email! } });
  if (!me || !conversationId || !body?.trim()) return NextResponse.json({}, { status: 400 });
  const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!convo || (convo.aId !== me.id && convo.bId !== me.id)) return NextResponse.json({}, { status: 403 });

  const msg = await prisma.message.create({ data: { conversationId, senderId: me.id, body: body.trim() } });
  await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  await pusherServer.trigger(`conversation-${conversationId}`, "message:new", msg);
  return NextResponse.json(msg);
}

// ✅ GET: 이전 메시지 페이지네이션 (cursor=ISO or number, take=30 기본)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 });

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId")!;
  const cursor = searchParams.get("cursor"); // createdAt ISO 문자열
  const take = Math.min(Number(searchParams.get("take") ?? 30), 100);

  const me = await prisma.user.findUnique({ where: { email: session.user!.email! } });
  if (!me || !conversationId) return NextResponse.json({}, { status: 400 });
  const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!convo || (convo.aId !== me.id && convo.bId !== me.id)) return NextResponse.json({}, { status: 403 });

  const where = cursor
    ? { conversationId, createdAt: { lt: new Date(cursor) } }
    : { conversationId };

  const items = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
  });

  const sortedAsc = items.slice().reverse(); // 클라에서 위에 끼워넣기 쉬우라고 오름차순으로 반환
  const nextCursor = items.length === take ? sortedAsc[0]?.createdAt?.toISOString() : null;

  return NextResponse.json({ items: sortedAsc, nextCursor });
}

