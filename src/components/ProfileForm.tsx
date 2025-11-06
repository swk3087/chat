
"use client";
import { useState, useTransition } from "react";
import Image from "next/image";
import axios from "axios";
const defaultAvatars = ["/avatars/1.png","/avatars/2.png","/avatars/3.png","/avatars/4.png"];
export default function ProfileForm({ user }: any) {
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [image, setImage] = useState(user?.image ?? defaultAvatars[0]);
  const [isPending, startTransition] = useTransition();
  const onSave = () => {
    startTransition(async () => {
      await axios.post("/api/profile/update", { displayName, username, image });
      window.location.href = `/u/${username}`;
    });
  };
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm">닉네임</label>
        <input className="w-full rounded-xl border bg-background px-3 py-2"
          value={displayName} onChange={(e)=>setDisplayName(e.target.value)} placeholder="홍길동" />
      </div>
      <div>
        <label className="mb-1 block text-sm">프로필 URL (영문/숫자)</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">/u/</span>
          <input className="flex-1 rounded-xl border bg-background px-3 py-2"
            value={username}
            onChange={(e)=>setUsername(e.target.value.replace(/[^a-z0-9_\-]/g, ""))}
            placeholder="gildong" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm">프로필 사진</label>
        <div className="flex gap-3 overflow-x-auto">
          {defaultAvatars.map((src)=>(
            <button key={src} onClick={()=>setImage(src)} className={`rounded-2xl border p-1 ${image===src?"ring-2 ring-black dark:ring-white":""}`}>
              <Image src={src} alt="avatar" width={64} height={64} className="rounded-2xl" />
            </button>
          ))}
        </div>
      </div>
      <button onClick={onSave} disabled={isPending} className="w-full rounded-2xl bg-primary px-4 py-2 text-primary-foreground shadow">
        저장
      </button>
    </div>
  );
}
