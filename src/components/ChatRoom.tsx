
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { getPusherClient } from "@/lib/pusher";
import axios from "axios";
import { format } from "date-fns";
export default function ChatRoom({ convoId, meId, initialMessages }: any) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`conversation-${convoId}`);
    channel.bind("message:new", (m: any) => setMessages((prev: any) => [...prev, m]));
    channel.bind("message:edit", (m: any) => setMessages((prev: any) => prev.map((x: any) => (x.id === m.id ? m : x))));
    channel.bind("message:delete", (m: any) => setMessages((prev: any) => prev.map((x: any) => (x.id === m.id ? m : x))));
    channel.bind("reaction:toggle", (payload: any) => {
      setMessages((prev: any) => prev.map((x: any) => (x.id === payload.messageId ? { ...x, reactions: payload.reactions } : x)));
    });
    return () => { channel.unsubscribe(); pusher.disconnect(); };
  }, [convoId]);
  const send = useCallback(async () => {
    if (!text.trim()) return;
    const body = text;
    setText("");
    await axios.post("/api/messages", { conversationId: convoId, body });
  }, [text, convoId]);
  return (
    <div className="flex h-[80vh] flex-col gap-2">
      <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl border p-3">
        {messages.map((m: any) => (<MessageItem key={m.id} m={m} meId={meId} />))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={(e)=>setText(e.target.value)} onKeyDown={(e)=> e.key === "Enter" && send()}
          placeholder="메시지 입력" className="flex-1 rounded-2xl border px-3 py-2" />
        <button onClick={send} className="rounded-2xl bg-primary px-4 py-2 text-primary-foreground">전송</button>
      </div>
    </div>
  );
}
function MessageItem({ m, meId }: any) {
  const isMine = m.senderId === meId;
  const canEdit = !m.isDeleted && Date.now() - new Date(m.createdAt).getTime() < 5 * 60 * 1000;
  const canDelete = !m.isDeleted && Date.now() - new Date(m.createdAt).getTime() < 60 * 1000;
  const hearts = m.reactions?.filter((r: any) => r.type === "HEART").length ?? 0;
  const edit = async () => {
    const body = prompt("수정할 메시지", m.body);
    if (body && body.trim()) await axios.patch(`/api/messages/${m.id}/edit`, { body });
  };
  const del = async () => {
    if (confirm("메시지를 삭제할까요? (1분 이내만 가능)")) await axios.delete(`/api/messages/${m.id}/delete`);
  };
  const toggleHeart = async () => { await axios.post(`/api/messages/${m.id}/react`, { type: "HEART" }); };
  return (
    <div onDoubleClick={toggleHeart}
      className={`group max-w-[85%] rounded-2xl px-3 py-2 ${isMine ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}>
      <div className="whitespace-pre-wrap break-words text-sm">
        {m.isDeleted ? <span className="italic text-zinc-500 dark:text-zinc-400">삭제된 메시지</span> : m.body}
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] opacity-70">
        <span>{format(new Date(m.createdAt), "HH:mm")}{m.editedAt ? " · 수정됨" : ""}</span>
        <div className="hidden gap-2 group-hover:flex">
          {isMine && canEdit && <button onClick={edit}>수정</button>}
          {isMine && canDelete && <button onClick={del}>삭제</button>}
          <button onClick={toggleHeart}>❤️ {hearts}</button>
        </div>
      </div>
    </div>
  );
}
