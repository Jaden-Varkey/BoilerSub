export type StoredChatAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  name: string;
  size: number;
  mimeType: string;
  url: string;
};

export type StoredChatMessage = {
  id: string;
  senderUserId: string;
  text: string;
  timestamp: number;
  attachments: StoredChatAttachment[];
};

export type StoredConversation = {
  key: string;
  listingId: string;
  listingTitle: string;
  participantIds: [string, string];
  participantProfiles: Record<string, { name: string; email: string }>;
  updatedAt: number;
  messages: StoredChatMessage[];
};

export type ChatIndexEntry = {
  key: string;
  listingId: string;
  listingTitle: string;
  participantIds: [string, string];
  participantProfiles: Record<string, { name: string; email: string }>;
  updatedAt: number;
  lastMessageText: string;
};

export const CHAT_INDEX_KEY = "bs_chat_index_v1";

export function buildConversationKey(listingId: string, userAId: string, userBId: string) {
  const [a, b] = [userAId, userBId].sort();
  return `bs_chat_${listingId}_${a}_${b}`;
}

export function getConversation(key: string): StoredConversation | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredConversation;
  } catch {
    return null;
  }
}

function getIndex(): ChatIndexEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(CHAT_INDEX_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as ChatIndexEntry[];
  } catch {
    return [];
  }
}

function saveIndex(entries: ChatIndexEntry[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CHAT_INDEX_KEY, JSON.stringify(entries));
}

export function saveConversation(conversation: StoredConversation) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(conversation.key, JSON.stringify(conversation));

  const existing = getIndex().filter((entry) => entry.key !== conversation.key);
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const next: ChatIndexEntry = {
    key: conversation.key,
    listingId: conversation.listingId,
    listingTitle: conversation.listingTitle,
    participantIds: conversation.participantIds,
    participantProfiles: conversation.participantProfiles,
    updatedAt: conversation.updatedAt,
    lastMessageText: lastMessage?.text || (lastMessage?.attachments.length ? "Sent attachments" : "Started a chat"),
  };

  const merged = [next, ...existing].sort((a, b) => b.updatedAt - a.updatedAt);
  saveIndex(merged);
}

export function listConversationsForUser(userId: string): ChatIndexEntry[] {
  return getIndex().filter((entry) => entry.participantIds.includes(userId)).sort((a, b) => b.updatedAt - a.updatedAt);
}
