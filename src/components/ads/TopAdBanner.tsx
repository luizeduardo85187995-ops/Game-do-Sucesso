import React, { useState, useEffect, useRef } from 'react';
import { Crown, ExternalLink, Copy, Check, Info } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useSettings, DEFAULT_CUSTOM_ADS, CustomAd } from '../../context/SettingsContext';

export default function TopAdBanner() {
  const { isPro, openProModal } = useSubscription();
  const {
    googleAdSenseClientId,
    googleAdSenseSlotId,
    customAds,
    adDisplayMode,
    theme,
  } = useSettings();

  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const adSenseRef = useRef<HTMLModElement | null>(null);

  const isLight = theme === 'pro_light';

  // Get active ads from context, falling back to default ads if none are active
  const activeAds: CustomAd[] = (customAds && customAds.length > 0)
    ? customAds.filter((a) => a.active)
    : DEFAULT_CUSTOM_ADS;

  const validAds = activeAds.length > 0 ? activeAds : DEFAULT_CUSTOM_ADS;

  // Rotate custom ads every 9 seconds for free users unless hovered
  useEffect(() => {
    if (isPro || isPaused || validAds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % validAds.length);
    }, 9000);
    return () => clearInterval(interval);
  }, [isPro, isPaused, validAds.length]);

  // Keep index in bounds if ads list changes
  useEffect(() => {
    if (currentAdIndex >= validAds.length) {
      setCurrentAdIndex(0);
    }
  }, [validAds.length, currentAdIndex]);

  // Handle promo code copy
  const handleCopyPromoCode = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 3000);
    } catch {
      // fallback
    }
  };

  // Load real Google AdSense script dynamically when publisher ID is configured and mode is adsense
  useEffect(() => {
    if (isPro || adDisplayMode !== 'adsense' || !googleAdSenseClientId) return;

    try {
      // @ts-ignore
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // silently handle AdSense push
    }
  }, [isPro, adDisplayMode, googleAdSenseClientId, googleAdSenseSlotId]);

  // If user is PRO subscriber, do not render any ad banner!
  if (isPro) {
    return null;
  }

  // If set to Google AdSense mode and has valid client ID
  if (adDisplayMode === 'adsense' && googleAdSenseClientId) {
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

  const currentAd = validAds[currentAdIndex] || validAds[0];
  const targetUrl = currentAd.url;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`top-admob-strip relative z-50 border-b px-3 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 transition-colors ${
        isLight
          ? 'bg-slate-50 border-slate-200 shadow-sm'
          : 'bg-[#070d1e] border-cyan-500/30 shadow-inner'
      }`}
    >
      {/* Left: Ad Label & Sponsored Content */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-[260px] overflow-hidden">
        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
          isLight
            ? 'bg-slate-200 text-slate-700 border-slate-300'
            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        }`}>
          PARCERIA
        </span>

        {currentAd.tag && (
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border hidden md:inline shrink-0 ${
            currentAd.badgeColor || (isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30')
          }`}>
            {currentAd.tag}
          </span>
        )}

        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 truncate group cursor-pointer"
          title={`Clique para acessar: ${currentAd.title}`}
        >
          <span className={`text-xs font-bold transition-colors truncate ${
            isLight
              ? 'text-slate-900 group-hover:text-blue-600'
              : 'text-white group-hover:text-cyan-300'
          }`}>
            {currentAd.title}
          </span>
          {currentAd.subtitle && (
            <span className={`text-[11px] hidden lg:inline truncate ${
              isLight
                ? 'text-slate-500 group-hover:text-slate-700'
                : 'text-slate-400 group-hover:text-slate-300'
            }`}>
              — {currentAd.subtitle}
            </span>
          )}
          <ExternalLink className={`w-3 h-3 shrink-0 ${
            isLight
              ? 'text-slate-400 group-hover:text-blue-600'
              : 'text-slate-500 group-hover:text-cyan-400'
          }`} />
        </a>

        {/* Promo code copy button if ad has a coupon */}
        {currentAd.promoCode && (
          <button
            type="button"
            onClick={(e) => handleCopyPromoCode(currentAd.promoCode!, e)}
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black border flex items-center gap-1 transition-all shrink-0 active:scale-95 ${
              copiedCode === currentAd.promoCode
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                : isLight
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30'
            }`}
            title="Copiar código promocional de indicação"
          >
            {copiedCode === currentAd.promoCode ? (
              <>
                <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Código: {currentAd.promoCode}</span>
              </>
            )}
          </button>
        )}

        {/* Legal link if present */}
        {currentAd.legalUrl && (
          <a
            href={currentAd.legalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-slate-400 hover:text-cyan-400 underline underline-offset-1 hidden xl:inline shrink-0"
            title="Informações legais e regulatórias do patrocinador"
          >
            Legal
          </a>
        )}
      </div>

      {/* Right: Actions (CTA and Remove Ads) */}
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm hover:scale-[1.02] active:scale-95 ${
            isLight
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-emerald-500/20'
          }`}
        >
          <span>{currentAd.cta || 'Acessar'}</span>
          <ExternalLink className="w-3 h-3 stroke-[2.5]" />
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
