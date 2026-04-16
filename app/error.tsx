"use client";

import { StitchErrorPage } from "@/components/StitchErrorPage";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StitchErrorPage
      title="Something went wrong"
      subtitle="This route hit an unexpected issue. Refresh the flow or jump back into the BoilerSub marketplace."
      primaryLabel="Try Again"
      onPrimaryAction={() => reset()}
      secondaryLabel="Back to Home"
      secondaryHref="/"
      tertiaryTitle="Recovery Tip"
      tertiaryBody="If this happened after a stale route or deploy mismatch, a fresh reload usually clears it."
      supportTitle="Fallback"
      supportBody="You can always reopen listings or your profile from the main BoilerSub navigation."
      statusTitle="Live Status"
      statusBody="The marketplace is still online even if this specific route failed."
    />
  );
}
