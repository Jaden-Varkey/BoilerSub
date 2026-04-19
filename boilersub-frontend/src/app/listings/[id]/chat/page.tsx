"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthProvider";
import { apiClient } from "@/lib/apiClient";
import type { ChatMessage, Listing, PublicUser } from "@/lib/types";

function bytesToLabel(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function buildConversationKey(listingId: string, userAId: string, userBId: string) {
  const [a, b] = [userAId, userBId].sort();
  return `${listingId}__${a}__${b}`;
}

function ChatContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const peerId = searchParams.get("with") || searchParams.get("peer") || "";
  const { user, status } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [peer, setPeer] = useState<PublicUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const conversationKey = useMemo(() => {
    if (!user?.id || !peerId) return "";
    return buildConversationKey(params.id, user.id, peerId);
  }, [params.id, peerId, user?.id]);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  useEffect(() => {
    if (!peerId) {
      setError("Missing lister id.");
      return;
    }

    let active = true;
    async function loadContext() {
      try {
        const loadedListing = await apiClient.listings.getById(params.id);
        const loadedPeer = await apiClient.users.getById(peerId);
        if (!active) return;
        setListing(loadedListing);
        setPeer(loadedPeer);
      } catch (nextError) {
        if (!active) return;
        setError(nextError instanceof Error ? nextError.message : "Failed to load chat context");
      }
    }
    void loadContext();
    return () => {
      active = false;
    };
  }, [params.id, peerId]);

  useEffect(() => {
    if (!conversationKey || !user) return;

    let active = true;
    async function refreshMessages() {
      try {
        const nextMessages = await apiClient.chats.getMessages(conversationKey, 250);
        if (!active) return;
        setMessages(nextMessages);
        setError(null);
      } catch (nextError) {
        if (!active) return;
        setError(nextError instanceof Error ? nextError.message : "Failed to refresh messages");
      }
    }

    void refreshMessages();
    const interval = window.setInterval(() => {
      void refreshMessages();
    }, 2500);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [conversationKey, user]);

  useEffect(() => {
    if (!editingMessageId) {
      scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, editingMessageId]);

  async function send() {
    if (!user || !listing || !peer) return;
    if (!input.trim()) return;

    try {
      await apiClient.chats.sendMessage({
        listing_id: listing.id,
        recipient_user_id: peer.id,
        text: input.trim(),
        attachments: [],
      });
      setInput("");
      setMessages(await apiClient.chats.getMessages(conversationKey, 250));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to send message");
    }
  }

  async function deleteMessage(messageId: string) {
    if (!conversationKey) return;
    try {
      await apiClient.chats.deleteMessage(conversationKey, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to delete message");
    }
  }

  async function updateMessage(messageId: string, text: string) {
    if (!conversationKey || !text.trim()) return;
    try {
      await apiClient.chats.editMessage(conversationKey, messageId, text.trim());
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, text: text.trim() } : m)));
      setEditingMessageId(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to update message");
    }
  }

  function handleContextMenu(e: React.MouseEvent, message: ChatMessage, mine: boolean) {
    if (!mine) return;
    e.preventDefault();
    setContextMenu({ id: message.id, x: e.clientX, y: e.clientY });
  }

  if (status === "loading") return <main className="page-wrap"><div className="panel p-8">Loading chat…</div></main>;
  if (!user) return <main className="page-wrap"><div className="panel p-8">Please sign in to chat.</div></main>;

  return (
    <main className="mx-auto max-w-5xl px-6 pb-12 pt-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold text-[#2f2f2e]">Chat with {peer?.full_name || peer?.email || "Lister"}</h1>
        <Link className="rounded-lg bg-[#dfdcdc] px-4 py-2 text-sm font-bold text-[#2f2f2e]" href={`/listings/${params.id}`}>Back to Listing</Link>
      </div>
      {error ? <div className="mb-4 rounded-xl bg-[#ffe9df] px-4 py-3 text-sm text-[#8e2f12]">{error}</div> : null}
      
      {contextMenu && (
        <div 
          className="fixed z-50 flex items-center gap-1 rounded-lg border border-[#ece9e8] bg-white p-1 shadow-panel"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="rounded px-3 py-1 text-xs font-bold text-[#0052d0] hover:bg-[#edf4ff]"
            onClick={() => {
              const msg = messages.find(m => m.id === contextMenu.id);
              if (msg) {
                setEditingMessageId(msg.id);
                setEditText(msg.text);
              }
              setContextMenu(null);
            }}
          >
            Edit
          </button>
          <div className="h-4 w-[1px] bg-[#ece9e8]" />
          <button 
            className="rounded px-3 py-1 text-xs font-bold text-[#b92902] hover:bg-[#ffe9df]"
            onClick={() => {
              void deleteMessage(contextMenu.id);
              setContextMenu(null);
            }}
          >
            Delete
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/60 bg-white/85 shadow-panel">
        <div className="h-[62vh] overflow-y-auto p-4 transition-all" ref={scrollerRef}>
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            {messages.map((message) => {
              const mine = message.sender_user_id === user.id;
              const isEditing = editingMessageId === message.id;

              return (
                <div 
                  className={`flex transition-all duration-300 ${mine ? "justify-end" : "justify-start"}`} 
                  key={message.id}
                  onContextMenu={(e) => handleContextMenu(e, message, mine)}
                >
                  <article className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm transition-all ${mine ? "bg-[#0052d0] text-white" : "border border-[#ece9e8] bg-white text-[#2f2f2e]"}`}>
                    {isEditing ? (
                      <textarea
                        autoFocus
                        className="w-full resize-none bg-transparent outline-none"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void updateMessage(message.id, editText);
                          } else if (e.key === "Escape") {
                            setEditingMessageId(null);
                          }
                        }}
                        onBlur={() => {
                          setEditingMessageId(null);
                        }}
                        rows={1}
                      />
                    ) : (
                      <>
                        {message.text ? <p className="whitespace-pre-wrap">{message.text}</p> : null}
                        {message.attachments.length > 0 ? (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment) => (
                              <div className={`overflow-hidden rounded-xl ${mine ? "bg-white/10" : "bg-[#f6f2f0]"}`} key={attachment.id}>
                                {attachment.kind === "image" ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img alt={attachment.name} className="h-auto max-h-64 w-full object-cover" src={attachment.url} />
                                ) : null}
                                {attachment.kind === "video" ? <video className="h-auto max-h-72 w-full" controls src={attachment.url} /> : null}
                                {attachment.kind === "audio" ? <audio className="w-full p-2" controls src={attachment.url} /> : null}
                                {attachment.kind === "file" ? (
                                  <a className={`block px-3 py-2 text-sm font-semibold ${mine ? "text-white" : "text-[#2f2f2e]"}`} download={attachment.name} href={attachment.url}>
                                    📎 {attachment.name} · {bytesToLabel(attachment.size)}
                                  </a>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </>
                    )}
                  </article>
                </div>
              );
            })}
          </div>
        </div>
        <div className="border-t border-[#ece9e8] bg-white/90 p-4">
          <div className="mx-auto max-w-3xl">
            <div className="mx-auto flex max-w-3xl gap-2">
              <textarea
                className="min-h-[44px] flex-1 resize-none rounded-2xl border border-[#d8d4d2] bg-[#fbfaf9] px-4 py-3 text-sm outline-none focus:border-[#0052d0]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Message..."
                rows={1}
              />
              <button className="rounded-2xl bg-[#0052d0] px-5 py-3 text-sm font-bold text-white" onClick={() => void send()} type="button">Send</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ListingChatPage() {
  return (
    <Suspense fallback={<main className="page-wrap"><div className="panel p-8">Loading chat…</div></main>}>
      <ChatContent />
    </Suspense>
  );
}
