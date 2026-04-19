"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { apiClient } from "@/lib/apiClient";
import type { ChatInboxEntry } from "@/lib/types";

export default function ChatsPage() {
  const { user, status } = useAuth();
  const [inbox, setInbox] = useState<ChatInboxEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      void loadInbox();
    }
  }, [status]);

  async function loadInbox() {
    try {
      const data = await apiClient.chats.listInbox();
      setInbox(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <main className="page-wrap">
        <div className="panel p-8">Loading inbox...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page-wrap">
        <div className="panel p-8">Please sign in to view your chats.</div>
      </main>
    );
  }

  return (
    <main className="page-wrap">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-[#2f2f2e]">Inbox</h1>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl bg-[#ffe9df] px-4 py-3 text-sm text-[#8e2f12]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4">
        {inbox.length === 0 ? (
          <div className="panel p-12 text-center text-[#7c7876]">No messages yet.</div>
        ) : (
          inbox.map((entry) => (
            <Link
              key={entry.conversation_key}
              href={`/listings/${entry.listing_id}/chat?peer=${entry.peer.id}`}
              className="panel block p-4 transition-all hover:border-[#0052d0] hover:shadow-lg active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#2f2f2e]">
                    {entry.peer.full_name || entry.peer.email}
                  </h3>
                  <p className="text-sm text-[#7c7876]">{entry.listing_title}</p>
                </div>
                <div className="text-right text-xs text-[#7c7876]">
                  {new Date(entry.updated_at).toLocaleDateString()}
                </div>
              </div>
              <p className="mt-2 line-clamp-1 text-sm text-[#2f2f2e]">
                {entry.last_message_text}
              </p>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
