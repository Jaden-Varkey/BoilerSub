import crypto from "node:crypto";
import { Router } from "express";
import { sendError, sendSuccess } from "../lib/envelope.js";

type CaptureSessionRecord = {
  token: string;
  images: string[];
  createdAt: number;
  updatedAt: number;
};

const captureSessions = new Map<string, CaptureSessionRecord>();
const CAPTURE_SESSION_TTL_MS = 1000 * 60 * 30;
const MAX_CAPTURE_IMAGES = 10;
const JPEG_DATA_URL_REGEX = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;

function pruneCaptureSessions(now = Date.now()) {
  captureSessions.forEach((session, id) => {
    if (now - session.updatedAt > CAPTURE_SESSION_TTL_MS) {
      captureSessions.delete(id);
    }
  });
}

function getCaptureToken(req: import("express").Request): string | null {
  const headerToken = req.header("x-capture-token");
  if (headerToken) {
    return headerToken;
  }

  const queryToken = req.query.token;
  return typeof queryToken === "string" ? queryToken : null;
}

function readIncomingImages(body: unknown): string[] {
  if (!body || typeof body !== "object" || !("images" in body)) {
    return [];
  }
  const images = (body as { images?: unknown }).images;
  return Array.isArray(images) ? images.filter((item): item is string => typeof item === "string") : [];
}

export function createMediaRouter(): Router {
  const router = Router();

  router.post("/capture-sessions", (_req, res) => {
    pruneCaptureSessions();
    const id = crypto.randomUUID();
    const token = crypto.randomUUID();
    const now = Date.now();

    captureSessions.set(id, {
      token,
      images: [],
      createdAt: now,
      updatedAt: now,
    });

    return sendSuccess(
      res,
      {
        session_id: id,
        token,
        max_images: MAX_CAPTURE_IMAGES,
        expires_in_seconds: Math.floor(CAPTURE_SESSION_TTL_MS / 1000),
      },
      201,
    );
  });

  router.get("/capture-sessions/:id", (req, res) => {
    pruneCaptureSessions();
    const sessionId = req.params.id;
    const session = captureSessions.get(sessionId);
    if (!session) {
      return sendError(res, "capture_session_not_found", "Capture session not found", 404);
    }

    const token = getCaptureToken(req);
    if (!token || token !== session.token) {
      return sendError(res, "invalid_capture_token", "Invalid capture token", 403);
    }

    session.updatedAt = Date.now();
    return sendSuccess(res, {
      session_id: sessionId,
      images: session.images,
      image_count: session.images.length,
      max_images: MAX_CAPTURE_IMAGES,
    });
  });

  router.post("/capture-sessions/:id/images", (req, res) => {
    pruneCaptureSessions();
    const sessionId = req.params.id;
    const session = captureSessions.get(sessionId);
    if (!session) {
      return sendError(res, "capture_session_not_found", "Capture session not found", 404);
    }

    const token = getCaptureToken(req);
    if (!token || token !== session.token) {
      return sendError(res, "invalid_capture_token", "Invalid capture token", 403);
    }

    const incomingImages = readIncomingImages(req.body);
    if (!incomingImages.length) {
      return sendError(res, "images_required", "At least one image is required", 400);
    }

    for (const image of incomingImages) {
      if (!JPEG_DATA_URL_REGEX.test(image)) {
        return sendError(res, "invalid_image", "Images must be JPEG data URLs", 400);
      }
    }

    for (const image of incomingImages) {
      if (session.images.length >= MAX_CAPTURE_IMAGES) {
        break;
      }
      session.images.push(image);
    }

    session.updatedAt = Date.now();
    captureSessions.set(sessionId, session);

    return sendSuccess(res, {
      session_id: sessionId,
      images: session.images,
      image_count: session.images.length,
      max_images: MAX_CAPTURE_IMAGES,
    });
  });

  router.delete("/capture-sessions/:id", (req, res) => {
    pruneCaptureSessions();
    const sessionId = req.params.id;
    const session = captureSessions.get(sessionId);
    if (!session) {
      return sendError(res, "capture_session_not_found", "Capture session not found", 404);
    }

    const token = getCaptureToken(req);
    if (!token || token !== session.token) {
      return sendError(res, "invalid_capture_token", "Invalid capture token", 403);
    }

    captureSessions.delete(sessionId);
    return sendSuccess(res, { status: "capture_session_closed" });
  });

  return router;
}
