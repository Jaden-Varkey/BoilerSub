import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { ListingRecord, UserRecord } from "../types/index.js";

type DemoUserRecord = UserRecord & {
  password: string;
  pending_email_token: string | null;
  pending_phone_token: string | null;
};

type DemoSessionRecord = {
  access_token: string;
  refresh_token: string;
  user_id: string;
  expires_at: string;
};

type DemoStoreShape = {
  users: DemoUserRecord[];
  listings: ListingRecord[];
  sessions: DemoSessionRecord[];
};

const demoStorePath = resolve(process.cwd(), ".demo", "demo-store.json");
const DEFAULT_PASSWORD = "BoilerSub123!";

function nowIso() {
  return new Date().toISOString();
}

function createSeedUsers(): DemoUserRecord[] {
  const createdAt = nowIso();

  return Array.from({ length: 6 }, (_value, index) => ({
    id: randomUUID(),
    email: `student${index + 1}@purdue.edu`,
    phone: `+17652000${String(100 + index).padStart(3, "0")}`,
    full_name: `Purdue Student ${index + 1}`,
    bio: "Looking for a clean, friendly sublease near campus.",
    email_verified: true,
    phone_verified: true,
    fully_verified: true,
    role: index === 0 ? "admin" : "user",
    created_at: createdAt,
    updated_at: createdAt,
    password: DEFAULT_PASSWORD,
    pending_email_token: null,
    pending_phone_token: null,
  }));
}

function createSeedListings(users: DemoUserRecord[]): ListingRecord[] {
  const baseDate = new Date("2026-05-01T00:00:00.000Z");
  const amenities = [
    ["WiFi", "Laundry", "Furnished"],
    ["WiFi", "Parking", "AC"],
    ["Gym", "Dishwasher", "Furnished"],
    ["WiFi", "Parking", "Gym"],
  ];

  return Array.from({ length: 14 }, (_value, index) => {
    const owner = users[index % users.length];
    const createdAt = nowIso();
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() + index * 3);
    const end = new Date(start);
    end.setMonth(start.getMonth() + 3);

    return {
      id: randomUUID(),
      owner_id: owner.id,
      title: [
        "Chauncey Studio Close to PMU",
        "2BR at Aspire with Covered Parking",
        "Summer Room Near WALC",
        "Furnished Apartment on State Street",
      ][index % 4],
      description: `Demo listing ${index + 1} for hackathon testing with flexible move-in and a verified Purdue owner.`,
      price: 575 + index * 45,
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      bedrooms: (index % 3) + 1,
      bathrooms: (index % 2) + 1,
      address: `${200 + index} W State St, West Lafayette, IN`,
      amenities: amenities[index % amenities.length] ?? [],
      created_at: createdAt,
      updated_at: createdAt,
    };
  });
}

function createInitialStore(): DemoStoreShape {
  const users = createSeedUsers();
  const listings = createSeedListings(users);

  return {
    users,
    listings,
    sessions: [],
  };
}

function ensureStoreFile(): void {
  if (existsSync(demoStorePath)) {
    return;
  }

  mkdirSync(dirname(demoStorePath), { recursive: true });
  writeFileSync(demoStorePath, JSON.stringify(createInitialStore(), null, 2));
}

function readStore(): DemoStoreShape {
  ensureStoreFile();
  return JSON.parse(readFileSync(demoStorePath, "utf8")) as DemoStoreShape;
}

function writeStore(data: DemoStoreShape): DemoStoreShape {
  mkdirSync(dirname(demoStorePath), { recursive: true });
  writeFileSync(demoStorePath, JSON.stringify(data, null, 2));
  return data;
}

export function getDemoData(): DemoStoreShape {
  return readStore();
}

export function updateDemoData(mutator: (data: DemoStoreShape) => void): DemoStoreShape {
  const state = readStore();
  mutator(state);
  return writeStore(state);
}

export function resetDemoData(): DemoStoreShape {
  return writeStore(createInitialStore());
}

export function issueDemoToken(): string {
  return randomUUID();
}

export function issueDemoOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export { DEFAULT_PASSWORD, demoStorePath };
