
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function NavTabs() {
  const path = usePathname();
  const Tab = ({ href, children }: any) => (
    <Link
      href={href}
      className={`flex-1 rounded-xl px-3 py-2 text-center text-sm transition-all ${
        path === href ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
      }`}
    >
      {children}
    </Link>
  );
  return (
    <div className="sticky top-2 z-10 mb-3 flex gap-2">
      <Tab href="/profile">프로필</Tab>
      <Tab href="/chats">채팅</Tab>
    </div>
  );
}
