"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="rounded-2xl border px-3 py-2 text-xs text-muted-foreground">로딩…</div>;
  }

  if (!session) {
    const callbackUrl =
      typeof window !== "undefined" ? window.location.pathname + window.location.search : "/profile";
    return (
      <button
        onClick={() => signIn("google", { callbackUrl })}
        className="rounded-2xl border px-3 py-2 text-sm shadow-sm hover:bg-muted"
      >
        Google 로그인
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {session.user?.image && (
        <Image src={session.user.image} alt="me" width={24} height={24} className="rounded-full" />
      )}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-2xl border px-3 py-2 text-sm shadow-sm hover:bg-muted"
      >
        로그아웃
      </button>
    </div>
  );
}
