import React, { useState } from 'react';
import { Goal, GoalColor } from '../types';
import { sounds } from '../utils/audio';

interface GoalSummitTargetProps {
  goal?: Goal;
  progress: number;
  activeColor: GoalColor;
  formatCurrency: (value: number) => string;
}

type GoalCategory =
  | 'car'
  | 'house'
  | 'trip'
  | 'gamer'
  | 'phone'
  | 'bike'
  | 'vault'
  | 'graduation'
  | 'ring'
  | 'boat'
  | 'generic';

function detectGoalCategory(goal?: Goal): GoalCategory {
  if (!goal) return 'generic';
  const text = `${goal.name} ${goal.emoji}`.toLowerCase();

  if (goal.emoji === '🚗' || goal.emoji === '🏎️' || /carro|veiculo|automovel|auto|bmw|porsche|civic|ferrari|fusca/.test(text)) {
    return 'car';
  }
  if (goal.emoji === '🏠' || goal.emoji === '🏡' || goal.emoji === '🏢' || /casa|apartamento|apto|imovel|moradia|lar|terreno/.test(text)) {
    return 'house';
  }
  if (goal.emoji === '✈️' || goal.emoji === '🏖️' || goal.emoji === '🌴' || goal.emoji === '🏝️' || /viagem|aviao|ferias|praia|europa|paris|japao|orlando|disney|trip/.test(text)) {
    return 'trip';
  }
  if (goal.emoji === '🎮' || goal.emoji === '💻' || goal.emoji === '🖥️' || /setup|gamer|pc|computador|notebook|ps5|xbox|playstation/.test(text)) {
    return 'gamer';
  }
  if (goal.emoji === '📱' || /iphone|celular|smartphone|galaxy|ipad/.test(text)) {
    return 'phone';
  }
  if (goal.emoji === '🏍️' || /moto|motocicleta|yamaha|honda|harley|scooter/.test(text)) {
    return 'bike';
  }
  if (goal.emoji === '💰' || goal.emoji === '🛡️' || goal.emoji === '💵' || /reserva|cofre|emergencia|investimento|patrimonio|riqueza|tesouro/.test(text)) {
    return 'vault';
  }
  if (goal.emoji === '🎓' || /formatura|faculdade|diploma|pos|mestrado|estudos|curso/.test(text)) {
    return 'graduation';
  }
  if (goal.emoji === '💍' || /casamento|alianca|anel|noivado/.test(text)) {
    return 'ring';
  }
  if (goal.emoji === '🛥️' || /barco|iate|lancha|veleiro/.test(text)) {
    return 'boat';
  }

  return 'generic';
}

export default function GoalSummitTarget({
  goal,
  progress,
  activeColor,
  formatCurrency,
}: GoalSummitTargetProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const category = detectGoalCategory(goal);
  const isVictory = progress >= 100;
  const isClose = progress >= 75 && !isVictory;

  const handleInteraction = () => {
    sounds.playGoalInteract();
    setIsInteracting(true);
    setTimeout(() => setIsInteracting(false), 1200);

    let msg = 'Seu grande sonho te espera no topo da montanha!';
    if (category === 'car') {
      msg = isVictory ? '🚗 CHAVE NA MÃO! O carro novo é todo seu! 🏆' : '🚗 Ronco do motor acelerando! Falta pouco para o test drive!';
    } else if (category === 'house') {
      msg = isVictory ? '🏠 CASA PRÓPRIA CONQUISTADA! Bem-vindo ao seu novo lar! 🔑' : '🏠 As portas do seu novo lar estão prestes a se abrir!';
    } else if (category === 'trip') {
      msg = isVictory ? '✈️ VOO CONFIRMADO! Boa viagem dos seus sonhos! 🌴' : '✈️ Turbinas aquecidas! Próxima parada: realização!';
    } else if (category === 'gamer') {
      msg = isVictory ? '🎮 BATTLESTATION 100% LIBERADA! GG Campeão! 🚀' : '🎮 Mais FPS, gráficos no ultra! O setup tá quase pronto!';
    } else if (category === 'vault') {
      msg = isVictory ? '💰 COFRE DA LIBERDADE TRANQUILA CONQUISTADO! 👑' : '💰 A montanha da segurança financeira está se erguendo!';
    }

    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const remaining = goal ? Math.max(0, goal.targetAmount - goal.currentAmount) : 0;

  return (
    <div
      onClick={handleInteraction}
      className="relative flex flex-col items-center select-none cursor-pointer group pointer-events-auto"
      title="Clique na sua meta dos sonhos!"
    >
      {/* Toast Message Balloon */}
      {toastMessage && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-xl bg-slate-950/95 border border-amber-400/80 text-white text-xs font-bold shadow-2xl shadow-amber-500/40 whitespace-nowrap animate-pop-in flex items-center gap-1.5">
          <span>✨</span>
          <span>{toastMessage}</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-5 border-x-transparent border-t-5 border-t-slate-950" />
        </div>
      )}

      {/* Target Title / Status Badge Above Object */}
      <div className="mb-1 flex flex-col items-center">
        {isVictory ? (
          <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs rounded-full shadow-xl shadow-amber-400/50 border border-yellow-100 animate-bounce">
            <span>👑</span>
            <span>{goal ? goal.name : 'META CONQUISTADA!'}</span>
            <span>🏆</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-950/80 backdrop-blur-md rounded-full border border-white/20 text-[11px] text-white/90 font-medium shadow-lg transition-transform group-hover:scale-105">
            <span className="text-amber-400 font-bold">{goal ? goal.emoji : '🎯'}</span>
            <span className="font-bold max-w-[140px] truncate">{goal ? goal.name : 'Sua Meta'}</span>
            <span className="text-white/40">•</span>
            <span className="text-amber-300 font-mono font-bold">{progress.toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* Main Target Altar Stage */}
      <div className="relative flex items-center justify-center">
        {/* Victory Celebratory Rays & Aura */}
        {isVictory && (
          <div className="absolute -inset-10 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 rounded-full bg-gradient-to-r from-amber-400/20 via-yellow-300/30 to-amber-500/20 blur-2xl animate-pulse" />
            <div className="absolute w-36 h-36 rounded-full border border-yellow-300/40 animate-spin-slow" />
          </div>
        )}

        {/* High Progress Spotlight Beam down to stairs */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 w-48 h-36 pointer-events-none bg-gradient-to-b from-amber-300/20 via-yellow-400/10 to-transparent blur-md transition-opacity duration-700 ${
            isClose || isVictory ? 'opacity-100' : 'opacity-30'
          }`}
          style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)' }}
        />

        {/* Visual Target Object Representation */}
        <div
          className={`relative transition-transform duration-500 ${
            isInteracting ? 'scale-110' : 'group-hover:scale-105'
          } ${isVictory ? 'animate-float-slow' : ''}`}
        >
          {category === 'car' && <SportsCarSvg isVictory={isVictory} isClose={isClose} activeColor={activeColor} />}
          {category === 'house' && <LuxuryHouseSvg isVictory={isVictory} isClose={isClose} activeColor={activeColor} />}
          {category === 'trip' && <LuxuryJetSvg isVictory={isVictory} isClose={isClose} activeColor={activeColor} />}
          {category === 'gamer' && <GamerSetupSvg isVictory={isVictory} isClose={isClose} activeColor={activeColor} />}
          {category === 'vault' && <VaultTreasureSvg isVictory={isVictory} isClose={isClose} activeColor={activeColor} />}
          {category === 'phone' && <SmartphoneSvg isVictory={isVictory} isClose={isClose} activeColor={activeColor} />}
          {category === 'bike' && <SuperbikeSvg isVictory={isVictory} isClose={isClose} activeColor={activeColor} />}
          {category === 'graduation' && <GraduationSvg isVictory={isVictory} isClose={isClose} activeColor={activeColor} />}
          {category === 'ring' && <DiamondRingSvg isVictory={isVictory} isClose={isClose} activeColor={activeColor} />}
          {category === 'boat' && <LuxuryYachtSvg isVictory={isVictory} isClose={isClose} activeColor={activeColor} />}
          {category === 'generic' && (
            <UniversalTargetSvg
              emoji={goal?.emoji || '🎯'}
              name={goal?.name || 'Meta'}
              isVictory={isVictory}
              activeColor={activeColor}
            />
          )}
        </div>
      </div>

      {/* Altar Pedestal Slab (The Summit Floor) */}
      <div className="relative -mt-1 flex flex-col items-center">
        {/* Pedestal Surface Top */}
        <div className="w-40 sm:w-48 h-3.5 rounded-t-lg bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-t border-x border-amber-400/40 relative overflow-hidden flex items-center justify-between px-3 shadow-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[8px] tracking-widest uppercase font-mono text-amber-300/80">
            {isVictory ? '🏆 CUME CONQUISTADO' : '⭐ ALTAR DA CONQUISTA'}
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>

        {/* Pedestal Riser (Front Depth) */}
        <div className="w-40 sm:w-48 h-3 rounded-b-lg bg-slate-950 border-b border-x border-slate-800 flex items-center justify-center relative">
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
        </div>

        {/* Floating Micro Label for Distance Remaining */}
        {!isVictory && goal && (
          <div className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-white/10 text-[10px] text-white/70 whitespace-nowrap shadow-md">
            Faltam <span className="text-amber-300 font-bold font-mono">{formatCurrency(remaining)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// 1. CARRO BONITÃO (Supercarro Esportivo Aerodinâmico em Perspectiva 3D)
// =========================================================================
function SportsCarSvg({
  isVictory,
  isClose,
  activeColor,
}: {
  isVictory: boolean;
  isClose: boolean;
  activeColor: GoalColor;
}) {
  return (
    <svg width="170" height="84" viewBox="0 0 170 84" fill="none" className="drop-shadow-2xl">
      <defs>
        {/* Car Body Metallic Gradients */}
        <linearGradient id="carPaint" x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="40%" stopColor="#dc2626" />
          <stop offset="75%" stopColor="#b91c1c" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>

        <linearGradient id="carRoofGlass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="60%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        <linearGradient id="rimAlloy" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <linearGradient id="goldGleam" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        <linearGradient id="headlightBeam" x1="0%" y1="50%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Headlight Beams shooting forward/downward */}
      <polygon
        points="148,51 170,44 170,72 148,58"
        fill="url(#headlightBeam)"
        className="pointer-events-none animate-pulse"
      />

      {/* Ground Neon Underglow */}
      <ellipse
        cx="85"
        cy="70"
        rx="72"
        ry="7"
        fill={activeColor.accentHex || '#ef4444'}
        opacity={isVictory ? 0.75 : 0.45}
        filter="blur(4px)"
      />

      {/* Wheels / Alloy Rims Behind Body */}
      {/* Front Wheel */}
      <g transform="translate(118, 48)">
        <circle cx="13" cy="13" r="13" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />
        <circle cx="13" cy="13" r="9" fill="url(#rimAlloy)" />
        {/* 5-Spoke Sport Design */}
        <line x1="13" y1="4" x2="13" y2="22" stroke="#0f172a" strokeWidth="2" />
        <line x1="5" y1="9" x2="21" y2="17" stroke="#0f172a" strokeWidth="2" />
        <line x1="5" y1="17" x2="21" y2="9" stroke="#0f172a" strokeWidth="2" />
        {/* Red Brembo Brake Caliper */}
        <circle cx="13" cy="13" r="4.5" fill="#ef4444" />
        <circle cx="13" cy="13" r="2.5" fill="#f8fafc" />
      </g>

      {/* Rear Wheel */}
      <g transform="translate(28, 48)">
        <circle cx="13" cy="13" r="13" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />
        <circle cx="13" cy="13" r="9" fill="url(#rimAlloy)" />
        <line x1="13" y1="4" x2="13" y2="22" stroke="#0f172a" strokeWidth="2" />
        <line x1="5" y1="9" x2="21" y2="17" stroke="#0f172a" strokeWidth="2" />
        <line x1="5" y1="17" x2="21" y2="9" stroke="#0f172a" strokeWidth="2" />
        <circle cx="13" cy="13" r="4.5" fill="#ef4444" />
        <circle cx="13" cy="13" r="2.5" fill="#f8fafc" />
      </g>

      {/* Main Aerodynamic Supercar Body Shell */}
      <g id="car-body">
        {/* Rear Spoiler Wing */}
        <path d="M 12 36 L 24 36 L 22 42 L 10 42 Z" fill="#1e293b" />
        <rect x="8" y="33" width="18" height="3.5" rx="1.5" fill="#0f172a" stroke="#ef4444" strokeWidth="0.8" />

        {/* Lower Chassis / Side Skirt */}
        <path
          d="M 14 58 L 27 58 Q 41 54 41 62 L 118 62 Q 118 54 132 58 L 156 58 C 160 58 163 56 160 52 L 152 46 C 146 43 138 41 128 41 L 96 38 L 52 38 C 34 38 22 44 14 52 Z"
          fill="url(#carPaint)"
          stroke="#7f1d1d"
          strokeWidth="1"
        />

        {/* Aerodynamic Cockpit Greenhouse / Glass Cabin */}
        <path
          d="M 50 38 L 72 23 C 76 21 82 20 88 20 L 114 20 C 120 20 124 23 126 27 L 138 40 L 50 38 Z"
          fill="url(#carRoofGlass)"
          stroke="#0f172a"
          strokeWidth="1"
        />

        {/* Front Windshield Glass Reflection Angle */}
        <path
          d="M 112 22 L 124 22 L 135 39 L 123 39 Z"
          fill="#38bdf8"
          opacity="0.35"
        />
        {/* Side Window */}
        <path
          d="M 74 24 L 110 24 L 110 37 L 66 37 Z"
          fill="#1e293b"
          opacity="0.85"
        />
        {/* Window Chrome Pillar */}
        <line x1="110" y1="22" x2="110" y2="38" stroke="#94a3b8" strokeWidth="1.2" />

        {/* Hood Surface & Front Nose Wedge */}
        <path
          d="M 126 39 L 154 44 C 160 45 163 48 162 52 L 154 55 L 124 43 Z"
          fill="#ef4444"
        />

        {/* Xenon Dual Projector Headlights with Light Sweep */}
        <g>
          <polygon points="144,46 156,47 154,51 142,50" fill="#38bdf8" />
          <circle cx="150" cy="48.5" r="2" fill="#ffffff" className="animate-pulse" />
          <circle cx="145" cy="48.5" r="1.2" fill="#38bdf8" />
        </g>

        {/* Front Grille & Carbon Splitter */}
        <rect x="156" y="52" width="6" height="5" rx="1.5" fill="#020617" />
        <line x1="154" y1="57" x2="164" y2="57" stroke="#020617" strokeWidth="2.5" strokeLinecap="round" />

        {/* Side Door Contour & Aerodynamic Air Intake Scoop */}
        <path d="M 64 42 L 106 42 L 102 54 L 60 54 Z" fill="#b91c1c" opacity="0.6" />
        <path d="M 44 48 L 52 48 L 48 54 L 40 54 Z" fill="#090d16" />
        {/* Door Handle */}
        <rect x="74" y="44" width="7" height="1.5" rx="0.75" fill="#f8fafc" />

        {/* Rear Taillight Strip */}
        <rect x="12" y="46" width="3" height="6" rx="1" fill="#f43f5e" className="animate-pulse" />

        {/* Body Metallic Reflection Stripe */}
        <path
          d="M 28 44 C 54 40 102 40 148 46"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.75"
        />
      </g>

      {/* Floating Sparkle Glints */}
      <circle cx="146" cy="42" r="1.5" fill="#ffffff" className="animate-ping" />
      <circle cx="82" cy="22" r="1.2" fill="#ffffff" className="animate-pulse" />

      {/* Victory Golden Keys Floating Above Car */}
      {isVictory && (
        <g className="animate-bounce" transform="translate(76, 4)">
          <circle cx="8" cy="8" r="5" fill="none" stroke="url(#goldGleam)" strokeWidth="2" />
          <rect x="8" y="11" width="3" height="7" fill="url(#goldGleam)" />
          <rect x="11" y="14" width="3" height="2" fill="url(#goldGleam)" />
          <circle cx="8" cy="8" r="2" fill="#ffffff" />
        </g>
      )}
    </svg>
  );
}

// =========================================================================
// 2. CASA DOS SONHOS (Mansão Contemporânea com Fachada de Vidro e Luzes)
// =========================================================================
function LuxuryHouseSvg({
  isVictory,
  isClose,
  activeColor,
}: {
  isVictory: boolean;
  isClose: boolean;
  activeColor: GoalColor;
}) {
  return (
    <svg width="160" height="92" viewBox="0 0 160 92" fill="none" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="wallWhite" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="warmWindow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="cedarWood" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>

      {/* Ambient Lawn Glow */}
      <ellipse cx="80" cy="84" rx="70" ry="7" fill="#10b981" opacity="0.3" filter="blur(4px)" />

      {/* Two-Story Modern Villa Structure */}
      {/* Ground Floor Main Block */}
      <rect x="25" y="44" width="110" height="38" rx="2" fill="url(#wallWhite)" stroke="#64748b" strokeWidth="1" />

      {/* Upper Floor Overhanging Suite */}
      <rect x="40" y="16" width="85" height="32" rx="2" fill="url(#wallWhite)" stroke="#64748b" strokeWidth="1" />

      {/* Flat Architectural Roofline Overhangs */}
      <rect x="36" y="14" width="93" height="3.5" rx="1" fill="#1e293b" />
      <rect x="20" y="42" width="120" height="3.5" rx="1" fill="#1e293b" />

      {/* Cedar Wood Accent Wall on Upper Left */}
      <rect x="42" y="18" width="22" height="24" fill="url(#cedarWood)" />
      <line x1="42" y1="24" x2="64" y2="24" stroke="#451a03" strokeWidth="0.7" />
      <line x1="42" y1="30" x2="64" y2="30" stroke="#451a03" strokeWidth="0.7" />
      <line x1="42" y1="36" x2="64" y2="36" stroke="#451a03" strokeWidth="0.7" />

      {/* Upper Floor Panoramic Glass Windows */}
      <rect x="68" y="20" width="52" height="20" rx="1" fill="url(#warmWindow)" stroke="#1e293b" strokeWidth="1" />
      <line x1="94" y1="20" x2="94" y2="40" stroke="#1e293b" strokeWidth="1" />
      {/* Balcony Glass Railing */}
      <rect x="66" y="32" width="56" height="10" fill="#38bdf8" opacity="0.3" stroke="#94a3b8" strokeWidth="0.6" />

      {/* Ground Floor Large Living Room Panoramic Window */}
      <rect x="32" y="48" width="50" height="28" rx="1" fill="url(#warmWindow)" stroke="#1e293b" strokeWidth="1" />
      <line x1="57" y1="48" x2="57" y2="76" stroke="#1e293b" strokeWidth="1" />

      {/* Modern Front Entrance Door */}
      <rect x="94" y="50" width="18" height="28" rx="1" fill="#0f172a" />
      <line x1="108" y1="62" x2="108" y2="67" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      {/* Warm Porch Downlight */}
      <circle cx="103" cy="47" r="2" fill="#fbbf24" className="animate-pulse" />

      {/* Side Garage / Carport with vehicle silhouette */}
      <rect x="116" y="52" width="16" height="26" fill="#1e293b" />
      <circle cx="120" cy="74" r="3" fill="#020617" />
      <circle cx="128" cy="74" r="3" fill="#020617" />

      {/* Landscaping Cypress Shrubs */}
      <ellipse cx="28" cy="76" rx="4" ry="7" fill="#059669" />
      <ellipse cx="128" cy="76" rx="5" ry="8" fill="#059669" />

      {/* Victory Golden Key in Front of House */}
      {isVictory && (
        <g className="animate-bounce" transform="translate(100, 2)">
          <circle cx="6" cy="6" r="4" fill="none" stroke="#fbbf24" strokeWidth="2" />
          <rect x="6" y="8" width="2" height="6" fill="#fbbf24" />
          <rect x="8" y="10" width="3" height="1.5" fill="#fbbf24" />
        </g>
      )}
    </svg>
  );
}

// =========================================================================
// 3. JATINHO EXECUTIVO / VIAGEM DOS SONHOS (Cruzeiro nos Ares e Nuvens)
// =========================================================================
function LuxuryJetSvg({
  isVictory,
  isClose,
  activeColor,
}: {
  isVictory: boolean;
  isClose: boolean;
  activeColor: GoalColor;
}) {
  return (
    <svg width="160" height="84" viewBox="0 0 160 84" fill="none" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="jetFuselage" x1="0%" y1="0%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Fluffy Clouds beneath Jet */}
      <g opacity="0.6">
        <circle cx="35" cy="72" r="14" fill="url(#cloudGrad)" />
        <circle cx="60" cy="74" r="16" fill="url(#cloudGrad)" />
        <circle cx="95" cy="72" r="15" fill="url(#cloudGrad)" />
        <circle cx="125" cy="75" r="12" fill="url(#cloudGrad)" />
      </g>

      {/* Executive Jet Airplane Soaring Upwards Right */}
      <g transform="rotate(-6 80 42)">
        {/* Left Wing & Turbine */}
        <polygon points="65,42 40,64 54,64 88,44" fill="#64748b" />
        <rect x="44" y="52" width="14" height="6" rx="2.5" fill="#334155" />
        <circle cx="58" cy="55" r="1.5" fill="#38bdf8" className="animate-pulse" />

        {/* Tail Fin Stabilizer */}
        <polygon points="20,40 12,18 24,18 36,40" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
        <polygon points="14,18 20,18 30,30 24,30" fill="#fbbf24" />

        {/* Sleek Aerodynamic Fuselage */}
        <path
          d="M 18 40 C 22 36, 40 34, 95 34 C 128 34, 148 40, 154 44 C 148 48, 128 50, 95 50 C 40 50, 22 46, 18 40 Z"
          fill="url(#jetFuselage)"
          stroke="#94a3b8"
          strokeWidth="1"
        />

        {/* Golden Racing Stripe along Fuselage */}
        <path d="M 22 42 C 45 38 110 38 148 44" stroke="#fbbf24" strokeWidth="1.8" fill="none" />

        {/* Cockpit Window */}
        <polygon points="134,39 146,42 140,43 132,41" fill="#0f172a" />

        {/* Passenger Luxury Cabin Windows with Warm Interior Glow */}
        {[50, 64, 78, 92, 106, 120].map((x) => (
          <ellipse key={x} cx={x} cy="41" rx="2.5" ry="3.5" fill="#fef08a" stroke="#0f172a" strokeWidth="0.5" />
        ))}

        {/* Right Wing Tip Navigation Light */}
        <polygon points="80,40 108,22 118,22 96,40" fill="#cbd5e1" />
        <circle cx="114" cy="22" r="2" fill="#22c55e" className="animate-ping" />
      </g>
    </svg>
  );
}

// =========================================================================
// 4. SETUP GAMER ULTRA (Dual Curved Monitors, PC RGB Aquário, Teclado)
// =========================================================================
function GamerSetupSvg({
  isVictory,
  isClose,
  activeColor,
}: {
  isVictory: boolean;
  isClose: boolean;
  activeColor: GoalColor;
}) {
  return (
    <svg width="160" height="88" viewBox="0 0 160 88" fill="none" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="deskPadRgb" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="35%" stopColor="#3b82f6" />
          <stop offset="70%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
        <linearGradient id="gameScreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="50%" stopColor="#581c87" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* Desk Surface & RGB Pad */}
      <rect x="15" y="68" width="130" height="8" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <rect x="25" y="67" width="110" height="3" rx="1.5" fill="url(#deskPadRgb)" className="animate-pulse" />

      {/* Main Curved Ultrawide Display */}
      <g transform="translate(38, 16)">
        {/* Monitor Frame */}
        <rect x="0" y="0" width="76" height="44" rx="3" fill="#020617" stroke="#38bdf8" strokeWidth="1.2" />
        {/* Curved Screen Bezel */}
        <rect x="2" y="2" width="72" height="40" rx="2" fill="url(#gameScreen)" />
        {/* Synthwave Sun & Grid Graphic on Screen */}
        <ellipse cx="36" cy="22" rx="10" ry="10" fill="#f43f5e" />
        <line x1="2" y1="30" x2="74" y2="30" stroke="#a855f7" strokeWidth="0.8" />
        <line x1="2" y1="35" x2="74" y2="35" stroke="#38bdf8" strokeWidth="0.8" />
        <line x1="2" y1="40" x2="74" y2="40" stroke="#10b981" strokeWidth="0.8" />
        {/* Monitor Heavy Aluminum Stand */}
        <rect x="34" y="44" width="8" height="12" fill="#475569" />
        <polygon points="26,56 46,56 44,54 28,54" fill="#334155" />
      </g>

      {/* High-End Gaming PC Tower with Glass Panel (Right Side) */}
      <g transform="translate(118, 22)">
        <rect x="0" y="0" width="26" height="44" rx="3" fill="#0f172a" stroke="#a855f7" strokeWidth="1.2" />
        {/* Tempered Glass Window */}
        <rect x="2" y="2" width="22" height="40" rx="2" fill="#020617" />
        {/* RGB Fans & Water Cooling Tubes */}
        <circle cx="13" cy="12" r="5" fill="none" stroke="#f43f5e" strokeWidth="2" className="animate-spin-slow" />
        <circle cx="13" cy="25" r="5" fill="none" stroke="#3b82f6" strokeWidth="2" className="animate-spin-slow" />
        <rect x="6" y="34" width="14" height="4" rx="1" fill="#10b981" className="animate-pulse" />
      </g>

      {/* Mechanical RGB Backlit Keyboard & Mouse */}
      <g transform="translate(48, 62)">
        <rect x="0" y="0" width="34" height="6" rx="1.5" fill="#1e293b" stroke="#a855f7" strokeWidth="0.8" />
        <rect x="2" y="1" width="30" height="4" fill="url(#deskPadRgb)" opacity="0.9" />
      </g>
      {/* RGB Gaming Mouse */}
      <ellipse cx="92" cy="65" rx="3" ry="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="0.8" />
    </svg>
  );
}

// =========================================================================
// 5. COFRE DA FORTUNA / RESERVA DE EMERGÊNCIA (Cofre Aberto com Ouro e Joias)
// =========================================================================
function VaultTreasureSvg({
  isVictory,
  isClose,
  activeColor,
}: {
  isVictory: boolean;
  isClose: boolean;
  activeColor: GoalColor;
}) {
  return (
    <svg width="150" height="86" viewBox="0 0 150 86" fill="none" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="goldBar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>

      {/* Vault Steel Casing */}
      <rect x="25" y="16" width="95" height="58" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
      <rect x="31" y="22" width="83" height="46" rx="4" fill="#0f172a" />

      {/* Mountain of Glowing Gold Bullion Bars Inside */}
      <g transform="translate(40, 36)">
        {/* Layer 1 */}
        <polygon points="4,24 24,24 20,18 0,18" fill="url(#goldBar)" stroke="#78350f" strokeWidth="0.6" />
        <polygon points="26,24 46,24 42,18 22,18" fill="url(#goldBar)" stroke="#78350f" strokeWidth="0.6" />
        <polygon points="48,24 68,24 64,18 44,18" fill="url(#goldBar)" stroke="#78350f" strokeWidth="0.6" />
        {/* Layer 2 */}
        <polygon points="14,17 34,17 30,11 10,11" fill="url(#goldBar)" stroke="#78350f" strokeWidth="0.6" />
        <polygon points="36,17 56,17 52,11 32,11" fill="url(#goldBar)" stroke="#78350f" strokeWidth="0.6" />
        {/* Layer 3 Top */}
        <polygon points="25,10 45,10 41,4 21,4" fill="url(#goldBar)" stroke="#78350f" strokeWidth="0.6" />

        {/* Faceted Sparkling Diamonds */}
        <polygon points="12,4 16,0 20,4 16,8" fill="#38bdf8" className="animate-pulse" />
        <polygon points="52,4 56,0 60,4 56,8" fill="#a855f7" className="animate-pulse" />
      </g>

      {/* Heavy Circular Vault Door Swing-Open */}
      <g transform="translate(108, 18)">
        <circle cx="18" cy="27" r="24" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
        <circle cx="18" cy="27" r="16" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1" />
        {/* Spoke Wheel Handle */}
        <line x1="18" y1="17" x2="18" y2="37" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="8" y1="27" x2="28" y2="27" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="18" cy="27" r="4" fill="#fbbf24" />
      </g>
    </svg>
  );
}

// =========================================================================
// 6. SMARTPHONE FLAGSHIP (iPhone Pro / Holográfico)
// =========================================================================
function SmartphoneSvg({
  isVictory,
  isClose,
  activeColor,
}: {
  isVictory: boolean;
  isClose: boolean;
  activeColor: GoalColor;
}) {
  return (
    <svg width="110" height="92" viewBox="0 0 110 92" fill="none" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="phoneScreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="40%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* Floating 3D Angle Flagship Phone */}
      <g transform="translate(28, 6) rotate(6)">
        <rect x="0" y="0" width="46" height="76" rx="8" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
        {/* OLED Screen */}
        <rect x="2.5" y="2.5" width="41" height="71" rx="6" fill="url(#phoneScreen)" />

        {/* Dynamic Island */}
        <rect x="17" y="6" width="12" height="3.5" rx="1.75" fill="#020617" />

        {/* Holographic Wallpaper Graphics */}
        <circle cx="23" cy="38" r="12" fill="#38bdf8" opacity="0.4" className="animate-ping" style={{ animationDuration: '3s' }} />
        <text x="23" y="42" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ffffff">
          100%
        </text>

        {/* Camera Bump on Back Corner */}
        <rect x="3" y="4" width="8" height="8" rx="2" fill="#020617" opacity="0.5" />
      </g>
    </svg>
  );
}

// =========================================================================
// 7. MOTO SUPERBIKE (Esportiva Streetfighter Aerodinâmica)
// =========================================================================
function SuperbikeSvg({
  isVictory,
  isClose,
  activeColor,
}: {
  isVictory: boolean;
  isClose: boolean;
  activeColor: GoalColor;
}) {
  return (
    <svg width="150" height="84" viewBox="0 0 150 84" fill="none" className="drop-shadow-2xl">
      {/* Front Wheel */}
      <circle cx="118" cy="54" r="15" fill="#090d16" stroke="#334155" strokeWidth="2" />
      <circle cx="118" cy="54" r="10" fill="#1e293b" stroke="#fbbf24" strokeWidth="1" />
      {/* Rear Wheel */}
      <circle cx="34" cy="54" r="15" fill="#090d16" stroke="#334155" strokeWidth="2" />
      <circle cx="34" cy="54" r="10" fill="#1e293b" stroke="#fbbf24" strokeWidth="1" />

      {/* Trellis Frame & Aerodynamic Fairings */}
      <polygon points="56,36 94,36 108,48 80,56 46,46" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1" />
      <polygon points="76,26 98,26 112,38 92,38" fill="#1e293b" />

      {/* Twin LED Headlight */}
      <polygon points="112,38 120,40 114,44" fill="#38bdf8" className="animate-pulse" />

      {/* Chrome Exhaust Pipe */}
      <line x1="50" y1="52" x2="26" y2="44" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// =========================================================================
// 8. FORMATURA / DIPLOMA DE HONRA (Capelo & Pergaminho de Ouro)
// =========================================================================
function GraduationSvg({
  isVictory,
  isClose,
  activeColor,
}: {
  isVictory: boolean;
  isClose: boolean;
  activeColor: GoalColor;
}) {
  return (
    <svg width="140" height="84" viewBox="0 0 140 84" fill="none" className="drop-shadow-2xl">
      {/* Capelo / Graduation Mortarboard Cap */}
      <polygon points="70,12 110,24 70,36 30,24" fill="#1e1b4b" stroke="#a855f7" strokeWidth="1.5" />
      <polygon points="46,30 94,30 86,46 54,46" fill="#0f172a" />
      {/* Golden Tassel */}
      <circle cx="70" cy="24" r="2.5" fill="#fbbf24" />
      <path d="M 70 24 Q 90 28 92 44" stroke="#fbbf24" strokeWidth="2" fill="none" />

      {/* Parchment Diploma Tied with Red Ribbon */}
      <g transform="translate(42, 50)">
        <rect x="0" y="0" width="56" height="18" rx="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
        <rect x="24" y="0" width="8" height="18" fill="#ef4444" />
        <circle cx="28" cy="9" r="3" fill="#fbbf24" />
      </g>
    </svg>
  );
}

// =========================================================================
// 9. ANEL DE DIAMANTE / CASAMENTO (Caixa de Veludo com Solitário)
// =========================================================================
function DiamondRingSvg({
  isVictory,
  isClose,
  activeColor,
}: {
  isVictory: boolean;
  isClose: boolean;
  activeColor: GoalColor;
}) {
  return (
    <svg width="120" height="84" viewBox="0 0 120 84" fill="none" className="drop-shadow-2xl">
      {/* Open Velvet Box */}
      <polygon points="30,50 90,50 82,76 38,76" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
      <polygon points="30,50 90,50 84,34 36,34" fill="#450a0a" />

      {/* Gold Ring Band */}
      <circle cx="60" cy="40" r="16" fill="none" stroke="#fbbf24" strokeWidth="3" />

      {/* Solitaire Sparkling Brilliant Diamond */}
      <polygon points="60,16 68,24 60,32 52,24" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" className="animate-pulse" />
      <circle cx="60" cy="24" r="3" fill="#ffffff" className="animate-ping" />
    </svg>
  );
}

// =========================================================================
// 10. IATE / BARCO DE LUXO (Navegando em Águas Turquesa)
// =========================================================================
function LuxuryYachtSvg({
  isVictory,
  isClose,
  activeColor,
}: {
  isVictory: boolean;
  isClose: boolean;
  activeColor: GoalColor;
}) {
  return (
    <svg width="160" height="84" viewBox="0 0 160 84" fill="none" className="drop-shadow-2xl">
      {/* Ocean Wake */}
      <ellipse cx="80" cy="68" rx="66" ry="6" fill="#0284c7" opacity="0.4" />

      {/* Yacht Hull */}
      <path
        d="M 18 58 L 138 58 C 146 58 152 54 148 48 L 130 46 L 24 46 Z"
        fill="#ffffff"
        stroke="#94a3b8"
        strokeWidth="1"
      />
      <line x1="26" y1="52" x2="142" y2="52" stroke="#0284c7" strokeWidth="1.5" />

      {/* Superstructure Cabin with Tinted Glass */}
      <polygon points="44,46 112,46 102,28 56,28" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
      <rect x="62" y="32" width="34" height="8" rx="1.5" fill="#0f172a" opacity="0.8" />
      {/* Radar Arch */}
      <line x1="74" y1="28" x2="74" y2="20" stroke="#94a3b8" strokeWidth="1.5" />
      <rect x="70" y="19" width="8" height="2" rx="1" fill="#fbbf24" />
    </svg>
  );
}

// =========================================================================
// 11. UNIVERSAL / CUSTOM (Troféu Cósmico 3D com Emoji e Anéis de Luz)
// =========================================================================
function UniversalTargetSvg({
  emoji,
  name,
  isVictory,
  activeColor,
}: {
  emoji: string;
  name: string;
  isVictory: boolean;
  activeColor: GoalColor;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center p-2">
      {/* Planetary Orbit Ring */}
      <div className="absolute w-28 h-28 rounded-full border border-amber-400/30 animate-spin-slow pointer-events-none" />
      <div className="absolute w-24 h-24 rounded-full border border-cyan-400/20 pointer-events-none" />

      {/* Giant 3D Holographic Display Pod */}
      <div
        className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${activeColor.gradient} flex items-center justify-center text-4xl shadow-2xl border border-white/30 relative transition-transform ${
          isVictory ? 'animate-bounce' : 'animate-float-slow'
        }`}
        style={{
          boxShadow: `0 0 28px ${activeColor.accentHex || '#f59e0b'}80`,
        }}
      >
        <span className="drop-shadow-lg select-none">{emoji}</span>
        {/* Shimmer Light Sweep */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer pointer-events-none" />
      </div>
    </div>
  );
}
