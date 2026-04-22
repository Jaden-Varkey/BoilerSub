import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const sharedAuthConfig = {
  autoRefreshToken: false,
  persistSession: false,
};
const hasSupabaseConfig = Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY);

function assertSupabaseConfig() {
  if (!hasSupabaseConfig) {
    throw new Error("Supabase config is missing. Set BACKEND_MODE=supabase and provide Supabase env vars.");
  }
}
export const supabaseServiceClient = hasSupabaseConfig
  ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: sharedAuthConfig,
    })
  : null;

export const supabaseAnonClient = hasSupabaseConfig
  ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: sharedAuthConfig,
    })
  : null;

export const supabaseAdmin = supabaseServiceClient;

export function createSupabaseClient(accessToken?: string) {
  assertSupabaseConfig();
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
