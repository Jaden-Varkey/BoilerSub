export type Role = "user" | "admin";

export type User = {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  bio: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  role: Role;
  created_at: string;
};

export type PublicUser = {
  id: string;
  full_name: string | null;
  email: string;
};

export type Session = {
  access_token: string;
  refresh_token: string;
  user: User;
};

export type ListingPayload = {
  title: string;
  description: string;
  price: number;
  location: string;
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

export type Listing = ListingPayload & {
  id: string;
  owner_id: string;
  created_at: string;
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
