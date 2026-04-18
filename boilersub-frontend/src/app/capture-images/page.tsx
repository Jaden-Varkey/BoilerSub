"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "@/components/Toast";
import { apiClient } from "@/lib/apiClient";

const MAX_IMAGES = 10;

export default function CaptureImagesPage() {
  const params = useSearchParams();
  const sessionId = useMemo(() => params.get("session") ?? "", [params]);
  const token = useMemo(() => params.get("token") ?? "", [params]);
  const email = useMemo(() => params.get("email") ?? "", [params]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [captured, setCaptured] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !token) {
      setMessage("Invalid camera session. Re-open from the listing page QR code.");
      return;
    }

    let cancelled = false;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to access camera");
      }
    }

    void startCamera();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [sessionId, token]);

  function takePhoto() {
    setMessage(null);
    if (!videoRef.current || !canvasRef.current) {
      return;
    }
    if (captured.length >= MAX_IMAGES) {
      setMessage(`You can capture up to ${MAX_IMAGES} photos.`);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext("2d");
    if (!context) {
      setMessage("Unable to process photo capture.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/jpeg", 0.92);
    setCaptured((current) => [...current, image]);
  }

  async function uploadPhotos() {
    setMessage(null);
    setSuccessMessage(null);
    if (!captured.length) {
      setMessage("Capture at least one photo before uploading.");
      return;
    }
    if (!sessionId || !token) {
      setMessage("Invalid camera session.");
      return;
    }

    setBusy(true);
    try {
      await apiClient.media.appendCaptureImages(sessionId, token, captured);
      setSuccessMessage("Photos synced to your listing form. You can capture more or return to your desktop.");
      setCaptured([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to upload captured photos");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-5 py-8">
      <header className="space-y-2">
        <Link className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#5c5b5b] hover:text-[#0052d0]" href="/">
          ← BoilerSub
        </Link>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#2f2f2e] md:text-4xl">Capture Listing Photos</h1>
        <p className="text-[#5c5b5b]">
          Live camera only. Captured photos sync to your listing form.
          {email ? ` (${email})` : ""}
        </p>
      </header>

      {message ? <Toast kind="error" message={message} /> : null}
      {successMessage ? <Toast kind="success" message={successMessage} /> : null}

      <section className="overflow-hidden rounded-2xl bg-black shadow-xl">
        <video ref={videoRef} autoPlay playsInline muted className="aspect-[3/4] w-full bg-black object-cover md:aspect-video" />
      </section>
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-xl bg-[#0052d0] px-6 py-3 font-bold text-[#f1f2ff] shadow-lg shadow-[#0052d0]/30 transition-all hover:bg-[#0047b7] active:scale-[0.98]"
          type="button"
          onClick={takePhoto}
        >
          Take Photo
        </button>
        <button
          className="rounded-xl bg-[#6a5a32] px-6 py-3 font-bold text-[#fff1d9] shadow-lg shadow-[#6a5a32]/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy}
          type="button"
          onClick={() => void uploadPhotos()}
        >
          {busy ? "Uploading…" : "Use These Photos"}
        </button>
      </div>

      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#5c5b5b]/70">Captured ({captured.length}/{MAX_IMAGES})</p>
        {captured.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {captured.map((image, index) => (
              <div key={`${index}-${image.slice(0, 32)}`} className="relative overflow-hidden rounded-xl bg-[#e4e2e1]">
                <img alt={`Captured ${index + 1}`} className="aspect-[4/3] w-full object-cover" src={image} />
                <button
                  className="absolute right-2 top-2 rounded-full bg-black/65 px-2 py-1 text-xs font-bold text-white"
                  type="button"
                  onClick={() =>
                    setCaptured((current) => current.filter((_, currentIndex) => currentIndex !== index))
                  }
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#5c5b5b]">No photos captured yet.</p>
        )}
      </section>
    </main>
  );
}
