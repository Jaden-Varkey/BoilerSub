import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  BACKEND_MODE: z.enum(["demo", "supabase"]).default("demo"),
  SUPABASE_URL: z.string().default(""),
  SUPABASE_ANON_KEY: z.string().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(""),
  GOOGLE_API_KEY: z.string().min(1).optional(),
  GOOGLE_STITCH_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:3000,http://localhost:5173"),
  LOG_LEVEL: z.string().default("info"),
});

const parsedEnv = envSchema.parse(process.env);

if (parsedEnv.BACKEND_MODE === "supabase") {
  const missing = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"].filter(
    (key) => !parsedEnv[key as keyof typeof parsedEnv],
  );

  if (missing.length > 0) {
    throw new Error(`Missing required Supabase env vars in supabase mode: ${missing.join(", ")}`);
  }
}

export const env = parsedEnv;
