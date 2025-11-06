// src/app/chats/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ChatRoom from "@/components/ChatRoom";

export default async function ChatRoomPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return <div className="p-4">로그인이 필요합니다.</div>;

  const me = await prisma.user.findUnique({ where: { email: session.user!.email! } });
  const convo = await prisma.conversation.findUnique({ where: { id: params.id } });
  if (!convo || !me || (convo.aId !== me.id && convo.bId !== me.id)) {
    return <div className="p-4">권한이 없습니다.</div>;
  }

  const pageSize = 30;

  // DB에서 Date로 온 값을 클라이언트용 ISO string으로 직렬화
  const initialDb = await prisma.message.findMany({
    where: { conversationId: convo.id },
    orderBy: { createdAt: "asc" },
    take: pageSize,
  });

  const initial = initialDb.map((m) => ({
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    editedAt: m.editedAt ? m.editedAt.toISOString() : null,
    deletedAt: m.deletedAt ? m.deletedAt.toISOString() : null,
    isDeleted: m.isDeleted,
    // reactions는 클라에서 optional이라 생략 가능 (필요하면 include: { reactions: true }로 조회)
  }));

  const partnerId = convo.aId === me.id ? convo.bId : convo.aId;
  const theirLastSeenAt = convo.aId === me.id ? convo.bLastSeenAt : convo.aLastSeenAt;

  return (
    <ChatRoom
      convoId={convo.id}
      meId={me.id}
      partnerId={partnerId}
      partnerSeenAt={theirLastSeenAt ? theirLastSeenAt.toISOString() : null}
      initialMessages={initial}
      pageSize={pageSize}
    />
  );
}

