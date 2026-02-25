const DEFAULT_TTL_SECONDS = 10 * 60;
const MAX_IDEMPOTENCY_KEY_LENGTH = 128;

interface CachedResponse {
  status: number;
  body: unknown;
  createdAt: number;
}

const memoryStore = new Map<string, { value: CachedResponse; expiresAt: number }>();

type RedisLike = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: { ex?: number }): Promise<unknown>;
};

let redisClient: RedisLike | null = null;
let hasTriedRedisInit = false;

async function getRedisClient(): Promise<RedisLike | null> {
  if (redisClient || hasTriedRedisInit) {
    return redisClient;
  }

  hasTriedRedisInit = true;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  try {
    const { Redis } = await import("@upstash/redis");
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }) as RedisLike;
  } catch {
    redisClient = null;
  }

  return redisClient;
}

function normalizeKey(rawKey: string): string {
  return rawKey.trim().slice(0, MAX_IDEMPOTENCY_KEY_LENGTH);
}

function buildStorageKey(scope: string, userId: string, rawIdempotencyKey: string): string {
  const idempotencyKey = normalizeKey(rawIdempotencyKey);
  return `idem:${scope}:${userId}:${idempotencyKey}`;
}

export async function getIdempotentResponse(
  scope: string,
  userId: string,
  idempotencyKey: string
): Promise<CachedResponse | null> {
  if (!scope || !userId || !idempotencyKey) {
    return null;
  }

  const storageKey = buildStorageKey(scope, userId, idempotencyKey);
  const redis = await getRedisClient();
  if (redis) {
    try {
      const value = await redis.get<CachedResponse>(storageKey);
      if (value && typeof value.status === "number") {
        return value;
      }
    } catch {
      // Fall through to in-memory cache if Redis is unavailable.
    }
  }

  const inMemory = memoryStore.get(storageKey);
  if (!inMemory) return null;

  if (Date.now() > inMemory.expiresAt) {
    memoryStore.delete(storageKey);
    return null;
  }

  return inMemory.value;
}

export async function setIdempotentResponse(
  scope: string,
  userId: string,
  idempotencyKey: string,
  response: { status: number; body: unknown },
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<void> {
  if (!scope || !userId || !idempotencyKey) {
    return;
  }

  const payload: CachedResponse = {
    status: response.status,
    body: response.body,
    createdAt: Date.now(),
  };
  const storageKey = buildStorageKey(scope, userId, idempotencyKey);
  const redis = await getRedisClient();
  if (redis) {
    try {
      await redis.set(storageKey, payload, { ex: ttlSeconds });
      return;
    } catch {
      // Fall back to in-memory cache.
    }
  }

  memoryStore.set(storageKey, {
    value: payload,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}
