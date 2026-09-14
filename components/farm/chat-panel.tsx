"use client";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Dialog } from "./dialog";
import { Icon } from "./icon";
import type { FarmChatSnapshot } from "../../lib/farm/chat-context";

type Message = { id: string; role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; createdAt: number; updatedAt: number; messages: Message[] };
function keyFor(snapshot: FarmChatSnapshot) { return `kanshan-chat-${snapshot.mode}-${snapshot.displayName || "guest"}`; }
function makeConversation(): Conversation { const now = Date.now(); return { id: crypto.randomUUID(), title: "和刘看山聊聊", createdAt: now, updatedAt: now, messages: [{ id: crypto.randomUUID(), role: "assistant", content: "我记得这片田里的收获，也愿意听你说说回顾时想到的事情。先说明一下：我看不到知乎原帖全文，只能知道农场里的统计，以及你愿意告诉我的内容。" }] }; }

export function ChatPanel({ snapshot, getSnapshot, onClose }: { snapshot: FarmChatSnapshot; getSnapshot?: () => FarmChatSnapshot; onClose: () => void }) {
  const storageKey = useMemo(() => keyFor(snapshot), [snapshot.mode, snapshot.displayName]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const stickToBottom = useRef(true);
  useEffect(() => {
    try { const raw = localStorage.getItem(storageKey); const loaded = raw ? JSON.parse(raw) as Conversation[] : []; const list = Array.isArray(loaded) && loaded.length ? loaded : [makeConversation()]; setConversations(list); setActiveId(list[0].id); } catch { const first = makeConversation(); setConversations([first]); setActiveId(first.id); }
  }, [storageKey]);
  useEffect(() => { if (conversations.length) localStorage.setItem(storageKey, JSON.stringify(conversations)); }, [conversations, storageKey]);
  const active = conversations.find(c => c.id === activeId) || conversations[0];
  useEffect(() => {
    stickToBottom.current = true;
    const node = messagesRef.current;
    if (node) requestAnimationFrame(() => { node.scrollTop = node.scrollHeight; });
  }, [activeId]);
  useEffect(() => {
    const node = messagesRef.current;
    if (node && stickToBottom.current) requestAnimationFrame(() => { node.scrollTop = node.scrollHeight; });
  }, [active?.messages.length, sending]);
  function newChat() { const next = makeConversation(); setConversations(old => [next, ...old]); setActiveId(next.id); setDraft(""); }
  function deleteChat(id: string) { setConversations(old => { const next = old.filter(c => c.id !== id); if (!next.length) { const fresh = makeConversation(); setActiveId(fresh.id); return [fresh]; } if (id === activeId) setActiveId(next[0].id); return next; }); }
  async function send(text = draft) {
    if (!active || !text.trim() || sending) return;
    const content = text.trim();
    const user: Message = { id: crypto.randomUUID(), role: "user", content };
    const history = active.messages.map(({ role, content: value }) => ({ role, content: value }));
    setConversations(old => old.map(c => c.id === active.id ? { ...c, title: c.messages.length <= 1 ? content.slice(0, 20) : c.title, updatedAt: Date.now(), messages: [...c.messages, user] } : c));
    setDraft(""); setSending(true);
    try {
      const response = await fetch("/api/chat", { cache: "no-store", method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: content, history, snapshot: getSnapshot ? getSnapshot() : snapshotRef.current }) });
      const data = await response.json() as { message?: string; error?: string };
      const answer: Message = { id: crypto.randomUUID(), role: "assistant", content: response.ok && data.message ? data.message : (data.error || "刘看山暂时没有回应，请稍后再试。") };
      setConversations(old => old.map(c => c.id === active.id ? { ...c, updatedAt: Date.now(), messages: [...c.messages, answer] } : c));
    } catch { setConversations(old => old.map(c => c.id === active.id ? { ...c, messages: [...c.messages, { id: crypto.randomUUID(), role: "assistant", content: "和刘看山的连接暂时断开了，请稍后再试。" }] } : c)); }
    finally { setSending(false); }
  }
  function handleComposerKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }
  if (!active) return null;
  return <Dialog title="和刘看山聊聊" eyebrow="农场里的小北极狐" onClose={onClose} wide onTitleClick={() => setShowConversations(value => !value)} titleExpanded={showConversations} headerActions={<button className="primary chat-new-top" onClick={newChat}><Icon name="spark" />新建空对话</button>}>
    <div className={"chat-layout " + (showConversations ? "chat-layout-with-sidebar" : "chat-layout-collapsed")}><aside id="chat-conversation-list" className={"chat-sidebar " + (!showConversations ? "chat-sidebar-hidden" : "")}><div className="chat-list">{conversations.map(c => <div key={c.id} className={"chat-list-item " + (c.id === active.id ? "active" : "")}><button onClick={() => setActiveId(c.id)}>{c.title}</button><button className="chat-delete" onClick={() => deleteChat(c.id)} aria-label={`删除${c.title}`}><Icon name="close" /></button></div>)}</div></aside><section className="chat-main"><div className="chat-messages" ref={messagesRef} onScroll={e => { const node = e.currentTarget; stickToBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 48; }}>{active.messages.map(m => <div key={m.id} className={"chat-message " + m.role}><span>{m.role === "assistant" ? "刘看山" : "你"}</span><p>{m.content}</p></div>)}{sending && <div className="chat-message assistant"><span>刘看山</span><p className="chat-thinking">正在想一想…</p></div>}</div><div className="chat-shortcuts">{["看看我的农场", "我回顾过多少收藏？", "我想说说刚才想到的事"].map(q => <button key={q} className="secondary" onClick={() => void send(q)} disabled={sending}>{q}</button>)}</div><form className="chat-composer" onSubmit={e => { e.preventDefault(); void send(); }}><textarea aria-label="和刘看山说点什么" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={handleComposerKeyDown} placeholder="把回顾时想到的事情告诉我…" rows={1} /><button className="primary" disabled={!draft.trim() || sending}><Icon name="arrow" />{sending ? "思考中" : "发送"}</button></form></section></div>
  </Dialog>;
}









