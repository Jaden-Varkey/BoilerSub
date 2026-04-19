"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { apiClient } from "@/lib/apiClient";
import type { ChatInboxEntry, ChatMessage } from "@/lib/types";

const OPEN_STATE_KEY = "bs_floating_chat_open";
const ACTIVE_KEY_KEY = "bs_floating_chat_active_key";

function formatRowTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

type ActiveConversation = {
  conversationKey: string;
  listingId: string;
  listingTitle: string;
  peerId: string;
  peerLabel: string;
};

export function FloatingChatWidget() {
  const { user, status } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [inboxError, setInboxError] = useState<string | null>(null);
  const [inbox, setInbox] = useState<ChatInboxEntry[]>([]);
  const [activeConversation, setActiveConversation] = useState<ActiveConversation | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const activeConversationKey = activeConversation?.conversationKey ?? "";

  useEffect(() => {
    const savedOpenState = window.localStorage.getItem(OPEN_STATE_KEY);
    if (savedOpenState === "1") {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(OPEN_STATE_KEY, isOpen ? "1" : "0");
  }, [isOpen]);

  useEffect(() => {
    if (status !== "authenticated") {
      setInbox([]);
      setActiveConversation(null);
      setMessages([]);
      setInboxError(null);
      setMessagesError(null);
      return;
    }

    let active = true;
    async function loadInbox() {
      try {
        setLoadingInbox(true);
        const nextInbox = await apiClient.chats.listInbox();
        if (!active) return;
        setInbox(nextInbox);
        setInboxError(null);
        const persistedKey = window.localStorage.getItem(ACTIVE_KEY_KEY);
        if (persistedKey) {
          const match = nextInbox.find((entry) => entry.conversation_key === persistedKey);
          if (match) {
            setActiveConversation({
              conversationKey: match.conversation_key,
              listingId: match.listing_id,
              listingTitle: match.listing_title,
              peerId: match.peer.id,
              peerLabel: match.peer.full_name || match.peer.email,
            });
          }
        }
      } catch (error) {
        if (!active) return;
        setInboxError(error instanceof Error ? error.message : "Failed to load chats.");
      } finally {
        if (!active) return;
        setLoadingInbox(false);
      }
    }

    void loadInbox();
    const interval = window.setInterval(() => {
      void loadInbox();
    }, 8000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [status]);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  useEffect(() => {
    if (!activeConversationKey || status !== "authenticated") {
      setMessages([]);
      setLoadingMessages(false);
      setMessagesError(null);
      return;
    }

    let active = true;
    async function loadMessages() {
      try {
        setLoadingMessages(true);
        const nextMessages = await apiClient.chats.getMessages(activeConversationKey, 250);
        if (!active) return;
        setMessages(nextMessages);
        setMessagesError(null);
      } catch (error) {
        if (!active) return;
        setMessagesError(error instanceof Error ? error.message : "Failed to load messages.");
      } finally {
        if (!active) return;
        setLoadingMessages(false);
      }
    }

    void loadMessages();
    const interval = window.setInterval(() => {
      void loadMessages();
    }, 2500);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [activeConversationKey, status]);

  useEffect(() => {
    if (editingMessageId) return;
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, editingMessageId]);

  async function sendMessage() {
    if (!user || !activeConversation) return;
    const text = draft.trim();
    if (!text) return;

    try {
      await apiClient.chats.sendMessage({
        listing_id: activeConversation.listingId,
        recipient_user_id: activeConversation.peerId,
        text,
        attachments: [],
      });
      setDraft("");
      setMessages(await apiClient.chats.getMessages(activeConversation.conversationKey, 250));
      setInbox(await apiClient.chats.listInbox());
    } catch (error) {
      setMessagesError(error instanceof Error ? error.message : "Failed to send message.");
    }
  }

  async function saveEdit(messageId: string) {
    if (!activeConversation) return;
    const text = editText.trim();
    if (!text) return;

    try {
      await apiClient.chats.editMessage(activeConversation.conversationKey, messageId, text);
      setMessages((prev) => prev.map((message) => (message.id === messageId ? { ...message, text } : message)));
      setEditingMessageId(null);
      setEditText("");
    } catch (error) {
      setMessagesError(error instanceof Error ? error.message : "Failed to edit message.");
    }
  }

  async function deleteMessage(messageId: string) {
    if (!activeConversation) return;

    try {
      await apiClient.chats.deleteMessage(activeConversation.conversationKey, messageId);
      setMessages((prev) => prev.filter((message) => message.id !== messageId));
    } catch (error) {
      setMessagesError(error instanceof Error ? error.message : "Failed to delete message.");
    }
  }

  const isSignedIn = status === "authenticated" && Boolean(user);
  const selectedConversation = useMemo(
    () => inbox.find((entry) => entry.conversation_key === activeConversationKey) ?? null,
    [activeConversationKey, inbox],
  );

  function openConversation(entry: ChatInboxEntry) {
    const nextConversation = {
      conversationKey: entry.conversation_key,
      listingId: entry.listing_id,
      listingTitle: entry.listing_title,
      peerId: entry.peer.id,
      peerLabel: entry.peer.full_name || entry.peer.email,
    };
    setActiveConversation(nextConversation);
    window.localStorage.setItem(ACTIVE_KEY_KEY, nextConversation.conversationKey);
  }

  function handleContextMenu(event: React.MouseEvent, message: ChatMessage) {
    event.preventDefault();
    setContextMenu({ id: message.id, x: event.clientX, y: event.clientY });
  }

  return (
    <div className="fixed bottom-5 right-5 z-[70]">
      {isOpen ? (
        <section className="panel flex h-[76vh] max-h-[640px] w-[370px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[1.8rem] border border-white/70 bg-[#fbfaf9]/95 shadow-[0_28px_60px_rgba(22,28,45,0.28)] backdrop-blur-xl">
          <header className="flex items-center justify-between border-b border-[#ece9e8] bg-white/80 px-4 py-3">
            <div>
              <p className="font-display text-lg font-black tracking-tight text-[#2f2f2e]">Messages</p>
              {selectedConversation ? (
                <p className="text-xs font-semibold text-[#7c7876]">{selectedConversation.listing_title}</p>
              ) : (
                <p className="text-xs font-semibold text-[#7c7876]">Recent conversations</p>
              )}
            </div>
            <button
              aria-label="Close chat widget"
              className="rounded-full bg-[#edf4ff] px-3 py-1.5 text-xs font-bold text-[#0052d0] transition hover:bg-[#dbeaff]"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              Close
            </button>
          </header>

          {!isSignedIn ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="font-display text-xl font-bold text-[#2f2f2e]">Sign in to use chat</p>
              <p className="text-sm text-[#7c7876]">Your floating chat stays available on every page once you log in.</p>
              <Link className="rounded-xl bg-[#0052d0] px-5 py-2.5 text-sm font-bold text-white" href="/login">
                Go to login
              </Link>
            </div>
          ) : activeConversation ? (
            <>
              {contextMenu ? (
                <div
                  className="fixed z-[2147483647] flex items-center gap-1 rounded-lg border border-[#ece9e8] bg-white p-1 shadow-panel"
                  onClick={(event) => event.stopPropagation()}
                  style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                  <button
                    className="rounded px-3 py-1 text-xs font-bold text-[#0052d0] hover:bg-[#edf4ff]"
                    onClick={() => {
                      const message = messages.find((entry) => entry.id === contextMenu.id);
                      if (message) {
                        setEditingMessageId(message.id);
                        setEditText(message.text);
                      }
                      setContextMenu(null);
                    }}
                    type="button"
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
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              ) : null}

              <div className="flex items-center justify-between border-b border-[#ece9e8] px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#2f2f2e]">{activeConversation.peerLabel}</p>
                  <p className="truncate text-xs text-[#7c7876]">{activeConversation.listingTitle}</p>
                </div>
                <button
                  className="rounded-lg px-3 py-1 text-xs font-bold text-[#0052d0] transition hover:bg-[#edf4ff]"
                  onClick={() => setActiveConversation(null)}
                  type="button"
                >
                  Back
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3" ref={scrollerRef}>
                {loadingMessages && messages.length === 0 ? (
                  <p className="px-1 py-2 text-sm text-[#7c7876]">Loading messages…</p>
                ) : null}
                {messagesError ? (
                  <p className="mb-2 rounded-lg bg-[#ffe9df] px-3 py-2 text-xs text-[#8e2f12]">{messagesError}</p>
                ) : null}
                <div className="flex flex-col gap-2">
                  {messages.map((message) => {
                    const mine = message.sender_user_id === user?.id;
                    const isEditing = editingMessageId === message.id;

                    return (
                      <div
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        key={message.id}
                        onContextMenu={(event) => handleContextMenu(event, message)}
                      >
                        <article className={`max-w-[86%] rounded-2xl px-3 py-2.5 text-sm ${mine ? "bg-[#0052d0] text-white" : "border border-[#ece9e8] bg-white text-[#2f2f2e]"}`}>
                          {isEditing ? (
                            <textarea
                              autoFocus
                              className={`w-full resize-none bg-transparent outline-none ${mine ? "placeholder:text-white/70" : "placeholder:text-[#6f6b69]"}`}
                              onBlur={() => {
                                setEditingMessageId(null);
                                setEditText("");
                              }}
                              onChange={(event) => setEditText(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" && !event.shiftKey) {
                                  event.preventDefault();
                                  void saveEdit(message.id);
                                }
                                if (event.key === "Escape") {
                                  setEditingMessageId(null);
                                  setEditText("");
                                }
                              }}
                              rows={1}
                              value={editText}
                            />
                          ) : (
                            <>
                              <p className="whitespace-pre-wrap">{message.text}</p>
                              <div className={`mt-1 flex items-center justify-between gap-3 text-[11px] ${mine ? "text-white/80" : "text-[#7c7876]"}`}>
                                <span>{formatMessageTime(message.created_at)}</span>
                              </div>
                            </>
                          )}
                        </article>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-[#ece9e8] bg-white/90 p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    className="min-h-[42px] flex-1 resize-none rounded-2xl border border-[#d8d4d2] bg-[#fbfaf9] px-3 py-2.5 text-sm text-[#2f2f2e] outline-none focus:border-[#0052d0]"
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    value={draft}
                  />
                  <button className="rounded-2xl bg-[#0052d0] px-4 py-2.5 text-sm font-bold text-white" onClick={() => void sendMessage()} type="button">
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {loadingInbox && inbox.length === 0 ? (
                <p className="px-2 py-3 text-sm text-[#7c7876]">Loading chats…</p>
              ) : null}
              {inboxError ? (
                <p className="mx-2 my-2 rounded-lg bg-[#ffe9df] px-3 py-2 text-xs text-[#8e2f12]">{inboxError}</p>
              ) : null}
              {inbox.length === 0 && !loadingInbox ? (
                <p className="px-3 py-4 text-sm text-[#7c7876]">No recent conversations yet.</p>
              ) : (
                <div className="space-y-1">
                  {inbox.map((entry) => (
                    <button
                      className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-[#f3f7ff]"
                      key={entry.conversation_key}
                      onClick={() => openConversation(entry)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-bold text-[#2f2f2e]">{entry.peer.full_name || entry.peer.email}</p>
                        <span className="shrink-0 text-[11px] text-[#7c7876]">{formatRowTime(entry.updated_at)}</span>
                      </div>
                      <p className="truncate text-xs text-[#7c7876]">{entry.last_message_text || "No text preview."}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      ) : null}

      <button
        aria-label={isOpen ? "Chat is open" : "Open floating chat"}
        className={`flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-[#0052d0] text-white shadow-[0_16px_36px_rgba(0,82,208,0.45)] transition hover:bg-[#0047b7] ${isOpen ? "pointer-events-none scale-0 opacity-0" : "scale-100 opacity-100"}`}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path
            d="M7 8h10M7 12h7m8-2a8 8 0 0 1-8 8H8l-4 3v-5a8 8 0 1 1 18-6z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </button>
    </div>
  );
}
