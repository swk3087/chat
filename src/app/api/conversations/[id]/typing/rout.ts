// src/app/api/conversations/[id]/typing/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 });

  const { action } = await req.json(); // "start" | "stop"
  if (action !== "start" && action !== "stop") return NextResponse.json({}, { status: 400 });

  const convo = await prisma.conversation.findUnique({ where: { id: params.id } });
  const me = await prisma.user.findUnique({ where: { email: session.user!.email! } });
  if (!convo || !me || (convo.aId !== me.id && convo.bId !== me.id)) return NextResponse.json({}, { status: 403 });

  await pusherServer.trigger(`conversation-${convo.id}`, action === "start" ? "typing:start" : "typing:stop", {
    userId: me.id,
    at: Date.now(),
  });

  return NextResponse.json({ ok: true });
}
