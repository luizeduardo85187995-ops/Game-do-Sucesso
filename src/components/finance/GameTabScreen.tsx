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
  Gamepad2,
} from 'lucide-react';
import { Goal, GoalColor, CharacterSkinId, CharacterState, ParticleEffect } from '../../types';
import { GOAL_COLORS } from '../../data/colors';
import { CHARACTER_SKINS } from '../../data/skins';
import { sounds } from '../../utils/audio';
import GameHeader from '../GameHeader';
import GameCanvas from '../GameCanvas';
import MotivationalCoach from '../MotivationalCoach';
import {
  CreateGoalModal,
  AmountModal,
  WalletModal,
  SkinSelectorModal,
} from '../GoalModals';
import { useFinance } from '../../context/FinanceContext';
import { formatBRL } from '../../utils/format';
import { useSubscription } from '../../context/SubscriptionContext';

interface GameTabScreenProps {
  initialGoalId?: string | null;
}

export default function GameTabScreen({ initialGoalId }: GameTabScreenProps) {
  const { isPro, openProModal } = useSubscription();
  const {
    savingGoals,
    activeGoalId,
    setActiveGoalId,
    addSavingGoal,
    deleteSavingGoal,
    depositToGoal,
    withdrawFromGoal,
    metrics,
  } = useFinance();

  // Convert savingGoals to the Game's Goal interface
  const gameGoals: Goal[] = savingGoals.map((g, idx) => ({
    id: g.id,
    name: g.name,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount,
    createdAt: g.createdAt,
    emoji: g.emoji || '🎯',
    color: GOAL_COLORS[idx % GOAL_COLORS.length].gradient,
  }));

  // Selected goal
  const selectedGoalId = activeGoalId || initialGoalId || (gameGoals[0]?.id ?? null);
  const activeGoal = gameGoals.find((g) => g.id === selectedGoalId) || gameGoals[0] || null;

  // Active color
  const activeColorIndex = gameGoals.findIndex((g) => g.id === activeGoal?.id);
  const activeColor: GoalColor =
    activeColorIndex >= 0
      ? GOAL_COLORS[activeColorIndex % GOAL_COLORS.length]
      : GOAL_COLORS[0];

  // Progress
  const progress = activeGoal
    ? Math.min((activeGoal.currentAmount / activeGoal.targetAmount) * 100, 100)
    : 0;

  // Character Skin - Default to The Executive (O Magnata)
  const [currentSkin, setCurrentSkin] = useState<CharacterSkinId>(() => {
    try {
      const saved = localStorage.getItem('game_character_skin_v4') as CharacterSkinId;
      if (saved && saved !== 'dante_dog') return saved;
      return 'executive';
    } catch {
      return 'executive';
    }
  });

  // Sound FX toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showSkinModal, setShowSkinModal] = useState(false);
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

  useEffect(() => {
    localStorage.setItem('game_character_skin_v4', currentSkin);
  }, [currentSkin]);

  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  // Character emotional state
  const characterState: CharacterState = (() => {
    if (progress >= 100) return 'victory';
    if (progress >= 85) return 'almost';
    if (progress >= 50) return 'running';
    if (progress >= 20) return 'walking';
    if (progress > 0) return 'idle';
    return 'struggling';
  })();

  // Particle Spawner
  const spawnParticles = (count = 12, emojiList = ['✨', '💰', '⭐']) => {
    const newItems: ParticleEffect[] = [];
    for (let i = 0; i < count; i++) {
      particleIdRef.current += 1;
      newItems.push({
        id: particleIdRef.current,
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 50,
        emoji: emojiList[Math.floor(Math.random() * emojiList.length)],
        delay: i * 0.05,
        scale: 0.8 + Math.random() * 0.5,
      });
    }
    setParticles((prev) => [...prev.slice(-20), ...newItems]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newItems.some((n) => n.id === p.id)));
    }, 2000);
  };

  // Deposit handler
  const handleDeposit = (amount: number, fromWallet = false) => {
    if (!activeGoal) return;
    const oldProgress = (activeGoal.currentAmount / activeGoal.targetAmount) * 100;
    const newAmount = activeGoal.currentAmount + amount;
    const newProgress = Math.min((newAmount / activeGoal.targetAmount) * 100, 100);

    depositToGoal(activeGoal.id, amount);

    setBoostEffect(true);
    setTimeout(() => setBoostEffect(false), 1200);

    sounds.playDeposit();
    setTimeout(() => sounds.playStep(), 250);

    // Milestones check
    if (oldProgress < 25 && newProgress >= 25) {
      setTimeout(() => sounds.playMilestone(), 500);
      setMilestoneToast({
        title: '🥉 Marco dos 25% Atingido!',
        message: `Primeiro quarto da escalada superado na meta "${activeGoal.name}"!`,
        emoji: '🧗‍♂️',
      });
    } else if (oldProgress < 50 && newProgress >= 50) {
      setTimeout(() => sounds.playMilestone(), 500);
      setMilestoneToast({
        title: '🥈 Metade do Caminho (50%)!',
        message: 'Você já passou pelo acampamento base! O topo está visível!',
        emoji: '⛺',
      });
    } else if (oldProgress < 75 && newProgress >= 75) {
      setTimeout(() => sounds.playMilestone(), 500);
      setMilestoneToast({
        title: '🥇 Reta Final (75%)!',
        message: 'Falta muito pouco! O ar da altitude traz cheiro de conquista!',
        emoji: '🏔️',
      });
    }

    if (oldProgress < 100 && newProgress >= 100) {
      setTimeout(() => {
        sounds.playVictory();
        spawnParticles(24, ['👑', '🏆', '💎', '🎉', '🌟']);
      }, 700);
      setMilestoneToast({
        title: '👑 Cume Alcançado (100%)!',
        message: `Parabéns! Meta "${activeGoal.name}" conquistada com sucesso!`,
        emoji: '🏆',
      });
    } else {
      spawnParticles(10, ['💰', '✨', '🪙', '⭐']);
    }

    setShowDepositModal(false);
  };

  // Withdraw handler
  const handleWithdraw = (amount: number, toWallet = false) => {
    if (!activeGoal) return;
    withdrawFromGoal(activeGoal.id, amount);
    sounds.playWithdraw();
    setShowWithdrawModal(false);
  };

  // Create Goal
  const handleCreateGoal = (
    name: string,
    targetAmount: number,
    color: string,
    emoji: string,
    initialSaved?: number
  ) => {
    const created = addSavingGoal({
      name,
      emoji,
      targetAmount,
      currentAmount: initialSaved || 0,
      categoryTag: 'Lazer',
    });
    setActiveGoalId(created.id);
    sounds.playVictory();
    spawnParticles(16, ['🎯', '✨', '🚀']);
    setShowCreateModal(false);
  };

  const handleOpenCreateGoal = () => {
    if (!isPro && savingGoals.length >= 1) {
      openProModal();
      return;
    }
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in flex flex-col items-center">
      {/* Free Plan Metas Limit Banner in Game */}
      {!isPro && (
        <div className="w-full max-w-4xl p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Meta Gratuita Ativa ({savingGoals.length}/1) • Assine o VIP PRO para Metas e Fases Ilimitadas!</span>
          </div>
          <button
            onClick={openProModal}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 transition shadow"
          >
            Liberar Metas
          </button>
        </div>
      )}

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
        {/* Game Header */}
        <GameHeader
          goals={gameGoals}
          activeGoal={activeGoal}
          activeColor={activeColor}
          progress={progress}
          currentBalance={metrics.balance}
          soundEnabled={soundEnabled}
          currentSkin={currentSkin}
          formatCurrency={formatBRL}
          onSelectGoal={(id) => {
            setActiveGoalId(id);
            sounds.playStep();
          }}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          onOpenWallet={() => {}}
          onOpenCreate={handleOpenCreateGoal}
          onOpenSkinSelector={() => setShowSkinModal(true)}
          onOpenReset={() => {}}
        />

        {/* The Game Climbing Area */}
        <div className="glass-elevated rounded-3xl overflow-hidden shadow-2xl border border-white/10">
          <GameCanvas
            activeGoal={activeGoal}
            progress={progress}
            characterState={characterState}
            skinId={currentSkin}
            activeColor={activeColor}
            boostEffect={boostEffect}
            particles={particles}
            formatCurrency={formatBRL}
            currentBalance={metrics.balance}
            onOpenCreate={handleOpenCreateGoal}
          />

          {/* Action Bar (Depositar / Retirar / Mudar Herói) */}
          {activeGoal && (
            <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-slate-900/90 border-t border-white/10 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowDepositModal(true)}
                className="flex-1 min-w-[140px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Aportar na Meta (+Subir)</span>
              </button>

              <button
                onClick={() => setShowWithdrawModal(true)}
                disabled={activeGoal.currentAmount <= 0}
                className="flex-1 min-w-[130px] py-3.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-rose-300 font-bold text-sm transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
              >
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span>Retirar (-Descer)</span>
              </button>

              <button
                onClick={() => setShowSkinModal(true)}
                className="py-3.5 px-4 rounded-2xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 font-bold text-xs transition-all flex items-center gap-2"
                title="Mudar visual do herói"
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
          formatCurrency={formatBRL}
          onDepositPrompt={() => setShowDepositModal(true)}
          onSpawnParticles={spawnParticles}
        />

        {/* Goal Switcher Strip */}
        <div className="glass-card rounded-3xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Escolha a Meta para Escalar</h3>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Meta</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {gameGoals.map((g) => {
              const isSelected = activeGoal?.id === g.id;
              const gPct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);

              return (
                <div
                  key={g.id}
                  onClick={() => {
                    setActiveGoalId(g.id);
                    sounds.playStep();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-400/10 border-amber-400 shadow-lg shadow-amber-500/10 scale-[1.02]'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{g.emoji}</span>
                    <div>
                      <h5 className="font-bold text-white text-xs">{g.name}</h5>
                      <span className="text-[11px] text-slate-400">
                        {formatBRL(g.currentAmount)} / {formatBRL(g.targetAmount)}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-black text-amber-400">{gPct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateGoalModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGoal}
          currentBalance={metrics.balance}
          formatCurrency={formatBRL}
        />
      )}

      {showDepositModal && activeGoal && (
        <AmountModal
          goal={activeGoal}
          type="deposit"
          maxAmount={metrics.balance > 0 ? metrics.balance : 999999}
          onClose={() => setShowDepositModal(false)}
          onConfirm={handleDeposit}
          formatCurrency={formatBRL}
        />
      )}

      {showWithdrawModal && activeGoal && (
        <AmountModal
          goal={activeGoal}
          type="withdraw"
          maxAmount={activeGoal.currentAmount}
          onClose={() => setShowWithdrawModal(false)}
          onConfirm={handleWithdraw}
          formatCurrency={formatBRL}
        />
      )}

      {showSkinModal && (
        <SkinSelectorModal
          currentSkin={currentSkin}
          onSelectSkin={(skinId) => {
            setCurrentSkin(skinId);
            sounds.playStep();
          }}
          onClose={() => setShowSkinModal(false)}
        />
      )}
    </div>
  );
}
