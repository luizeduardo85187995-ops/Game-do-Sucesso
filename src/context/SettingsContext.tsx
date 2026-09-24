import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme = 'cyber_dark' | 'pro_light' | 'midnight' | 'emerald';
export type AppCurrency = 'BRL' | 'USD' | 'EUR';

export interface AppSettings {
  theme: AppTheme;
  hideValues: boolean;
  visualEffects: boolean;
  soundEffects: boolean;
  compactDensity: boolean;
  currency: AppCurrency;
  budgetClosingDay: number;
  savingsTargetRate: number;
  highExpenseAlert: number;
  googleAdSenseClientId: string;
  googleAdSenseSlotId: string;
  affiliateCustomUrl: string;
}

interface SettingsContextValue extends AppSettings {
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
  setGoogleAdSenseClientId: (id: string) => void;
  setGoogleAdSenseSlotId: (id: string) => void;
  setAffiliateCustomUrl: (url: string) => void;
  formatMoney: (value: number, forceShow?: boolean) => string;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'cyber_dark',
  hideValues: false,
  visualEffects: true,
  soundEffects: true,
  compactDensity: false,
  currency: 'BRL',
  budgetClosingDay: 1,
  savingsTargetRate: 20,
  highExpenseAlert: 1500,
  googleAdSenseClientId: '',
  googleAdSenseSlotId: '',
  affiliateCustomUrl: '',
};

const STORAGE_KEY = '@financas/settings-v1';

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Apply theme class to document element for global CSS cascading
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-cyber_dark', 'theme-pro_light', 'theme-midnight', 'theme-emerald');
    root.classList.add(`theme-${settings.theme}`);
    
    // Set theme-color meta tag for mobile status bar
    const themeColors: Record<AppTheme, string> = {
      cyber_dark: '#030712',
      pro_light: '#f8fafc',
      midnight: '#000000',
      emerald: '#021a12',
    };
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColors[settings.theme] || '#030712');
    }
  }, [settings.theme]);

  const setTheme = (theme: AppTheme) => setSettings((s) => ({ ...s, theme }));
  const setHideValues = (hideValues: boolean) => setSettings((s) => ({ ...s, hideValues }));
  const toggleHideValues = () => setSettings((s) => ({ ...s, hideValues: !s.hideValues }));
  const setVisualEffects = (visualEffects: boolean) => setSettings((s) => ({ ...s, visualEffects }));
  const setSoundEffects = (soundEffects: boolean) => setSettings((s) => ({ ...s, soundEffects }));
  const setCompactDensity = (compactDensity: boolean) => setSettings((s) => ({ ...s, compactDensity }));
  const setCurrency = (currency: AppCurrency) => setSettings((s) => ({ ...s, currency }));
  const setBudgetClosingDay = (budgetClosingDay: number) => setSettings((s) => ({ ...s, budgetClosingDay }));
  const setSavingsTargetRate = (savingsTargetRate: number) => setSettings((s) => ({ ...s, savingsTargetRate }));
  const setHighExpenseAlert = (highExpenseAlert: number) => setSettings((s) => ({ ...s, highExpenseAlert }));
  const setGoogleAdSenseClientId = (googleAdSenseClientId: string) => setSettings((s) => ({ ...s, googleAdSenseClientId }));
  const setGoogleAdSenseSlotId = (googleAdSenseSlotId: string) => setSettings((s) => ({ ...s, googleAdSenseSlotId }));
  const setAffiliateCustomUrl = (affiliateCustomUrl: string) => setSettings((s) => ({ ...s, affiliateCustomUrl }));

  const formatMoney = (value: number, forceShow: boolean = false): string => {
    if (settings.hideValues && !forceShow) {
      return '••••••';
    }

    if (!Number.isFinite(value)) {
      return settings.currency === 'BRL' ? 'R$ 0,00' : '$ 0.00';
    }

    const currencyCode = settings.currency;
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
        ...settings,
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
        setGoogleAdSenseClientId,
        setGoogleAdSenseSlotId,
        setAffiliateCustomUrl,
        formatMoney,
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
