
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  const msg = await prisma.message.findUnique({ where: { id: params.id } });
  if (!me || !msg || msg.senderId !== me.id) return NextResponse.json({}, { status: 403 });
  const elapsed = Date.now() - new Date(msg.createdAt).getTime();
  if (elapsed > 60 * 1000 || msg.isDeleted) return NextResponse.json({ message: "delete window closed" }, { status: 409 });
  const updated = await prisma.message.update({ where: { id: msg.id }, data: { isDeleted: true, deletedAt: new Date(), body: "" } });
  await pusherServer.trigger(`conversation-${msg.conversationId}`, "message:delete", updated);
  return NextResponse.json(updated);
}
