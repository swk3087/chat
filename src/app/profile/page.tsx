// src/app/profile/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) return <div className="p-4">로그인이 필요합니다.</div>;
  const user = await prisma.user.findUnique({
    where: { email: session.user!.email! }
  });
  return <ProfileForm user={user} />;
}

