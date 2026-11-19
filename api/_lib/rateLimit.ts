/**
 * Per-user fixed-window rate limit stored in Firestore (collection "rateLimits", denied to clients by
 * the default rule). Protects the shared free AI quotas from a single user or script draining them.
 */

type AdminDb = typeof import('./firebaseAdmin.js')['adminDb'];

export interface RateLimitConfig {
  perHour: number;
  perDay: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  remainingHour: number;
  remainingDay: number;
}

function positiveInt(raw: string | undefined, fallback: number): number {
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Defaults: 20/hour and 100/day; admins get 60/hour and 300/day. Overridable via env. */
export function danteLimits(isAdmin: boolean, env: NodeJS.ProcessEnv = process.env): RateLimitConfig {
  return isAdmin
    ? { perHour: positiveInt(env.DANTE_ADMIN_LIMIT_HOUR, 60), perDay: positiveInt(env.DANTE_ADMIN_LIMIT_DAY, 300) }
    : { perHour: positiveInt(env.DANTE_LIMIT_HOUR, 20), perDay: positiveInt(env.DANTE_LIMIT_DAY, 100) };
}

/** Counts one request for `key` if within limits; atomic across concurrent serverless instances. */
export async function consumeRateLimit(adminDb: AdminDb, key: string, limits: RateLimitConfig, nowMs = Date.now()): Promise<RateLimitResult> {
  const hourWindow = Math.floor(nowMs / 3_600_000);
  const dayWindow = Math.floor(nowMs / 86_400_000);
  const ref = adminDb.collection('rateLimits').doc(key);
  return adminDb.runTransaction(async (tx) => {
    const data = (await tx.get(ref)).data() ?? {};
    const hourCount = data.hourWindow === hourWindow ? Number(data.hourCount) || 0 : 0;
    const dayCount = data.dayWindow === dayWindow ? Number(data.dayCount) || 0 : 0;
    if (hourCount >= limits.perHour || dayCount >= limits.perDay) {
      const retryAfterSeconds = dayCount >= limits.perDay
        ? Math.ceil(((dayWindow + 1) * 86_400_000 - nowMs) / 1000)
        : Math.ceil(((hourWindow + 1) * 3_600_000 - nowMs) / 1000);
      return { allowed: false, retryAfterSeconds, remainingHour: Math.max(0, limits.perHour - hourCount), remainingDay: Math.max(0, limits.perDay - dayCount) };
    }
    tx.set(ref, { hourWindow, hourCount: hourCount + 1, dayWindow, dayCount: dayCount + 1, updatedAt: nowMs }, { merge: true });
    return { allowed: true, retryAfterSeconds: 0, remainingHour: limits.perHour - hourCount - 1, remainingDay: limits.perDay - dayCount - 1 };
  });
}

export function formatWait(seconds: number): string {
  if (seconds >= 3600) return `${Math.ceil(seconds / 3600)} hora(s)`;
  if (seconds >= 60) return `${Math.ceil(seconds / 60)} minuto(s)`;
  return `${seconds} segundo(s)`;
}
