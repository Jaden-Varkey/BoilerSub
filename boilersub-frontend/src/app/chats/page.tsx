"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthProvider";
import { CHAT_INDEX_KEY, listConversationsForUser, type ChatIndexEntry } from "@/lib/chatStore";

function formatUpdated(ts: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(ts);
}

export default function ChatsInboxPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatIndexEntry[]>([]);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }

    const refresh = () => setConversations(listConversationsForUser(user.id));
    refresh();

    function handleStorage(event: StorageEvent) {
      if (event.key === CHAT_INDEX_KEY || event.key?.startsWith("bs_chat_")) {
        refresh();
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [user]);

  return (
    <ProtectedRoute requireVerified>
      <main className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#0052d0]">BoilerSub Messages</p>
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-[#2f2f2e]">Chats</h1>
          <p className="mt-2 text-sm text-[#5c5b5b]">Continue any conversation with listers or interested students.</p>
        </header>

        {conversations.length === 0 ? (
          <section className="rounded-[1.8rem] border border-white/60 bg-white/85 p-10 shadow-panel">
            <h2 className="font-display text-2xl font-bold text-[#2f2f2e]">No chats yet</h2>
            <p className="mt-2 text-sm text-[#5c5b5b]">Open any listing and press Contact Lister to start your first chat.</p>
            <Link
              className="mt-5 inline-flex rounded-lg bg-[#0052d0] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#0052d0]/20"
              href="/listings"
            >
              Browse Listings
            </Link>
          </section>
        ) : (
          <section className="overflow-hidden rounded-[1.6rem] border border-white/60 bg-white/85 shadow-panel">
            <ul className="divide-y divide-[#ece9e8]">
              {conversations.map((conversation) => {
                const peerId = conversation.participantIds.find((id) => id !== user?.id) ?? "";
                const peerProfile = conversation.participantProfiles[peerId];
                const peerName = peerProfile?.name || "User";

                return (
                  <li key={conversation.key}>
                    <Link
                      className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#f8f4f2]"
                      href={`/listings/${conversation.listingId}/chat?with=${encodeURIComponent(peerId)}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-[#2f2f2e]">{peerName}</p>
                        <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-[#0052d0]">
                          {conversation.listingTitle}
                        </p>
                        <p className="mt-1 truncate text-sm text-[#5c5b5b]">
                          {conversation.lastMessageText || "No messages yet"}
                        </p>
                      </div>
                      <div className="shrink-0 text-xs font-medium text-[#7a7877]">{formatUpdated(conversation.updatedAt)}</div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </ProtectedRoute>
  );
}
