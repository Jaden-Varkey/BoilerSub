import { supabaseServiceClient } from "../config/supabase";
import { ApiError } from "../lib/apiError";
import type { ListingRecord, ListingWithOwner, UserRecord } from "../types/index";
import type { ListingFilters, ListingRepository } from "./listing.repository";

function mapListing(row: Record<string, unknown>): ListingRecord {
  return {
    id: String(row.id),
    owner_id: String(row.owner_id),
    title: String(row.title),
    description: row.description == null ? null : String(row.description),
    price: Number(row.price),
    start_date: String(row.start_date),
    end_date: row.end_date == null ? null : String(row.end_date),
    bedrooms: row.bedrooms == null ? null : Number(row.bedrooms),
    bathrooms: row.bathrooms == null ? null : Number(row.bathrooms),
    distance: row.distance == null ? null : Number(row.distance),
    address: row.address == null ? null : String(row.address),
    amenities: Array.isArray(row.amenities) ? row.amenities.map(String) : [],
    images: Array.isArray(row.images) ? row.images.map(String) : [],
    panorama_image: row.panorama_image == null ? null : String(row.panorama_image),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapOwner(row: Record<string, unknown>): Pick<UserRecord, "id" | "full_name" | "email" | "phone" | "fully_verified"> {
  return {
    id: String(row.id),
    email: String(row.email),
    phone: row.phone == null ? null : String(row.phone),
    full_name: row.full_name == null ? null : String(row.full_name),
    fully_verified: Boolean(row.fully_verified),
  };
}

const listingSelect =
  "id, owner_id, title, description, price, start_date, end_date, bedrooms, bathrooms, distance, address, amenities, images, panorama_image, created_at, updated_at";

export class SupabaseListingRepository implements ListingRepository {
  async findAll(filters: ListingFilters = {}): Promise<ListingRecord[]> {
    let query = supabaseServiceClient.from("listings").select(listingSelect).order("created_at", { ascending: false });
    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) {
      throw new ApiError(500, "database_error", error.message);
    }
    return (data ?? []).map((row) => mapListing(row as Record<string, unknown>));
  }

  async findById(id: string): Promise<ListingRecord | null> {
    const { data, error } = await supabaseServiceClient.from("listings").select(listingSelect).eq("id", id).maybeSingle();
    if (error) {
      throw new ApiError(500, "database_error", error.message);
    }
    return data ? mapListing(data as Record<string, unknown>) : null;
  }

  async findByIds(ids: string[]): Promise<ListingRecord[]> {
    if (ids.length === 0) {
      return [];
    }

    const { data, error } = await supabaseServiceClient.from("listings").select(listingSelect).in("id", ids);
    if (error) {
      throw new ApiError(500, "database_error", error.message);
    }
    return (data ?? []).map((row) => mapListing(row as Record<string, unknown>));
  }

  async create(ownerId: string, data: Omit<ListingRecord, "id" | "owner_id" | "created_at" | "updated_at">): Promise<ListingRecord> {
    const { data: row, error } = await supabaseServiceClient
      .from("listings")
      .insert({
        owner_id: ownerId,
        ...data,
      })
      .select(listingSelect)
      .single();

    if (error) {
      throw new ApiError(500, "database_error", error.message);
    }
    return mapListing(row as Record<string, unknown>);
  }

  async update(
    id: string,
    ownerId: string,
    data: Partial<Omit<ListingRecord, "id" | "owner_id" | "created_at" | "updated_at">>,
  ): Promise<ListingRecord> {
    const { data: row, error } = await supabaseServiceClient
      .from("listings")
      .update(data)
      .eq("id", id)
      .eq("owner_id", ownerId)
      .select(listingSelect)
      .single();

    if (error) {
      throw new ApiError(500, "database_error", error.message);
    }
    return mapListing(row as Record<string, unknown>);
  }

  async delete(id: string, ownerId: string): Promise<void> {
    const { error } = await supabaseServiceClient.from("listings").delete().eq("id", id).eq("owner_id", ownerId);
    if (error) {
      throw new ApiError(500, "database_error", error.message);
    }
  }

  async findWithOwners(filters: ListingFilters = {}): Promise<ListingWithOwner[]> {
    const listings = await this.findAll(filters);
    const ownerIds = Array.from(new Set(listings.map((listing) => listing.owner_id)));

    if (ownerIds.length === 0) {
      return [];
    }

    const { data, error } = await supabaseServiceClient
      .from("users")
      .select("id, email, phone, full_name, fully_verified")
      .in("id", ownerIds);

    if (error) {
      throw new ApiError(500, "database_error", error.message);
    }

    const ownerMap = new Map<string, Pick<UserRecord, "id" | "full_name" | "email" | "phone" | "fully_verified">>();
    for (const row of data ?? []) {
      const owner = mapOwner(row as Record<string, unknown>);
      ownerMap.set(owner.id, owner);
    }

    return listings.map((listing) => ({
      ...listing,
      owner: ownerMap.get(listing.owner_id) ?? {
        id: listing.owner_id,
        email: "",
        phone: null,
        full_name: null,
        fully_verified: false,
      },
    }));
  }
}
