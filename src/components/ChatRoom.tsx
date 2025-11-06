// src/components/ChatRoom.tsx
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { getPusherClient } from "@/lib/pusher";
import axios from "axios";
import { format } from "date-fns";

type Msg = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  isDeleted: boolean;
  reactions?: Array<{ type: "HEART"; userId: string }>;
};

export default function ChatRoom({
  convoId,
  meId,
  partnerId,
  partnerSeenAt: initialPartnerSeenAt,
  initialMessages,
  pageSize = 30,
}: {
  convoId: string;
  meId: string;
  partnerId: string;
  partnerSeenAt: string | null;
  initialMessages: Msg[];
  pageSize?: number;
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null); // 가장 오래된 createdAt
  const [text, setText] = useState("");
  const [partnerSeenAt, setPartnerSeenAt] = useState<string | null>(initialPartnerSeenAt);
  const [partnerTyping, setPartnerTyping] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  // 최초 cursor 설정
  useEffect(() => {
    if (messages.length) {
      setCursor(messages[0].createdAt); // 제일 오래된 메시지의 createdAt
    } else {
      setHasMore(false);
    }
  }, []); // 최초 1회

  // pusher 실시간 수신
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`conversation-${convoId}`);

    channel.bind("message:new", (m: Msg) => {
      setMessages((prev) => [...prev, m]);
      // 내가 아닌 상대 메시지면 '읽음 업데이트' 트리거를 위해 잠시 후 seen 호출
      setTimeout(postSeen, 150);
    });

    channel.bind("message:edit", (m: Msg) => {
      setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
    });

    channel.bind("message:delete", (m: Msg) => {
      setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
    });

    channel.bind("reaction:toggle", (payload: any) => {
      setMessages((prev) =>
        prev.map((x) => (x.id === payload.messageId ? { ...x, reactions: payload.reactions } : x)),
      );
    });

    // ✅ 읽음 수신
    channel.bind("seen:update", (payload: { userId: string; at: string }) => {
      if (payload.userId === partnerId) setPartnerSeenAt(payload.at);
    });

    // ✅ 타이핑 수신
    let typingTimer: any = null;
    channel.bind("typing:start", (payload: { userId: string }) => {
      if (payload.userId === partnerId) {
        setPartnerTyping(true);
        // 안전 타임아웃(3초 후 자동 꺼짐)
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => setPartnerTyping(false), 3000);
      }
    });
    channel.bind("typing:stop", (payload: { userId: string }) => {
      if (payload.userId === partnerId) {
        setPartnerTyping(false);
      }
    });

    return () => {
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [convoId, partnerId]);

  // 스크롤 하단으로 자동 이동 (새 메시지)
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  // ✅ 내가 보고 있음 → 주기적으로 seen 전송 (과도 호출 방지: 2초 디바운스)
  const seenTimer = useRef<NodeJS.Timeout | null>(null);
  const postSeen = useCallback(() => {
    if (seenTimer.current) clearTimeout(seenTimer.current);
    seenTimer.current = setTimeout(async () => {
      try {
        await axios.post(`/api/conversations/${convoId}/seen`);
      } catch {}
    }, 2000);
  }, [convoId]);

  useEffect(() => {
    postSeen();
    // 페이지 떠날 때 마지막 seen
    const onBeforeUnload = () => postSeen();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [postSeen]);

  // ✅ 무한 스크롤: 상단 근처에서 더 불러오기
  const onScroll = async () => {
    const el = listRef.current!;
    if (!el || loadingMore || !hasMore) return;
    if (el.scrollTop < 80) {
      setLoadingMore(true);
      const prevHeight = el.scrollHeight;
      try {
        const res = await axios.get("/api/messages", {
          params: { conversationId: convoId, cursor, take: pageSize },
        });
        const { items, nextCursor } = res.data as { items: Msg[]; nextCursor: string | null };
        if (items.length === 0) setHasMore(false);
        else {
          setMessages((prev) => [...items, ...prev]);
          setCursor(nextCursor);
          // 스크롤 위치 보정(로딩 전 위치 유지)
          requestAnimationFrame(() => {
            const newHeight = el.scrollHeight;
            el.scrollTop = newHeight - prevHeight;
          });
        }
      } finally {
        setLoadingMore(false);
      }
    }
  };

  // 전송
  const send = async () => {
    if (!text.trim()) return;
    const body = text;
    setText("");
    await axios.post("/api/messages", { conversationId: convoId, body });
  };

  // 입력 중(타이핑) 신호 (디바운스 1.2s)
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const notifyTyping = async (state: "start" | "stop") => {
    try {
      await axios.post(`/api/conversations/${convoId}/typing`, { action: state });
    } catch {}
  };
  const onInput = (v: string) => {
    setText(v);
    // start 즉시, stop은 1.2s 후
    notifyTyping("start");
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => notifyTyping("stop"), 1200);
  };

  // ✅ 읽음 배지: 내 마지막 메시지 시간이 상대 lastSeenAt 이전/동일이면 "읽음"
  const myLastMessageAt = (() => {
    const own = [...messages].reverse().find((m) => m.senderId === meId && !m.isDeleted);
    return own ? new Date(own.createdAt).getTime() : null;
  })();
  const partnerSeenTS = partnerSeenAt ? new Date(partnerSeenAt).getTime() : 0;
  const showRead = myLastMessageAt && partnerSeenTS >= myLastMessageAt;

  return (
    <div className="flex h-[80vh] flex-col gap-2">
      <div
        ref={listRef}
        onScroll={onScroll}
        className="flex-1 space-y-2 overflow-y-auto rounded-2xl border p-3"
      >
        {loadingMore && hasMore && (
          <div className="py-1 text-center text-xs text-muted-foreground">이전 메시지 불러오는 중…</div>
        )}
        {messages.map((m) => (
          <MessageItem key={m.id} m={m} meId={meId} />
        ))}
        {partnerTyping && (
          <div className="mt-1 text-center text-[11px] italic text-muted-foreground">상대가 입력 중…</div>
        )}
      </div>

      <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
        <div>{showRead ? "읽음" : " "}</div>
        {/* 마지막 메시지 시간 등 보조 정보 원하면 여기 */}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="메시지 입력"
          className="flex-1 rounded-2xl border px-3 py-2"
        />
        <button onClick={send} className="rounded-2xl bg-primary px-4 py-2 text-primary-foreground">
          전송
        </button>
      </div>
    </div>
  );
}

function MessageItem({ m, meId }: { m: Msg; meId: string }) {
  const isMine = m.senderId === meId;
  const canEdit = !m.isDeleted && Date.now() - new Date(m.createdAt).getTime() < 5 * 60 * 1000;
  const canDelete = !m.isDeleted && Date.now() - new Date(m.createdAt).getTime() < 60 * 1000;
  const hearts = m.reactions?.filter((r) => r.type === "HEART").length ?? 0;

  const edit = async () => {
    const body = prompt("수정할 메시지", m.body);
    if (body && body.trim()) await axios.patch(`/api/messages/${m.id}/edit`, { body });
  };
  const del = async () => {
    if (confirm("메시지를 삭제할까요? (1분 이내만 가능)")) await axios.delete(`/api/messages/${m.id}/delete`);
  };
  const toggleHeart = async () => {
    await axios.post(`/api/messages/${m.id}/react`, { type: "HEART" });
  };

  return (
    <div
      onDoubleClick={toggleHeart}
      className={`group max-w-[85%] rounded-2xl px-3 py-2 ${
        isMine ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
      }`}
    >
      <div className="whitespace-pre-wrap break-words text-sm">
        {m.isDeleted ? <span className="italic text-muted-foreground">삭제된 메시지</span> : m.body}
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] opacity-70">
        <span>
          {format(new Date(m.createdAt), "HH:mm")}
          {m.editedAt ? " · 수정됨" : ""}
        </span>
        <div className="hidden gap-2 group-hover:flex">
          {isMine && canEdit && <button onClick={edit}>수정</button>}
          {isMine && canDelete && <button onClick={del}>삭제</button>}
          <button onClick={toggleHeart}>❤️ {hearts}</button>
        </div>
      </div>
    </div>
  );
}

