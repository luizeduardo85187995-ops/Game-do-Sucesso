import React, { createContext, useContext, useState, useEffect } from 'react';

export type SubscriptionPlan = 'free' | 'monthly' | 'annual';

interface SubscriptionContextType {
  isPro: boolean;
  plan: SubscriptionPlan;
  expiresAt: string | null;
  isProModalOpen: boolean;
  openProModal: () => void;
  closeProModal: () => void;
  activatePro: (plan: 'monthly' | 'annual') => void;
  downgradeToFree: () => void;
}

const STORAGE_KEY = '@financas/subscription-v1';

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<SubscriptionPlan>('free');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.plan) setPlan(parsed.plan);
        if (parsed.expiresAt) setExpiresAt(parsed.expiresAt);
      }
    } catch (e) {
      console.warn('Erro ao carregar status de assinatura:', e);
    }
  }, []);

  const isPro = plan === 'monthly' || plan === 'annual';

  const activatePro = (selectedPlan: 'monthly' | 'annual') => {
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

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ plan: selectedPlan, expiresAt: expiry })
      );
    } catch (e) {
      console.warn('Erro ao salvar assinatura:', e);
    }
  };

  const downgradeToFree = () => {
    setPlan('free');
    setExpiresAt(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Erro ao resetar assinatura:', e);
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
