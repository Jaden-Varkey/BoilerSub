import { randomUUID } from "node:crypto";
import { getDemoData, updateDemoData } from "../data/demoStore.js";
import { ApiError } from "../lib/apiError.js";
import type { ListingRecord, ListingWithOwner, UserRecord } from "../types/index.js";
import type { ListingFilters, ListingRepository } from "./listing.repository.js";

function ownerSummary(user: UserRecord): Pick<UserRecord, "id" | "full_name" | "email" | "phone" | "fully_verified"> {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    fully_verified: user.fully_verified,
  };
}

export class DemoListingRepository implements ListingRepository {
  async findAll(filters: ListingFilters = {}): Promise<ListingRecord[]> {
    const listings = [...getDemoData().listings]
      .filter((entry) => (filters.ownerId ? entry.owner_id === filters.ownerId : true))
      .sort((left, right) => right.created_at.localeCompare(left.created_at));

    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 20;

    return listings.slice(offset, offset + limit);
  }

  async findById(id: string): Promise<ListingRecord | null> {
    return getDemoData().listings.find((entry) => entry.id === id) ?? null;
  }

  async findByIds(ids: string[]): Promise<ListingRecord[]> {
    const idSet = new Set(ids);
    return getDemoData().listings.filter((entry) => idSet.has(entry.id));
  }

  async create(ownerId: string, data: Omit<ListingRecord, "id" | "owner_id" | "created_at" | "updated_at">): Promise<ListingRecord> {
    let created: ListingRecord | null = null;

    updateDemoData((state) => {
      const timestamp = new Date().toISOString();
      const listing: ListingRecord = {
        id: randomUUID(),
        owner_id: ownerId,
        created_at: timestamp,
        updated_at: timestamp,
        ...data,
      };
      state.listings.push(listing);
      created = listing;
    });

    if (!created) {
      throw new ApiError(500, "database_error", "Failed to create listing");
    }

    return created;
  }

  async update(
    id: string,
    ownerId: string,
    data: Partial<Omit<ListingRecord, "id" | "owner_id" | "created_at" | "updated_at">>,
  ): Promise<ListingRecord> {
    let updated: ListingRecord | null = null;

    updateDemoData((state) => {
      const listing = state.listings.find((entry) => entry.id === id && entry.owner_id === ownerId);
      if (!listing) {
        throw new ApiError(404, "listing_not_found", "Listing not found");
      }

      Object.assign(listing, data, { updated_at: new Date().toISOString() });
      updated = listing;
    });

    if (!updated) {
      throw new ApiError(500, "database_error", "Failed to update listing");
    }

    return updated;
  }

  async delete(id: string, ownerId: string): Promise<void> {
    updateDemoData((state) => {
      const index = state.listings.findIndex((entry) => entry.id === id && entry.owner_id === ownerId);
      if (index === -1) {
        throw new ApiError(404, "listing_not_found", "Listing not found");
      }

      state.listings.splice(index, 1);
    });
  }

  async findWithOwners(filters: ListingFilters = {}): Promise<ListingWithOwner[]> {
    const state = getDemoData();
    const usersById = new Map(state.users.map((user) => [user.id, user]));
    const listings = await this.findAll(filters);

    return listings.map((listing) => ({
      ...listing,
      owner: usersById.has(listing.owner_id)
        ? ownerSummary(usersById.get(listing.owner_id) as UserRecord)
        : {
            id: listing.owner_id,
            full_name: null,
            email: "",
            phone: null,
            fully_verified: false,
          },
    }));
  }
}
