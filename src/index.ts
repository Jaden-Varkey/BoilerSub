import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { supabaseAnonClient } from "./config/supabase.js";
import { resetDemoData } from "./data/demoStore.js";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/logger.js";
import { createRequireDemoAuth } from "./middleware/requireDemoAuth.js";
import { createRequireAuth } from "./middleware/requireAuth.js";
import { requireVerified } from "./middleware/requireVerified.js";
import { requestId } from "./middleware/requestId.js";
import { DemoListingRepository } from "./repositories/demo.listing.repository.js";
import { DemoUserRepository } from "./repositories/demo.user.repository.js";
import { SupabaseListingRepository } from "./repositories/supabase.listing.repository.js";
import { SupabaseUserRepository } from "./repositories/supabase.user.repository.js";
import { createAuthRouter } from "./routes/auth.routes.js";
import { createListingsRouter } from "./routes/listings.routes.js";
import { createUsersRouter } from "./routes/users.routes.js";
import { AuthService } from "./services/auth.service.js";
import { DemoAuthService } from "./services/demoAuth.service.js";
import { ListingsService } from "./services/listings.service.js";
import { UsersService } from "./services/users.service.js";

const app = express();
const isDemoMode = env.BACKEND_MODE === "demo";
const userRepository = isDemoMode ? new DemoUserRepository() : new SupabaseUserRepository();
const listingRepository = isDemoMode ? new DemoListingRepository() : new SupabaseListingRepository();
const authService = isDemoMode ? new DemoAuthService(userRepository) : new AuthService(userRepository);
const usersService = new UsersService(userRepository);
const listingsService = new ListingsService(listingRepository, userRepository);
const requireAuthMiddleware = isDemoMode
  ? createRequireDemoAuth({ userRepository })
  : createRequireAuth({
      supabase: supabaseAnonClient,
      userRepository,
    });

if (isDemoMode) {
  resetDemoData();
}

app.use(helmet());
const allowedCorsOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedCorsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(requestId);
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", mode: env.BACKEND_MODE } });
});

app.use("/api/v1/auth", createAuthRouter({ authService, requireAuthMiddleware }));
app.use(
  "/api/v1/users",
  createUsersRouter({
    usersService,
    requireAuthMiddleware,
    requireVerifiedMiddleware: requireVerified,
  }),
);
app.use(
  "/api/v1/listings",
  createListingsRouter({
    listingsService,
    requireAuthMiddleware,
    requireVerifiedMiddleware: requireVerified,
  }),
);

app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info("server_started", { port: env.PORT, mode: env.BACKEND_MODE });
});
