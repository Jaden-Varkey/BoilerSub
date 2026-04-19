import test from "node:test";
import assert from "node:assert/strict";

import { ListingsService } from "../../../server/services/listings.service";
import { ApiError } from "../../../server/lib/apiError";
import type { ListingRecord, RequestUser, UserRecord } from "../../../server/types/index";
import type { ListingRepository } from "../../../server/repositories/listing.repository";
import type { UserRepository } from "../../../server/repositories/user.repository";

function makeUserRecord(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    email: "student@purdue.edu",
    phone: "+17651234567",
    full_name: "Boiler Student",
    bio: "Hello",
    email_verified: true,
    phone_verified: true,
    fully_verified: true,
    role: "user",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeRequestUser(overrides: Partial<RequestUser> = {}): RequestUser {
  const record = makeUserRecord(overrides);
  return {
    id: record.id,
    email: record.email,
    phone: record.phone,
    full_name: record.full_name,
    bio: record.bio,
    email_verified: record.email_verified,
    phone_verified: record.phone_verified,
    fully_verified: record.fully_verified,
    role: record.role,
  };
}

function makeListing(overrides: Partial<ListingRecord> = {}): ListingRecord {
  return {
    id: "22222222-2222-2222-2222-222222222222",
    owner_id: "11111111-1111-1111-1111-111111111111",
    title: "Campus Apartment",
    description: "Quiet spot",
    price: 900,
    start_date: "2026-08-01",
    end_date: "2027-05-31",
    bedrooms: 2,
    bathrooms: 1,
    distance: 0.8,
    address: "123 State St",
    amenities: ["WiFi"],
    images: ["data:image/jpeg;base64,QUJD"],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function createListingRepositoryStub() {
  const calls: {
    create: Array<{ ownerId: string; payload: Omit<ListingRecord, "id" | "owner_id" | "created_at" | "updated_at"> }>;
    update: Array<{ id: string; ownerId: string; payload: Partial<Omit<ListingRecord, "id" | "owner_id" | "created_at" | "updated_at">> }>;
    delete: Array<{ id: string; ownerId: string }>;
  } = {
    create: [],
    update: [],
    delete: [],
  };

  const repository: ListingRepository = {
    async findAll() {
      return [];
    },
    async findById(id) {
      return makeListing({ id });
    },
    async findByIds() {
      return [];
    },
    async create(ownerId, payload) {
      calls.create.push({ ownerId, payload });
      return makeListing({ owner_id: ownerId, ...payload });
    },
    async update(id, ownerId, payload) {
      calls.update.push({ id, ownerId, payload });
      return makeListing({ id, owner_id: ownerId, ...payload });
    },
    async delete(id, ownerId) {
      calls.delete.push({ id, ownerId });
    },
    async findWithOwners() {
      return [];
    },
  };

  return { repository, calls };
}

function createUserRepositoryStub(user = makeUserRecord()) {
  const repository: UserRepository = {
    async findById(id) {
      return id === user.id ? user : null;
    },
    async findByEmail() {
      return null;
    },
    async findByIds() {
      return [];
    },
    async upsertAuthUser() {
      return user;
    },
    async updateProfile() {
      return user;
    },
    async markEmailVerified() {
      return user;
    },
    async markPhoneVerified() {
      return user;
    },
    async markFullyVerified() {
      return user;
    },
  };

  return repository;
}

test("ListingsService.create normalizes optional fields to null", async () => {
  const { repository, calls } = createListingRepositoryStub();
  const service = new ListingsService(repository, createUserRepositoryStub());

  await service.create(makeRequestUser(), {
    title: "New Listing",
    description: undefined,
    price: 1200,
    start_date: "2026-08-01",
    end_date: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    distance: undefined,
    address: undefined,
    amenities: [],
    images: ["data:image/jpeg;base64,QUJD"],
  });

  assert.deepEqual(calls.create[0], {
    ownerId: "11111111-1111-1111-1111-111111111111",
    payload: {
      title: "New Listing",
      description: null,
      price: 1200,
      start_date: "2026-08-01",
      end_date: null,
      bedrooms: null,
      bathrooms: null,
      distance: null,
      address: null,
      amenities: [],
      images: ["data:image/jpeg;base64,QUJD"],
    },
  });
});

test("ListingsService.update rejects non-owner non-admin users", async () => {
  const { repository } = createListingRepositoryStub();
  const userRepository = createUserRepositoryStub(makeUserRecord({ id: "33333333-3333-3333-3333-333333333333" }));
  const service = new ListingsService(repository, userRepository);

  await assert.rejects(
    service.update(
      makeRequestUser({ id: "33333333-3333-3333-3333-333333333333" }),
      "22222222-2222-2222-2222-222222222222",
      { title: "Updated" },
    ),
    (error: unknown) => error instanceof ApiError && error.statusCode === 403 && error.code === "forbidden",
  );
});

test("ListingsService.delete allows admins to delete another user's listing", async () => {
  const { repository, calls } = createListingRepositoryStub();
  const service = new ListingsService(repository, createUserRepositoryStub(makeUserRecord({ id: "99999999-9999-9999-9999-999999999999", role: "admin" })));

  await service.delete(
    makeRequestUser({ id: "99999999-9999-9999-9999-999999999999", role: "admin" }),
    "22222222-2222-2222-2222-222222222222",
  );

  assert.deepEqual(calls.delete, [
    {
      id: "22222222-2222-2222-2222-222222222222",
      ownerId: "11111111-1111-1111-1111-111111111111",
    },
  ]);
});
