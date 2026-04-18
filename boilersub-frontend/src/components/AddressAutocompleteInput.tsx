"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Suggestion = {
  id: string;
  text: string;
};

type PlacesAutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
    };
  }>;
};

export function AddressAutocompleteInput({
  id,
  className,
  placeholder,
  value,
  onValueChange,
}: {
  id?: string;
  className?: string;
  placeholder?: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  const sessionToken = useMemo(() => crypto.randomUUID(), []);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const suppressFetchRef = useRef(false);

  useEffect(() => {
    if (!mapsApiKey) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const query = value.trim();
    if (suppressFetchRef.current) {
      suppressFetchRef.current = false;
      return;
    }
    if (query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": mapsApiKey,
            "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
          },
          body: JSON.stringify({
            input: query,
            includedRegionCodes: ["us"],
            sessionToken,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          setSuggestions([]);
          setOpen(false);
          return;
        }

        const payload = (await response.json()) as PlacesAutocompleteResponse;
        const nextSuggestions: Suggestion[] = (payload.suggestions ?? [])
          .map((item) => {
            const placeId = item.placePrediction?.placeId ?? "";
            const text = item.placePrediction?.text?.text?.trim() ?? "";
            return {
              id: placeId || text,
              text,
            };
          })
          .filter((item) => Boolean(item.id) && Boolean(item.text));

        setSuggestions(nextSuggestions);
        setOpen(nextSuggestions.length > 0);
        setActiveIndex(-1);
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [mapsApiKey, sessionToken, value]);

  const commitSuggestion = (suggestion: Suggestion) => {
    suppressFetchRef.current = true;
    onValueChange(suggestion.text);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        autoComplete="street-address"
        className={className}
        id={id}
        placeholder={placeholder}
        type="text"
        value={value}
        onBlur={() => {
          window.setTimeout(() => {
            setOpen(false);
            setActiveIndex(-1);
          }, 120);
        }}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        onFocus={() => {
          if (suggestions.length > 0) {
            setOpen(true);
          }
        }}
        onKeyDown={(event) => {
          if (!open || suggestions.length === 0) {
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((current) => (current + 1) % suggestions.length);
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
            return;
          }
          if (event.key === "Enter" && activeIndex >= 0 && activeIndex < suggestions.length) {
            event.preventDefault();
            commitSuggestion(suggestions[activeIndex]);
            return;
          }
          if (event.key === "Escape") {
            setOpen(false);
            setActiveIndex(-1);
          }
        }}
      />
      {open ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-[#afadac]/35 bg-white shadow-xl">
          <ul className="max-h-64 overflow-y-auto py-1">
            {suggestions.map((suggestion, index) => (
              <li key={`${suggestion.id}-${index}`}>
                <button
                  className={
                    index === activeIndex
                      ? "block w-full bg-[#f3f0ef] px-4 py-3 text-left text-sm font-medium text-[#2f2f2e]"
                      : "block w-full px-4 py-3 text-left text-sm font-medium text-[#2f2f2e] hover:bg-[#f3f0ef]"
                  }
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    commitSuggestion(suggestion);
                  }}
                >
                  {suggestion.text}
                </button>
              </li>
            ))}
            {loading ? <li className="px-4 py-3 text-xs font-medium text-[#5c5b5b]">Loading suggestions…</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
