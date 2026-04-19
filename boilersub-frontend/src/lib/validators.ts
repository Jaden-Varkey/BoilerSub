import type { ListingPayload } from "@/lib/types";

export const PURDUE_EMAIL_REGEX = /^[^@]+@purdue\.edu$/i;
export const US_PHONE_REGEX = /^\+1\d{10}$/;

export const amenityOptions = [
  "WiFi",
  "Parking",
  "Laundry",
  "Furnished",
  "Pets",
  "Gym",
  "AC",
  "Dishwasher",
] as const;

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const trimmed = digits.startsWith("1") ? digits.slice(1) : digits;
  return trimmed.length === 10 ? `+1${trimmed}` : phone;
}

export function emptyListingPayload(): ListingPayload {
  return {
    title: "",
    description: "",
    price: 0,
    start_date: "",
    end_date: "",
    bedrooms: null,
    bathrooms: null,
    distance: null,
    address: "",
    amenities: [],
    images: [],
    panorama_image: null,
  };
}
