// src/app/page.tsx
import NavTabs from "@/components/NavTabs";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Chat</h1>
        <ThemeToggle />
      </div>
      <NavTabs />
      <p className="text-sm text-muted-foreground">프로필을 설정하고 채팅을 시작하세요.</p>
    </main>
  );
}

