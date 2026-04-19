export type Role = "user" | "admin";

export type User = {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  bio: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  fully_verified: boolean;
  role: Role;
  created_at?: string;
  updated_at?: string;
};

export type PublicUser = {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  bio: string | null;
  fully_verified: boolean;
  role: Role;
  created_at?: string;
  updated_at?: string;
};

export type Listing = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  price: number;
  start_date: string;
  end_date: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  distance: number | null;
  address: string | null;
  amenities: string[];
  images: string[];
  panorama_image: string | null;
  created_at?: string;
  updated_at?: string;
  owner?: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    fully_verified: boolean;
  };
};

export type Session = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
} | null;

export type ListingPayload = {
  title: string;
  description: string | null;
  price: number;
  start_date: string;
  end_date: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  distance: number | null;
  address: string | null;
  amenities: string[];
  images: string[];
  panorama_image: string | null;
};

export type ChatAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  name: string;
  size: number;
  mimeType: string;
  url: string;
};

export type ChatMessage = {
  id: string;
  conversation_key: string;
  listing_id: string;
  sender_user_id: string;
  recipient_user_id: string;
  text: string;
  attachments: ChatAttachment[];
  created_at: string;
};

export type ChatInboxEntry = {
  conversation_key: string;
  listing_id: string;
  listing_title: string;
  peer: {
    id: string;
    full_name: string | null;
    email: string;
  };
  updated_at: string;
  last_message_text: string;
};
