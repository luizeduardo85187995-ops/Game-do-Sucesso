import React, { useState, useEffect, useRef } from 'react';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Trophy,
  Crown,
  Sparkles,
  RefreshCw,
  Wallet,
  Star,
  Users,
} from 'lucide-react';
import { Goal, GoalColor, CharacterSkinId, CharacterState, ParticleEffect } from './types';
import { GOAL_COLORS } from './data/colors';
import { CHARACTER_SKINS } from './data/skins';
import { sounds } from './utils/audio';
import GameHeader from './components/GameHeader';
import GameCanvas from './components/GameCanvas';
import MotivationalCoach from './components/MotivationalCoach';
import {
  CreateGoalModal,
  AmountModal,
  WalletModal,
  SkinSelectorModal,
  ResetDataModal,
} from './components/GoalModals';

// Estado zerado para permitir inserção de dados reais do usuário
const INITIAL_GOALS: Goal[] = [];

export default function App() {
  // State: Goals
  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem('game_goals_v4');
      return saved ? JSON.parse(saved) : INITIAL_GOALS;
    } catch {
      return INITIAL_GOALS;
    }
  });

  // State: Active Goal
  const [activeGoalId, setActiveGoalId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('game_active_goal_id_v4') || null;
    } catch {
      return null;
    }
  });

  // State: Simulated Wallet Balance (Inicia zerada R$ 0,00 para dados reais)
  const [currentBalance, setCurrentBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('game_wallet_balance_v4');
      return saved ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  });

  // State: Character Skin
  const [currentSkin, setCurrentSkin] = useState<CharacterSkinId>(() => {
    try {
      return (localStorage.getItem('game_character_skin_v4') as CharacterSkinId) || 'executive';
    } catch {
      return 'executive';
    }
  });

  // State: Sound FX toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSkinModal, setShowSkinModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [milestoneToast, setMilestoneToast] = useState<{ title: string; message: string; emoji: string } | null>(null);

  // FX & Particles
  const [boostEffect, setBoostEffect] = useState(false);
  const [particles, setParticles] = useState<ParticleEffect[]>([]);
  const particleIdRef = useRef(0);

  // Auto-dismiss milestone toast
  useEffect(() => {
    if (!milestoneToast) return;
    const t = setTimeout(() => setMilestoneToast(null), 6500);
    return () => clearTimeout(t);
  }, [milestoneToast]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('game_goals_v4', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    if (activeGoalId) {
      localStorage.setItem('game_active_goal_id_v4', activeGoalId);
    } else {
      localStorage.removeItem('game_active_goal_id_v4');
    }
  }, [activeGoalId]);

  useEffect(() => {
    localStorage.setItem('game_wallet_balance_v4', currentBalance.toString());
  }, [currentBalance]);

  useEffect(() => {
    localStorage.setItem('game_character_skin_v4', currentSkin);
  }, [currentSkin]);

  // Sync sound controller
  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  // Support seamless deep-linking/syncing from external apps like minhas-financas
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const goalName = params.get('name') || params.get('goal');
      const targetAmount = parseFloat(params.get('target') || '0');
      const currentAmount = parseFloat(params.get('current') || '0');
      const emoji = params.get('emoji');
      const balance = parseFloat(params.get('balance') || '0');

      if (goalName && targetAmount > 0) {
        const customGoal: Goal = {
          id: 'goal-synced-app',
          name: goalName,
          targetAmount,
          currentAmount: isNaN(currentAmount) ? 0 : Math.max(0, currentAmount),
          emoji: emoji || '🚗',
          color: 'from-amber-400 to-yellow-500',
          createdAt: new Date().toISOString(),
        };

        setGoals((prev) => {
          const exists = prev.find((g) => g.id === 'goal-synced-app');
          if (exists) {
            return prev.map((g) => (g.id === 'goal-synced-app' ? customGoal : g));
          }
          return [customGoal, ...prev];
        });
        setActiveGoalId('goal-synced-app');
      }

      if (balance > 0) {
        setCurrentBalance(balance);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Active goal & progress calculation
  const activeGoal = goals.find((g) => g.id === activeGoalId) || (goals.length > 0 ? goals[0] : null);
  const progress = activeGoal
    ? Math.min((activeGoal.currentAmount / activeGoal.targetAmount) * 100, 100)
    : 0;

  const activeColor: GoalColor = activeGoal
    ? GOAL_COLORS.find((c) => c.gradient === activeGoal.color) || GOAL_COLORS[0]
    : GOAL_COLORS[0];

  // Character emotional state based on progress
  const getCharacterState = (): CharacterState => {
    if (!activeGoal) return 'idle';
    if (progress >= 100) return 'victory';
    if (progress >= 85) return 'almost';
    if (progress >= 50) return 'running';
    if (progress >= 10) return 'walking';
    return 'struggling';
  };

  const characterState = getCharacterState();

  // Currency formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  // Particles generator
  const spawnParticles = (count: number, emojis: string[]) => {
    const newParticles = Array.from({ length: count }, () => ({
      id: particleIdRef.current++,
      x: 20 + Math.random() * 60,
      y: 25 + Math.random() * 50,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      delay: Math.random() * 0.4,
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 2600);
  };

  // Action: Create Goal (suporta valor já guardado para dados reais)
  const handleCreateGoal = (
    name: string,
    targetAmount: number,
    color: string,
    emoji: string,
    initialSaved: number = 0
  ) => {
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      name,
      targetAmount,
      currentAmount: Math.min(initialSaved, targetAmount),
      createdAt: new Date().toISOString(),
      color,
      emoji,
    };
    setGoals((prev) => [...prev, newGoal]);
    setActiveGoalId(newGoal.id);
    setShowCreateModal(false);
    sounds.playDeposit();

    if (initialSaved > 0) {
      setBoostEffect(true);
      setTimeout(() => setBoostEffect(false), 1200);
      spawnParticles(15, ['🎯', '✨', '⭐', '🚀', '💰']);
    } else {
      spawnParticles(10, ['🎯', '✨', '⭐', '🚀']);
    }
  };

  // Action: Deposit into Goal (suporta aporte direto ou da carteira)
  const handleDeposit = (amount: number, fromWallet: boolean = true) => {
    if (!activeGoal) return;

    if (fromWallet) {
      if (amount > currentBalance) return;
      // Deduct from wallet
      setCurrentBalance((prev) => Math.max(0, prev - amount));
    }

    const wasComplete = activeGoal.currentAmount >= activeGoal.targetAmount;
    const newAmount = activeGoal.currentAmount + amount;
    const isNowComplete = newAmount >= activeGoal.targetAmount;

    // Progress milestone detection
    const prevPercent = (activeGoal.currentAmount / activeGoal.targetAmount) * 100;
    const newPercent = (newAmount / activeGoal.targetAmount) * 100;

    // Update goal
    setGoals((prev) =>
      prev.map((g) => (g.id === activeGoal.id ? { ...g, currentAmount: newAmount } : g))
    );

    // Sound & Boost effect
    setBoostEffect(true);
    setTimeout(() => setBoostEffect(false), 1200);

    if (!wasComplete && isNowComplete) {
      sounds.playVictory();
      setMilestoneToast({
        title: '👑 META 100% REALIZADA!',
        message: `Parabéns! Você alcançou o topo e conquistou ${activeGoal.name}! Sua disciplina venceu!`,
        emoji: '👑',
      });
      spawnParticles(35, ['🏆', '👑', '🎉', '💎', '⭐', '🍾']);
    } else if (prevPercent < 25 && newPercent >= 25) {
      sounds.playMilestone();
      setMilestoneToast({
        title: '🥉 1º Marco Superado (25%)!',
        message: `Você superou a barreira inicial de ${activeGoal.name}! O primeiro quarto já é seu!`,
        emoji: '🥉',
      });
      spawnParticles(20, ['🥉', '✨', '⭐', '🚀']);
    } else if (prevPercent < 50 && newPercent >= 50) {
      sounds.playMilestone();
      setMilestoneToast({
        title: '🥈 Metade da Montanha (50%)!',
        message: `Metade de ${activeGoal.name} garantida! O topo agora é pura questão de constância!`,
        emoji: '🥈',
      });
      spawnParticles(25, ['🥈', '✨', '⚡', '💰']);
    } else if (prevPercent < 75 && newPercent >= 75) {
      sounds.playMilestone();
      setMilestoneToast({
        title: '🥇 Reta Final Conquistada (75%)!',
        message: `Faltam poucos degraus para conquistar ${activeGoal.name}! Mantenha o ritmo!`,
        emoji: '🥇',
      });
      spawnParticles(25, ['🥇', '🔥', '⚡', '💎']);
    } else {
      sounds.playDeposit();
      spawnParticles(12, ['💰', '✨', '💫', '💎']);
    }

    setShowDepositModal(false);
  };

  // Action: Reset App Data (Zera tudo para dados reais)
  const handleResetAll = () => {
    setGoals([]);
    setActiveGoalId(null);
    setCurrentBalance(0);
    localStorage.removeItem('game_goals_v4');
    localStorage.removeItem('game_active_goal_id_v4');
    localStorage.removeItem('game_wallet_balance_v4');
    sounds.playSuccess();
    spawnParticles(15, ['✨', '🔄', '⭐', '💫']);
  };

  // Action: Withdraw from Goal
  const handleWithdraw = (amount: number) => {
    if (!activeGoal || amount > activeGoal.currentAmount) return;

    // Return to wallet
    setCurrentBalance((prev) => prev + amount);

    // Deduct from goal
    setGoals((prev) =>
      prev.map((g) =>
        g.id === activeGoal.id
          ? { ...g, currentAmount: Math.max(0, g.currentAmount - amount) }
          : g
      )
    );

    sounds.playWithdraw();
    spawnParticles(6, ['💸', '📉', '💦']);
    setShowWithdrawModal(false);
  };

  // Action: Delete Goal
  const handleDeleteGoal = (goalId: string) => {
    const goalToDelete = goals.find((g) => g.id === goalId);
    if (goalToDelete && goalToDelete.currentAmount > 0) {
      // Refund to wallet
      setCurrentBalance((prev) => prev + goalToDelete.currentAmount);
    }
    const filtered = goals.filter((g) => g.id !== goalId);
    setGoals(filtered);
    if (activeGoalId === goalId) {
      setActiveGoalId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  // Action: Reset Demo Data
  const handleResetDemo = () => {
    setGoals(INITIAL_GOALS);
    setActiveGoalId('goal-1');
    setCurrentBalance(2500);
    spawnParticles(12, ['🔄', '✨', '💰']);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 lg:p-8 flex flex-col items-center">
      {/* Milestone Celebration Toast */}
      {milestoneToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-400/90 shadow-2xl shadow-amber-500/40 text-white animate-pop-in backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-2xl shrink-0">
              {milestoneToast.emoji}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-amber-300 tracking-wide">{milestoneToast.title}</h4>
              <p className="text-xs text-white/90 leading-tight mt-0.5">{milestoneToast.message}</p>
            </div>
            <button
              onClick={() => setMilestoneToast(null)}
              className="text-white/40 hover:text-white p-1 text-xs"
              title="Fechar"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl space-y-6">
        {/* Header with Brand, Wallet Balance, Hero Selector & Sounds */}
        <GameHeader
          goals={goals}
          activeGoal={activeGoal}
          activeColor={activeColor}
          progress={progress}
          currentBalance={currentBalance}
          soundEnabled={soundEnabled}
          currentSkin={currentSkin}
          formatCurrency={formatCurrency}
          onSelectGoal={(id) => {
            setActiveGoalId(id);
            sounds.playStep();
          }}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          onOpenWallet={() => setShowWalletModal(true)}
          onOpenCreate={() => setShowCreateModal(true)}
          onOpenSkinSelector={() => setShowSkinModal(true)}
          onOpenReset={() => setShowResetModal(true)}
        />

        {/* The Game Climbing Area */}
        <div className="glass-elevated rounded-3xl overflow-hidden shadow-2xl border border-white/10">
          {/* Canvas Component with 25-step staircase & high quality animated character */}
          <GameCanvas
            activeGoal={activeGoal}
            progress={progress}
            characterState={characterState}
            skinId={currentSkin}
            activeColor={activeColor}
            boostEffect={boostEffect}
            particles={particles}
            formatCurrency={formatCurrency}
            currentBalance={currentBalance}
            onOpenCreate={() => setShowCreateModal(true)}
          />

          {/* Action Bar (Depositar / Retirar / Trocar Herói) */}
          {activeGoal && (
            <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-slate-900/90 border-t border-white/10 flex flex-wrap items-center gap-3">
              {/* Depositar Button */}
              <button
                onClick={() => setShowDepositModal(true)}
                className="flex-1 min-w-[140px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Depositar (+Subir)</span>
              </button>

              {/* Retirar Button */}
              <button
                onClick={() => setShowWithdrawModal(true)}
                disabled={activeGoal.currentAmount <= 0}
                className="flex-1 min-w-[130px] py-3.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-rose-300 font-bold text-sm transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
              >
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span>Retirar (-Descer)</span>
              </button>

              {/* Customize Hero Shortcut */}
              <button
                onClick={() => setShowSkinModal(true)}
                className="py-3.5 px-4 rounded-2xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 font-bold text-xs transition-all flex items-center gap-2"
                title="Mudar visual do personagem"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Mudar Herói</span>
              </button>
            </div>
          )}
        </div>

        {/* Motivational Coach & Financial Wisdom */}
        <MotivationalCoach
          activeGoal={activeGoal}
          progress={activeGoal ? (activeGoal.currentAmount / activeGoal.targetAmount) * 100 : 0}
          formatCurrency={formatCurrency}
          onDepositPrompt={() => setShowDepositModal(true)}
          onSpawnParticles={spawnParticles}
        />

        {/* Goals Management Panel */}
        <div className="glass-elevated rounded-3xl p-5 sm:p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                Todas as Metas ({goals.length})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetDemo}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-xs flex items-center gap-1.5 transition-all"
                title="Restaurar metas de exemplo"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Restaurar Padrões</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Meta</span>
              </button>
            </div>
          </div>

          {/* Goal Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {goals.map((g) => {
              const isSelected = activeGoal?.id === g.id;
              const gProgress = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
              return (
                <div
                  key={g.id}
                  onClick={() => {
                    setActiveGoalId(g.id);
                    sounds.playStep();
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white/10 border-amber-400/50 shadow-xl shadow-amber-400/10 ring-1 ring-amber-400/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center text-xl shadow-md`}
                        >
                          {g.emoji}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-white">{g.name}</h4>
                            {gProgress >= 100 && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                          </div>
                          <span className="text-[11px] text-white/50 font-mono">
                            {formatCurrency(g.currentAmount)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGoal(g.id);
                        }}
                        className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Excluir meta e resgatar saldo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center justify-between text-[10px] text-white/50">
                      <span>Progresso: {gProgress.toFixed(0)}%</span>
                      <span className="font-mono">Meta: {formatCurrency(g.targetAmount)}</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${g.color} transition-all duration-500`}
                        style={{ width: `${gProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Notes */}
        <footer className="text-center text-xs text-white/40 pb-6 flex items-center justify-center gap-2">
          <span>Jornada da Meta</span>
          <span>•</span>
          <span>Economize com diversão e disciplina</span>
        </footer>
      </div>

      {/* MODALS */}
      {showCreateModal && (
        <CreateGoalModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGoal}
          currentBalance={currentBalance}
          formatCurrency={formatCurrency}
        />
      )}

      {showDepositModal && activeGoal && (
        <AmountModal
          goal={activeGoal}
          type="deposit"
          onClose={() => setShowDepositModal(false)}
          onConfirm={handleDeposit}
          formatCurrency={formatCurrency}
          maxAmount={currentBalance}
        />
      )}

      {showWithdrawModal && activeGoal && (
        <AmountModal
          goal={activeGoal}
          type="withdraw"
          onClose={() => setShowWithdrawModal(false)}
          onConfirm={handleWithdraw}
          formatCurrency={formatCurrency}
          maxAmount={activeGoal.currentAmount}
        />
      )}

      {showWalletModal && (
        <WalletModal
          currentBalance={currentBalance}
          onClose={() => setShowWalletModal(false)}
          onAddFunds={(val) => {
            setCurrentBalance((prev) => prev + val);
            sounds.playDeposit();
            spawnParticles(8, ['💰', '💵', '✨']);
          }}
          formatCurrency={formatCurrency}
        />
      )}

      {showSkinModal && (
        <SkinSelectorModal
          currentSkin={currentSkin}
          onSelectSkin={(skinId) => {
            setCurrentSkin(skinId);
            sounds.playCharacterVoice();
          }}
          onClose={() => setShowSkinModal(false)}
        />
      )}

      {showResetModal && (
        <ResetDataModal
          onClose={() => setShowResetModal(false)}
          onConfirmReset={handleResetAll}
        />
      )}
    </div>
  );
}
