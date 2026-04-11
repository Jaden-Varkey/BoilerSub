import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { env } from "../src/config/env.js";

type SeedUser = {
  id: string;
  email: string;
  phone: string;
  full_name: string;
};

const service = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users: SeedUser[] = Array.from({ length: 10 }, (_value, index) => ({
  id: randomUUID(),
  email: `student${index + 1}@purdue.edu`,
  phone: `+1555000000${index}`,
  full_name: `Purdue Student ${index + 1}`,
}));

async function main(): Promise<void> {
  for (const user of users) {
    const { data, error } = await service.auth.admin.createUser({
      email: user.email,
      password: "BoilerSub123!",
      email_confirm: true,
      phone_confirm: true,
    });

    if (error) {
      throw error;
    }

    if (data.user?.id) {
      user.id = data.user.id;
    }
  }

  const userRows = users.map((user) => ({
    id: user.id,
    email: user.email,
    phone: user.phone,
    full_name: user.full_name,
    bio: `Seed profile for ${user.full_name}`,
    email_verified: true,
    phone_verified: true,
    fully_verified: true,
    role: "user",
  }));

  const { error: userInsertError } = await service.from("users").upsert(userRows, { onConflict: "id" });
  if (userInsertError) {
    throw userInsertError;
  }

  const listings = Array.from({ length: 30 }, (_value, index) => {
    const owner = users[index % users.length];
    const startDate = new Date(2026, 4, 1 + index);
    const endDate = new Date(2026, 6, 1 + index);
    return {
      owner_id: owner.id,
      title: `BoilerSub Listing ${index + 1}`,
      description: `Seed listing ${index + 1} near Purdue`,
      price: 500 + index * 25,
      start_date: startDate.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
      bedrooms: (index % 4) + 1,
      bathrooms: Number(((index % 3) + 1).toFixed(1)),
      address: `${100 + index} W State St, West Lafayette, IN`,
      amenities: ["wifi", "laundry", "parking"].slice(0, 2 + (index % 2)),
    };
  });

  const { error: listingInsertError } = await service.from("listings").insert(listings);
  if (listingInsertError) {
    throw listingInsertError;
  }

  console.log(JSON.stringify({ success: true, usersSeeded: users.length, listingsSeeded: listings.length }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
