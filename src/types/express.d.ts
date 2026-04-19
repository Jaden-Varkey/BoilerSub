import type { AppUser } from './index.js';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      auth?: {
        accessToken: string;
        userId: string;
      };
      user?: AppUser;
    }
  }
}

export {};
