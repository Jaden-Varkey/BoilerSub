export type Role = "user" | "admin";

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiErrorBody };

export type RequestUser = {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  bio: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  fully_verified: boolean;
  role: Role;
};

export type UserRecord = RequestUser & {
  created_at: string;
  updated_at: string;
};

export type AppUser = UserRecord;

export type PublicUser = Pick<
  UserRecord,
  | "id"
  | "email"
  | "phone"
  | "full_name"
  | "bio"
  | "role"
  | "email_verified"
  | "phone_verified"
  | "fully_verified"
  | "created_at"
  | "updated_at"
>;

export type ListingRecord = {
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
  created_at: string;
  updated_at: string;
};

export type ListingWithOwner = ListingRecord & {
  owner: Pick<UserRecord, "id" | "full_name" | "email" | "phone" | "fully_verified">;
};

export type AuthSessionPayload = {
  session: {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    token_type?: string;
  } | null;
  user: RequestUser;
};

export type AuthenticatedRequest = Express.Request & {
  user: AppUser;
  auth: {
    accessToken: string;
    userId: string;
  };
};
