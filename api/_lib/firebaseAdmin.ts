import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function requiredEnv(name: string): string {
  const value = (process.env[name] || '').trim();
  if (!value) throw new Error(`${name} não configurado na Vercel.`);
  return value;
}

const projectId = requiredEnv('FIREBASE_PROJECT_ID');
const clientEmail = requiredEnv('FIREBASE_CLIENT_EMAIL');
const privateKey = requiredEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');
const databaseId = (process.env.FIRESTORE_DATABASE_ID || '(default)').trim();

const adminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      });

export const adminAuth = getAuth(adminApp);
export const adminDb =
  databaseId && databaseId !== '(default)'
    ? getFirestore(adminApp, databaseId)
    : getFirestore(adminApp);

export const firestoreDatabaseId = databaseId;
