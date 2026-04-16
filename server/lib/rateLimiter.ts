type Bucket = number[];

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  checkLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
    return this.consume(identifier, maxRequests, windowMs).allowed;
  }

  consume(identifier: string, maxRequests: number, windowMs: number): {
    allowed: boolean;
    retryAfterMs?: number;
  } {
    const now = Date.now();
    const bucket = this.buckets.get(identifier) ?? [];
    const recent = bucket.filter((timestamp) => now - timestamp < windowMs);

    if (recent.length >= maxRequests) {
      this.buckets.set(identifier, recent);
      const oldest = recent[0] ?? now;
      return {
        allowed: false,
        retryAfterMs: Math.max(windowMs - (now - oldest), 0),
      };
    }

    recent.push(now);
    this.buckets.set(identifier, recent);
    return { allowed: true };
  }
}

export const rateLimiter = new RateLimiter();
