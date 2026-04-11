"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ListingEditor } from "@/components/ListingEditor";
import { Toast } from "@/components/Toast";
import { apiClient } from "@/lib/apiClient";
import type { Listing } from "@/lib/types";

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void apiClient.listings
      .getById(params.id)
      .then(setListing)
      .catch((error) => setMessage(error instanceof Error ? error.message : "Failed to load listing"));
  }, [params.id]);

  return (
    <ProtectedRoute requireVerified>
      {message ? (
        <main className="page-wrap py-12">
          <Toast kind="error" message={message} />
        </main>
      ) : listing ? (
        <ListingEditor
          cancelHref={`/listings/${params.id}`}
          deleteLabel="Delete Listing"
          deletingLabel="Deleting..."
          initial={listing}
          title="Edit Listing"
          description="You're updating an active listing on the BoilerSub marketplace."
          submitLabel="Save Changes"
          busyLabel="Saving…"
          variant="stitchEdit"
          onDelete={async () => {
            await apiClient.listings.delete(params.id);
            router.push("/profile/listings");
          }}
          onSubmit={async (payload) => {
            await apiClient.listings.update(params.id, payload);
            router.push(`/listings/${params.id}`);
          }}
        />
      ) : (
        <main className="page-wrap py-12">
          <div className="panel p-10 text-sm text-slate-600">Loading listing…</div>
        </main>
      )}
    </ProtectedRoute>
  );
}
