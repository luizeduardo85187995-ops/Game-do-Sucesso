import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

export type AppTheme = 'cyber_dark' | 'pro_light' | 'midnight' | 'emerald';
export type AppCurrency = 'BRL' | 'USD' | 'EUR';
export type AdDisplayMode = 'custom_ads' | 'adsense' | 'mixed';

export interface CustomAd {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  cta: string;
  url: string;
  promoCode?: string;
  legalUrl?: string;
  disclaimer?: string;
  badgeColor?: string;
  active: boolean;
  updatedAt?: string;
}

export const DEFAULT_CUSTOM_ADS: CustomAd[] = [
  {
    id: 'ad-nomad-luiz',
    tag: 'CONTA GLOBAL NOMAD',
    title: 'Nomad: Taxa de conversão 0% na 1ª operação com código 8F1TYE2SE3',
    subtitle: 'Ganhe taxa 0% em até US$ 1.000 ou € 1.000 em até 15 dias após aprovação para investir nos EUA!',
    cta: 'Abrir Conta Nomad',
    url: 'https://nomad.onelink.me/wIQT/Invest?code=8F1TYE2SE3%26n=Luiz',
    promoCode: '8F1TYE2SE3',
    legalUrl: 'https://www.nomadglobal.com/legal',
    disclaimer: '#GlobalDTVM #IntermediacaoGlobalDTVM #NomadFintechInc #SECRIA',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    active: true,
  },
  {
    id: 'ad-b3-oficial',
    tag: 'RENDA PASSIVA B3',
    title: 'Área do Investidor B3: Acompanhe seus Dividendos',
    subtitle: 'Consolide suas ações, FIIs e tesouro direto com segurança oficial.',
    cta: 'Acessar B3',
    url: 'https://investidor.b3.com.br',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    active: true,
  },
  {
    id: 'ad-remessa-online',
    tag: 'CÂMBIO & INVESTIMENTOS',
    title: 'Remessa Online: Envie e receba remessas internacionais com menor custo',
    subtitle: 'Taxas reduzidas para investidores e desenvolvedores globais.',
    cta: 'Conhecer',
    url: 'https://www.remessaonline.com.br',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    active: true,
  },
];

// Preferências Pessoais (Armazenadas estritamente no dispositivo local do usuário)
export interface PersonalPreferences {
  theme: AppTheme;
  hideValues: boolean;
  visualEffects: boolean;
  soundEffects: boolean;
  compactDensity: boolean;
  currency: AppCurrency;
  budgetClosingDay: number;
  savingsTargetRate: number;
  highExpenseAlert: number;
}

// Configurações Comerciais Globais (Armazenadas e sincronizadas via Firestore na Nuvem)
export interface CommercialSettings {
  kiwifyMonthlyUrl: string;
  kiwifyAnnualUrl: string;
  checkoutUrl: string;
  pixKey: string;
  pixName: string;
  adDisplayMode: AdDisplayMode;
  googleAdSenseClientId: string;
  googleAdSenseSlotId: string;
  affiliateCustomUrl: string;
  customAds: CustomAd[];
  isCloudSynced: boolean;
}

export interface AppSettings extends PersonalPreferences, CommercialSettings {}

interface SettingsContextValue extends AppSettings {
  // Ações de Preferência Pessoal
  setTheme: (theme: AppTheme) => void;
  setHideValues: (hide: boolean) => void;
  toggleHideValues: () => void;
  setVisualEffects: (enable: boolean) => void;
  setSoundEffects: (enable: boolean) => void;
  setCompactDensity: (compact: boolean) => void;
  setCurrency: (currency: AppCurrency) => void;
  setBudgetClosingDay: (day: number) => void;
  setSavingsTargetRate: (rate: number) => void;
  setHighExpenseAlert: (threshold: number) => void;
  formatMoney: (value: number, forceShow?: boolean) => string;

  // Ações Comerciais Globais (Nuvem Firestore)
  setGoogleAdSenseClientId: (id: string) => Promise<void>;
  setGoogleAdSenseSlotId: (id: string) => Promise<void>;
  setAffiliateCustomUrl: (url: string) => Promise<void>;
  setPixKey: (key: string) => Promise<void>;
  setPixName: (name: string) => Promise<void>;
  setCheckoutUrl: (url: string) => Promise<void>;
  setKiwifyMonthlyUrl: (url: string) => Promise<void>;
  setKiwifyAnnualUrl: (url: string) => Promise<void>;
  setAdDisplayMode: (mode: AdDisplayMode) => Promise<void>;
  updateCommercialSettings: (newSettings: Partial<CommercialSettings>) => Promise<boolean>;
  setCustomAds: (ads: CustomAd[]) => Promise<void>;
  addCustomAd: (ad: Omit<CustomAd, 'id'>) => Promise<string>;
  updateCustomAd: (id: string, ad: Partial<CustomAd>) => Promise<boolean>;
  deleteCustomAd: (id: string) => Promise<boolean>;
  refreshCommercialFromCloud: () => Promise<void>;
}

const DEFAULT_PERSONAL_PREFERENCES: PersonalPreferences = {
  theme: 'cyber_dark',
  hideValues: false,
  visualEffects: true,
  soundEffects: true,
  compactDensity: false,
  currency: 'BRL',
  budgetClosingDay: 1,
  savingsTargetRate: 20,
  highExpenseAlert: 1500,
};

const DEFAULT_COMMERCIAL_SETTINGS: CommercialSettings = {
  kiwifyMonthlyUrl: 'https://pay.kiwify.com.br/DCGRpFb',
  kiwifyAnnualUrl: 'https://pay.kiwify.com.br/09lfPE1',
  checkoutUrl: 'https://pay.kiwify.com.br/DCGRpFb',
  pixKey: 'luizeduardo85187995@gmail.com',
  pixName: 'Luiz Eduardo',
  adDisplayMode: 'custom_ads',
  googleAdSenseClientId: 'ca-pub-4819281615715588',
  googleAdSenseSlotId: '',
  affiliateCustomUrl: '',
  customAds: DEFAULT_CUSTOM_ADS,
  isCloudSynced: false,
};

const PREFERENCES_STORAGE_KEY = '@financas/user_preferences_v1';
const COMMERCIAL_CACHE_KEY = '@financas/commercial_cache_v1';
const CUSTOM_ADS_CACHE_KEY = '@financas/custom_ads_cache_v1';

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // 1. Estado de preferências pessoais locais
  const [personal, setPersonal] = useState<PersonalPreferences>(() => {
    try {
      const saved = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PERSONAL_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_PERSONAL_PREFERENCES;
  });

  // 2. Estado de configurações comerciais globais (Nuvem Firestore com cache local)
  const [commercial, setCommercial] = useState<CommercialSettings>(() => {
    try {
      const savedComm = localStorage.getItem(COMMERCIAL_CACHE_KEY);
      const savedAds = localStorage.getItem(CUSTOM_ADS_CACHE_KEY);
      let parsedComm = savedComm ? JSON.parse(savedComm) : {};
      let parsedAds = savedAds ? JSON.parse(savedAds) : DEFAULT_CUSTOM_ADS;
      return {
        ...DEFAULT_COMMERCIAL_SETTINGS,
        ...parsedComm,
        customAds: Array.isArray(parsedAds) && parsedAds.length > 0 ? parsedAds : DEFAULT_CUSTOM_ADS,
        isCloudSynced: false,
      };
    } catch {
      return DEFAULT_COMMERCIAL_SETTINGS;
    }
  });

  // Salva preferências pessoais no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(personal));
    } catch {
      // ignore
    }
  }, [personal]);

  // Aplica classe de tema dinamicamente
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-cyber_dark', 'theme-pro_light', 'theme-midnight', 'theme-emerald');
    root.classList.add(`theme-${personal.theme}`);
    if (personal.theme === 'pro_light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }

    const themeColors: Record<AppTheme, string> = {
      cyber_dark: '#030712',
      pro_light: '#f8fafc',
      midnight: '#000000',
      emerald: '#021a12',
    };
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColors[personal.theme] || '#030712');
    }
  }, [personal.theme]);

  // 3. SINCRONIZAÇÃO EM TEMPO REAL COM O FIRESTORE (Configurações Comerciais e Anúncios Globais)
  useEffect(() => {
    let isSubscribed = true;

    // A. Ouvinte para /config/commercial
    const commercialDocRef = doc(db, 'config', 'commercial');
    const unsubCommercial = onSnapshot(
      commercialDocRef,
      (docSnap) => {
        if (!isSubscribed) return;
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCommercial((prev) => {
            const updated = {
              ...prev,
              kiwifyMonthlyUrl: data.kiwifyMonthlyUrl ?? prev.kiwifyMonthlyUrl,
              kiwifyAnnualUrl: data.kiwifyAnnualUrl ?? prev.kiwifyAnnualUrl,
              checkoutUrl: data.checkoutUrl ?? prev.checkoutUrl,
              pixKey: data.pixKey ?? prev.pixKey,
              pixName: data.pixName ?? prev.pixName,
              adDisplayMode: data.adDisplayMode ?? prev.adDisplayMode,
              googleAdSenseClientId: data.googleAdSenseClientId ?? prev.googleAdSenseClientId,
              googleAdSenseSlotId: data.googleAdSenseSlotId ?? prev.googleAdSenseSlotId,
              affiliateCustomUrl: data.affiliateCustomUrl ?? prev.affiliateCustomUrl,
              isCloudSynced: true,
            };
            try {
              localStorage.setItem(COMMERCIAL_CACHE_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      },
      (err) => {
        console.warn('Ouvinte de configurações comerciais offline ou restrito:', err);
      }
    );

    // B. Ouvinte para /customAds (Coleção Global de Anúncios)
    const adsColRef = collection(db, 'customAds');
    const unsubAds = onSnapshot(
      adsColRef,
      (querySnap) => {
        if (!isSubscribed) return;
        if (!querySnap.empty) {
          const loadedAds: CustomAd[] = [];
          querySnap.forEach((d) => {
            const adData = d.data() as CustomAd;
            loadedAds.push({ ...adData, id: d.id });
          });
          setCommercial((prev) => {
            const updated = { ...prev, customAds: loadedAds, isCloudSynced: true };
            try {
              localStorage.setItem(CUSTOM_ADS_CACHE_KEY, JSON.stringify(loadedAds));
            } catch {}
            return updated;
          });
        }
      },
      (err) => {
        console.warn('Ouvinte de anúncios customizados offline ou restrito:', err);
      }
    );

    return () => {
      isSubscribed = false;
      unsubCommercial();
      unsubAds();
    };
  }, []);

  const refreshCommercialFromCloud = useCallback(async () => {
    try {
      const commSnap = await getDoc(doc(db, 'config', 'commercial'));
      if (commSnap.exists()) {
        const data = commSnap.data();
        setCommercial((prev) => ({
          ...prev,
          ...data,
          isCloudSynced: true,
        }));
      }

      const adsSnap = await getDocs(collection(db, 'customAds'));
      if (!adsSnap.empty) {
        const loaded: CustomAd[] = [];
        adsSnap.forEach((d) => loaded.push({ ...(d.data() as CustomAd), id: d.id }));
        setCommercial((prev) => ({
          ...prev,
          customAds: loaded,
          isCloudSynced: true,
        }));
      }
    } catch (e) {
      console.warn('Falha ao atualizar configurações comerciais da nuvem:', e);
    }
  }, []);

  // Setters de Preferências Pessoais
  const setTheme = (theme: AppTheme) => setPersonal((p) => ({ ...p, theme }));
  const setHideValues = (hideValues: boolean) => setPersonal((p) => ({ ...p, hideValues }));
  const toggleHideValues = () => setPersonal((p) => ({ ...p, hideValues: !p.hideValues }));
  const setVisualEffects = (visualEffects: boolean) => setPersonal((p) => ({ ...p, visualEffects }));
  const setSoundEffects = (soundEffects: boolean) => setPersonal((p) => ({ ...p, soundEffects }));
  const setCompactDensity = (compactDensity: boolean) => setPersonal((p) => ({ ...p, compactDensity }));
  const setCurrency = (currency: AppCurrency) => setPersonal((p) => ({ ...p, currency }));
  const setBudgetClosingDay = (budgetClosingDay: number) => setPersonal((p) => ({ ...p, budgetClosingDay }));
  const setSavingsTargetRate = (savingsTargetRate: number) => setPersonal((p) => ({ ...p, savingsTargetRate }));
  const setHighExpenseAlert = (highExpenseAlert: number) => setPersonal((p) => ({ ...p, highExpenseAlert }));

  // Setters de Configurações Comerciais Globais (Nuvem Firestore)
  const updateCommercialSettings = async (newFields: Partial<CommercialSettings>): Promise<boolean> => {
    setCommercial((prev) => {
      const updated = { ...prev, ...newFields };
      try {
        localStorage.setItem(COMMERCIAL_CACHE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      const commRef = doc(db, 'config', 'commercial');
      await setDoc(
        commRef,
        {
          ...newFields,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return true;
    } catch (err) {
      console.warn('Configuração salva localmente; erro ao enviar para nuvem:', err);
      return false;
    }
  };

  const setGoogleAdSenseClientId = async (googleAdSenseClientId: string) => {
    await updateCommercialSettings({ googleAdSenseClientId });
  };

  const setGoogleAdSenseSlotId = async (googleAdSenseSlotId: string) => {
    await updateCommercialSettings({ googleAdSenseSlotId });
  };

  const setAffiliateCustomUrl = async (affiliateCustomUrl: string) => {
    await updateCommercialSettings({ affiliateCustomUrl });
  };

  const setPixKey = async (pixKey: string) => {
    await updateCommercialSettings({ pixKey });
  };

  const setPixName = async (pixName: string) => {
    await updateCommercialSettings({ pixName });
  };

  const setCheckoutUrl = async (checkoutUrl: string) => {
    await updateCommercialSettings({ checkoutUrl });
  };

  const setKiwifyMonthlyUrl = async (kiwifyMonthlyUrl: string) => {
    await updateCommercialSettings({ kiwifyMonthlyUrl });
  };

  const setKiwifyAnnualUrl = async (kiwifyAnnualUrl: string) => {
    await updateCommercialSettings({ kiwifyAnnualUrl });
  };

  const setAdDisplayMode = async (adDisplayMode: AdDisplayMode) => {
    await updateCommercialSettings({ adDisplayMode });
  };

  const setCustomAds = async (customAds: CustomAd[]) => {
    setCommercial((prev) => ({ ...prev, customAds }));
    try {
      localStorage.setItem(CUSTOM_ADS_CACHE_KEY, JSON.stringify(customAds));
    } catch {}
  };

  const addCustomAd = async (newAdData: Omit<CustomAd, 'id'>): Promise<string> => {
    const newId = `ad-${Date.now()}`;
    const newAd: CustomAd = {
      ...newAdData,
      id: newId,
      updatedAt: new Date().toISOString(),
    };

    setCommercial((prev) => {
      const updated = [newAd, ...prev.customAds];
      try {
        localStorage.setItem(CUSTOM_ADS_CACHE_KEY, JSON.stringify(updated));
      } catch {}
      return { ...prev, customAds: updated };
    });

    try {
      await setDoc(doc(db, 'customAds', newId), newAd);
    } catch (err) {
      console.warn('Anúncio salvo em cache local; erro ao gravar no Firestore:', err);
    }

    return newId;
  };

  const updateCustomAd = async (id: string, updatedFields: Partial<CustomAd>): Promise<boolean> => {
    setCommercial((prev) => {
      const updated = prev.customAds.map((ad) =>
        ad.id === id ? { ...ad, ...updatedFields, updatedAt: new Date().toISOString() } : ad
      );
      try {
        localStorage.setItem(CUSTOM_ADS_CACHE_KEY, JSON.stringify(updated));
      } catch {}
      return { ...prev, customAds: updated };
    });

    try {
      await setDoc(doc(db, 'customAds', id), { ...updatedFields, updatedAt: new Date().toISOString() }, { merge: true });
      return true;
    } catch (err) {
      console.warn('Erro ao atualizar anúncio no Firestore:', err);
      return false;
    }
  };

  const deleteCustomAd = async (id: string): Promise<boolean> => {
    setCommercial((prev) => {
      const updated = prev.customAds.filter((ad) => ad.id !== id);
      try {
        localStorage.setItem(CUSTOM_ADS_CACHE_KEY, JSON.stringify(updated));
      } catch {}
      return { ...prev, customAds: updated };
    });

    try {
      await deleteDoc(doc(db, 'customAds', id));
      return true;
    } catch (err) {
      console.warn('Erro ao excluir anúncio do Firestore:', err);
      return false;
    }
  };

  const formatMoney = (value: number, forceShow: boolean = false): string => {
    if (personal.hideValues && !forceShow) {
      return '••••••';
    }
    if (!Number.isFinite(value)) {
      return personal.currency === 'BRL' ? 'R$ 0,00' : '$ 0.00';
    }
    const currencyCode = personal.currency;
    const locale = currencyCode === 'BRL' ? 'pt-BR' : currencyCode === 'EUR' ? 'de-DE' : 'en-US';
    return value.toLocaleString(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        ...personal,
        ...commercial,
        setTheme,
        setHideValues,
        toggleHideValues,
        setVisualEffects,
        setSoundEffects,
        setCompactDensity,
        setCurrency,
        setBudgetClosingDay,
        setSavingsTargetRate,
        setHighExpenseAlert,
        formatMoney,
        setGoogleAdSenseClientId,
        setGoogleAdSenseSlotId,
        setAffiliateCustomUrl,
        setPixKey,
        setPixName,
        setCheckoutUrl,
        setKiwifyMonthlyUrl,
        setKiwifyAnnualUrl,
        setAdDisplayMode,
        updateCommercialSettings,
        setCustomAds,
        addCustomAd,
        updateCustomAd,
        deleteCustomAd,
        refreshCommercialFromCloud,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}
