import { ApiError } from "../lib/apiError";
import type { ListingRepository } from "../repositories/listing.repository";
import type { UserRepository } from "../repositories/user.repository";
import type { ListingCreateInput, ListingUpdateInput } from "../schemas/listings.schema";
import type { ListingRecord, ListingWithOwner, RequestUser } from "../types/index";

export class ListingsService {
  constructor(
    private readonly listingRepository: ListingRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async list(filters: { limit?: number; offset?: number }): Promise<ListingWithOwner[]> {
    return this.listingRepository.findWithOwners(filters);
  }

  async getById(id: string): Promise<ListingRecord> {
    const listing = await this.listingRepository.findById(id);
    if (!listing) {
      throw new ApiError(404, "listing_not_found", "Listing not found");
    }
    return listing;
  }

  async create(user: RequestUser, payload: ListingCreateInput): Promise<ListingRecord> {
    await this.assertFullyVerified(user.id);
    return this.listingRepository.create(user.id, {
      title: payload.title,
      description: payload.description ?? null,
      price: payload.price,
      start_date: payload.start_date,
      end_date: payload.end_date ?? null,
      bedrooms: payload.bedrooms ?? null,
      bathrooms: payload.bathrooms ?? null,
      distance: payload.distance ?? null,
      address: payload.address ?? null,
      amenities: payload.amenities,
      images: payload.images,
    });
  }

  async update(user: RequestUser, id: string, payload: ListingUpdateInput): Promise<ListingRecord> {
    await this.assertFullyVerified(user.id);
    const existing = await this.getById(id);
    if (existing.owner_id !== user.id && user.role !== "admin") {
      throw new ApiError(403, "forbidden", "Only the owner can modify this listing");
    }

    return this.listingRepository.update(id, existing.owner_id, {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.price !== undefined ? { price: payload.price } : {}),
      ...(payload.start_date !== undefined ? { start_date: payload.start_date } : {}),
      ...(payload.end_date !== undefined ? { end_date: payload.end_date } : {}),
      ...(payload.bedrooms !== undefined ? { bedrooms: payload.bedrooms } : {}),
      ...(payload.bathrooms !== undefined ? { bathrooms: payload.bathrooms } : {}),
      ...(payload.distance !== undefined ? { distance: payload.distance } : {}),
      ...(payload.address !== undefined ? { address: payload.address } : {}),
      ...(payload.amenities !== undefined ? { amenities: payload.amenities } : {}),
      ...(payload.images !== undefined ? { images: payload.images } : {}),
    });
  }

  async delete(user: RequestUser, id: string): Promise<void> {
    await this.assertFullyVerified(user.id);
    const existing = await this.getById(id);
    if (existing.owner_id !== user.id && user.role !== "admin") {
      throw new ApiError(403, "forbidden", "Only the owner can delete this listing");
    }

    await this.listingRepository.delete(id, existing.owner_id);
  }

  private async assertFullyVerified(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user?.fully_verified) {
      throw new ApiError(403, "verification_required", "Fully verified account required");
    }
  }
}
