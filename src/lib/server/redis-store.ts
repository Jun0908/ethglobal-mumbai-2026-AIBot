import "server-only";
import { Redis } from "@upstash/redis";
import { randomUUID } from "node:crypto";
import { decrypt, encrypt } from "../crypto";

let client: Redis | undefined;
const namespace = () => `masala:${process.env.VERCEL_ENV || "development"}:`;
export const sharedName = (name: string) => namespace() + name;

export function sharedRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (Boolean(url) !== Boolean(token)) throw new Error("Both Upstash Redis credentials are required");
  if (!url || !token) {
    if (process.env.VERCEL) throw new Error("Vercel requires Upstash Redis for persistent state");
    return null;
  }
  return client ??= new Redis({ url, token });
}

export async function sharedRead<T>(name: string, key: Buffer): Promise<T | null> {
  const redis = sharedRedis();
  if (!redis) return null;
  const value = await redis.get<ReturnType<typeof encrypt>>(sharedName(name));
  return value ? decrypt(value, key) as T : null;
}

export async function sharedWrite(name: string, value: unknown, key: Buffer, expiresAt?: number) {
  const redis = sharedRedis();
  if (!redis) throw new Error("Shared storage is unavailable");
  const ttl = expiresAt ? Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000)) : undefined;
  await redis.set(sharedName(name), encrypt(value, key), ttl ? { ex: ttl } : undefined);
}

export async function sharedKeys(pattern: string): Promise<string[]> {
  const redis = sharedRedis();
  if (!redis) return [];
  let cursor = "0";
  const keys: string[] = [];
  do {
    const page = await redis.scan(cursor, { match: sharedName(pattern), count: 100 });
    cursor = page[0];
    keys.push(...page[1].map(name => name.slice(namespace().length)));
  } while (cursor !== "0");
  return keys;
}

export async function sharedLock<T>(name: string, run: () => Promise<T>): Promise<T> {
  const redis = sharedRedis();
  if (!redis) return run();
  const token = randomUUID();
  const lockKey = sharedName(`lock:${name}`);
  const acquired = await redis.set(lockKey, token, { nx: true, px: 120_000 });
  if (!acquired) throw new Error("LOCKED");
  try { return await run(); }
  finally {
    await redis.eval("if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end", [lockKey], [token]);
  }
}
