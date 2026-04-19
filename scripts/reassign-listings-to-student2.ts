import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { env } from "../src/config/env.js";

const service = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const student1 = {
  email: "student1@purdue.edu",
  phone: "+15550000000",
  full_name: "Ethan Walker",
  bio: "Student 1. Analytical, low-key, and always comparing lease details before making a move.",
};

const student2 = {
  email: "student2@purdue.edu",
  phone: "+15550000001",
  full_name: "Maya Chen",
  bio: "Student 2. Friendly, organized, and outgoing. She keeps her place spotless, answers quickly, and likes helping other Purdue students land a smooth sublease.",
};

async function ensureAuthUser(input: { email: string; phone: string }) {
  const { data, error } = await service.auth.admin.listUsers();
  if (error) {
    throw error;
  }

  const existing = data.users.find((user) => user.email === input.email);
  if (existing) {
    return existing.id;
  }

  const created = await service.auth.admin.createUser({
    email: input.email,
    password: "BoilerSub123!",
    email_confirm: true,
    phone_confirm: true,
  });

  if (created.error || !created.data.user?.id) {
    throw created.error ?? new Error(`Failed to create auth user for ${input.email}`);
  }

  return created.data.user.id;
}

async function main() {
  const student1Id = await ensureAuthUser(student1);
  const student2Id = await ensureAuthUser(student2);

  const { error: userError } = await service.from("users").upsert(
    [
      {
        id: student1Id,
        email: student1.email,
        phone: student1.phone,
        full_name: student1.full_name,
        bio: student1.bio,
        email_verified: true,
        phone_verified: true,
        fully_verified: true,
        role: "user",
      },
      {
        id: student2Id,
        email: student2.email,
        phone: student2.phone,
        full_name: student2.full_name,
        bio: student2.bio,
        email_verified: true,
        phone_verified: true,
        fully_verified: true,
        role: "user",
      },
    ],
    { onConflict: "id" },
  );

  if (userError) {
    throw userError;
  }

  const { data: listings, error: listingsError } = await service.from("listings").select("id");
  if (listingsError) {
    throw listingsError;
  }

  if ((listings ?? []).length > 0) {
    const { error: updateError } = await service.from("listings").update({ owner_id: student2Id }).neq("owner_id", student2Id);
    if (updateError) {
      throw updateError;
    }
  }

  console.log(
    JSON.stringify({
      success: true,
      student1Id,
      student2Id,
      listingsReassigned: (listings ?? []).length,
    }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
