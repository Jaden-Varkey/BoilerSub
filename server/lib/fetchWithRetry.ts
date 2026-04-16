export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries - 1) {
        const delayMs = 2 ** attempt * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Operation failed after retries");
}
