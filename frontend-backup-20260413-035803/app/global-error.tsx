"use client";

import { StitchErrorPage } from "@/components/StitchErrorPage";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <StitchErrorPage
          title="Something went wrong"
          subtitle="BoilerSub hit a full-page error. Try reloading or head back to the marketplace."
          primaryLabel="Try Again"
          onPrimaryAction={() => reset()}
          secondaryLabel="Back to Home"
          secondaryHref="/"
          tertiaryTitle="Recovery Tip"
          tertiaryBody="A full-page refresh usually clears transient runtime errors after route changes."
          supportTitle="Support"
          supportBody="If the issue keeps happening, go back home and retry from a stable route."
          statusTitle="Live Status"
          statusBody="The app shell can recover even when this render path fails."
        />
      </body>
    </html>
  );
}
