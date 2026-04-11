import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const sharedAuthConfig = {
  autoRefreshToken: false,
  persistSession: false,
};

export const supabaseServiceClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: sharedAuthConfig,
});

export const supabaseAnonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: sharedAuthConfig,
});

export const supabaseAdmin = supabaseServiceClient;

export function createSupabaseClient(accessToken?: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: sharedAuthConfig,
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}
