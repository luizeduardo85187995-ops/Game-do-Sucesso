import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { formatBRL } from './utils/format';
import OverviewScreen from './components/finance/OverviewScreen';
import TransactionsScreen from './components/finance/TransactionsScreen';
import BanksScreen from './components/finance/BanksScreen';
import InvestmentsScreen from './components/finance/InvestmentsScreen';
import PlanningScreen from './components/finance/PlanningScreen';
import ReportsScreen from './components/finance/ReportsScreen';
import GameTabScreen from './components/finance/GameTabScreen';

type TabId =
  | 'overview'
  | 'transactions'
  | 'banks'
  | 'investments'
  | 'planning'
  | 'reports'
  | 'game';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; highlight?: boolean }[] = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'transactions', label: 'Lançamentos', icon: ReceiptText },
  { id: 'banks', label: 'Bancos', icon: Building2 },
  { id: 'investments', label: 'Investimentos', icon: TrendingUp },
  { id: 'planning', label: 'Planejar', icon: Target },
  { id: 'reports', label: 'Relatórios', icon: PieChart },
  { id: 'game', label: 'Jornada da Meta', icon: Gamepad2, highlight: true },
];

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [targetGameGoalId, setTargetGameGoalId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  const { metrics, setActiveGoalId, resetAllData } = useFinance();

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
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* Futuristic Background Atmospheric Mesh & Subtle Perspective Grid */}
      <div className="fixed inset-0 cyber-grid opacity-25 pointer-events-none z-0" />
      <div className="fixed inset-0 cyber-dots opacity-20 pointer-events-none z-0" />

      {/* Cybernetic Ambient Glowing Orbs */}
      <div className="fixed -top-40 left-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse" />
      <div className="fixed top-1/3 -right-20 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 left-1/3 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Futuristic Top HUD Telemetry Strip */}
      <div className="relative z-50 bg-slate-950/90 border-b border-cyan-500/20 px-4 py-1 flex items-center justify-between text-[10px] font-mono text-slate-400 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
            <span className="font-bold tracking-wider">NEO-FINANCE v3.2</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">QUANTUM CORE: SYNC 60FPS</span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline text-emerald-400 flex items-center gap-1">
            <Shield className="w-3 h-3" /> CRIPTOGRAFIA LOCAL AES-256
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetData}
            title="Resetar todos os dados para 0"
            className="text-[10px] font-mono font-bold text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40 transition-all flex items-center gap-1 active:scale-95"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>ZERAR APP</span>
          </button>
          <span className="hidden sm:inline text-amber-300 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> JORNADA HOLOGRÁFICA
          </span>
          <span className="text-cyan-300 font-mono tracking-widest">{currentTime}</span>
        </div>
      </div>

      {/* Main Glass Navbar */}
      <header className="sticky top-0 z-40 bg-[#060b19]/85 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo with Holographic Hex Glow */}
          <div
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-3.5 cursor-pointer select-none group"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 via-teal-400 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/30 group-hover:scale-105 group-hover:shadow-cyan-400/50 transition-all">
                <Gamepad2 className="w-6 h-6 text-slate-950" />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-cyan-400/20 blur-sm -z-10 group-hover:bg-cyan-400/40 transition-colors" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base tracking-tight leading-none">
                  Minhas Finanças
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400/20 to-yellow-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-mono font-black uppercase tracking-wider">
                  + JOGO
                </span>
              </div>
              <p className="text-[10px] text-cyan-400/80 font-mono leading-none mt-1">
                Controle Financeiro • Jornada da Meta
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              if (tab.highlight) {
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 relative overflow-hidden group ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-xl shadow-amber-500/30 scale-105'
                        : 'text-amber-400 hover:bg-amber-400/15 border border-amber-400/30'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  </button>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-md shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header: Consolidated Balance HUD & Mobile Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 shadow-md shadow-cyan-500/10">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <div className="text-right">
                <div className="text-[9px] text-cyan-400/80 font-mono uppercase font-bold leading-none">Saldo Total</div>
                <div className="text-xs font-black text-white font-mono leading-tight">{formatBRL(metrics.balance)}</div>
              </div>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-cyan-500/20 bg-slate-950/95 backdrop-blur-2xl p-3 space-y-1.5">
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
                      ? tab.highlight
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.highlight && (
                    <span className="text-[10px] font-black uppercase text-amber-950 bg-amber-300 px-2 py-0.5 rounded-full">
                      JOGO ATIVO
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'overview' && (
          <OverviewScreen
            onNavigateToGame={handleNavigateToGame}
            onOpenNewTransaction={() => setActiveTab('transactions')}
            onNavigateToTab={(tab) => setActiveTab(tab as TabId)}
          />
        )}

        {activeTab === 'transactions' && <TransactionsScreen />}

        {activeTab === 'banks' && <BanksScreen />}

        {activeTab === 'investments' && <InvestmentsScreen />}

        {activeTab === 'planning' && (
          <PlanningScreen onNavigateToGame={handleNavigateToGame} />
        )}

        {activeTab === 'reports' && <ReportsScreen />}

        {activeTab === 'game' && (
          <GameTabScreen initialGoalId={targetGameGoalId} />
        )}
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

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>Suba cada degrau da sua liberdade financeira</span>
            <span className="text-emerald-400 font-bold">▲ 100% SEGURO</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
