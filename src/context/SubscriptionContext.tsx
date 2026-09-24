import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type SubscriptionPlan = 'free' | 'monthly' | 'annual';

interface SubscriptionContextType {
  isPro: boolean;
  plan: SubscriptionPlan;
  expiresAt: string | null;
  isProModalOpen: boolean;
  openProModal: () => void;
  closeProModal: () => void;
  activatePro: (plan: 'monthly' | 'annual', paymentMethod?: string) => Promise<void>;
  downgradeToFree: () => Promise<void>;
}

const STORAGE_KEY = '@financas/subscription-v1';

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<SubscriptionPlan>('free');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Carrega localmente inicialmente
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.plan) setPlan(parsed.plan);
        if (parsed.expiresAt) setExpiresAt(parsed.expiresAt);
      }
    } catch (e) {
      console.warn('Erro ao carregar status de assinatura local:', e);
    }
  }, []);

  // Se o usuário logar, sincroniza com o Firestore
  useEffect(() => {
    if (!user) return;
    const currentUserId = user.uid;

    let isMounted = true;
    async function loadCloudSubscription() {
      try {
        const subDocRef = doc(db, 'subscriptions', currentUserId);
        const subSnap = await getDoc(subDocRef);
        if (subSnap.exists() && isMounted) {
          const data = subSnap.data();
          if (data.plan && (data.plan === 'monthly' || data.plan === 'annual')) {
            setPlan(data.plan);
            setExpiresAt(data.expiresAt || null);
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ plan: data.plan, expiresAt: data.expiresAt || null })
            );
          }
        }
      } catch (err) {
        console.warn('Não foi possível verificar assinatura no Firestore:', err);
      }
    }

    loadCloudSubscription();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const isPro = plan === 'monthly' || plan === 'annual';

  const activatePro = async (selectedPlan: 'monthly' | 'annual', paymentMethod: string = 'PIX') => {
    const nextMonth = new Date();
    if (selectedPlan === 'monthly') {
      nextMonth.setMonth(nextMonth.getMonth() + 1);
    } else {
      nextMonth.setFullYear(nextMonth.getFullYear() + 1);
    }
    const expiry = nextMonth.toISOString();

    setPlan(selectedPlan);
    setExpiresAt(expiry);
    setIsProModalOpen(false);

    const subData = {
      plan: selectedPlan,
      expiresAt: expiry,
      activatedAt: new Date().toISOString(),
      paymentMethod,
      userId: user?.uid || 'local',
      userEmail: user?.email || 'anonimo',
      status: 'active',
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ plan: selectedPlan, expiresAt: expiry }));
    } catch (e) {
      console.warn('Erro ao salvar assinatura local:', e);
    }

    // Salva na nuvem no Firestore se o usuário estiver logado
    if (user?.uid) {
      try {
        await setDoc(doc(db, 'subscriptions', user.uid), subData, { merge: true });
      } catch (err) {
        console.warn('Erro ao salvar assinatura no Firestore:', err);
      }
    }
  };

  const downgradeToFree = async () => {
    setPlan('free');
    setExpiresAt(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Erro ao resetar assinatura local:', e);
    }

    if (user?.uid) {
      try {
        await setDoc(
          doc(db, 'subscriptions', user.uid),
          { plan: 'free', status: 'cancelled', cancelledAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (err) {
        console.warn('Erro ao cancelar assinatura no Firestore:', err);
      }
    }
  };

  const openProModal = () => setIsProModalOpen(true);
  const closeProModal = () => setIsProModalOpen(false);

  return (
    <SubscriptionContext.Provider
      value={{
        isPro,
        plan,
        expiresAt,
        isProModalOpen,
        openProModal,
        closeProModal,
        activatePro,
        downgradeToFree,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription deve ser usado dentro de um SubscriptionProvider');
  }
  return context;
}
