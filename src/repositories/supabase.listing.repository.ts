import { supabaseServiceClient } from "../config/supabase.js";
import { ApiError } from "../lib/apiError.js";
import type { ListingRecord, ListingWithOwner, UserRecord } from "../types/index.js";
import type { ListingFilters, ListingRepository } from "./listing.repository.js";

function mapListing(row: Record<string, unknown>): ListingRecord {
  return {
    id: String(row.id),
    owner_id: String(row.owner_id),
    title: String(row.title),
    description: row.description == null ? null : String(row.description),
    price: Number(row.price),
    start_date: String(row.start_date),
    end_date: String(row.end_date),
    bedrooms: row.bedrooms == null ? null : Number(row.bedrooms),
    bathrooms: row.bathrooms == null ? null : Number(row.bathrooms),
    address: row.address == null ? null : String(row.address),
    amenities: Array.isArray(row.amenities) ? row.amenities.map(String) : [],
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
  "id, owner_id, title, description, price, start_date, end_date, bedrooms, bathrooms, address, amenities, created_at, updated_at";

function getSupabaseService() {
  if (!supabaseServiceClient) {
    throw new ApiError(500, "supabase_not_configured", "Supabase repository is not configured");
  }

  return supabaseServiceClient;
}

export class SupabaseListingRepository implements ListingRepository {
  async findAll(filters: ListingFilters = {}): Promise<ListingRecord[]> {
    let query = getSupabaseService().from("listings").select(listingSelect).order("created_at", { ascending: false });
    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;
    if (filters.ownerId) {
      query = query.eq("owner_id", filters.ownerId);
    }
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) {
      throw new ApiError(500, "database_error", error.message);
    }
    return (data ?? []).map((row) => mapListing(row as Record<string, unknown>));
  }

  async findById(id: string): Promise<ListingRecord | null> {
    const { data, error } = await getSupabaseService().from("listings").select(listingSelect).eq("id", id).maybeSingle();
    if (error) {
      throw new ApiError(500, "database_error", error.message);
    }
    return data ? mapListing(data as Record<string, unknown>) : null;
  }

  async findByIds(ids: string[]): Promise<ListingRecord[]> {
    if (ids.length === 0) {
      return [];
    }

    const { data, error } = await getSupabaseService().from("listings").select(listingSelect).in("id", ids);
    if (error) {
      throw new ApiError(500, "database_error", error.message);
    }
    return (data ?? []).map((row) => mapListing(row as Record<string, unknown>));
  }

  async create(ownerId: string, data: Omit<ListingRecord, "id" | "owner_id" | "created_at" | "updated_at">): Promise<ListingRecord> {
    const { data: row, error } = await getSupabaseService()
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
    const { data: row, error } = await getSupabaseService()
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
    const { error } = await getSupabaseService().from("listings").delete().eq("id", id).eq("owner_id", ownerId);
    if (error) {
      throw new ApiError(500, "database_error", error.message);
    }
  }

  async findWithOwners(filters: ListingFilters = {}): Promise<ListingWithOwner[]> {
    const listings = await this.findAll(filters);
    const ownerIds = [...new Set(listings.map((listing) => listing.owner_id))];

    if (ownerIds.length === 0) {
      return [];
    }

    const { data, error } = await getSupabaseService()
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
