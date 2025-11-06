
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ChatRoom from "@/components/ChatRoom";
export default async function ChatRoomPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return <div className="p-4">로그인이 필요합니다.</div>;
  const me = await prisma.user.findUnique({ where: { email: session.user!.email! } });
  const convo = await prisma.conversation.findUnique({ where: { id: params.id } });
  if (!convo || !me || (convo.aId !== me.id && convo.bId !== me.id)) return <div className="p-4">권한이 없습니다.</div>;
  const messages = await prisma.message.findMany({ where: { conversationId: convo.id }, orderBy: { createdAt: "asc" }, take: 50 });
  return <ChatRoom convoId={convo.id} meId={me.id} initialMessages={messages} />;
}
