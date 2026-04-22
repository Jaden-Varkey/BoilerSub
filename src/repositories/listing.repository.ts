import type { ListingRecord, ListingWithOwner } from "../types/index.js";

export type ListingFilters = {
  limit?: number;
  offset?: number;
  ownerId?: string;
};

export interface ListingRepository {
  findAll(filters?: ListingFilters): Promise<ListingRecord[]>;
  findById(id: string): Promise<ListingRecord | null>;
  findByIds(ids: string[]): Promise<ListingRecord[]>;
  create(ownerId: string, data: Omit<ListingRecord, "id" | "owner_id" | "created_at" | "updated_at">): Promise<ListingRecord>;
  update(id: string, ownerId: string, data: Partial<Omit<ListingRecord, "id" | "owner_id" | "created_at" | "updated_at">>): Promise<ListingRecord>;
  delete(id: string, ownerId: string): Promise<void>;
  findWithOwners(filters?: ListingFilters): Promise<ListingWithOwner[]>;
}
