export type JitterStrategy = "full" | "equal" | "none";

export interface BackoffOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Activa aleatoriedad entre reintentos para evitar thundering herd. */
  jitter?: boolean;
  /**
   * - full:  random(0, delay) — recomendado AWS; máxima dispersión tras cortes
   * - equal: delay/2 + random(0, delay/2)
   * - none:  sin jitter
   */
  jitterStrategy?: JitterStrategy;
}

export interface BackoffAttempt<T> {
  attempt: number;
  result?: T;
  error?: Error;
}

const DEFAULT_OPTIONS: BackoffOptions = {
  maxAttempts: 8,
  baseDelayMs: 1_000,
  maxDelayMs: 60_000,
  jitter: true,
  jitterStrategy: "full",
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calcula espera con backoff exponencial + jitter.
 * Full jitter dispersa reintentos cuando muchos SPEI se procesan tras un corte.
 */
export function computeBackoffDelay(attempt: number, options: BackoffOptions): number {
  const exponential = options.baseDelayMs * 2 ** (attempt - 1);
  const capped = Math.min(exponential, options.maxDelayMs);

  if (!options.jitter || options.jitterStrategy === "none") {
    return capped;
  }

  if (options.jitterStrategy === "equal") {
    const half = capped / 2;
    return Math.floor(half + Math.random() * half);
  }

  // full jitter (default): random entre 0 y capped
  return Math.floor(Math.random() * capped);
}

/**
 * Ejecuta `fn` con reintentos y backoff exponencial + jitter.
 */
export async function withExponentialBackoff<T>(
  fn: (attempt: number) => Promise<T>,
  options: Partial<BackoffOptions> = {},
): Promise<{ result: T; attempts: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const result = await fn(attempt);
      return { result, attempts: attempt };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === opts.maxAttempts) break;
      await delay(computeBackoffDelay(attempt, opts));
    }
  }

  throw lastError ?? new Error("Backoff agotado sin error específico.");
}

/**
 * Polling hasta que `fn` retorne un valor que pase `isDone`, con backoff+jitter entre intentos.
 */
export async function pollUntil<T>(
  fn: (attempt: number) => Promise<T>,
  isDone: (value: T) => boolean,
  options: Partial<BackoffOptions> = {},
): Promise<{ result: T; attempts: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastValue: T | undefined;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    lastValue = await fn(attempt);
    if (isDone(lastValue)) {
      return { result: lastValue, attempts: attempt };
    }
    if (attempt < opts.maxAttempts) {
      await delay(computeBackoffDelay(attempt, opts));
    }
  }

  throw new Error(
    `Polling agotado tras ${opts.maxAttempts} intentos. Último estado: ${JSON.stringify(lastValue)}`,
  );
}
