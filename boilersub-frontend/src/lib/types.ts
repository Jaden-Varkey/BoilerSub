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
  end_date: string;
  bedrooms: number | null;
  bathrooms: number | null;
  address: string | null;
  amenities: string[];
  images: string[];
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
  end_date: string;
  bedrooms: number | null;
  bathrooms: number | null;
  address: string | null;
  amenities: string[];
  images: string[];
};
