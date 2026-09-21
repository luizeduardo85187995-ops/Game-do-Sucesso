import React from 'react';
import { Target, Wallet, Volume2, VolumeX, Sparkles, Plus, Crown, User, ChevronDown, RotateCcw } from 'lucide-react';
import { Goal, GoalColor, CharacterSkinId } from '../types';
import { CHARACTER_SKINS } from '../data/skins';

interface GameHeaderProps {
  goals: Goal[];
  activeGoal: Goal | null;
  activeColor: GoalColor;
  progress: number;
  currentBalance: number;
  soundEnabled: boolean;
  currentSkin: CharacterSkinId;
  formatCurrency: (value: number) => string;
  onSelectGoal: (goalId: string) => void;
  onToggleSound: () => void;
  onOpenWallet: () => void;
  onOpenCreate: () => void;
  onOpenSkinSelector: () => void;
  onOpenReset: () => void;
}

export default function GameHeader({
  goals,
  activeGoal,
  activeColor,
  progress,
  currentBalance,
  soundEnabled,
  currentSkin,
  formatCurrency,
  onSelectGoal,
  onToggleSound,
  onOpenWallet,
  onOpenCreate,
  onOpenSkinSelector,
  onOpenReset,
}: GameHeaderProps) {
  const activeSkinObj = CHARACTER_SKINS.find((s) => s.id === currentSkin) || CHARACTER_SKINS[0];

  return (
    <header className="space-y-4">
      {/* Top Navbar Row */}
      <div className="cyber-card rounded-2xl px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between gap-3 hud-border-corners">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-xl shadow-lg shadow-amber-400/30 text-slate-950 font-black ring-1 ring-amber-300/40 animate-pulse">
            🏆
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white font-mono flex items-center gap-1.5">
                Jornada da Meta <span className="text-amber-400 neon-text-gold">OS</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold text-[10px] border border-amber-400/40">
                PRO 60FPS
              </span>
            </div>
            <p className="text-[11px] text-cyan-400/70 font-mono">Escale a escadaria da liberdade financeira quântica</p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Character Selector Pill Button */}
          <button
            onClick={onOpenSkinSelector}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 transition-all hover:scale-105"
            title="Trocar herói/personagem"
          >
            <span className="text-base">{activeSkinObj.icon}</span>
            <div className="text-left hidden md:block">
              <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">Herói</p>
              <p className="text-xs font-bold text-white leading-none">{activeSkinObj.name}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-white/40" />
          </button>

          {/* Wallet Balance Pill */}
          <button
            onClick={onOpenWallet}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-2 transition-all hover:scale-105"
            title="Saldo disponível para guardar"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <p className="text-[9px] text-emerald-300/60 uppercase tracking-wider font-semibold">
                Carteira
              </p>
              <p className="text-xs font-bold text-emerald-400 number-display leading-none">
                {formatCurrency(currentBalance)}
              </p>
            </div>
            <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-1 rounded font-bold">
              +
            </span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2.5 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-white/10 text-amber-300 border-white/20'
                : 'bg-white/5 text-white/40 border-white/5'
            }`}
            title={soundEnabled ? 'Silenciar Efeitos' : 'Ativar Sons do Jogo'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Reset / Zerar Dados Button */}
          <button
            onClick={onOpenReset}
            className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all"
            title="Zerar dados e iniciar com metas reais"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Goal Selector Badges Carousel */}
      {goals.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {goals.map((g) => {
            const isSelected = activeGoal?.id === g.id;
            const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
            return (
              <button
                key={g.id}
                onClick={() => onSelectGoal(g.id)}
                className={`shrink-0 px-3.5 py-2 rounded-xl border transition-all flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-white/15 border-white/30 shadow-lg scale-105 ring-1 ring-white/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 opacity-75 hover:opacity-100'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg bg-gradient-to-br ${g.color} flex items-center justify-center text-sm shadow`}
                >
                  {g.emoji}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{g.name}</span>
                    {pct >= 100 && <Crown className="w-3 h-3 text-yellow-400" />}
                  </div>
                  <span className="text-[10px] text-white/50 font-mono">
                    {pct.toFixed(0)}% ({formatCurrency(g.currentAmount)})
                  </span>
                </div>
              </button>
            );
          })}

          <button
            onClick={onOpenCreate}
            className="shrink-0 px-3 py-2 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Meta</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2.5 text-xs text-white/70">
            <span className="text-lg">🎯</span>
            <span>Nenhuma meta cadastrada. Pronto para definir sua meta real?</span>
          </div>
          <button
            onClick={onOpenCreate}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Cadastrar Meta Real
          </button>
        </div>
      )}
    </header>
  );
}

