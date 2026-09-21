import React from 'react';
import { Trophy, Target, Sparkles, Flame, MessageCircleHeart } from 'lucide-react';
import { Goal, GoalColor, CharacterSkinId, CharacterState, ParticleEffect } from '../types';
import CharacterHero from './CharacterHero';
import GoalSummitTarget from './GoalSummitTarget';
import LivingScenery from './LivingScenery';

interface GameCanvasProps {
  activeGoal: Goal | null;
  progress: number;
  characterState: CharacterState;
  skinId: CharacterSkinId;
  activeColor: GoalColor;
  boostEffect: boolean;
  particles: ParticleEffect[];
  formatCurrency: (value: number) => string;
  currentBalance: number;
  onOpenCreate: () => void;
}

const MILESTONES = [
  { step: 6, percent: 25, label: '25%' },
  { step: 12, percent: 50, label: '50%' },
  { step: 18, percent: 75, label: '75%' },
  { step: 25, percent: 100, label: '100%' },
];

export default function GameCanvas({
  activeGoal,
  progress,
  characterState,
  skinId,
  activeColor,
  boostEffect,
  particles,
  formatCurrency,
  currentBalance,
  onOpenCreate,
}: GameCanvasProps) {
  // Calculate dynamic character vertical position on the stairs (0 to 74%)
  const characterBottomPercent = Math.min(progress * 0.70 + 5, 73);

  return (
    <div className="relative h-[540px] sm:h-[580px] rounded-3xl overflow-hidden shadow-2xl select-none border border-white/10">
      {/* 🌟 Dynamic Living Scenery with Mountains, Aurora, Moving Clouds & Life */}
      <LivingScenery progress={progress} activeColor={activeColor} />

      {/* Giant Speed Arrow indicator on >85% */}
      {progress >= 85 && progress < 100 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="text-white text-[240px] font-black leading-none animate-pulse">
            ↑
          </div>
        </div>
      )}

      {/* Central Escalier / Grand Dynamic Staircase Structure */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center h-[77%] pointer-events-none">
        {/* Dynamic Curved Energy Rails (SVG) hugging the winding stairway */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible opacity-75">
          <defs>
            <linearGradient id="railGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.4" />
              <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="80%" stopColor="#f59e0b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fef08a" stopOpacity="1" />
            </linearGradient>
            <filter id="railGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Render winding neon guide rails */}
          {(() => {
            const leftPoints: string[] = [];
            const rightPoints: string[] = [];
            for (let s = 0; s < 25; s++) {
              const yPercent = 96 - (s / 24) * 88;
              const curveX = Math.sin(s * 0.44) * 32;
              const halfWidth = 88 - s * 0.7;
              leftPoints.push(`calc(50% + ${curveX - halfWidth}px) ${yPercent}%`);
              rightPoints.push(`calc(50% + ${curveX + halfWidth}px) ${yPercent}%`);
            }
            return (
              <>
                <polyline
                  points={leftPoints.join(', ')}
                  fill="none"
                  stroke="url(#railGrad)"
                  strokeWidth="2.5"
                  strokeDasharray="4,6"
                  filter="url(#railGlow)"
                  className="animate-pulse"
                />
                <polyline
                  points={rightPoints.join(', ')}
                  fill="none"
                  stroke="url(#railGrad)"
                  strokeWidth="2.5"
                  strokeDasharray="4,6"
                  filter="url(#railGlow)"
                  className="animate-pulse"
                />
              </>
            );
          })()}
        </svg>

        {/* 25 Individual Dynamic 3D Steps Stacked Upwards along S-Curve */}
        <div className="relative w-full h-full flex flex-col-reverse items-center justify-between pb-3 pt-6">
          {[...Array(25)].map((_, i) => {
            const stepNum = i + 1;
            const stepThreshold = stepNum * 4;
            const isReached = progress >= stepThreshold;
            const isCurrent = progress >= stepThreshold - 4 && progress < stepThreshold;
            const isUpcoming = progress < stepThreshold - 4;
            const curveX = Math.sin(i * 0.44) * 32;
            const stepWidth = 175 - i * 1.5;

            // Milestones checkpoints
            const milestone = MILESTONES.find((m) => m.step === stepNum);

            // Dynamic Step styling based on tier and completion
            let treadBg = 'from-slate-800 to-slate-900 border-slate-700/60';
            let riserBg = 'bg-slate-950 border-slate-800';
            let underglow = 'rgba(15, 23, 42, 0.5)';
            let accentTextColor = 'text-slate-500';

            if (isReached) {
              if (stepNum > 20) {
                treadBg = 'from-yellow-300 via-amber-400 to-yellow-500 border-yellow-200';
                riserBg = 'bg-amber-900 border-amber-600';
                underglow = 'rgba(251, 191, 36, 0.7)';
                accentTextColor = 'text-amber-950 font-black';
              } else if (stepNum > 15) {
                treadBg = 'from-amber-400 via-yellow-400 to-amber-500 border-amber-300';
                riserBg = 'bg-amber-800 border-amber-600';
                underglow = 'rgba(245, 158, 11, 0.6)';
                accentTextColor = 'text-amber-950 font-bold';
              } else if (stepNum > 8) {
                treadBg = 'from-cyan-400 via-sky-500 to-blue-600 border-cyan-300';
                riserBg = 'bg-sky-950 border-sky-800';
                underglow = 'rgba(56, 189, 248, 0.55)';
                accentTextColor = 'text-white font-bold';
              } else {
                treadBg = 'from-emerald-400 via-teal-500 to-emerald-600 border-emerald-300';
                riserBg = 'bg-emerald-950 border-emerald-800';
                underglow = 'rgba(16, 185, 129, 0.5)';
                accentTextColor = 'text-emerald-950 font-bold';
              }
            } else if (isCurrent) {
              treadBg = 'from-cyan-400 via-blue-500 to-indigo-600 border-white ring-2 ring-cyan-300 shadow-xl shadow-cyan-400/80';
              riserBg = 'bg-cyan-950 border-cyan-400';
              underglow = 'rgba(56, 189, 248, 0.9)';
              accentTextColor = 'text-white font-black';
            }

            return (
              <div
                key={stepNum}
                className={`relative flex items-center justify-center transition-transform duration-700 ease-out pointer-events-auto group ${
                  boostEffect ? 'animate-stair-pulse' : ''
                }`}
                style={{
                  transform: `translateX(${curveX}px)`,
                  width: `${stepWidth}px`,
                  animationDelay: boostEffect ? `${stepNum * 0.035}s` : undefined,
                }}
              >
                {/* Milestone Landmark Station */}
                {milestone && (
                  <>
                    <div
                      className={`absolute -right-20 sm:-right-24 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border transition-all duration-300 z-10 ${
                        progress >= milestone.percent
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border-yellow-200 shadow-lg shadow-amber-400/50 scale-105 animate-stair-beacon'
                          : 'bg-slate-900/90 text-white/50 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <span className="text-xs">{stepNum === 25 ? '👑' : stepNum === 18 ? '🥇' : stepNum === 12 ? '🥈' : '🥉'}</span>
                      <span>{milestone.label}</span>
                    </div>

                    {/* Living Stone Brazier with Flickering Flame on Left */}
                    <div className="absolute -left-16 sm:-left-20 flex flex-col items-center pointer-events-none z-10">
                      <div className="relative w-5 h-6 flex items-center justify-center">
                        <div
                          className={`absolute inset-0 rounded-full blur-[3px] animate-torch-flame ${
                            progress >= milestone.percent
                              ? 'bg-amber-400/80 shadow-[0_0_14px_#f59e0b]'
                              : 'bg-cyan-400/50 shadow-[0_0_10px_#38bdf8]'
                          }`}
                        />
                        <span className="text-xs select-none relative z-10 animate-torch-flame">
                          {progress >= milestone.percent ? '🔥' : '🕯️'}
                        </span>
                      </div>
                      <div className="w-4 h-2 bg-slate-800 border border-slate-600 rounded-t-sm" />
                      <div className="w-2.5 h-2 bg-slate-900 border-x border-slate-700" />
                      <div className="w-5 h-1 bg-slate-700 rounded-sm" />
                    </div>
                  </>
                )}

                {/* Left Side Energy Node / Gem Bracket */}
                <div
                  className={`absolute -left-2 w-2 h-2.5 rounded-full border transition-all duration-500 ${
                    isReached
                      ? 'bg-amber-300 border-yellow-100 shadow-[0_0_8px_#fde047]'
                      : isCurrent
                      ? 'bg-cyan-400 border-white shadow-[0_0_10px_#38bdf8] animate-ping'
                      : 'bg-slate-700 border-slate-600 opacity-40'
                  }`}
                />

                {/* Right Side Energy Node / Gem Bracket */}
                <div
                  className={`absolute -right-2 w-2 h-2.5 rounded-full border transition-all duration-500 ${
                    isReached
                      ? 'bg-amber-300 border-yellow-100 shadow-[0_0_8px_#fde047]'
                      : isCurrent
                      ? 'bg-cyan-400 border-white shadow-[0_0_10px_#38bdf8] animate-ping'
                      : 'bg-slate-700 border-slate-600 opacity-40'
                  }`}
                />

                {/* 3D Isometric Floating Platform */}
                <div className="w-full flex flex-col items-center">
                  {/* Step Tread (Top Surface with Perspective Bevel) */}
                  <div
                    className={`w-full h-3 rounded-t-md bg-gradient-to-r ${treadBg} border-t border-x relative overflow-hidden transition-all duration-500 flex items-center justify-between px-2 ${
                      isUpcoming ? 'opacity-35' : 'opacity-100'
                    }`}
                    style={{
                      boxShadow: isReached || isCurrent ? `0 0 16px ${underglow}` : 'none',
                    }}
                  >
                    {/* Shimmer light sweep */}
                    {isReached && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer pointer-events-none" />
                    )}

                    {/* Step Corner Accent Runes */}
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    {milestone && (
                      <span className={`text-[8px] tracking-wider uppercase ${accentTextColor}`}>
                        Nível {stepNum}
                      </span>
                    )}
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  </div>

                  {/* Step Riser (Front 3D Depth Face) */}
                  <div
                    className={`w-full h-2 rounded-b-md ${riserBg} border-b border-x relative overflow-hidden flex items-center justify-center ${
                      isUpcoming ? 'opacity-25' : 'opacity-90'
                    }`}
                  >
                    {/* 3D Drop Glow onto lower step */}
                    <div
                      className="absolute inset-x-0 bottom-0 h-0.5"
                      style={{ background: underglow }}
                    />
                  </div>
                </div>

                {/* Interactive Hover Micro-Badge */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md bg-slate-900/95 border border-amber-400/40 text-[9px] text-white whitespace-nowrap shadow-xl z-30 pointer-events-none">
                  Degrau #{stepNum} • {stepThreshold}%
                  {activeGoal && (
                    <span className="text-amber-300 font-bold ml-1">
                      ({formatCurrency((activeGoal.targetAmount * stepThreshold) / 100)})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* The Animated Character with Curve-tracking on the Stairs */}
      {(() => {
        const currentStepProgress = (progress / 100) * 24;
        const characterCurveX = Math.sin(currentStepProgress * 0.44) * 32;

        return (
          <div
            className="absolute left-1/2 transition-all duration-700 ease-out z-20 pointer-events-auto"
            style={{
              bottom: `${characterBottomPercent}%`,
              transform: `translateX(calc(-50% + ${characterCurveX}px)) ${boostEffect ? 'scale(1.12)' : 'scale(1)'}`,
            }}
          >
            {/* Active Footstep Dynamic Energy Ripple beneath Hero */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-14 h-5 rounded-[100%] bg-cyan-400/30 blur-[1px] animate-footstep-ripple pointer-events-none" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-3 rounded-[100%] bg-amber-400/40 blur-[1px] animate-pulse pointer-events-none" />

            <CharacterHero
              state={characterState}
              skinId={skinId}
              progress={progress}
              boostEffect={boostEffect}
              accentGradient={activeColor.gradient}
              goalName={activeGoal?.name}
              currentAmount={activeGoal?.currentAmount}
              remainingAmount={activeGoal ? Math.max(0, activeGoal.targetAmount - activeGoal.currentAmount) : 0}
              formatCurrency={formatCurrency}
            />
          </div>
        );
      })()}

      {/* Top Summit Altar (The Real Dream Target Goal - e.g. Carro Bonitão, Mansão, Jatinho, etc.) */}
      <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <GoalSummitTarget
          goal={activeGoal || undefined}
          progress={progress}
          activeColor={activeColor}
          formatCurrency={formatCurrency}
        />
      </div>

      {/* Floating Particles Burst Effect */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute pointer-events-none z-40"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animation: `particle 2.5s ease-out ${p.delay}s forwards`,
          }}
        >
          <span className="text-2xl sm:text-3xl drop-shadow-md select-none">{p.emoji}</span>
        </div>
      ))}

      {/* Bottom Progress Bar Overlay */}
      <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-20">
        <div className="flex items-center justify-between text-xs font-semibold mb-2 text-white">
          <div className="flex items-center gap-1.5">
            <span className="text-white/40 text-[10px] uppercase tracking-wider">Guardado:</span>
            <span className="text-emerald-400 number-display font-bold">
              {activeGoal ? formatCurrency(activeGoal.currentAmount) : 'R$ 0,00'}
            </span>
          </div>

          <div className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] text-amber-300 font-bold">
            {progress.toFixed(1)}% Concluído
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-white/40 text-[10px] uppercase tracking-wider">Alvo:</span>
            <span className="text-white/90 number-display font-bold">
              {activeGoal ? formatCurrency(activeGoal.targetAmount) : 'R$ 0,00'}
            </span>
          </div>
        </div>

        {/* Progress Rail */}
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${activeColor.gradient} relative overflow-hidden`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Subtitle Motivation Status */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-white/60">
          <div className="flex items-center gap-1.5">
            {characterState === 'struggling' && <span className="text-amber-300 font-medium">💪 Iniciando a jornada com determinação!</span>}
            {characterState === 'walking' && <span className="text-sky-300 font-medium">🚶 Ritmo firme e constante rumo ao objetivo!</span>}
            {characterState === 'running' && <span className="text-emerald-300 font-medium">🏃 Acelerando a todo vapor!</span>}
            {characterState === 'almost' && <span className="text-yellow-300 font-bold animate-pulse">⚡ Reta final! O topo está logo ali!</span>}
            {characterState === 'victory' && <span className="text-amber-300 font-bold">🏆 PARABÉNS! VOCÊ CONQUISTOU SUA META!</span>}
            {characterState === 'idle' && <span>Crie uma meta para começar a escalada</span>}
          </div>

          <span className="hidden sm:inline text-white/40 text-[10px]">
            Toque no personagem para interagir ✨
          </span>
        </div>
      </div>

      {/* Empty State Overlay if no active goal */}
      {!activeGoal && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 z-40">
          <div className="max-w-sm text-center bg-slate-900/90 border border-white/15 p-8 rounded-3xl shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30 mb-4">
              🎯
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sua Jornada Começa Aqui</h3>
            <p className="text-xs text-white/60 leading-relaxed mb-6">
              Defina seu sonho (um carro, uma viagem, reserva de emergência) e veja seu herói escalar os degraus até o topo a cada depósito!
            </p>
            <button
              onClick={onOpenCreate}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Criar Primeira Meta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
