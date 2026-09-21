import React from 'react';
import { GoalColor } from '../types';

interface LivingSceneryProps {
  progress: number;
  activeColor: GoalColor;
}

export default function LivingScenery({ progress, activeColor }: LivingSceneryProps) {
  const isNight = progress < 35;
  const isSunset = progress >= 35 && progress < 75;
  const isGoldenHour = progress >= 75;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Dynamic Animated Sky Gradient */}
      <div
        className="absolute inset-0 transition-all duration-[3000ms] ease-out"
        style={{
          background: isNight
            ? 'linear-gradient(180deg, #030712 0%, #0b132b 30%, #1c1c38 65%, #2d124d 100%)'
            : isSunset
            ? 'linear-gradient(180deg, #0c1445 0%, #1e295d 25%, #4c1d95 55%, #9f1239 80%, #d97706 100%)'
            : 'linear-gradient(180deg, #0369a1 0%, #0ea5e9 25%, #38bdf8 55%, #fbbf24 85%, #f59e0b 100%)',
        }}
      />

      {/* 2. Shimmering Aurora Borealis / Celestial Light Wave */}
      <div className="absolute top-0 inset-x-0 h-44 overflow-hidden opacity-70">
        <svg
          viewBox="0 0 1000 240"
          preserveAspectRatio="none"
          className="w-full h-full animate-aurora-wave"
        >
          <defs>
            <linearGradient id="auroraGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
              <stop offset="25%" stopColor="#34d399" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.6" />
              <stop offset="75%" stopColor="#c084fc" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
            </linearGradient>
            <filter id="auroraGlow">
              <feGaussianBlur stdDeviation="12" result="blur" />
            </filter>
          </defs>
          <path
            d="M 0 60 C 200 20, 350 110, 500 50 C 650 -10, 800 90, 1000 40 L 1000 0 L 0 0 Z"
            fill="url(#auroraGrad)"
            filter="url(#auroraGlow)"
          />
          <path
            d="M 0 90 C 250 40, 400 130, 600 70 C 800 10, 900 100, 1000 80 L 1000 0 L 0 0 Z"
            fill="url(#auroraGrad)"
            opacity="0.6"
            filter="url(#auroraGlow)"
          />
        </svg>
      </div>

      {/* 3. Twinkling Night Stars & Constellations */}
      <div
        className={`absolute inset-0 transition-opacity duration-[2000ms] ${
          isGoldenHour ? 'opacity-25' : 'opacity-85'
        }`}
      >
        {[...Array(40)].map((_, i) => {
          const size = (i % 3) + 1;
          const top = (i * 19) % 62;
          const left = (i * 27) % 98;
          const delay = (i * 0.4) % 4;
          const duration = 2 + (i % 3);
          return (
            <div
              key={`star-${i}`}
              className="absolute rounded-full bg-white animate-pulse"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                top: `${top}%`,
                left: `${left}%`,
                opacity: 0.35 + ((i % 5) * 0.15),
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                boxShadow: size > 2 ? '0 0 6px 1px rgba(255,255,255,0.8)' : 'none',
              }}
            />
          );
        })}
      </div>

      {/* 4. Shooting Stars / Comets */}
      <div className="absolute top-10 right-20 w-44 h-0.5 pointer-events-none animate-shooting-star-1 opacity-0">
        <div className="w-full h-full bg-gradient-to-l from-white via-cyan-300 to-transparent shadow-[0_0_8px_#38bdf8]" />
      </div>
      <div className="absolute top-24 left-1/3 w-36 h-0.5 pointer-events-none animate-shooting-star-2 opacity-0">
        <div className="w-full h-full bg-gradient-to-l from-amber-200 via-yellow-400 to-transparent shadow-[0_0_8px_#fde047]" />
      </div>

      {/* 5. Celestial Orb (Sun / Moon) */}
      <div
        className="absolute transition-all duration-[3000ms] pointer-events-none"
        style={{
          top: isGoldenHour ? '8%' : isSunset ? '14%' : '10%',
          right: isGoldenHour ? '12%' : '14%',
          width: isGoldenHour ? '78px' : '64px',
          height: isGoldenHour ? '78px' : '64px',
        }}
      >
        {isGoldenHour ? (
          // Radiant Golden Sun with Solar Corona
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Outer Solar Flares */}
            <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-amber-400/30 via-yellow-300/40 to-amber-500/30 blur-xl animate-pulse" />
            <div className="absolute -inset-4 rounded-full border border-yellow-200/40 animate-spin-slow" />
            {/* Sun Core */}
            <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-100 via-amber-300 to-amber-500 shadow-[0_0_50px_rgba(251,191,36,0.8)] border border-yellow-100/60" />
            {/* God Rays descending */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-b from-yellow-300/15 to-transparent blur-md pointer-events-none" style={{ clipPath: 'polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)' }} />
          </div>
        ) : (
          // Mystic Moon with Halo & Crater details
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute -inset-6 rounded-full bg-cyan-400/20 blur-xl" />
            <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-400 shadow-[0_0_30px_rgba(226,232,240,0.5)] border border-white/60 relative overflow-hidden">
              {/* Moon craters */}
              <div className="absolute top-3 left-4 w-3.5 h-3.5 rounded-full bg-slate-400/40" />
              <div className="absolute top-8 left-8 w-5 h-5 rounded-full bg-slate-400/30" />
              <div className="absolute bottom-3 left-3 w-4 h-4 rounded-full bg-slate-400/35" />
            </div>
          </div>
        )}
      </div>

      {/* 6. Distant Soaring Birds / Eagles */}
      <div className="absolute top-16 left-0 w-16 h-8 pointer-events-none animate-birds-glide opacity-60">
        <svg viewBox="0 0 60 25" fill="currentColor" className="w-full h-full text-slate-800/80">
          <path d="M 0 10 Q 15 0 30 10 Q 45 0 60 10 Q 45 7 30 14 Q 15 7 0 10 Z" />
          <path d="M 12 18 Q 22 10 32 18 Q 42 10 52 18 Q 42 16 32 21 Q 22 16 12 18 Z" opacity="0.7" />
        </svg>
      </div>

      {/* 7. Parallax Living Mountain Ranges */}
      {/* Layer 1: Distant Misty Mountain Silhouette */}
      <div className="absolute inset-x-0 bottom-0 h-72 opacity-40">
        <svg viewBox="0 0 1200 400" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="farMountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#312e81" />
              <stop offset="40%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>
          </defs>
          <polygon
            points="0,400 0,220 120,150 240,240 380,110 520,260 680,90 840,230 980,130 1100,210 1200,160 1200,400"
            fill="url(#farMountainGrad)"
          />
          {/* Distant Snow Peaks Highlights */}
          <polygon points="110,160 120,150 135,165 125,170" fill="#ffffff" opacity="0.6" />
          <polygon points="370,120 380,110 395,125 385,130" fill="#ffffff" opacity="0.6" />
          <polygon points="670,105 680,90 695,110 685,115" fill="#ffffff" opacity="0.7" />
        </svg>
      </div>

      {/* Layer 2: Midground Craggy Peaks & Glowing Crystals */}
      <div className="absolute inset-x-0 bottom-0 h-56 opacity-65">
        <svg viewBox="0 0 1200 350" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="midMountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="60%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
          </defs>
          <polygon
            points="0,350 0,180 160,110 300,210 460,130 620,230 780,100 940,220 1080,140 1200,190 1200,350"
            fill="url(#midMountainGrad)"
          />
        </svg>
      </div>

      {/* Layer 3: Foreground Cliffs Framing the Stairs with Living Bonsai/Pines */}
      {/* Left Cliff with Swaying Evergreen Pine */}
      <div className="absolute bottom-0 -left-6 w-36 sm:w-44 h-64 pointer-events-none">
        <svg viewBox="0 0 160 260" fill="none" className="w-full h-full drop-shadow-xl">
          {/* Rocky Cliff */}
          <path
            d="M 0 260 L 0 60 Q 50 110 70 170 Q 90 220 120 260 Z"
            fill="#0f172a"
            stroke="#1e293b"
            strokeWidth="1.5"
          />
          {/* Swaying Pine Tree Trunk & Needles */}
          <g className="animate-tree-sway">
            <path d="M 35 120 Q 55 105 75 95" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
            <path d="M 55 105 Q 85 85 95 65" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
            {/* Pine Needle Foliage Tufts */}
            <ellipse cx="78" cy="92" rx="14" ry="7" fill="#065f46" />
            <ellipse cx="78" cy="90" rx="11" ry="5" fill="#10b981" opacity="0.8" />
            <ellipse cx="96" cy="63" rx="16" ry="8" fill="#065f46" />
            <ellipse cx="96" cy="61" rx="12" ry="6" fill="#10b981" opacity="0.8" />
            <ellipse cx="62" cy="110" rx="12" ry="6" fill="#065f46" />
          </g>
        </svg>
      </div>

      {/* Right Cliff with Mountain Pine */}
      <div className="absolute bottom-0 -right-6 w-36 sm:w-44 h-64 pointer-events-none">
        <svg viewBox="0 0 160 260" fill="none" className="w-full h-full drop-shadow-xl">
          <path
            d="M 160 260 L 160 70 Q 110 120 90 180 Q 70 230 40 260 Z"
            fill="#0f172a"
            stroke="#1e293b"
            strokeWidth="1.5"
          />
          <g className="animate-tree-sway" style={{ animationDelay: '1.2s' }}>
            <path d="M 125 130 Q 105 110 85 100" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
            <ellipse cx="82" cy="98" rx="15" ry="7" fill="#065f46" />
            <ellipse cx="82" cy="96" rx="11" ry="5" fill="#10b981" opacity="0.8" />
            <ellipse cx="102" cy="118" rx="13" ry="6" fill="#065f46" />
          </g>
        </svg>
      </div>

      {/* 8. Parallax Drifting Clouds (Multi-layer) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Cloud Layer 1 - Slow High Altitude */}
        <div className="absolute top-12 -left-20 w-[600px] h-20 animate-cloud-drift-1 opacity-25 blur-sm">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-transparent via-white to-transparent" />
        </div>
        {/* Cloud Layer 2 - Mid Altitude */}
        <div className="absolute top-28 -right-20 w-[500px] h-24 animate-cloud-drift-2 opacity-35 blur-md">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        </div>
      </div>

      {/* 9. Floating Golden Fireflies / Luminescent Stardust */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(14)].map((_, i) => {
          const left = 12 + ((i * 18) % 76);
          const top = 35 + ((i * 14) % 55);
          const delay = (i * 0.7) % 5;
          const duration = 4 + (i % 3);
          return (
            <div
              key={`firefly-${i}`}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${3 + (i % 2)}px`,
                height: `${3 + (i % 2)}px`,
                background: i % 2 === 0 ? '#fbbf24' : '#38bdf8',
                boxShadow: i % 2 === 0 ? '0 0 10px 2px #fde047' : '0 0 10px 2px #38bdf8',
                animation: `firefly-dance ${duration}s ease-in-out ${delay}s infinite`,
              }}
            />
          );
        })}
      </div>

      {/* 10. Fluttering Mountain Wind Leaves / Cherry Blossom Petals */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => {
          const left = 5 + (i * 16);
          const top = 10 + ((i * 12) % 30);
          const delay = (i * 1.5) % 6;
          return (
            <div
              key={`leaf-${i}`}
              className="absolute pointer-events-none text-xs"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                animation: `leaf-drift 7s linear ${delay}s infinite`,
              }}
            >
              <span className="opacity-70">{i % 2 === 0 ? '🍃' : '🌸'}</span>
            </div>
          );
        })}
      </div>

      {/* 11. Low Valley Rolling Mist / Fog along base */}
      <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none animate-mist-drift">
        <div className="w-full h-full bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent blur-md" />
      </div>
    </div>
  );
}
