import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, getDocFromServer, setDoc } from 'firebase/firestore';

export type SubscriptionPlan = 'free' | 'monthly' | 'annual';

export interface VerificationResult {
  active: boolean;
  message: string;
  plan?: SubscriptionPlan;
  expiresAt?: string;
}

interface SubscriptionContextType {
  isPro: boolean;
  plan: SubscriptionPlan;
  expiresAt: string | null;
  isChecking: boolean;
  isProModalOpen: boolean;
  openProModal: () => void;
  closeProModal: () => void;
  verifySubscription: () => Promise<VerificationResult>;
  adminGrantSubscription: (targetUid?: string, selectedPlan?: 'monthly' | 'annual') => Promise<{ success: boolean; message: string }>;
  downgradeToFree: () => Promise<void>;
  activatePro: (plan: 'monthly' | 'annual', paymentMethod?: string) => Promise<void>; // compatibilidade: nunca concede PRO a usuário comum
}

const STORAGE_KEY_PREFIX = '@financas/sub_';

function isSubscriptionActive(plan: SubscriptionPlan, expiresAt: string | null): boolean {
  if (plan !== 'monthly' && plan !== 'annual') return false;
  if (!expiresAt || typeof expiresAt !== 'string') return false;
  const expTime = new Date(expiresAt).getTime();
  if (isNaN(expTime) || expTime <= Date.now()) return false;
  return true;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [plan, setPlan] = useState<SubscriptionPlan>('free');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  const currentStorageKey = user ? `${STORAGE_KEY_PREFIX}${user.uid}` : `${STORAGE_KEY_PREFIX}guest`;

  const claimPendingSubscription = async () => {
    if (!user?.uid) return;
    try {
      const idToken = await user.getIdToken();
      await fetch('/api/subscriptions/claim-pending', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
    } catch (err) {
      // O endpoint é complementar. A consulta autoritativa ao Firestore continua abaixo.
      console.warn('Não foi possível verificar assinatura pendente:', err);
    }
  };

  // 1. CARREGAMENTO INICIAL: FIRESTORE É A ÚNICA AUTORIDADE DE ACESSO PRO.
  // O localStorage permanece apenas como cache informativo e nunca concede privilégio.
  useEffect(() => {
    let isMounted = true;

    if (!user?.uid) {
      setPlan('free');
      setExpiresAt(null);
      try {
        localStorage.removeItem(currentStorageKey);
      } catch {
        // ignore
      }
      return;
    }

    const uid = user.uid;
    const userCacheKey = `${STORAGE_KEY_PREFIX}${uid}`;

    // Enquanto o servidor não confirma, o usuário permanece FREE.
    setPlan('free');
    setExpiresAt(null);

    async function loadRemoteSubscription() {
      try {
        // Se um pagamento chegou antes do primeiro login, tenta vinculá-lo ao UID real.
        try {
          const idToken = await user.getIdToken();
          await fetch('/api/subscriptions/claim-pending', {
            method: 'POST',
            headers: { Authorization: `Bearer ${idToken}` },
          });
        } catch {
          // Não bloqueia a consulta principal caso o backend esteja temporariamente indisponível.
        }

        const subDocRef = doc(db, 'subscriptions', uid);
        const subSnap = await getDocFromServer(subDocRef);
        if (!isMounted) return;

        if (subSnap.exists()) {
          const data = subSnap.data();
          if (isSubscriptionActive(data?.plan, data?.expiresAt)) {
            setPlan(data.plan);
            setExpiresAt(data.expiresAt);
            try {
              localStorage.setItem(
                userCacheKey,
                JSON.stringify({ plan: data.plan, expiresAt: data.expiresAt, verifiedAt: new Date().toISOString() })
              );
            } catch {
              // ignore
            }
            return;
          }
        }

        setPlan('free');
        setExpiresAt(null);
        try {
          localStorage.removeItem(userCacheKey);
        } catch {
          // ignore
        }
      } catch (err) {
        // Falha fechada: sem confirmação remota, cache local não concede PRO.
        setPlan('free');
        setExpiresAt(null);
        console.warn('Verificação de assinatura remota indisponível:', err);
      }
    }

    loadRemoteSubscription();

    return () => {
      isMounted = false;
    };
  }, [user, currentStorageKey]);

  // isPro rigoroso: apenas verdadeiro se plano for mensal ou anual E data for válida e futura
  const isPro = isSubscriptionActive(plan, expiresAt);

  // 2. VERIFICAÇÃO ATIVA DO PAGAMENTO (Bate no servidor do Firestore com getDocFromServer)
  const verifySubscription = async (): Promise<VerificationResult> => {
    if (!user?.uid) {
      return {
        active: false,
        message: 'Para verificar sua assinatura, conecte primeiro sua conta Google.',
      };
    }

    setIsChecking(true);
    const uid = user.uid;
    const userCacheKey = `${STORAGE_KEY_PREFIX}${uid}`;

    try {
      await claimPendingSubscription();
      const subDocRef = doc(db, 'subscriptions', uid);
      // Força consulta direta ao servidor ignorando qualquer cache local
      const subSnap = await getDocFromServer(subDocRef);

      if (subSnap.exists()) {
        const data = subSnap.data();
        if (isSubscriptionActive(data?.plan, data?.expiresAt)) {
          setPlan(data.plan);
          setExpiresAt(data.expiresAt);
          try {
            localStorage.setItem(
              userCacheKey,
              JSON.stringify({ plan: data.plan, expiresAt: data.expiresAt, verifiedAt: new Date().toISOString() })
            );
          } catch {
            // ignore
          }
          setIsChecking(false);
          return {
            active: true,
            plan: data.plan,
            expiresAt: data.expiresAt,
            message: `Pagamento confirmado com sucesso! Seu plano VIP PRO está ativo até ${new Date(data.expiresAt).toLocaleDateString('pt-BR')}.`,
          };
        }
      }

      // Se não há documento ativo no Firestore
      setPlan('free');
      setExpiresAt(null);
      try {
        localStorage.removeItem(userCacheKey);
      } catch {
        // ignore
      }
      setIsChecking(false);
      return {
        active: false,
        message: 'Aguardando confirmação do pagamento pelo gateway da Kiwify. Se você acabou de pagar no cartão ou PIX, aguarde alguns instantes e tente novamente.',
      };
    } catch (e: any) {
      setIsChecking(false);
      return {
        active: false,
        message: 'Não foi possível contatar o servidor de assinaturas no momento. Verifique sua conexão e tente novamente.',
      };
    }
  };

  // 3. CONCESSÃO ADMINISTRATIVA REAL NO FIRESTORE (Apenas administradores autenticados)
  const adminGrantSubscription = async (
    targetUid?: string,
    selectedPlan: 'monthly' | 'annual' = 'monthly'
  ): Promise<{ success: boolean; message: string }> => {
    if (!isAdmin) {
      return {
        success: false,
        message: 'Acesso negado: apenas administradores autorizados podem emitir assinaturas.',
      };
    }

    const uidToGrant = targetUid || user?.uid;
    if (!uidToGrant) {
      return {
        success: false,
        message: 'UID de usuário inválido para concessão.',
      };
    }

    const nextDate = new Date();
    if (selectedPlan === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    const expiry = nextDate.toISOString();

    try {
      const subDocRef = doc(db, 'subscriptions', uidToGrant);
      // Grava no Firestore através da regra isAdmin() autorizada
      await setDoc(
        subDocRef,
        {
          plan: selectedPlan,
          expiresAt: expiry,
          updatedAt: new Date().toISOString(),
          paymentMethod: 'Admin Override',
          grantedBy: user?.email,
        },
        { merge: true }
      );

      // Se for para a conta atualmente conectada, atualiza o estado
      if (uidToGrant === user?.uid) {
        setPlan(selectedPlan);
        setExpiresAt(expiry);
        try {
          localStorage.setItem(
            `${STORAGE_KEY_PREFIX}${uidToGrant}`,
            JSON.stringify({ plan: selectedPlan, expiresAt: expiry, verifiedAt: new Date().toISOString() })
          );
        } catch {
          // ignore
        }
      }

      return {
        success: true,
        message: `Assinatura PRO (${selectedPlan}) gravada no Firestore com sucesso para ${uidToGrant}!`,
      };
    } catch (err: any) {
      console.error('Erro ao gravar assinatura no Firestore:', err);
      return {
        success: false,
        message: `Falha ao gravar assinatura no Firestore: ${err.message || 'Erro de permissão'}`,
      };
    }
  };

  const downgradeToFree = async () => {
    if (isAdmin && user?.uid) {
      try {
        await setDoc(
          doc(db, 'subscriptions', user.uid),
          {
            plan: 'free',
            expiresAt: null,
            status: 'admin_revoked',
            updatedAt: new Date().toISOString(),
            paymentMethod: 'Admin Override',
            grantedBy: user.email,
          },
          { merge: true }
        );
      } catch (e) {
        console.error('Não foi possível remover a assinatura no Firestore:', e);
        return;
      }
    }

    setPlan('free');
    setExpiresAt(null);
    try {
      localStorage.removeItem(currentStorageKey);
    } catch (e) {
      console.warn('Erro ao resetar assinatura local:', e);
    }
  };

  // Stub de compatibilidade que redireciona para a verificação remota
  const activatePro = async (selectedPlan: 'monthly' | 'annual', _paymentMethod?: string) => {
    if (isAdmin) {
      await adminGrantSubscription(user?.uid, selectedPlan);
    } else {
      await verifySubscription();
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
        isChecking,
        isProModalOpen,
        openProModal,
        closeProModal,
        verifySubscription,
        adminGrantSubscription,
        downgradeToFree,
        activatePro,
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
