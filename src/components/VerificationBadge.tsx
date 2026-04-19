export function VerificationBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.28em] ${
        verified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
      }`}
    >
      {verified ? "Verified" : "Pending"}
    </span>
  );
}
