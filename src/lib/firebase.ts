import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import rawConfig from '../../firebase-applet-config.json';

const officialConfig = {
  apiKey: "AIzaSyDyvmiKY-Ppygm0XUZ3gYnH_EfZzk2cbCU",
  authDomain: "jornada-do-sucesso-501fa.firebaseapp.com",
  projectId: "jornada-do-sucesso-501fa",
  storageBucket: "jornada-do-sucesso-501fa.firebasestorage.app",
  messagingSenderId: "184133774893",
  appId: "1:184133774893:web:cfc129f77d0b1e5dd852a4",
  measurementId: "G-YHGG0G16QM"
};

const firebaseConfig = { ...officialConfig, ...rawConfig };

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Config prompt to ensure account selection popup works smoothly
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error('Google Sign-In error:', error);
    let friendlyMsg = error.message || 'Falha ao autenticar com o Google';
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

    if (error.code === 'auth/unauthorized-domain') {
      friendlyMsg = `Domínio não autorizado pelo Firebase (${currentHost}). Adicione "${currentHost}" nos Domínios Autorizados do Console do Firebase (Authentication > Configurações > Domínios Autorizados).`;
    } else if (error.code === 'auth/popup-closed-by-user') {
      friendlyMsg = 'A janela de login do Google foi fechada antes de concluir.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      friendlyMsg = 'Operação cancelada. Tente novamente.';
    } else if (error.code === 'auth/popup-blocked') {
      friendlyMsg = 'O navegador bloqueou a janela pop-up do Google. Permita pop-ups para este site.';
    }

    return { user: null, error: friendlyMsg };
  }
}

export async function logOut() {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

export { onAuthStateChanged };
export type { User };
