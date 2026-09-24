import React, { useState, useEffect } from 'react';
import { Sparkles, Flame, Volume2, Lightbulb, ChevronRight, Target, Award, Quote } from 'lucide-react';
import { Goal } from '../types';
import { sounds } from '../utils/audio';

interface MotivationalCoachProps {
  activeGoal?: Goal | null;
  progress: number;
  formatCurrency: (value: number) => string;
  onDepositPrompt?: () => void;
  onSpawnParticles?: (count: number, emojis: string[]) => void;
}

const MOTIVATIONAL_QUOTES = [
  {
    quote: 'A disciplina é a ponte inabalável entre os seus objetivos e as suas grandes realizações.',
    author: 'Jim Rohn',
    category: 'Disciplina',
  },
  {
    quote: 'Não poupe o que sobra depois de gastar. Gaste apenas o que sobra depois de investir no seu sonho.',
    author: 'Warren Buffett',
    category: 'Riqueza',
  },
  {
    quote: 'Cada real economizado com foco é um soldado leal trabalhando 24 horas pela sua liberdade.',
    author: 'Mentalidade Próspera',
    category: 'Liberdade',
  },
  {
    quote: 'O que você faz hoje em silêncio vai determinar a vida que você viverá em público amanhã.',
    author: 'Foco Absoluto',
    category: 'Constância',
  },
  {
    quote: 'Grandes fortunas e sonhos reais não surgem por sorte. Nascem de hábitos diários que ninguém vê.',
    author: 'Sabedoria Financeira',
    category: 'Hábitos',
  },
  {
    quote: 'Quem domina a própria vontade domina o próprio dinheiro. Você está no comando do seu destino.',
    author: 'Autodomínio',
    category: 'Foco',
  },
  {
    quote: 'A dor da disciplina diária custa centavos; a dor do arrependimento custa uma fortuna.',
    author: 'Princípio do Sucesso',
    category: 'Decisão',
  },
  {
    quote: 'A montanha parece íngreme apenas para quem fica olhando da base. Você já está subindo!',
    author: 'Crescimento Real',
    category: 'Ação',
  },
  {
    quote: 'Comprar o que não precisa para impressionar quem não importa é a armadilha. Seu sonho é prioridade!',
    author: 'Clareza Financeira',
    category: 'Prioridade',
  },
  {
    quote: 'Constância vence o talento e a pressa. Passo a passo, o impossível vira rotina.',
    author: 'Lei da Subida',
    category: 'Resiliência',
  },
];

const PRACTICAL_TIPS = [
  {
    title: 'A Regra das 72 Horas',
    tip: 'Antes de uma compra não essencial, espere 3 dias. Se o desejo passar, guarde esse valor na sua meta!',
  },
  {
    title: 'Auditoria de Assinaturas',
    tip: 'Cancele aquele streaming ou app que você não usa há 1 mês. R$ 40/mês aceleram sua subida na montanha.',
  },
  {
    title: 'Pague a Si Mesmo Primeiro',
    tip: 'Assim que receber qualquer valor, separe o aporte da sua meta ANTES de pagar os boletos do dia a dia.',
  },
  {
    title: 'Transforme o Pequeno em Gigante',
    tip: 'Aquele cafezinho ou lanche de R$ 15 economizado 3x por semana vira R$ 180 a mais no seu sonho todo mês.',
  },
];

export default function MotivationalCoach({
  activeGoal,
  progress,
  formatCurrency,
  onDepositPrompt,
  onSpawnParticles,
}: MotivationalCoachProps) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'quote' | 'tips'>('quote');
  const [tipIndex, setTipIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [glowEffect, setGlowEffect] = useState(false);

  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex];
  const currentTip = PRACTICAL_TIPS[tipIndex];

  // Calculate Next Milestone
  let nextMilestonePercent = 25;
  let nextMilestoneLabel = '1º Marco (25%)';
  if (progress >= 75) {
    nextMilestonePercent = 100;
    nextMilestoneLabel = 'Topo Supremo (100%)';
  } else if (progress >= 50) {
    nextMilestonePercent = 75;
    nextMilestoneLabel = 'Reta Final (75%)';
  } else if (progress >= 25) {
    nextMilestonePercent = 50;
    nextMilestoneLabel = 'Metade do Caminho (50%)';
  }

  const remainingForGoal = activeGoal
    ? Math.max(0, activeGoal.targetAmount - activeGoal.currentAmount)
    : 0;

  const targetForNextMilestone = activeGoal
    ? Math.max(0, (activeGoal.targetAmount * (nextMilestonePercent / 100)) - activeGoal.currentAmount)
    : 0;

  // Level Badge
  let badge = { label: 'Iniciante Determinado', icon: '🥉', color: 'from-amber-700 to-amber-900 border-amber-600/40 text-amber-200' };
  if (progress >= 100) {
    badge = { label: 'Conquistador Supremo', icon: '👑', color: 'from-amber-400 to-yellow-500 border-yellow-300 text-slate-950 font-black' };
  } else if (progress >= 75) {
    badge = { label: 'Reta Final da Vitória', icon: '⚡', color: 'from-yellow-500 to-amber-600 border-yellow-400/50 text-white font-bold' };
  } else if (progress >= 50) {
    badge = { label: 'Mestre da Constância', icon: '🥇', color: 'from-cyan-500 to-blue-600 border-cyan-400/50 text-white font-bold' };
  } else if (progress >= 25) {
    badge = { label: 'Desbravador Focado', icon: '🥈', color: 'from-teal-500 to-emerald-600 border-emerald-400/50 text-white font-bold' };
  }

  // Next quote action
  const handleNextQuote = () => {
    sounds.playCharacterVoice();
    setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    setGlowEffect(true);
    setTimeout(() => setGlowEffect(false), 800);
    onSpawnParticles?.(6, ['✨', '🔥', '⭐', '💡']);
  };

  // Next tip action
  const handleNextTip = () => {
    sounds.playStep();
    setTipIndex((prev) => (prev + 1) % PRACTICAL_TIPS.length);
    setGlowEffect(true);
    setTimeout(() => setGlowEffect(false), 800);
  };

  // Speak motivation
  const handleSpeak = () => {
    if (activeTab === 'quote') {
      const textToSpeak = activeGoal
        ? `${currentQuote.quote}. Você já conquistou ${progress.toFixed(0)} porcento da sua meta ${activeGoal.name}. Continue firme!`
        : currentQuote.quote;
      sounds.speakMotivation(textToSpeak);
    } else {
      sounds.speakMotivation(`${currentTip.title}. ${currentTip.tip}`);
    }
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 3000);
  };

  return (
    <div
      className={`glass-elevated rounded-3xl p-5 sm:p-6 border transition-all duration-500 relative overflow-hidden ${
        glowEffect
          ? 'border-amber-400/60 shadow-2xl shadow-amber-500/20 bg-slate-900/95'
          : 'border-white/10 bg-slate-900/80 shadow-xl'
      }`}
    >
      {/* Background Ambience Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-amber-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
            <Flame className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Coach de Conquistas & Mentalidade
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                Motivação Real
              </span>
            </div>
            <p className="text-xs text-white/50">
              Incentivo diário e clareza para não desviar do seu objetivo
            </p>
          </div>
        </div>

        {/* Level / Rank Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs shadow-md bg-gradient-to-r ${badge.color}`}
        >
          <span className="text-sm">{badge.icon}</span>
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Main Motivational Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center relative z-10">
        {/* Quote / Tip Card (Left 8 cols) */}
        <div className="lg:col-span-8 p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 relative group">
          {/* Tabs switch: Frases de Impacto vs Dicas Práticas */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveTab('quote')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'quote'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Quote className="w-3 h-3" />
                <span>Frase de Impacto</span>
              </button>
              <button
                onClick={() => setActiveTab('tips')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'tips'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Lightbulb className="w-3 h-3" />
                <span>Dica de Economia</span>
              </button>
            </div>

            {/* Listen Audio Button */}
            <button
              onClick={handleSpeak}
              className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 ${
                isSpeaking
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 animate-pulse'
                  : 'bg-white/5 text-white/70 hover:text-cyan-300 hover:bg-cyan-500/10 border-white/10'
              }`}
              title="Ouvir motivação em voz alta (Português)"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px] font-semibold">Ouvir</span>
            </button>
          </div>

          {activeTab === 'quote' ? (
            <div>
              <p className="text-sm sm:text-base text-white/95 font-medium italic leading-relaxed mb-3 min-h-[50px]">
                "{currentQuote.quote}"
              </p>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold tracking-wide">— {currentQuote.author}</span>
                  <span className="text-white/30">•</span>
                  <span className="text-white/40 text-[11px]">{currentQuote.category}</span>
                </div>

                <button
                  onClick={handleNextQuote}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Nova Frase</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-amber-400 text-sm">💡</span>
                <h4 className="text-sm font-bold text-white">{currentTip.title}</h4>
              </div>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-3 min-h-[46px]">
                {currentTip.tip}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40 text-[11px]">
                  Dica {tipIndex + 1} de {PRACTICAL_TIPS.length}
                </span>
                <button
                  onClick={handleNextTip}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-bold transition-all flex items-center gap-1"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>Próxima Dica</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Goal Progress Tracker & Next Milestone Card (Right 4 cols) */}
        <div className="lg:col-span-4 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-slate-900 border border-amber-500/20 flex flex-col justify-between h-full">
          {activeGoal ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    Rumo ao Cume
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {progress.toFixed(0)}% do caminho
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5 truncate">
                  <span>{activeGoal.emoji}</span>
                  <span className="truncate">{activeGoal.name}</span>
                </h4>

                {progress < 100 ? (
                  <p className="text-xs text-white/70 mb-3">
                    Faltam <strong className="text-amber-300">{formatCurrency(remainingForGoal)}</strong> para realizar esse sonho por completo.
                  </p>
                ) : (
                  <p className="text-xs text-emerald-300 font-bold mb-3 flex items-center gap-1">
                    <Award className="w-4 h-4 text-yellow-400" />
                    Você chegou ao topo! Meta 100% batida!
                  </p>
                )}

                {/* Next Milestone target indicator */}
                {progress < 100 && (
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 mb-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-white/60">Próximo Marco:</span>
                      <span className="font-bold text-yellow-400">{nextMilestoneLabel}</span>
                    </div>
                    {targetForNextMilestone > 0 ? (
                      <p className="text-[11px] text-white/80">
                        Apenas mais <strong>{formatCurrency(targetForNextMilestone)}</strong> para a próxima grande celebração!
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-400 font-semibold">
                        Marco alcançado! Pronto para o próximo nível!
                      </p>
                    )}
                  </div>
                )}
              </div>

              {progress < 100 ? (
                <button
                  onClick={onDepositPrompt}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/25 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 mt-2"
                >
                  <Flame className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Fazer Aporte & Subir (+Degraus)</span>
                </button>
              ) : (
                <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs text-center">
                  🏆 Vitória Completa! Parabéns!
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mx-auto mb-2">
                🎯
              </div>
              <h4 className="text-xs font-bold text-white mb-1">Defina sua Meta Real</h4>
              <p className="text-[11px] text-white/50 mb-3">
                Cadastre seu objetivo para ativar o acompanhamento passo a passo do Coach.
              </p>
              <button
                onClick={onDepositPrompt}
                className="w-full py-2 px-3 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:brightness-110"
              >
                Cadastrar Meta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
