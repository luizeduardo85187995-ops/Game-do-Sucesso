import React, { useState, useEffect, useRef } from 'react';
import { Crown, ExternalLink, Settings, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useSettings } from '../../context/SettingsContext';

interface SampleAd {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  cta: string;
  url: string;
  badgeColor: string;
}

const SAMPLE_ADS: SampleAd[] = [
  {
    id: 'ad-nomad',
    tag: 'CONTA GLOBAL',
    title: 'Nomad Global: Ganhe até US$ 20 de Cashback na abertura',
    subtitle: 'Compre ações e ETFs em dólar nos EUA sem taxa de corretagem.',
    cta: 'Abrir Conta',
    url: 'https://www.nomadglobal.com',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'ad-b3',
    tag: 'RENDA PASSIVA',
    title: 'Área do Investidor B3: Acompanhe seus Dividendos',
    subtitle: 'Consolide suas ações, FIIs e tesouro direto com segurança oficial.',
    cta: 'Acessar B3',
    url: 'https://investidor.b3.com.br',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  },
  {
    id: 'ad-remessa',
    tag: 'CÂMBIO & INVESTIMENTOS',
    title: 'Remessa Online: Envie e receba remessas do Google com menor custo',
    subtitle: 'Taxas reduzidas para desenvolvedores e investidores internacionais.',
    cta: 'Conhecer',
    url: 'https://www.remessaonline.com.br',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
];

export default function TopAdBanner() {
  const { isPro, openProModal } = useSubscription();
  const { googleAdSenseClientId, googleAdSenseSlotId, affiliateCustomUrl, theme } = useSettings();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const adSenseRef = useRef<HTMLModElement | null>(null);

  const isLight = theme === 'pro_light';

  // Rotate sample ads every 8 seconds for free users
  useEffect(() => {
    if (isPro) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % SAMPLE_ADS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isPro]);

  // Load real Google AdSense script dynamically when publisher ID is configured
  useEffect(() => {
    if (isPro || !googleAdSenseClientId) return;

    try {
      // @ts-ignore
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      // silently handle AdSense push if already rendered or waiting approval
    }
  }, [isPro, googleAdSenseClientId, googleAdSenseSlotId]);

  // Se o usuário for assinante PRO, não exibe anúncio!
  if (isPro) {
    return (
      <div className={`border-b px-3 py-1 flex items-center justify-between text-[11px] font-mono select-none ${
        isLight
          ? 'bg-amber-50/80 border-amber-200 text-amber-900'
          : 'bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 border-amber-500/20 text-amber-300'
      }`}>
        <div className="flex items-center gap-2">
          <Crown className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
          <span className="font-bold">STATUS PRO ATIVADO</span>
          <span className={isLight ? 'text-amber-400' : 'text-slate-500'}>|</span>
          <span className={`hidden sm:inline ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Experiência VIP 100% Livre de Anúncios</span>
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] ${isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400'}`}>
          <ShieldCheck className="w-3 h-3" />
          <span>RECURSOS ILIMITADOS</span>
        </div>
      </div>
    );
  }

  // Se o usuário inseriu o Google AdSense Client ID real
  if (googleAdSenseClientId) {
    return (
      <div className={`top-admob-strip relative z-50 border-b px-2 sm:px-4 py-1 flex items-center justify-between gap-2 ${
        isLight
          ? 'bg-slate-50 border-slate-200 text-slate-800'
          : 'bg-[#070d1e] border-cyan-500/30'
      }`}>
        <div className="flex-1 overflow-hidden flex items-center justify-center">
          <ins
            ref={adSenseRef}
            className="adsbygoogle block w-full text-center"
            style={{ display: 'block', maxHeight: '50px', overflow: 'hidden' }}
            data-ad-client={googleAdSenseClientId}
            data-ad-slot={googleAdSenseSlotId || '1234567890'}
            data-ad-format="horizontal"
            data-full-width-responsive="true"
          />
        </div>
        <button
          type="button"
          onClick={openProModal}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 flex items-center gap-1 ${
            isLight
              ? 'bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900'
              : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300'
          }`}
        >
          <Crown className="w-3 h-3" />
          <span>Remover</span>
        </button>
      </div>
    );
  }

  const currentAd = SAMPLE_ADS[currentAdIndex];
  const targetUrl = affiliateCustomUrl || currentAd.url;

  return (
    <div className={`top-admob-strip relative z-50 border-b px-3 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 transition-colors ${
      isLight
        ? 'bg-slate-50 border-slate-200 shadow-sm'
        : 'bg-[#070d1e] border-cyan-500/30 shadow-inner'
    }`}>
      {/* Left: Ad Label & Sponsored Content */}
      <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
          isLight
            ? 'bg-slate-200 text-slate-700 border-slate-300'
            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        }`}>
          ANÚNCIO
        </span>

        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border hidden md:inline shrink-0 ${
          isLight
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : currentAd.badgeColor
        }`}>
          {currentAd.tag}
        </span>

        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 truncate group cursor-pointer"
          title="Clique para acessar o patrocinador"
        >
          <span className={`text-xs font-bold transition-colors truncate ${
            isLight
              ? 'text-slate-900 group-hover:text-blue-600'
              : 'text-white group-hover:text-cyan-300'
          }`}>
            {currentAd.title}
          </span>
          <span className={`text-[11px] hidden lg:inline truncate ${
            isLight
              ? 'text-slate-500 group-hover:text-slate-700'
              : 'text-slate-400 group-hover:text-slate-300'
          }`}>
            — {currentAd.subtitle}
          </span>
          <ExternalLink className={`w-3 h-3 shrink-0 ${
            isLight
              ? 'text-slate-400 group-hover:text-blue-600'
              : 'text-slate-500 group-hover:text-cyan-400'
          }`} />
        </a>
      </div>

      {/* Right: Actions (CTA and Remove Ads) */}
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm ${
            isLight
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300'
          }`}
        >
          <span>{currentAd.cta}</span>
        </a>

        <button
          type="button"
          onClick={openProModal}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95 ${
            isLight
              ? 'bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900'
              : 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border border-amber-400/40 text-amber-300 hover:scale-[1.02]'
          }`}
          title="Assine o plano PRO para remover todos os anúncios"
        >
          <Crown className={`w-3 h-3 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
          <span>Remover Anúncios</span>
        </button>
      </div>
    </div>
  );
}
