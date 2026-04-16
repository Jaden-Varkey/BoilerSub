import { GoogleGenAI } from "@google/genai";

import { env } from "../config/env";

let stitchClient: GoogleGenAI | null = null;

export const STITCH_DEFAULT_MODEL = env.GOOGLE_STITCH_MODEL;

export function getStitchClient() {
  if (!env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is required to initialize Google Stitch tooling.");
  }

  stitchClient ??= new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });
  return stitchClient;
}
