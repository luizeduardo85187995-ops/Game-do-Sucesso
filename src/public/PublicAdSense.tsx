import React, { useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';

const ADSENSE_SCRIPT_ID = 'jornada-public-adsense-script';

/**
 * Google AdSense is intentionally restricted to long-form public educational
 * content. It is never rendered inside /app, login, settings, Dante, checkout,
 * navigation-only or empty states.
 */
export default function PublicAdSense() {
  const { adDisplayMode, googleAdSenseClientId, googleAdSenseSlotId } = useSettings();
  const adRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);

  const clientId = googleAdSenseClientId.trim();
  const slotId = googleAdSenseSlotId.trim();
  const clientIsValid = /^ca-pub-\d{10,20}$/.test(clientId);
  const slotIsValid = /^\d{6,20}$/.test(slotId);
  const enabled = adDisplayMode !== 'custom_ads' && clientIsValid && slotIsValid;

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    let script = document.getElementById(ADSENSE_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = ADSENSE_SCRIPT_ID;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
      document.head.appendChild(script);
    }

    const pushAd = () => {
      if (pushedRef.current || !adRef.current) return;
      try {
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle.push({});
        pushedRef.current = true;
      } catch {
        // AdSense may still be initializing. It can retry on a future render.
      }
    };

    if (script.dataset.loaded === 'true') {
      pushAd();
    } else {
      const onLoad = () => {
        script!.dataset.loaded = 'true';
        pushAd();
      };
      script.addEventListener('load', onLoad, { once: true });
      // If the script was already fetched before our listener, retry shortly.
      const retry = window.setTimeout(pushAd, 1200);
      return () => {
        script?.removeEventListener('load', onLoad);
        window.clearTimeout(retry);
      };
    }
  }, [enabled, clientId, slotId]);

  if (!enabled) return null;

  return (
    <aside
      className="my-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-label="Publicidade"
    >
      <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        Publicidade
      </p>
      <ins
        ref={adRef}
        className="adsbygoogle block min-h-[90px] w-full"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
