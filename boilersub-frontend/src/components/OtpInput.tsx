"use client";

import { useEffect, useRef } from "react";

export function OtpInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    refs.current = refs.current.slice(0, 6);
  }, []);

  return (
    <div className="flex gap-2 sm:gap-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          inputMode="numeric"
          maxLength={1}
          value={value[index] ?? ""}
          onChange={(event) => {
            const char = event.target.value.replace(/\D/g, "");
            const chars = value.split("");
            chars[index] = char;
            const next = chars.join("").slice(0, 6);
            onChange(next);
            if (char && index < 5) {
              refs.current[index + 1]?.focus();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !value[index] && index > 0) {
              refs.current[index - 1]?.focus();
            }
          }}
          className="h-14 w-12 rounded-2xl border border-slate-200 bg-white text-center text-xl font-semibold outline-none ring-brand-blue/20 transition focus:border-brand-blue focus:ring-2 sm:w-14"
        />
      ))}
    </div>
  );
}
