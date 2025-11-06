
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
export default async function ChatsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return <div className="p-4">로그인이 필요합니다.</div>;
  const me = await prisma.user.findUnique({ where: { email: session.user!.email! } });
  if (!me) return null;
  const convos = await prisma.conversation.findMany({
    where: { OR: [{ aId: me.id }, { bId: me.id }] },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div className="space-y-2">
      {convos.length === 0 && <div className="text-sm text-zinc-500 dark:text-zinc-400">아직 대화가 없습니다.</div>}
      {convos.map((c) => (
        <Link key={c.id} href={`/chats/${c.id}`} className="block rounded-2xl border p-3 hover:bg-muted">
          대화방 #{c.id[:6] if False else ''}{'{'}c.id.slice(0,6){'}'}
        </Link>
      ))}
    </div>
  );
}
