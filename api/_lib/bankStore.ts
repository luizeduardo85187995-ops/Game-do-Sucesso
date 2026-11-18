import type { BankSnapshot, BankTxAnnotation } from '../../src/types/openFinance.js';
import { fetchPersonalSnapshot, readPersonalConfig, snapshotFingerprint } from './pluggyPersonal.js';

const REFRESH_AFTER_MS = 12 * 60 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;
const MAX_ANNOTATIONS = 5000;

type AdminDb = typeof import('./firebaseAdmin.js')['adminDb'];

export interface OwnerBankData {
  snapshots: BankSnapshot[];
  annotations: Record<string, BankTxAnnotation>;
  missingMonths: string[];
}

export function lastMonths(count: number, now = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });
}

function sanitizeAnnotations(raw: unknown): Record<string, BankTxAnnotation> {
  // The client stores a list of { key, category, note, updatedAt }; a legacy map is also accepted.
  const entries: Array<[string, unknown]> = Array.isArray(raw)
    ? raw.filter((e): e is Record<string, unknown> => !!e && typeof e === 'object' && typeof (e as Record<string, unknown>).key === 'string').map(e => [e.key as string, e])
    : raw && typeof raw === 'object' ? Object.entries(raw as Record<string, unknown>) : [];
  const out: Record<string, BankTxAnnotation> = {};
  for (const [key, value] of entries.slice(0, MAX_ANNOTATIONS)) {
    if (!/^[\w-]{1,80}:[\w-]{1,80}$/.test(key) || !value || typeof value !== 'object') continue;
    const v = value as Record<string, unknown>;
    out[key] = {
      category: typeof v.category === 'string' ? v.category.slice(0, 60) : undefined,
      note: typeof v.note === 'string' ? v.note.slice(0, 200) : undefined,
      updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt.slice(0, 30) : '',
    };
  }
  return out;
}

/**
 * Loads the owner's saved monthly snapshots (only those matching the current configuration) and the
 * user's category/note annotations. Refreshes the current month from the provider when it is missing or
 * older than 12h, respecting the same per-owner cooldown used by /api/open-finance.
 * Returns null when the caller is not the configured owner or the integration is not configured.
 */
export async function loadOwnerBankData(adminDb: AdminDb, uid: string, env: NodeJS.ProcessEnv = process.env, months = 3): Promise<OwnerBankData | null> {
  const owner = env.OPEN_FINANCE_OWNER_UID?.trim();
  if (!owner || uid !== owner) return null;
  const config = readPersonalConfig(env);
  if (!config) return null;
  const fingerprint = snapshotFingerprint(config);
  const userRoot = adminDb.collection('openFinancePrivate').doc(uid);
  const wanted = lastMonths(months);

  const docs = await Promise.all(wanted.map(m => userRoot.collection('months').doc(m).get()));
  const byMonth = new Map<string, BankSnapshot>();
  docs.forEach((d, i) => {
    const data = d.data();
    if (data?.fingerprint === fingerprint && data.snapshot) byMonth.set(wanted[i], data.snapshot as BankSnapshot);
  });

  const current = wanted[0];
  const cached = byMonth.get(current);
  if (!cached || Date.now() - Date.parse(cached.fetchedAt) > REFRESH_AFTER_MS) {
    try {
      const allowed = await adminDb.runTransaction(async tx => {
        const state = (await tx.get(userRoot)).data();
        if (typeof state?.lastAttemptAt === 'number' && Date.now() - state.lastAttemptAt < COOLDOWN_MS) return false;
        tx.set(userRoot, { lastAttemptAt: Date.now() }, { merge: true });
        return true;
      });
      if (allowed) {
        const fresh = await fetchPersonalSnapshot(config, current);
        await userRoot.collection('months').doc(current).set({ fingerprint, snapshot: fresh });
        byMonth.set(current, fresh);
      }
    } catch {
      // Provider failure must not block the conversation: the analysis states which months are missing.
    }
  }

  const stateDoc = await adminDb.collection('users').doc(uid).collection('financialData').doc('state').get();
  return {
    snapshots: [...byMonth.values()],
    annotations: sanitizeAnnotations(stateDoc.data()?.bankTxAnnotations),
    missingMonths: wanted.filter(m => !byMonth.has(m)),
  };
}
