import React, { useState, useEffect } from 'react';
import { CharacterSkinId, CharacterState } from '../types';
import { sounds } from '../utils/audio';

interface CharacterHeroProps {
  state: CharacterState;
  skinId: CharacterSkinId;
  progress: number;
  boostEffect: boolean;
  accentGradient: string;
  goalName?: string;
  remainingAmount?: number;
  currentAmount?: number;
  formatCurrency?: (value: number) => string;
}

// Character specific motivational voice lines - Mature, inspiring & financial mindset
const SKIN_QUOTES: Record<CharacterSkinId, Record<CharacterState, string[]>> = {
  dante_dog: {
    idle: [
      'Au au! Dante conectado e farejando as melhores oportunidades de economia!',
      'Latido de alerta: cada real guardado hoje é um petisco financeiro no futuro!',
      'Radar quântico ativo! Sentado e vigiando seu patrimônio com lealdade canina.',
    ],
    struggling: [
      'Wuf! Primeiros passos da escalada! Abanando o rabo para celebrar seu esforço!',
      'Não desanime! Cachorro bom não larga o osso do planejamento financeiro!',
      'Latido de coragem! Subimos o primeiro degrau juntos! 🤖🐾',
    ],
    walking: [
      'Trote firme na montanha! Farejo disciplina e foco na sua meta!',
      'Au au! Mantendo o passo firme! Seus aportes estão dando resultado!',
      'Lealdade canina ao seu sonho! Cada aporte é um degrau a menos! 📈',
    ],
    running: [
      'AU AU! Reta de aceleração! Abanando o rabo cibernético na velocidade máxima!',
      'Mais da metade da montanha percorrida! Corrida triunfal rumo ao topo!',
      'Olha essa altitude! Quase alcançamos as nuvens da realização! ⚡🐕',
    ],
    almost: [
      'AUUUUUU! Uivo da vitória iminente! O topo está logo aqui, sinto o cheiro do troféu!',
      'Radar em 99%! Não para agora, o sonho da sua meta está ao alcance da pata!',
      'Latido supersônico! Só mais um fôlego e o topo é nosso!',
    ],
    victory: [
      'AUUUUUUU! 🏆 META CONQUISTADA COM SUCESSO! Abanando o rabo a mil por hora!',
      'Dante aprova 100%! Você provou ser o mestre da disciplina financeira! 🐾👑',
      'Uivo cósmico de vitória! Você chegou ao topo da montanha com maestria!',
    ],
  },
  executive: {
    idle: [
      'Visão de longo prazo: cada real guardado é um ativo trabalhando por você.',
      'Quem tem clareza de onde quer chegar nunca se perde no caminho.',
      'O mercado e a vida recompensam quem tem paciência e constância.',
    ],
    struggling: [
      'O início de qualquer grande patrimônio exige foco e disciplina!',
      'Pequenos aportes consistentes viram montanhas no futuro.',
      'Primeiro degrau conquistado com maestria estratégica! 💼',
    ],
    walking: [
      'Construindo seu objetivo tijolo por tijolo, aporte por aporte.',
      'Ritmo impecável. O planejamento financeiro está funcionando!',
      'Disciplina hoje, liberdade e paz amanhã! 📈',
    ],
    running: [
      'Mais da metade da meta batida! A sua evolução é visível!',
      'Acelerando rumo ao topo com rendimento e determinação máxima!',
      'Olha a distância que já percorremos! Continue firme! 🚀',
    ],
    almost: [
      'RETA FINAL! O topo da montanha está logo ali diante de nós! ⚡',
      'Consigo sentir o gostinho da meta realizada!',
      'Último esforço financeiro! Vamos fechar essa jornada com chave de ouro!',
    ],
    victory: [
      'OBJETIVO ATINGIDO COM SUCESSO ABSOLUTO! 🏆👑',
      'Você provou que tem disciplina de ferro e foco inabalável!',
      'Meta conquistada com honra e maestria financeira!',
    ],
  },
  astronaut: {
    idle: [
      'Próxima parada: a órbita dos seus maiores sonhos!',
      'O universo das grandes conquistas começa com a coragem do primeiro passo.',
      'Mantenha os olhos nas estrelas e os pés firmes no orçamento.',
    ],
    struggling: [
      'Vencendo a gravidade inicial! Cada economia dá propulsão!',
      'Propulsores ativados! Subindo os primeiros degraus cósmicos!',
      'Resistência superada com foco e determinação! 🚀',
    ],
    walking: [
      'Trajetória estabilizada! Ritmo constante rumo ao cume.',
      'Pequeno passo no cofre, salto gigante para a sua vida!',
      'Subindo a escadaria com precisão e disciplina matemática! 🌌',
    ],
    running: [
      'Propulsores a 100%! Rompendo a barreira da metade!',
      'Mais da metade da jornada concluída! O topo se aproxima!',
      'Aceleração máxima! Deixando as dúvidas e gastos fúteis para trás! ⚡',
    ],
    almost: [
      'ALERTA DE CUME! RETA FINAL DA GRANDE MISSÃO! 🔥',
      'Pouso no topo em andamento! Segure firme na disciplina!',
      'Faltam apenas alguns passos para a glória de realizar o seu sonho! 🛸',
    ],
    victory: [
      'MISSÃO CUMPRIDA COM SUCESSO! META CONQUISTADA! 🏆✨',
      'Você alcançou o cume e realizou o que parecia impossível!',
      'A sua disciplina levou você até o topo!',
    ],
  },
  wizard: {
    idle: [
      'A sabedoria financeira transforma pequenos hábitos em grandes conquistas.',
      'Constância e paciência são a mais nobre magia da prosperidade.',
      'Qual sonho realizaremos juntos hoje?',
    ],
    struggling: [
      'O hábito da economia floresce a partir do primeiro degrau!',
      'Pequenas moedas são as sementes que geram a verdadeira liberdade.',
      'Primeiro degrau iluminado com foco e determinação! ✨',
    ],
    walking: [
      'O fluxo da prosperidade cresce na proporção da sua disciplina.',
      'A verdadeira inteligência é escolher o que você mais quer no longo prazo.',
      'Os ventos da realização sopram a nosso favor! 🔮',
    ],
    running: [
      'Energia supercharged! Já superamos a barreira da metade!',
      'A força do hábito está atraindo o topo para perto de nós!',
      'Você é a prova viva de que a constância supera qualquer obstáculo! ⚡',
    ],
    almost: [
      'A GRANDE REALIZAÇÃO ESTÁ AO ALCANCE DAS NOSSAS MÃOS! 🔥',
      'Consigo ver o troféu reluzindo no cume da montanha!',
      'Último fôlego! A conquista já é quase uma realidade!',
    ],
    victory: [
      'TRIUNFO COMPLETO! SUA META FOI TOTALMENTE CONQUISTADA! 👑✨',
      'Você transformou esforço em conquista com maestria!',
      'A glória da vitória pertence a quem tem determinação!',
    ],
  },
  lucky_cat: {
    idle: [
      'A boa sorte financeira segue quem tem disciplina inabalável!',
      'Cada economia é um passo a mais rumo à fartura e tranquilidade.',
      'Quem cuida bem do seu dinheiro atrai abundância e paz!',
    ],
    struggling: [
      'O primeiro passo é o mais valioso de toda a caminhada!',
      'Com paciência diária e foco no objetivo, você alcança qualquer cume.',
      'Começou a subida com energia e determinação positiva! 🐾',
    ],
    walking: [
      'Passo a passo, subindo com leveza e certeza de vitória!',
      'A cada aporte, o seu sonho fica mais perto de virar realidade.',
      'Constância atrai prosperidade, tranquilidade e realização! ✨',
    ],
    running: [
      'Excelente ritmo! Já passamos da metade da montanha!',
      'A sua dedicação está rendendo frutos reais e visíveis!',
      'Continue acelerando! A abundância está cada vez mais perto! 🏃',
    ],
    almost: [
      'RETA FINAL DECISIVA! NÃO DESVIE O FOCO AGORA! ⚡',
      'O cume da conquista está diante dos seus olhos!',
      'Só mais alguns passos para comemorar essa grande vitória!',
    ],
    victory: [
      'É CAMPEÃO! VOCÊ CONQUISTOU A SUA META REAL! 🏆🎉',
      'Muita prosperidade, tranquilidade e fartura para a sua vida!',
      'Você provou que o seu esforço vale a pena!',
    ],
  },
  ninja: {
    idle: [
      'Silencioso nas despesas, implacável nos seus objetivos.',
      'A disciplina inabalável transforma qualquer sonho em realidade.',
      'Defina o alvo com precisão. Quem tem foco não erra o caminho.',
    ],
    struggling: [
      'O treinamento do guerreiro exige corte de distrações!',
      'Mantenha a postura e o foco. A grande jornada começou!',
      'Subindo o primeiro degrau com equilíbrio absoluto! 🥷',
    ],
    walking: [
      'Passos firmes e postura de vencedor. O progresso é real e constante!',
      'Quem domina a própria mente domina o próprio dinheiro.',
      'Avançando pela escadaria com disciplina militar!',
    ],
    running: [
      'Velocidade e precisão! Cortando a montanha sem hesitar!',
      'Mais da metade do percurso percorrido com honra e garra!',
      'Foco inabalável! O topo já está ao alcance dos nossos olhos! ⚡',
    ],
    almost: [
      'RETA DECISIVA! FOCO MÁXIMO NA CONQUISTA FINAL! 🔥',
      'Visão travada no topo da montanha. Nada pode nos parar!',
      'Mantenha a guarda alta e acelere! A vitória nos aguarda!',
    ],
    victory: [
      'MISSÃO CONCLUÍDA COM HONRA E PERFEIÇÃO! 🏆⚔️',
      'Você é o verdadeiro mestre da disciplina e da realização!',
      'O topo da montanha sagrada pertence aos perseverantes!',
    ],
  },
  valkyrie: {
    idle: [
      'Pela bravura dos que ousam sonhar grande e trabalhar pelo objetivo!',
      'Determinação inabalável para quem cumpre as próprias metas.',
      'Mantenha o escudo erguido contra gastos por impulso.',
    ],
    struggling: [
      'A verdadeira coragem está em dar o primeiro passo na subida!',
      'Escudo firme contra o consumismo fútil! Avante!',
      'Primeiro degrau tomado com bravura e determinação! ⚔️',
    ],
    walking: [
      'Marchando com a firmeza de quem sabe exatamente onde quer chegar!',
      'A disciplina diária forja a verdadeira liberdade e realização.',
      'Cada degrau superado é uma vitória da sua força de vontade!',
    ],
    running: [
      'Ascensão brilhante! Cortando os caminhos rumo ao grande cume!',
      'Mais da metade da montanha sagrada já foi conquistada!',
      'A vitória se aproxima com a luz da sua determinação! ⚡',
    ],
    almost: [
      'O CUME DA VITÓRIA ESTÁ À VISTA! RESISTA E AVANCE! 🔥',
      'Potência máxima! O troféu está a poucos passos!',
      'Último impulso heroico! O sonho é seu!',
    ],
    victory: [
      'GLÓRIA ETERNA! SUA META FOI HEROICAMENTE CONQUISTADA! 👑🏆',
      'Celebre com orgulho a sua determinação e vitória grandiosa!',
      'Você é um(a) verdadeiro(a) campeão(ã) da disciplina!',
    ],
  },
};

export default function CharacterHero({
  state,
  skinId,
  progress,
  boostEffect,
  accentGradient,
  goalName,
  remainingAmount,
  currentAmount,
  formatCurrency,
}: CharacterHeroProps) {
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [isWaving, setIsWaving] = useState(false);
  const [isSpeakingBubble, setIsSpeakingBubble] = useState(false);

  // Trigger interaction & voice
  const triggerInteraction = (customQuote?: string) => {
    sounds.playCharacterVoice();
    setIsWaving(true);
    setTimeout(() => setIsWaving(false), 1200);

    if (customQuote) {
      setSpeechBubble(customQuote);
      return;
    }

    // Dynamic goal-tailored motivation
    if (goalName && Math.random() > 0.45) {
      const remainingStr = formatCurrency && remainingAmount ? formatCurrency(remainingAmount) : '';
      const currentStr = formatCurrency && currentAmount ? formatCurrency(currentAmount) : '';

      const contextualQuotes = [
        `Cada real guardado para ${goalName} é um passo firme rumo à sua conquista!`,
        remainingStr
          ? `Faltam ${remainingStr} para conquistar ${goalName}! Mantenha o foco, vai valer a pena!`
          : `Rumo ao topo de ${goalName}! Você está no controle do seu destino!`,
        currentStr
          ? `Você já garantiu ${currentStr} para ${goalName}! A sua constância é admirável!`
          : `Constância vence qualquer obstáculo. Seu sonho está cada vez mais perto!`,
        `Imagine a emoção de realizar ${goalName}! Continue subindo degrau por degrau!`,
      ];
      const selected = contextualQuotes[Math.floor(Math.random() * contextualQuotes.length)];
      setSpeechBubble(selected);
      return;
    }

    const skinQuoteMap = SKIN_QUOTES[skinId] || SKIN_QUOTES.executive;
    const quotes = skinQuoteMap[state] || skinQuoteMap.walking;
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setSpeechBubble(randomQuote);
  };

  // Welcome motivation once on initial load if 0 progress
  useEffect(() => {
    if (progress === 0 && goalName) {
      const initialTimer = setTimeout(() => {
        triggerInteraction(`Pronto para subir a montanha de ${goalName}? O primeiro aporte é o mais importante!`);
      }, 1500);
      return () => clearTimeout(initialTimer);
    }
  }, [goalName]);

  // When boostEffect triggers (deposit made or milestone hit), cheer immediately with impact!
  useEffect(() => {
    if (boostEffect) {
      const cheerQuotes = [
        `Aporte confirmado! Mais um salto gigante rumo a ${goalName || 'ao seu sonho'}! 🚀`,
        'Sentiu esse impulso? A disciplina é o segredo de quem conquista o topo! 💰',
        'Mais degraus superados! Quem poupa com propósito não tem limites! ⚡',
        'Aceleração máxima! Cada economia hoje é sua liberdade de amanhã! 🏆',
      ];
      const quote = cheerQuotes[Math.floor(Math.random() * cheerQuotes.length)];
      triggerInteraction(quote);
    }
  }, [boostEffect, goalName]);

  // Clear speech after 6.5s
  useEffect(() => {
    if (!speechBubble) return;
    const timer = setTimeout(() => {
      setSpeechBubble(null);
    }, 6500);
    return () => clearTimeout(timer);
  }, [speechBubble]);

  // Read speech bubble aloud
  const handleReadSpeech = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!speechBubble) return;
    sounds.speakMotivation(speechBubble);
    setIsSpeakingBubble(true);
    setTimeout(() => setIsSpeakingBubble(false), 2500);
  };

  // Motion animation class
  const getBodyMotionClass = () => {
    if (isWaving) return 'animate-character-bounce';
    switch (state) {
      case 'struggling':
        return 'animate-hero-struggle';
      case 'walking':
        return 'animate-hero-walk';
      case 'running':
        return 'animate-hero-run';
      case 'almost':
        return 'animate-hero-turbo';
      case 'victory':
        return 'animate-hero-victory';
      default:
        return 'animate-hero-idle';
    }
  };

  // Dynamic Tier Levels (Visual Evolution as Goal climbs)
  const isTier1 = progress >= 25;
  const isTier2 = progress >= 50;
  const isTier3 = progress >= 75;
  const isTier4 = progress >= 100;

  return (
    <div
      onClick={() => triggerInteraction()}
      className="relative cursor-pointer select-none group flex flex-col items-center"
      title="Toque no herói para ouvir sua motivação!"
    >
      {/* Speech Bubble */}
      {speechBubble && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-20 left-1/2 -translate-x-1/2 z-40 w-max max-w-[280px] sm:max-w-[320px] text-left p-3 rounded-2xl bg-slate-950/95 text-white text-xs font-semibold border border-amber-400/70 shadow-2xl shadow-amber-500/30 animate-pop-in backdrop-blur-md"
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="text-amber-400 font-bold text-xs flex items-center gap-1">
              <span>💬</span> Mentor em Ação
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleReadSpeech}
                className={`p-1 rounded-md text-[10px] transition-all flex items-center gap-0.5 ${
                  isSpeakingBubble ? 'bg-cyan-500/30 text-cyan-300' : 'bg-white/10 hover:bg-white/20 text-white/70'
                }`}
                title="Ouvir em voz alta"
              >
                🔊
              </button>
              <button
                onClick={() => setSpeechBubble(null)}
                className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 text-[10px]"
                title="Fechar"
              >
                ✕
              </button>
            </div>
          </div>
          <p className="leading-snug text-white/90 text-[11px] sm:text-xs">{speechBubble}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-slate-950" />
        </div>
      )}

      {/* TIER 3 / TURBO: Supercharged Golden Fire Corona & Orbiting Coin Orbs */}
      {(isTier3 || boostEffect || state === 'almost') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Flame Corona */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-t from-amber-500/30 via-yellow-400/20 to-transparent blur-lg animate-pulse" />
          {/* Orbiting Coin Glyphs */}
          <div className="absolute w-24 h-24 rounded-full border border-amber-400/30 animate-spin-slow pointer-events-none">
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs drop-shadow-[0_0_8px_#fde047]">✨</span>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs drop-shadow-[0_0_8px_#fde047]">🪙</span>
          </div>
        </div>
      )}

      {/* TIER 2: Radiant Dual Aura Ring */}
      {isTier2 && (
        <div className="absolute -inset-2 rounded-full border border-cyan-400/30 blur-[1px] animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
      )}

      {/* Victory Rays & Fireworks Burst */}
      {isTier4 && (
        <div className="absolute -top-12 inset-x-0 flex flex-col items-center pointer-events-none">
          <div className="relative">
            <span className="text-3xl animate-bounce">👑</span>
            <div className="absolute -inset-4 rounded-full bg-yellow-300/40 blur-xl animate-pulse" />
          </div>
        </div>
      )}

      {/* Dynamic Ground Shadow */}
      <div
        className="absolute bottom-1 w-16 h-3.5 bg-black/40 rounded-[100%] blur-[2px] transition-all duration-500"
        style={{
          transform: `scale(${
            state === 'victory' ? 0.7 : state === 'almost' ? 1.15 : state === 'struggling' ? 1.25 : 1
          })`,
          opacity: state === 'victory' ? 0.25 : 0.55,
        }}
      />

      {/* Character Graphic */}
      <div className={`relative ${getBodyMotionClass()} transition-transform duration-300`}>
        {skinId === 'dante_dog' && <DanteDogSvg state={state} isWaving={isWaving} progress={progress} />}
        {skinId === 'executive' && <ExecutiveSvg state={state} isWaving={isWaving} progress={progress} />}
        {skinId === 'astronaut' && <AstronautSvg state={state} isWaving={isWaving} progress={progress} />}
        {skinId === 'wizard' && <WizardSvg state={state} isWaving={isWaving} progress={progress} />}
        {skinId === 'lucky_cat' && <LuckyCatSvg state={state} isWaving={isWaving} progress={progress} />}
        {skinId === 'ninja' && <NinjaSvg state={state} isWaving={isWaving} progress={progress} />}
        {skinId === 'valkyrie' && <ValkyrieSvg state={state} isWaving={isWaving} progress={progress} />}
      </div>

      {/* Hover Micro-Badge */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 text-[9px] text-white/70 bg-slate-950/80 px-2.5 py-0.5 rounded-full whitespace-nowrap pointer-events-none border border-white/10 shadow-lg">
        Toque para motivar ✨
      </div>
    </div>
  );
}

// =========================================================================
// 1. O Magnata / Executivo (Terno italiano, óculos escuros espelhados, maleta com notas)
// =========================================================================
function ExecutiveSvg({ state, isWaving, progress }: { state: CharacterState; isWaving: boolean; progress: number }) {
  const isVictory = state === 'victory';
  const isStruggling = state === 'struggling';
  const isRunning = state === 'running' || state === 'almost';

  return (
    <svg width="88" height="118" viewBox="0 0 88 118" fill="none" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="lapelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="tieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
        <linearGradient id="goldGlint" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <linearGradient id="briefcaseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
        <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="100%" stopColor="#fba06a" />
        </linearGradient>
      </defs>

      {/* Head */}
      <g id="head">
        {/* Hair - Stylish executive sweep */}
        <path
          d="M 30 26 C 30 15, 38 11, 50 12 C 60 13, 62 21, 62 26 C 60 22, 52 20, 42 22 C 34 23, 31 27, 30 26 Z"
          fill="#1c1917"
        />
        {/* Face */}
        <circle cx="44" cy="28" r="14" fill="url(#skinGrad)" stroke="#f97316" strokeWidth="0.5" />
        {/* Ears */}
        <circle cx="30" cy="28" r="2.5" fill="url(#skinGrad)" />
        <circle cx="58" cy="28" r="2.5" fill="url(#skinGrad)" />

        {/* Aviator Sunglasses with Animated Light Sweep */}
        <g>
          <rect x="41.5" y="24" width="5" height="1.5" rx="0.5" fill="#ca8a04" />
          <rect x="32" y="22" width="10" height="8" rx="2.5" fill="#0f172a" stroke="#eab308" strokeWidth="0.8" />
          <rect x="46" y="22" width="10" height="8" rx="2.5" fill="#0f172a" stroke="#eab308" strokeWidth="0.8" />
          {/* Animated lens glint reflection */}
          <line x1="34" y1="23" x2="38" y2="29" stroke="#38bdf8" strokeWidth="1" opacity="0.9" className="animate-visor-sweep" />
          <line x1="48" y1="23" x2="52" y2="29" stroke="#38bdf8" strokeWidth="1" opacity="0.9" className="animate-visor-sweep" />
        </g>

        {/* Confident Smile */}
        {isVictory ? (
          <path d="M 38 34 Q 44 41 50 34" stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round" fill="#ffffff" />
        ) : isStruggling ? (
          <line x1="40" y1="36" x2="48" y2="35" stroke="#9a3412" strokeWidth="1.5" strokeLinecap="round" />
        ) : (
          <path d="M 40 34 Q 44 37 48 34" stroke="#9a3412" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        )}
      </g>

      {/* Neck */}
      <rect x="41" y="41" width="6" height="5" fill="url(#skinGrad)" />

      {/* Torso / Italian Suit Jacket */}
      <g id="torso">
        <path
          d="M 28 45 C 28 43, 35 42, 44 42 C 53 42, 60 43, 60 45 L 58 74 C 58 75, 54 76, 44 76 C 34 76, 30 75, 30 74 Z"
          fill="url(#suitGrad)"
          stroke="#334155"
          strokeWidth="0.6"
        />

        {/* White Shirt Collar */}
        <polygon points="38,43 44,52 40,43" fill="#ffffff" />
        <polygon points="50,43 44,52 48,43" fill="#ffffff" />

        {/* Lapels */}
        <polygon points="28,45 38,44 42,60 32,62" fill="url(#lapelGrad)" />
        <polygon points="60,45 50,44 46,60 56,62" fill="url(#lapelGrad)" />

        {/* Silk Red Tie with Gold Tie-Clip */}
        <g className={isRunning ? 'animate-tie-flutter origin-top' : ''}>
          <polygon points="42.5,47 45.5,47 46,63 44,66 42,63" fill="url(#tieGrad)" />
          <line x1="43" y1="56" x2="46" y2="56" stroke="url(#goldGlint)" strokeWidth="1" />
        </g>

        {/* Pocket Square with Gold Pin */}
        <rect x="51" y="50" width="5" height="1.5" fill="#f8fafc" />
        <circle cx="53.5" cy="49" r="1" fill="url(#goldGlint)" />
      </g>

      {/* Left Arm & Briefcase with Escaping Dollar Bills & Gold Coins */}
      <g className={isVictory ? 'animate-arm-victory origin-top-left' : isRunning ? 'animate-arm-run origin-top-left' : 'animate-arm-swing origin-top-left'}>
        <path d="M 29 45 C 25 48, 22 58, 22 65" stroke="url(#suitGrad)" strokeWidth="7" strokeLinecap="round" />
        <circle cx="22" cy="67" r="3.5" fill="url(#skinGrad)" />

        {/* Gold Watch with Glint */}
        <rect x="20" y="63" width="4" height="2" rx="0.5" fill="url(#goldGlint)" />

        {/* Executive Briefcase */}
        <g transform="translate(7, 60)">
          <rect x="0" y="6" width="17" height="13" rx="2" fill="url(#briefcaseGrad)" stroke="#451a03" strokeWidth="0.8" />
          <path d="M 5.5 6 L 5.5 4 C 5.5 2.5, 11.5 2.5, 11.5 4 L 11.5 6" stroke="url(#goldGlint)" strokeWidth="1" fill="none" />
          <circle cx="8.5" cy="12.5" r="1.5" fill="url(#goldGlint)" />
          {/* Green bills peeking out */}
          <rect x="3" y="4.5" width="4.5" height="2.5" fill="#22c55e" rx="0.5" />
          <rect x="9.5" y="4.5" width="4.5" height="2.5" fill="#10b981" rx="0.5" />
          {/* Floating gold spark */}
          <circle cx="15" cy="3" r="1.5" fill="url(#goldGlint)" className="animate-ping" />
        </g>
      </g>

      {/* Right Arm */}
      <g
        className={
          isVictory
            ? 'animate-arm-victory origin-top-right'
            : isWaving
            ? 'animate-wave origin-top-right'
            : isRunning
            ? 'animate-arm-run origin-top-right'
            : 'animate-arm-swing origin-top-right'
        }
        style={{ animationDelay: '0.2s' }}
      >
        <path d="M 59 45 C 63 48, 66 58, 66 65" stroke="url(#suitGrad)" strokeWidth="7" strokeLinecap="round" />
        <circle cx="66" cy="67" r="3.5" fill="url(#skinGrad)" />

        {/* Diamond Pinky Ring */}
        <circle cx="68" cy="67" r="1.2" fill="#38bdf8" />

        {/* Victory Gold Coin */}
        {isVictory && (
          <g transform="translate(64, 53)">
            <circle cx="6" cy="6" r="6" fill="url(#goldGlint)" stroke="#854d0e" strokeWidth="1" />
            <text x="6" y="9.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#713f12">R$</text>
          </g>
        )}
      </g>

      {/* Legs & Polished Shoes */}
      <g id="legs">
        <g className={isRunning ? 'animate-leg-run origin-top' : 'animate-leg-walk origin-top'}>
          <path d="M 36 75 L 35 98" stroke="#0f172a" strokeWidth="7" strokeLinecap="round" />
          <ellipse cx="33" cy="101" rx="6" ry="3.5" fill="#020617" />
          <ellipse cx="31" cy="100" rx="2" ry="1" fill="#64748b" />
        </g>

        <g className={isRunning ? 'animate-leg-run origin-top' : 'animate-leg-walk origin-top'} style={{ animationDelay: '0.25s' }}>
          <path d="M 52 75 L 53 98" stroke="#0f172a" strokeWidth="7" strokeLinecap="round" />
          <ellipse cx="55" cy="101" rx="6" ry="3.5" fill="#020617" />
          <ellipse cx="53" cy="100" rx="2" ry="1" fill="#64748b" />
        </g>
      </g>
    </svg>
  );
}

// =========================================================================
// 2. A Astronauta (Capacete cósmico, propulsores plasma com chamas, computador HUD)
// =========================================================================
function AstronautSvg({ state, isWaving, progress }: { state: CharacterState; isWaving: boolean; progress: number }) {
  const isVictory = state === 'victory';
  const isRunning = state === 'running' || state === 'almost';

  return (
    <svg width="88" height="118" viewBox="0 0 88 118" fill="none" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="suitWhite" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="70%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="visorGalaxy" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="35%" stopColor="#6366f1" />
          <stop offset="70%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="plasmaFire" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="40%" stopColor="#06b6d4" />
          <stop offset="75%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>

      {/* Jetpack with Rocket Thruster Nozzles & Dual Plasma Fire */}
      <g id="jetpack">
        <rect x="25" y="44" width="38" height="26" rx="6" fill="#475569" stroke="#334155" strokeWidth="1" />
        <rect x="28" y="68" width="8" height="6" rx="1" fill="#1e293b" />
        <rect x="52" y="68" width="8" height="6" rx="1" fill="#1e293b" />

        {/* Dynamic Plasma Fire Cones */}
        {isRunning && (
          <g className="animate-flame-boost">
            <polygon points="29,74 35,74 32,92" fill="url(#plasmaFire)" />
            <polygon points="53,74 59,74 56,92" fill="url(#plasmaFire)" />
            <circle cx="32" cy="80" r="2" fill="#ffffff" />
            <circle cx="56" cy="80" r="2" fill="#ffffff" />
          </g>
        )}
      </g>

      {/* Cosmic Helmet & Visor */}
      <g id="helmet">
        <circle cx="44" cy="28" r="17" fill="url(#suitWhite)" stroke="#64748b" strokeWidth="1.2" />
        {/* Galaxy Visor */}
        <ellipse cx="44" cy="28" rx="13" ry="11" fill="url(#visorGalaxy)" stroke="#0284c7" strokeWidth="1" />
        {/* Stars inside visor */}
        <circle cx="38" cy="25" r="1" fill="#ffffff" className="animate-pulse" />
        <circle cx="48" cy="31" r="0.8" fill="#ffffff" />
        <circle cx="42" cy="29" r="0.8" fill="#fef08a" />
        {/* Curved Reflection Arch */}
        <path d="M 36 23 Q 46 20 50 24" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" fill="none" />
        {/* Antenna with Blinking LED */}
        <line x1="44" y1="11" x2="44" y2="4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        <circle cx="44" cy="3" r="2.5" fill="#f43f5e" className="animate-ping" />
      </g>

      {/* Spacesuit Body */}
      <rect x="30" y="44" width="28" height="30" rx="5" fill="url(#suitWhite)" stroke="#64748b" strokeWidth="1" />

      {/* Chest Life Support Terminal with Glowing HUD Bars */}
      <rect x="35" y="49" width="18" height="10" rx="2" fill="#0f172a" />
      <circle cx="39" cy="54" r="1.5" fill="#10b981" className="animate-pulse" />
      <circle cx="44" cy="54" r="1.5" fill="#38bdf8" />
      <circle cx="49" cy="54" r="1.5" fill="#f59e0b" />

      {/* Golden Astronaut NASA-Style Seal */}
      <circle cx="51" cy="67" r="3" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />

      {/* Arms & Heavy Space Gloves */}
      <g className={isRunning ? 'animate-arm-run origin-top-left' : 'animate-arm-swing origin-top-left'}>
        <path d="M 30 47 C 24 50, 20 58, 20 66" stroke="url(#suitWhite)" strokeWidth="8" strokeLinecap="round" />
        <circle cx="20" cy="68" r="4.5" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
      </g>

      <g className={isVictory ? 'animate-arm-victory origin-top-right' : isRunning ? 'animate-arm-run origin-top-right' : 'animate-arm-swing origin-top-right'} style={{ animationDelay: '0.2s' }}>
        <path d="M 58 47 C 64 50, 68 58, 68 66" stroke="url(#suitWhite)" strokeWidth="8" strokeLinecap="round" />
        <circle cx="68" cy="68" r="4.5" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
      </g>

      {/* Heavy Moon Boots */}
      <g className={isRunning ? 'animate-leg-run origin-top' : 'animate-leg-walk origin-top'}>
        <path d="M 37 74 L 36 96" stroke="url(#suitWhite)" strokeWidth="8" strokeLinecap="round" />
        <rect x="30" y="95" width="12" height="7" rx="2" fill="#0f172a" />
      </g>

      <g className={isRunning ? 'animate-leg-run origin-top' : 'animate-leg-walk origin-top'} style={{ animationDelay: '0.25s' }}>
        <path d="M 51 74 L 52 96" stroke="url(#suitWhite)" strokeWidth="8" strokeLinecap="round" />
        <rect x="46" y="95" width="12" height="7" rx="2" fill="#0f172a" />
      </g>
    </svg>
  );
}

// =========================================================================
// 3. O Alquimista (Grimório flutuante, cajado com cristal rotativo e runas orbitais)
// =========================================================================
function WizardSvg({ state, isWaving, progress }: { state: CharacterState; isWaving: boolean; progress: number }) {
  const isVictory = state === 'victory';
  const isRunning = state === 'running' || state === 'almost';

  return (
    <svg width="88" height="118" viewBox="0 0 88 118" fill="none" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="robeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7e22ce" />
          <stop offset="50%" stopColor="#581c87" />
          <stop offset="100%" stopColor="#3b0764" />
        </linearGradient>
        <linearGradient id="crystalPrism" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* Floating Magic Grimoire on Left Side */}
      <g className="animate-grimoire-float" transform="translate(10, 50)">
        <rect x="0" y="0" width="14" height="18" rx="2" fill="#451a03" stroke="#d97706" strokeWidth="0.8" />
        <rect x="2" y="2" width="10" height="14" rx="1" fill="#fef08a" />
        <text x="7" y="11" textAnchor="middle" fontSize="6" fill="#78350f">ᛟ</text>
        <circle cx="14" cy="4" r="1.5" fill="#fde047" className="animate-ping" />
      </g>

      {/* Wizard Hat with Star */}
      <g id="hat">
        <ellipse cx="44" cy="24" rx="22" ry="5" fill="#3b0764" stroke="#a855f7" strokeWidth="1" />
        <polygon points="28,23 60,23 50,2 44,4" fill="url(#robeGrad)" stroke="#a855f7" strokeWidth="0.8" />
        <rect x="38" y="20" width="12" height="4" rx="1" fill="#fbbf24" stroke="#b45309" strokeWidth="0.8" />
        <text x="42" y="14" fontSize="8" fill="#fde047">✦</text>
      </g>

      {/* Face & Flowing Silver Beard */}
      <circle cx="44" cy="30" r="10" fill="#fed7aa" />
      <circle cx="41" cy="28" r="1.5" fill="#a855f7" />
      <circle cx="47" cy="28" r="1.5" fill="#a855f7" />
      <path d="M 35 32 Q 44 48 53 32 Q 50 44 44 48 Q 38 44 35 32 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" />

      {/* Mystical Robe with Rune Inscriptions */}
      <polygon points="32,42 56,42 64,94 24,94" fill="url(#robeGrad)" stroke="#a855f7" strokeWidth="1" />
      <text x="42" y="58" fontSize="8" fill="#fbbf24" opacity="0.85">ᚠ</text>
      <text x="42" y="70" fontSize="8" fill="#fbbf24" opacity="0.85">ᛟ</text>
      <text x="42" y="82" fontSize="8" fill="#fbbf24" opacity="0.85">ᛒ</text>

      {/* Staff with Spinning Prism Crystal & Orbiting Elemental Runes */}
      <g className={isRunning ? 'animate-pulse' : ''}>
        <line x1="68" y1="20" x2="68" y2="98" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M 64 22 C 64 16, 72 16, 72 22 Z" fill="#b45309" />
        {/* Spinning Prism Crystal */}
        <polygon points="68,8 73,16 68,24 63,16" fill="url(#crystalPrism)" stroke="#fef08a" strokeWidth="1" className="animate-spin-slow origin-[68px_16px]" />
        {/* Orbiting Runestones */}
        <circle cx="78" cy="14" r="2.5" fill="#38bdf8" className="animate-pulse" />
        <circle cx="58" cy="18" r="2.5" fill="#f59e0b" className="animate-pulse" />
      </g>

      {/* Feet */}
      <ellipse cx="34" cy="95" rx="5" ry="3" fill="#1e1b4b" />
      <ellipse cx="54" cy="95" rx="5" ry="3" fill="#1e1b4b" />
    </svg>
  );
}

// =========================================================================
// 4. Cyber Neko (Gato da Fortuna com visor HUD scouter, Koban dourada brilhante)
// =========================================================================
function LuckyCatSvg({ state, isWaving, progress }: { state: CharacterState; isWaving: boolean; progress: number }) {
  const isRunning = state === 'running' || state === 'almost';
  const isVictory = state === 'victory';

  return (
    <svg width="88" height="118" viewBox="0 0 88 118" fill="none" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="catWhite" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>

      {/* Tail Wagging */}
      <path
        d="M 26 74 C 16 74, 14 56, 20 52"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        className="animate-wiggle origin-right"
      />

      {/* Ears with Pink Interior */}
      <polygon points="28,18 38,4 42,24" fill="url(#catWhite)" stroke="#f43f5e" strokeWidth="1.5" />
      <polygon points="32,16 37,8 39,20" fill="#fda4af" />
      <polygon points="60,18 50,4 46,24" fill="url(#catWhite)" stroke="#f43f5e" strokeWidth="1.5" />
      <polygon points="56,16 51,8 49,20" fill="#fda4af" />

      {/* Round Cat Head */}
      <circle cx="44" cy="30" r="16" fill="url(#catWhite)" stroke="#cbd5e1" strokeWidth="1" />

      {/* Cyber Scouter Visor over Right Eye */}
      <rect x="47" y="24" width="9" height="7" rx="2" fill="#10b981" opacity="0.8" stroke="#34d399" strokeWidth="0.8" />
      <text x="51.5" y="29.5" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#ffffff">+R$</text>

      {/* Normal Left Eye & Whiskers */}
      <path d="M 35 28 Q 38 24 41 28" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
      <line x1="28" y1="30" x2="20" y2="29" stroke="#94a3b8" strokeWidth="1" />
      <line x1="28" y1="33" x2="20" y2="35" stroke="#94a3b8" strokeWidth="1" />

      {/* Cheeks & Cute Nose */}
      <ellipse cx="34" cy="33" rx="3" ry="2" fill="#fda4af" opacity="0.8" />
      <polygon points="43,30 45,30 44,32" fill="#f43f5e" />
      <path d="M 41 34 Q 44 36 47 34" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Red Collar & Golden Bell */}
      <rect x="32" y="44" width="24" height="4" rx="2" fill="#dc2626" />
      <circle cx="44" cy="49" r="4.5" fill="#fbbf24" stroke="#b45309" strokeWidth="0.8" className="animate-ping" style={{ animationDuration: '3s' }} />

      {/* Chubby Body */}
      <ellipse cx="44" cy="66" rx="16" ry="19" fill="url(#catWhite)" stroke="#cbd5e1" strokeWidth="1" />

      {/* Sparkling Golden Koban Coin */}
      <g transform="translate(37, 57)">
        <rect x="0" y="0" width="14" height="18" rx="4" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
        <text x="7" y="12" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#78350f">千万両</text>
        <circle cx="12" cy="2" r="1.5" fill="#ffffff" className="animate-ping" />
      </g>

      {/* Beckoning Lucky Paw */}
      <g className="animate-bounce origin-top">
        <ellipse cx="60" cy="48" rx="5" ry="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
        <circle cx="60" cy="49" r="2.5" fill="#fda4af" />
        <circle cx="64" cy="42" r="1" fill="#fbbf24" className="animate-ping" />
      </g>

      {/* Feet */}
      <ellipse cx="34" cy="85" rx="6" ry="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
      <ellipse cx="54" cy="85" rx="6" ry="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
    </svg>
  );
}

// =========================================================================
// 5. O Shinobi (Faixa ninja esvoaçante, lâminas nas costas, shuriken dourada)
// =========================================================================
function NinjaSvg({ state, isWaving, progress }: { state: CharacterState; isWaving: boolean; progress: number }) {
  const isRunning = state === 'running' || state === 'almost';
  const isVictory = state === 'victory';

  return (
    <svg width="88" height="118" viewBox="0 0 88 118" fill="none" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="ninjaBlack" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#090d16" />
        </linearGradient>
      </defs>

      {/* Aerodynamic Emerald Ribbon Scarf */}
      <g className="animate-tie-flutter origin-left">
        <path d="M 28 23 Q 12 16 6 26 Q 16 30 26 27 Z" fill="#10b981" />
        <path d="M 28 25 Q 10 24 4 38 Q 14 36 26 29 Z" fill="#059669" />
      </g>

      {/* Head with Ninja Mask */}
      <circle cx="44" cy="28" r="14" fill="url(#ninjaBlack)" />

      {/* Emerald Headband with Gold Clan Emblem */}
      <rect x="31" y="19" width="26" height="6" fill="#10b981" rx="1" />
      <circle cx="44" cy="22" r="2" fill="#fbbf24" stroke="#854d0e" strokeWidth="0.5" />

      {/* Fierce Focused Eyes */}
      <rect x="35" y="27" width="18" height="6" fill="#fed7aa" rx="1" />
      <circle cx="40" cy="30" r="1.5" fill="#0f172a" />
      <circle cx="48" cy="30" r="1.5" fill="#0f172a" />

      {/* Gi Body */}
      <polygon points="32,44 56,44 54,72 34,72" fill="url(#ninjaBlack)" />
      <rect x="32" y="58" width="24" height="4" fill="#10b981" />

      {/* Dual Flaming Katanas on Back */}
      <line x1="26" y1="36" x2="62" y2="72" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="62" y1="36" x2="26" y2="72" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="26" cy="36" r="2" fill="#10b981" className="animate-ping" />

      {/* Arms & Spinning Golden Shuriken */}
      <g className={isRunning ? 'animate-arm-run origin-top-left' : 'animate-arm-swing origin-top-left'}>
        <path d="M 32 46 C 26 50, 22 58, 22 66" stroke="url(#ninjaBlack)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="22" cy="68" r="3.5" fill="#fed7aa" />
        {/* Golden Shuriken */}
        <g className="animate-spin origin-[22px_68px]" style={{ animationDuration: '2s' }}>
          <polygon points="22,62 25,68 22,74 19,68" fill="#fbbf24" />
          <polygon points="16,68 22,71 28,68 22,65" fill="#fbbf24" />
        </g>
      </g>

      <g className={isVictory ? 'animate-arm-victory origin-top-right' : 'animate-arm-swing origin-top-right'} style={{ animationDelay: '0.2s' }}>
        <path d="M 56 46 C 62 50, 66 58, 66 66" stroke="url(#ninjaBlack)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="66" cy="68" r="3.5" fill="#fed7aa" />
      </g>

      {/* Tabi Boots */}
      <g className={isRunning ? 'animate-leg-run origin-top' : 'animate-leg-walk origin-top'}>
        <path d="M 38 72 L 37 94" stroke="url(#ninjaBlack)" strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="35" cy="96" rx="5" ry="3" fill="#10b981" />
      </g>

      <g className={isRunning ? 'animate-leg-run origin-top' : 'animate-leg-walk origin-top'} style={{ animationDelay: '0.25s' }}>
        <path d="M 50 72 L 51 94" stroke="url(#ninjaBlack)" strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="53" cy="96" rx="5" ry="3" fill="#10b981" />
      </g>
    </svg>
  );
}

// =========================================================================
// 6. A Valquíria (Elmo alado dourado, asas de luz radiantes, lança do triunfo solar)
// =========================================================================
function ValkyrieSvg({ state, isWaving, progress }: { state: CharacterState; isWaving: boolean; progress: number }) {
  const isRunning = state === 'running' || state === 'almost';
  const isVictory = state === 'victory';

  return (
    <svg width="88" height="118" viewBox="0 0 88 118" fill="none" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="valkGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="wingGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#fde047" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Luminous Wings of Light (Flapping smoothly) */}
      <g className="animate-wing-flap origin-[44px_45px]">
        {/* Left Wing */}
        <path
          d="M 32 46 C 14 36, 6 22, 10 12 C 16 22, 24 32, 34 38 Z"
          fill="url(#wingGlow)"
          stroke="#fde047"
          strokeWidth="0.8"
        />
        {/* Right Wing */}
        <path
          d="M 56 46 C 74 36, 82 22, 78 12 C 72 22, 64 32, 54 38 Z"
          fill="url(#wingGlow)"
          stroke="#fde047"
          strokeWidth="0.8"
        />
      </g>

      {/* Golden Winged Helmet & Flowing Hair */}
      <g id="helmet">
        {/* Blonde Hair */}
        <path d="M 32 26 C 32 16, 40 12, 52 13 C 60 14, 62 26, 62 38 C 58 34, 52 32, 44 32 Z" fill="#fbbf24" />
        {/* Face */}
        <circle cx="44" cy="28" r="13" fill="#fed7aa" />
        {/* Golden Helm Diadem */}
        <path d="M 31 22 L 44 14 L 57 22 L 54 26 L 34 26 Z" fill="url(#valkGold)" stroke="#854d0e" strokeWidth="0.8" />
        {/* Helmet Feather Wings */}
        <polygon points="31,22 23,12 28,24" fill="#ffffff" stroke="#fde047" strokeWidth="0.5" />
        <polygon points="57,22 65,12 60,24" fill="#ffffff" stroke="#fde047" strokeWidth="0.5" />
        {/* Eyes */}
        <circle cx="40" cy="28" r="1.5" fill="#0284c7" />
        <circle cx="48" cy="28" r="1.5" fill="#0284c7" />
      </g>

      {/* Torso / Platinum & Gold Armor with Breastplate Gem */}
      <polygon points="32,42 56,42 52,70 36,70" fill="#e2e8f0" stroke="url(#valkGold)" strokeWidth="1" />
      <polygon points="40,42 48,42 44,54" fill="url(#valkGold)" />
      <circle cx="44" cy="48" r="2" fill="#38bdf8" className="animate-pulse" />

      {/* Azure Royal Skirt / Sash */}
      <polygon points="34,70 54,70 58,88 30,88" fill="#0284c7" stroke="#0369a1" strokeWidth="0.5" />

      {/* Left Hand holding Spear of Triumph */}
      <g>
        <line x1="22" y1="10" x2="22" y2="98" stroke="url(#valkGold)" strokeWidth="2.5" />
        {/* Blazing Sun Spear Tip */}
        <polygon points="22,2 26,12 22,10 18,12" fill="#fde047" stroke="#d97706" strokeWidth="0.8" />
        <circle cx="22" cy="10" r="4" fill="#fde047" opacity="0.4" className="animate-ping" />
      </g>

      {/* Right Arm waving or raised */}
      <g className={isVictory ? 'animate-arm-victory origin-top-right' : 'animate-arm-swing origin-top-right'}>
        <path d="M 56 44 C 62 48, 66 56, 66 64" stroke="#e2e8f0" strokeWidth="5" strokeLinecap="round" />
        <circle cx="66" cy="66" r="3" fill="#fed7aa" />
      </g>

      {/* Golden Greaves (Legs) */}
      <g className={isRunning ? 'animate-leg-run origin-top' : 'animate-leg-walk origin-top'}>
        <path d="M 38 72 L 37 94" stroke="url(#valkGold)" strokeWidth="6" strokeLinecap="round" />
      </g>
      <g className={isRunning ? 'animate-leg-run origin-top' : 'animate-leg-walk origin-top'} style={{ animationDelay: '0.25s' }}>
        <path d="M 50 72 L 51 94" stroke="url(#valkGold)" strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// =========================================================================
// 7. Dante (Cachorro Robótico Cibernético - O Mascote Fiel da Liberdade Financeira)
// =========================================================================
function DanteDogSvg({ state, isWaving, progress }: { state: CharacterState; isWaving: boolean; progress: number }) {
  const isVictory = state === 'victory';
  const isRunning = state === 'running' || state === 'almost';
  const isStruggling = state === 'struggling';

  return (
    <svg width="96" height="118" viewBox="0 0 96 118" fill="none" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="danteMetalArmor" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="danteDarkChassis" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="danteCyanNeon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>
        <filter id="danteGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Cybernetic Tail with Wagging Animation & Neon Cyan Tip */}
      <g className={isRunning || isVictory ? 'animate-bounce origin-left' : 'animate-wiggle origin-left'} style={{ transformOrigin: '28px 75px' }}>
        <path
          d="M 28 75 C 16 72, 10 60, 14 46 C 16 38, 24 34, 22 28"
          stroke="url(#danteMetalArmor)"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Tail Segment Rings */}
        <circle cx="16" cy="62" r="2.5" fill="#0284c7" />
        <circle cx="14" cy="46" r="2.5" fill="#38bdf8" />
        {/* Glowing Antenna Bulb on Tip */}
        <circle cx="22" cy="28" r="4.5" fill="url(#danteCyanNeon)" filter="url(#danteGlow)" />
        <circle cx="22" cy="28" r="2" fill="#ffffff" className="animate-ping" />
      </g>

      {/* Cybernetic Ears (Perked Robotic Puppy Ears) */}
      {/* Left Ear */}
      <g className={isRunning ? 'animate-bounce origin-bottom' : 'animate-pulse origin-bottom'}>
        <polygon points="34,26 24,6 40,16" fill="url(#danteDarkChassis)" stroke="url(#danteCyanNeon)" strokeWidth="1.2" />
        <polygon points="33,22 27,10 38,17" fill="#06b6d4" opacity="0.8" />
        <circle cx="26" cy="8" r="1.5" fill="#38bdf8" className="animate-ping" />
      </g>
      {/* Right Ear */}
      <g className={isRunning ? 'animate-bounce origin-bottom' : 'animate-pulse origin-bottom'} style={{ animationDelay: '0.15s' }}>
        <polygon points="62,26 72,6 56,16" fill="url(#danteDarkChassis)" stroke="url(#danteCyanNeon)" strokeWidth="1.2" />
        <polygon points="63,22 69,10 58,17" fill="#06b6d4" opacity="0.8" />
        <circle cx="70" cy="8" r="1.5" fill="#38bdf8" className="animate-ping" />
      </g>

      {/* Dog Head Chassis (Glossy White Robo-Canine Helmet) */}
      <ellipse cx="48" cy="34" rx="20" ry="17" fill="url(#danteMetalArmor)" stroke="#0f172a" strokeWidth="1.5" />

      {/* Top Head Antenna with Financial Radar Sensor */}
      <line x1="48" y1="17" x2="48" y2="9" stroke="url(#danteDarkChassis)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="48" cy="8" r="3" fill="url(#danteCyanNeon)" filter="url(#danteGlow)" />
      <circle cx="48" cy="8" r="1.2" fill="#ffffff" />

      {/* Curved Cyber Visor (Expressive Blue/Cyan LED Eyes) */}
      <rect x="33" y="24" width="30" height="15" rx="6" fill="#020617" stroke="#38bdf8" strokeWidth="1.2" />

      {/* Expressive Puppy Eyes (Cybernetic LEDs) */}
      {isVictory ? (
        // Happy Arc Victory Eyes ^^
        <g stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" filter="url(#danteGlow)">
          <path d="M 37 32 Q 41 27 45 32" fill="none" />
          <path d="M 51 32 Q 55 27 59 32" fill="none" />
        </g>
      ) : isStruggling ? (
        // Determined Focused Eyes
        <g fill="#38bdf8" filter="url(#danteGlow)">
          <polygon points="37,30 45,33 38,34" />
          <polygon points="59,30 51,33 58,34" />
        </g>
      ) : (
        // Big Cute Puppy Eyes with Sparkling Catchlights
        <g>
          <ellipse cx="41" cy="31" rx="4" ry="4.5" fill="#38bdf8" filter="url(#danteGlow)" />
          <circle cx="40" cy="29" r="1.8" fill="#ffffff" />
          <circle cx="43" cy="33" r="0.9" fill="#ffffff" />

          <ellipse cx="55" cy="31" rx="4" ry="4.5" fill="#38bdf8" filter="url(#danteGlow)" />
          <circle cx="54" cy="29" r="1.8" fill="#ffffff" />
          <circle cx="57" cy="33" r="0.9" fill="#ffffff" />
        </g>
      )}

      {/* Cute Robo Canine Snout */}
      <path
        d="M 40 37 C 40 35, 56 35, 56 37 L 54 47 C 54 49, 42 49, 42 47 Z"
        fill="#f1f5f9"
        stroke="#94a3b8"
        strokeWidth="1"
      />
      {/* Black Nose with LED Glint */}
      <ellipse cx="48" cy="41" rx="3.5" ry="2.5" fill="#0f172a" />
      <circle cx="47" cy="40" r="1" fill="#38bdf8" />

      {/* Cute Puppy Mouth */}
      <path d="M 44 44 Q 48 47 52 44" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Cyber Collar with Gold Energy Core / Tag */}
      <rect x="36" y="50" width="24" height="6" rx="3" fill="#0f172a" stroke="url(#danteCyanNeon)" strokeWidth="1" />
      {/* Collar Tag: Glowing Gold BRL Medallion */}
      <circle cx="48" cy="58" r="6" fill="#fbbf24" stroke="#b45309" strokeWidth="1" filter="url(#danteGlow)" />
      <text x="48" y="61" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#78350f" fontFamily="monospace">R$</text>

      {/* Main Body Chassis (Glossy White Armor with Carbon Fiber Plates) */}
      <ellipse cx="48" cy="74" rx="19" ry="20" fill="url(#danteMetalArmor)" stroke="#0f172a" strokeWidth="1.5" />
      {/* Chest Armor Power Core (Arc Reactor) */}
      <circle cx="48" cy="73" r="5" fill="#020617" stroke="#38bdf8" strokeWidth="1" />
      <polygon points="48,70 51,75 45,75" fill="#38bdf8" className="animate-spin origin-center" style={{ transformOrigin: '48px 73px', animationDuration: '4s' }} />
      <circle cx="48" cy="73" r="2" fill="#ffffff" className="animate-ping" />

      {/* Side Energy Circuit Decals */}
      <path d="M 33 70 L 39 74 L 35 80" stroke="#06b6d4" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M 63 70 L 57 74 L 61 80" stroke="#06b6d4" strokeWidth="1.2" strokeLinecap="round" fill="none" />

      {/* Front Left Paw / Hand waving or running */}
      <g className={isWaving || isVictory ? 'animate-arm-victory origin-top-left' : isRunning ? 'animate-arm-run origin-top-left' : ''}>
        <path d="M 35 68 C 29 74, 25 84, 28 92" stroke="url(#danteDarkChassis)" strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="28" cy="94" rx="4.5" ry="3.5" fill="url(#danteMetalArmor)" stroke="#0f172a" strokeWidth="1" />
        <circle cx="28" cy="94" r="1.5" fill="#38bdf8" />
      </g>

      {/* Front Right Paw */}
      <g className={isRunning ? 'animate-leg-run origin-top-right' : ''}>
        <path d="M 61 68 C 67 74, 71 84, 68 92" stroke="url(#danteDarkChassis)" strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="68" cy="94" rx="4.5" ry="3.5" fill="url(#danteMetalArmor)" stroke="#0f172a" strokeWidth="1" />
        <circle cx="68" cy="94" r="1.5" fill="#38bdf8" />
      </g>

      {/* Back Hydraulic Paws / Thruster Boots */}
      <g className={isRunning ? 'animate-leg-run origin-top' : 'animate-leg-walk origin-top'}>
        <path d="M 40 88 L 39 108" stroke="url(#danteDarkChassis)" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="38" cy="111" rx="6" ry="4" fill="url(#danteMetalArmor)" stroke="#0f172a" strokeWidth="1" />
        <rect x="34" y="112" width="8" height="2" rx="1" fill="#38bdf8" />
      </g>
      <g className={isRunning ? 'animate-leg-run origin-top' : 'animate-leg-walk origin-top'} style={{ animationDelay: '0.2s' }}>
        <path d="M 56 88 L 57 108" stroke="url(#danteDarkChassis)" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="58" cy="111" rx="6" ry="4" fill="url(#danteMetalArmor)" stroke="#0f172a" strokeWidth="1" />
        <rect x="54" y="112" width="8" height="2" rx="1" fill="#38bdf8" />
      </g>
    </svg>
  );
}

