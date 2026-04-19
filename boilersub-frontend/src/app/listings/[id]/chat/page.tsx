"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { apiClient } from "@/lib/apiClient";
import { buildConversationKey, getConversation, saveConversation, type StoredConversation } from "@/lib/chatStore";
import type { Listing, PublicUser } from "@/lib/types";

type ChatAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  name: string;
  size: number;
  mimeType: string;
  url: string;
};

type ChatMessage = {
  id: string;
  senderUserId: string;
  text: string;
  timestamp: number;
  attachments: ChatAttachment[];
};

function formatTimestamp(ts: number) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(ts);
}

function bytesToLabel(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function attachmentKind(file: File): ChatAttachment["kind"] {
  if (file.type.startsWith("image/")) {
    return "image";
  }
  if (file.type.startsWith("video/")) {
    return "video";
  }
  if (file.type.startsWith("audio/")) {
    return "audio";
  }
  return "file";
}

function buildAttachmentFromFile(file: File): ChatAttachment {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    kind: attachmentKind(file),
    name: file.name,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    url: URL.createObjectURL(file),
  };
}

export default function ListingChatPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const peerId = searchParams.get("with") ?? "";
  const { user, status } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [lister, setLister] = useState<PublicUser | null>(null);
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const chatKey = useMemo(() => {
    if (!user?.id || !peerId) {
      return "";
    }
    return buildConversationKey(params.id, user.id, peerId);
  }, [params.id, peerId, user?.id]);

  useEffect(() => {
    if (!peerId) {
      setError("Missing lister id for this chat.");
      return;
    }

    async function load() {
      try {
        const loadedListing = await apiClient.listings.getById(params.id);
        setListing(loadedListing);
        const owner = await apiClient.users.getById(peerId);
        setLister(owner);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load chat context.");
      }
    }

    void load();
  }, [params.id, peerId]);

  useEffect(() => {
    if (typeof window === "undefined" || !listing || !lister || !user || !chatKey) {
      return;
    }

    const existing = getConversation(chatKey);
    if (!existing) {
      const participantIds = [user.id, lister.id].sort() as [string, string];
      const initial: StoredConversation = {
        key: chatKey,
        listingId: listing.id,
        listingTitle: listing.title,
        participantIds,
        participantProfiles: {
          [user.id]: {
            name: user.full_name?.trim() || user.email,
            email: user.email,
          },
          [lister.id]: {
            name: lister.full_name?.trim() || lister.email,
            email: lister.email,
          },
        },
        updatedAt: Date.now(),
        messages: [],
      };
      setMessages([]);
      saveConversation(initial);
      return;
    }

    setMessages(existing.messages ?? []);
  }, [chatKey, listing, lister, user]);

  useEffect(() => {
    if (typeof window === "undefined" || !user || !lister || !listing || !chatKey) {
      return;
    }

    const participantIds = [user.id, lister.id].sort() as [string, string];
    const nextConversation: StoredConversation = {
      key: chatKey,
      listingId: listing.id,
      listingTitle: listing.title,
      participantIds,
      participantProfiles: {
        [user.id]: {
          name: user.full_name?.trim() || user.email,
          email: user.email,
        },
        [lister.id]: {
          name: lister.full_name?.trim() || lister.email,
          email: lister.email,
        },
      },
      updatedAt: Date.now(),
      messages,
    };
    saveConversation(nextConversation);
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [chatKey, listing, lister, messages, user]);

  useEffect(() => {
    if (!chatKey) {
      return;
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== chatKey || !event.newValue) {
        return;
      }
      try {
        const next = JSON.parse(event.newValue) as StoredConversation;
        setMessages(next.messages ?? []);
      } catch {
        // Ignore malformed cross-tab payloads.
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [chatKey]);

  function addFiles(fileList: FileList | null) {
    if (!fileList) {
      return;
    }
    const incoming = Array.from(fileList).map(buildAttachmentFromFile);
    setPendingAttachments((prev) => [...prev, ...incoming]);
  }

  function removePendingAttachment(id: string) {
    setPendingAttachments((prev) => prev.filter((item) => item.id !== id));
  }

  function sendMessage() {
    if (!input.trim() && pendingAttachments.length === 0) {
      return;
    }

    if (!user) {
      return;
    }
    const next: ChatMessage = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      senderUserId: user.id,
      text: input.trim(),
      timestamp: Date.now(),
      attachments: pendingAttachments,
    };

    setMessages((prev) => [...prev, next]);
    setInput("");
    setPendingAttachments([]);

  }

  async function startVoiceCapture() {
    if (!("MediaRecorder" in window) || isRecording) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mediaChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(mediaChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
        setPendingAttachments((prev) => [...prev, buildAttachmentFromFile(file)]);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setError("Microphone access was blocked. You can still upload an audio file.");
    }
  }

  function stopVoiceCapture() {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      return;
    }
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  }

  if (status === "loading") {
    return <main className="page-wrap"><div className="panel p-8 text-sm text-[#5c5b5b]">Loading chat…</div></main>;
  }

  if (!user) {
    return (
      <main className="page-wrap">
        <div className="panel space-y-4 p-8">
          <h1 className="text-2xl font-extrabold text-[#2f2f2e]">Sign in to use chat</h1>
          <p className="text-sm text-[#5c5b5b]">Open this conversation after logging in.</p>
          <Link className="inline-flex rounded-lg bg-[#0052d0] px-4 py-2 text-sm font-bold text-white" href="/login">
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#0052d0]">BoilerSub Messages</p>
          <h1 className="font-display text-3xl font-extrabold text-[#2f2f2e]">Chat with Lister</h1>
        </div>
        <Link className="rounded-lg bg-[#dfdcdc] px-4 py-2 text-sm font-bold text-[#2f2f2e] hover:bg-[#d6d2d1]" href={`/listings/${params.id}`}>
          Back to Listing
        </Link>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-[#fcb69f] bg-[#ffe9df] px-4 py-3 text-sm font-medium text-[#8e2f12]">{error}</div>
      ) : null}

      <section className="overflow-hidden rounded-[1.6rem] border border-white/60 bg-white/85 shadow-panel backdrop-blur">
        <header className="border-b border-[#ece9e8] bg-gradient-to-r from-[#f9f6f5] to-[#f1f6ff] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-[#c3d0ff]">
              <Image
                alt={lister?.full_name || lister?.email || "Lister"}
                className="object-cover"
                fill
                sizes="48px"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu7DqIapAfnMtfbME8zmkOnUeyPNZrYX_imDgXdQ0xJrJ_MGRLDKSz6Kd_VgAKmXrW3uHrWKpEk-745YKItTr5je2wCNscl-QO8gJhB-C3_zWDGSoErvJvXGDdaHAyOX4h4zmmP9OI-aX00O50kTiMlLGLogoVKpJY9BAVAD8GMZZRGlUyxikZexQoGagYYyFcZyjJULxJxZpHuOyzj7zzBg6xOQApVei0MYeA4OpS0KIlvpI7BtXbnEbm9mbbn51h9RCYaJb5ypx2"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-[#2f2f2e]">{lister?.full_name || lister?.email || "Lister"}</p>
              <p className="truncate text-xs font-medium text-[#5c5b5b]">{listing?.title || "Listing"}</p>
            </div>
            <span className="rounded-full bg-[#e8f2ff] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#0052d0]">
              Purdue Verified
            </span>
          </div>
        </header>

        <div className="grid min-h-[70vh] grid-rows-[1fr_auto] bg-[linear-gradient(180deg,rgba(250,247,245,0.8),rgba(246,239,232,0.9))]">
          <div className="overflow-y-auto px-4 py-5" ref={scrollerRef}>
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
              {messages.map((message) => {
                const mine = message.senderUserId === user.id;
                return (
                  <div className={`flex ${mine ? "justify-end" : "justify-start"}`} key={message.id}>
                    <article
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                        mine
                          ? "rounded-br-md bg-gradient-to-br from-[#0052d0] to-[#0047b7] text-white"
                          : "rounded-bl-md border border-[#ece9e8] bg-white text-[#2f2f2e]"
                      }`}
                    >
                      {message.text ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p> : null}

                      {message.attachments.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((attachment) => (
                            <div
                              className={`overflow-hidden rounded-xl ${mine ? "bg-white/10" : "bg-[#f6f2f0]"}`}
                              key={attachment.id}
                            >
                              {attachment.kind === "image" ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  alt={attachment.name}
                                  className="h-auto max-h-64 w-full object-cover"
                                  src={attachment.url}
                                />
                              ) : null}

                              {attachment.kind === "video" ? (
                                <video className="h-auto max-h-72 w-full" controls src={attachment.url} />
                              ) : null}

                              {attachment.kind === "audio" ? (
                                <audio className="w-full p-2" controls src={attachment.url} />
                              ) : null}

                              {attachment.kind === "file" ? (
                                <a
                                  className={`block px-3 py-2 text-sm font-semibold ${mine ? "text-white" : "text-[#2f2f2e]"}`}
                                  download={attachment.name}
                                  href={attachment.url}
                                >
                                  📎 {attachment.name} · {bytesToLabel(attachment.size)}
                                </a>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <p className={`mt-2 text-[11px] ${mine ? "text-white/80" : "text-[#7a7877]"}`}>
                        {formatTimestamp(message.timestamp)}
                      </p>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#ece9e8] bg-white/90 px-4 py-4 backdrop-blur">
            <div className="mx-auto w-full max-w-3xl">
              {pendingAttachments.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {pendingAttachments.map((attachment) => (
                    <div className="flex items-center gap-2 rounded-full bg-[#edf4ff] px-3 py-1.5 text-xs font-semibold text-[#0047b7]" key={attachment.id}>
                      <span className="max-w-[220px] truncate">
                        {attachment.kind.toUpperCase()} · {attachment.name}
                      </span>
                      <button
                        className="rounded-full bg-white px-2 py-0.5 text-[#2f2f2e]"
                        onClick={() => removePendingAttachment(attachment.id)}
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex items-end gap-2">
                <label className="cursor-pointer rounded-xl bg-[#f3f0ef] px-3 py-2 text-sm font-bold text-[#2f2f2e] hover:bg-[#e9e4e2]">
                  +
                  <input
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
                    className="hidden"
                    multiple
                    onChange={(event) => {
                      addFiles(event.target.files);
                      event.currentTarget.value = "";
                    }}
                    type="file"
                  />
                </label>

                <button
                  className={`rounded-xl px-3 py-2 text-sm font-bold ${isRecording ? "bg-[#b92902] text-white" : "bg-[#fee6b2] text-[#6a5a32]"}`}
                  onClick={isRecording ? stopVoiceCapture : startVoiceCapture}
                  type="button"
                >
                  {isRecording ? "Stop" : "Voice"}
                </button>

                <textarea
                  className="min-h-[44px] flex-1 resize-none rounded-2xl border border-[#d8d4d2] bg-[#fbfaf9] px-4 py-3 text-sm outline-none ring-[#0052d0]/20 transition focus:border-[#0052d0] focus:ring-2"
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Message the lister..."
                  rows={1}
                  value={input}
                />

                <button
                  className="rounded-2xl bg-gradient-to-br from-[#0052d0] to-[#0047b7] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#0052d0]/20 transition hover:scale-[1.02] active:scale-95"
                  onClick={sendMessage}
                  type="button"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
