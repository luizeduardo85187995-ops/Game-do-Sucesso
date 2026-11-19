import React, { Suspense, lazy, useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Building2,
  TrendingUp,
  Target,
  PieChart,
  Gamepad2,
  Plus,
  Wallet,
  Sparkles,
  Menu,
  X,
  Radio,
  Cpu,
  Shield,
  Zap,
  RotateCcw,
  Bot,
  Settings,
  Eye,
  EyeOff,
  Palette,
  Crown,
  CheckCircle2,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { SubscriptionProvider, useSubscription } from './context/SubscriptionContext';
import { PWAInstallButton } from './components/PWAInstallButton';
import TopAdBanner from './components/ads/TopAdBanner';
import ProModal from './components/subscription/ProModal';
import LegalModal from './components/legal/LegalModal';
import { formatBRL } from './utils/format';
import OverviewScreen from './components/finance/OverviewScreen';
// Screens load on demand: the first visit only downloads the overview, not all 10 tabs.
const TransactionsScreen = lazy(() => import('./components/finance/TransactionsScreen'));
const BanksScreen = lazy(() => import('./components/finance/BanksScreen'));
const InvestmentsScreen = lazy(() => import('./components/finance/InvestmentsScreen'));
const PlanningScreen = lazy(() => import('./components/finance/PlanningScreen'));
const ReportsScreen = lazy(() => import('./components/finance/ReportsScreen'));
const GameTabScreen = lazy(() => import('./components/finance/GameTabScreen'));
const AIChatScreen = lazy(() => import('./components/finance/AIChatScreen'));
const GoogleAuthScreen = lazy(() => import('./components/finance/GoogleAuthScreen'));
const SettingsScreen = lazy(() => import('./components/finance/SettingsScreen'));
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoogleLogo } from './components/icons/GoogleLogo';
import { TabId } from './types/navigation';
import GuidedTour from './components/tutorial/GuidedTour';
// The public editorial site and the private app never ship in each other's initial bundle.
const PublicSite = lazy(() => import('./public/PublicSite'));

// Clean, high-value primary financial modules (Settings and Google account sit dedicated on top right header)
const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; highlight?: boolean; badge?: string }[] = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'transactions', label: 'Lançamentos', icon: ReceiptText },
  { id: 'banks', label: 'Bancos & Contas', icon: Building2 },
  { id: 'investments', label: 'Investimentos', icon: TrendingUp, badge: 'PRO' },
  { id: 'planning', label: 'Planejar', icon: Target },
  { id: 'reports', label: 'Relatórios', icon: PieChart },
  { id: 'ai', label: 'Dante IA', icon: Bot, badge: 'PRO' },
  { id: 'game', label: 'Jornada da Meta', icon: Compass, highlight: true },
];


function ScreenLoading() {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center py-24 text-sm text-slate-400 font-mono">
      Carregando…
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [targetGameGoalId, setTargetGameGoalId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isTourOpen, setIsTourOpen] = useState(false);

  const { metrics, setActiveGoalId, resetAllData, cloudSyncStatus } = useFinance();
  const { user } = useAuth();
  const { isPro, openProModal } = useSubscription();
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | null>(null);
  const {
    theme,
    hideValues,
    toggleHideValues,
    visualEffects,
    formatMoney,
  } = useSettings();

  const isLight = theme === 'pro_light';

  const handleResetData = () => {
    const ok = window.confirm(
      'Deseja zerar todas as contas, transações, investimentos e metas para começar do zero com saldo R$ 0,00?'
    );
    if (ok) {
      resetAllData();
    }
  };

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigateToGame = (goalId?: string) => {
    if (goalId) {
      setTargetGameGoalId(goalId);
      setActiveGoalId(goalId);
    }
    setActiveTab('game');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="app-root" className={`min-h-screen theme-${theme} flex flex-col relative overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950 font-sans`}>
      {/* Futuristic Background Atmospheric Mesh & Subtle Perspective Grid */}
      <div className="fixed inset-0 cyber-grid opacity-25 pointer-events-none z-0" />
      <div className="fixed inset-0 cyber-dots opacity-20 pointer-events-none z-0" />

      {/* Cybernetic Ambient Glowing Orbs */}
      {visualEffects && theme !== 'pro_light' && (
        <>
          <div className="ambient-orb fixed -top-40 left-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse" />
          <div className="ambient-orb fixed top-1/3 -right-20 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
          <div className="ambient-orb fixed -bottom-40 left-1/3 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none z-0" />
        </>
      )}

      {/* Top AdMob / PRO Status Banner */}
      <TopAdBanner />

      {/* Main Glass Navbar */}
      <header className={`sticky top-0 z-40 backdrop-blur-2xl border-b transition-colors ${
        isLight
          ? 'bg-white/95 border-slate-200/90 shadow-sm text-slate-900'
          : 'bg-[#060b19]/90 border-white/10 shadow-2xl text-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand Logo - High-End Fintech Identity */}
          <div
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
          >
            <div className="relative">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${
                isLight
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/20 group-hover:scale-105'
                  : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/30 group-hover:scale-105 group-hover:shadow-emerald-400/50'
              }`}>
                <TrendingUp className="w-5 h-5 stroke-[2.5]" />
              </div>
              {!isLight && (
                <div className="absolute -inset-1 rounded-2xl bg-cyan-400/20 blur-sm -z-10 group-hover:bg-cyan-400/40 transition-colors" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`font-black text-base sm:text-lg tracking-tight leading-none ${
                  isLight ? 'text-slate-900 font-sans' : 'text-white holographic-text brand-title'
                }`}>
                  Minhas Finanças
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-700'
                    : 'bg-amber-400/15 border-amber-400/40 text-amber-300 brand-pill'
                }`}>
                  Jornada da Meta
                </span>
              </div>
              <p className={`text-[11px] leading-none mt-1 ${
                isLight ? 'text-slate-500 font-medium' : 'text-slate-400 brand-subtitle'
              }`}>
                Controle Financeiro Pessoal & Investimentos
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop Centered) */}
          <nav className={`hidden lg:flex items-center gap-1 p-1 rounded-2xl border backdrop-blur-md ${
            isLight
              ? 'bg-slate-100/80 border-slate-200/90'
              : 'bg-white/[0.03] border-white/10'
          }`}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isAI = tab.id === 'ai';

              if (tab.highlight) {
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative ${
                      isActive
                        ? isLight
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                          : 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25'
                        : isLight
                        ? 'text-amber-800 hover:bg-amber-100/80'
                        : 'text-amber-300 hover:bg-amber-400/15'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? isLight
                        ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200'
                        : isAI
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/25 border border-cyan-300'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-md shadow-cyan-500/10'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      : isAI
                      ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      tab.badge === 'PRO'
                        ? isLight
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black'
                        : isLight
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-cyan-400/30 text-cyan-200'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Header: Cloud Status, Balance HUD, Settings, Google Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Cloud Sync Status Indicator */}
            {user ? (
              <div
                className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                }`}
                title={`Sincronização em nuvem Firestore ativa para ${user.email}. Seus dados estão permanentemente salvos.`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-medium text-[11px]">Nuvem Ativa</span>
              </div>
            ) : (
              <div
                className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold ${
                  isLight
                    ? 'bg-slate-100 text-slate-600 border border-slate-200'
                    : 'bg-white/5 text-slate-400 border border-white/10'
                }`}
                title="Dados salvos no seu dispositivo com backup duplo redundante. Faça login com Google para sincronizar na nuvem."
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-[11px]">Salvo Local</span>
              </div>
            )}

            {/* Total Balance HUD */}
            <div className={`hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border ${
              isLight
                ? 'bg-slate-100/90 border-slate-200 text-slate-900 shadow-sm'
                : 'bg-cyan-950/20 border-cyan-500/30 text-white shadow-md shadow-cyan-500/10'
            }`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                isLight ? 'bg-blue-100 text-blue-700' : 'bg-cyan-500/20 text-cyan-300'
              }`}>
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <div className="text-right">
                <div className={`text-[9px] font-mono uppercase font-bold leading-none ${
                  isLight ? 'text-slate-500' : 'text-cyan-400/80'
                }`}>
                  Saldo Total
                </div>
                <div className={`text-xs font-black font-mono leading-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {formatMoney(metrics.balance)}
                </div>
              </div>
            </div>

            {/* Quick Privacy Toggle */}
            <button
              onClick={toggleHideValues}
              className={`p-2 rounded-xl border transition-all ${
                hideValues
                  ? isLight
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-md shadow-amber-500/20'
                  : isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title={hideValues ? 'Mostrar valores' : 'Ocultar valores (Modo Privacidade)'}
            >
              {hideValues ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Quick Settings Shortcut */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-xl border transition-all ${
                activeTab === 'settings'
                  ? isLight
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-md shadow-cyan-500/20'
                  : isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title="Abrir Configurações e Backups"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Quick Google Account Shortcut in Header */}
            <button
              onClick={() => setActiveTab('google')}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'google'
                  ? isLight
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-900 border-white shadow-md'
                  : user
                  ? isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
              title={user ? `Conta conectada: ${user.displayName || user.email}` : 'Entrar com o Google'}
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full border border-emerald-400 object-cover"
                />
              ) : (
                <GoogleLogo className="w-4 h-4 shrink-0" />
              )}
              <span className="hidden md:inline">
                {user ? user.displayName?.split(' ')[0] || 'Conta' : 'Entrar'}
              </span>
              {user && (
                <span className="hidden md:inline w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>

            {/* PRO Subscription Button */}
            <button
              type="button"
              onClick={openProModal}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all shadow-sm ${
                isPro
                  ? isLight
                    ? 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200'
                    : 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 border-amber-400/50 text-amber-300 hover:border-amber-300'
                  : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95'
              }`}
              title={isPro ? 'Plano PRO Ativo - Ver benefícios' : 'Conhecer Plano PRO'}
            >
              <Crown className={`w-3.5 h-3.5 ${isPro ? (isLight ? 'text-amber-800' : 'text-amber-400') : 'text-slate-950'}`} />
              <span className="font-mono">{isPro ? 'PRO' : 'PRO'}</span>
            </button>

            {/* Guided Tour Launcher Button */}
            <button
              type="button"
              onClick={() => setIsTourOpen(true)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                isTourOpen
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-cyan-500/20'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-cyan-300'
              }`}
              title="Fazer Tutorial Guiado (Passo a Passo pelas telas)"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Tutorial</span>
            </button>

            <PWAInstallButton />

            {/* Mobile/Tablet Hamburger */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={`lg:hidden p-2 rounded-xl border ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Horizontal Quick-Scroll Sub-bar for Mobile & Tablets */}
        <div className={`lg:hidden px-3 py-2 border-t overflow-x-auto no-scrollbar flex items-center gap-2 ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-slate-950/80 border-white/5'
        }`}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isAI = tab.id === 'ai';

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shrink-0 transition-all ${
                  isActive
                    ? isLight
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : isAI
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black'
                      : tab.highlight
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : isLight
                    ? 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                    : isAI
                    ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/40'
                    : 'text-slate-400 bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[8px] font-mono font-black px-1 py-0.2 rounded ${
                    tab.badge === 'PRO'
                      ? isLight ? 'bg-amber-100 text-amber-900' : 'bg-amber-400 text-slate-950'
                      : isLight ? 'bg-blue-100 text-blue-800' : 'bg-cyan-400/30 text-cyan-200'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className={`lg:hidden border-t p-3 space-y-1.5 ${
            isLight
              ? 'bg-white border-slate-200 shadow-xl'
              : 'bg-slate-950/95 border-cyan-500/20 backdrop-blur-2xl'
          }`}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    isActive
                      ? isLight
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : isLight
                      ? 'text-slate-700 hover:bg-slate-100'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className={`border-t my-2 pt-2 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <button
                onClick={() => {
                  setIsTourOpen(true);
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                  isLight
                    ? 'text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 mb-1'
                    : 'text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 mb-1'
                }`}
              >
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Tutorial Guiado (Passo a Passo)</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                  isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Configurações & Backups</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('google');
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                  isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <GoogleLogo className="w-4 h-4" />
                <span>{user ? `Conta: ${user.displayName || user.email}` : 'Entrar com o Google'}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<ScreenLoading />}>
        {activeTab === 'overview' && (
          <OverviewScreen
            onNavigateToGame={handleNavigateToGame}
            onOpenNewTransaction={() => setActiveTab('transactions')}
            onNavigateToTab={(tab) => setActiveTab(tab as TabId)}
            onStartTour={() => setIsTourOpen(true)}
          />
        )}

        {activeTab === 'transactions' && <TransactionsScreen />}

        {activeTab === 'banks' && <BanksScreen />}

        {activeTab === 'investments' && <InvestmentsScreen />}

        {activeTab === 'planning' && (
          <PlanningScreen onNavigateToGame={handleNavigateToGame} />
        )}

        {activeTab === 'reports' && <ReportsScreen />}

        {activeTab === 'ai' && <AIChatScreen />}

        {activeTab === 'game' && (
          <GameTabScreen initialGoalId={targetGameGoalId} />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            onNavigateToGoogle={() => setActiveTab('google')}
            onStartTour={() => setIsTourOpen(true)}
          />
        )}

        {activeTab === 'google' && <GoogleAuthScreen />}
        </Suspense>
      </main>

      {/* Futuristic Cyber Footer */}
      <footer className="relative z-10 border-t border-cyan-500/15 bg-slate-950/70 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-cyan-400 font-bold">MINHAS FINANÇAS</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">JORNADA DA META</span>
            <span>•</span>
            <span>SISTEMA FINANCEIRO QUÂNTICO</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400">
            <a href="/educacao-financeira" className="hover:text-emerald-400 underline underline-offset-2 transition-colors">
              Educação Financeira
            </a>
            <span>•</span>
            <a href="/ferramentas" className="hover:text-emerald-400 underline underline-offset-2 transition-colors">
              Ferramentas Gratuitas
            </a>
            <span>•</span>
            <button
              type="button"
              onClick={() => setLegalModalTab('privacy')}
              className="hover:text-cyan-400 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Política de Privacidade
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setLegalModalTab('terms')}
              className="hover:text-cyan-400 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Termos de Uso
            </button>
          </div>
        </div>
      </footer>

      {/* Optional Interactive Guided Tour */}
      <GuidedTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        activeTab={activeTab}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenProModal={openProModal}
      />

      {/* Subscription / Pro Upgrade Modal */}
      <ProModal />

      {/* Privacy Policy & Terms of Service Modal (AdSense & Google Play Compliance) */}
      <LegalModal
        isOpen={legalModalTab !== null}
        onClose={() => setLegalModalTab(null)}
        initialTab={legalModalTab || 'privacy'}
      />
    </div>
  );
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const isPrivateAppRoute = path === '/app' || path.startsWith('/app/');
  const isStandalonePwa = window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

  // Existing installed PWAs used to start at '/'. Keep them opening the finance app
  // while the normal browser root becomes the public editorial site.
  if (path === '/' && isStandalonePwa) {
    window.location.replace('/app');
    return null;
  }

  // Public editorial site is deliberately separated from the authenticated finance app.
  // This prevents Google AdSense from being loaded on login, settings, Dante, checkout,
  // navigation-only, empty or other private behavioral screens.
  if (!isPrivateAppRoute) {
    return (
      <SettingsProvider>
        <Suspense fallback={<ScreenLoading />}>
          <PublicSite />
        </Suspense>
      </SettingsProvider>
    );
  }

  return (
    <AuthProvider>
      <SettingsProvider>
        <SubscriptionProvider>
          <FinanceProvider>
            <AppContent />
          </FinanceProvider>
        </SubscriptionProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
