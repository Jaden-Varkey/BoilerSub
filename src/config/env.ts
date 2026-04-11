import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ override: true });

const envSchema = z.object({
  SUPABASE_URL: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GOOGLE_API_KEY: z.string().min(1).optional(),
  GOOGLE_STITCH_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  LOG_LEVEL: z.string().default("info"),
  SKIP_PHONE_VERIFICATION: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export const env = envSchema.parse(process.env);
