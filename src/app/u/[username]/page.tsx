// src/app/u/[username]/page.tsx
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function PublicProfile({ params }: { params: { username: string } }) {
  const session = await getServerSession(authOptions);
  const profile = await prisma.user.findUnique({ where: { username: params.username } });
  if (!profile) return <div className="p-4">존재하지 않는 프로필입니다.</div>;

  const self = session?.user?.email
    ? await prisma.user.findUnique({ where: { email: session.user!.email! } })
    : null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4">
        <div className="text-lg font-semibold">{profile.displayName ?? profile.username}</div>
        <div className="text-sm text-muted-foreground">@{profile.username}</div>
      </div>
      {!self ? (
        <Link
          href="/api/auth/signin"
          className="block rounded-2xl bg-primary px-4 py-2 text-center text-primary-foreground"
        >
          Google로 로그인하고 대화 시작
        </Link>
      ) : self.id === profile.id ? (
        <div className="text-sm text-muted-foreground">내 프로필입니다.</div>
      ) : (
        <form action={createOrOpen}>
          <input type="hidden" name="targetId" value={profile.id} />
          <button className="w-full rounded-2xl bg-primary px-4 py-2 text-primary-foreground">대화 시작</button>
        </form>
      )}
    </div>
  );
}

async function createOrOpen(formData: FormData) {
  "use server";
  const { prisma } = await import("@/lib/prisma");
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return;
  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  const targetId = String(formData.get("targetId"));
  if (!me) return;
  const [aId, bId] = [me.id, targetId].sort();
  const convo = await prisma.conversation.upsert({
    where: { aId_bId: { aId, bId } },
    create: { aId, bId },
    update: {}
  });
  return (global as any).redirect?.(`/chats/${convo.id}`) ?? null;
}

