import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { stitch } from "@google/stitch-sdk";

const prompt = `Create a responsive BoilerSub sign up page for both desktop and mobile, designed for Purdue students starting a Purdue-only sublease marketplace account flow. The page should feel editorial, high-trust, and modern, following the “Academic Kinetic / Kinetic Curator” visual system: muted Purdue-inspired gold #6a5a32 as the trust anchor, electric blue #0052d0 for primary actions, kinetic coral #a03a0f for energetic highlights, and an off-white bone background #f9f6f5. Use Plus Jakarta Sans for headlines and Manrope for body text. The typography mood should feel like a digital magazine meets tech product: bold, clean, premium, and youthful. Avoid generic SaaS styling, avoid harsh borders, and use tonal layering, soft lifted cards, rounded corners, subtle glassmorphism where appropriate, and ambient shadows instead of heavy drop shadows.

Layout should be desktop-first but fully mobile friendly. Include a top navigation bar consistent with BoilerSub branding: BoilerSub wordmark on the left, simple nav links if they fit cleanly, and a secondary action like “Log In” on the right. The main content should center around a strong sign up module with a clear headline like “Create your Purdue housing account” and a supporting line explaining that only @purdue.edu students can join. The core form must include these fields in order: Purdue email, password, confirm password. Add inline validation expectations directly in the UI: email must end in @purdue.edu, password must be at least 8 characters, confirm password must match. Include a large primary CTA button labeled Create Account. Beneath the form, include a text link: “Already have an account? Log in”. Add supporting trust/context elements around the form, such as a short 3-step explainer or side panel showing “Sign Up → Verify Email → Verify Phone → Browse/List”, plus small visual cues about secure student-only access. Inputs should use the “plinth” style from the design system: solid filled fields, no standard outlines, with focus states using a soft blue ghost border. The page should feel premium, kinetic, and tailored to a Purdue student housing platform rather than a generic auth screen.`;

async function main() {
  if (!process.env.STITCH_API_KEY) {
    throw new Error("STITCH_API_KEY is required.");
  }

  const project = await stitch.createProject("BoilerSub Sign Up");
  const screen = await project.generate(prompt, "DESKTOP");
  const htmlFile = await screen.getHtml();

  const htmlContent =
    typeof htmlFile === "string"
      ? htmlFile
      : htmlFile?.content ?? htmlFile?.text ?? htmlFile?.data ?? JSON.stringify(htmlFile, null, 2);

  const outputDir = path.resolve("stitch-out");
  await mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, "signup.html");
  await writeFile(outputPath, htmlContent, "utf8");

  console.log(JSON.stringify({ outputPath }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
