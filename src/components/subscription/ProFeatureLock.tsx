import React from 'react';
import { Crown, Sparkles, Lock, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';

interface ProFeatureLockProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  benefits: { title: string; desc: string }[];
  tag?: string;
}

export default function ProFeatureLock({
  title,
  subtitle,
  icon,
  benefits,
  tag = 'RECURSO EXCLUSIVO VIP PRO',
}: ProFeatureLockProps) {
  const { openProModal } = useSubscription();

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950 p-6 sm:p-10 my-4 shadow-2xl">
      {/* Background glow effects */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
        {/* Badges */}
        <div className="flex items-center justify-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/10">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            {tag}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            1º MÊS R$ 9,99
          </span>
        </div>

        {/* Icon & Title */}
        <div className="space-y-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/30">
            {icon || <Crown className="w-9 h-9 sm:w-11 sm:h-11" />}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-500/30 transition-all flex items-start gap-3"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs text-white block">{b.title}</strong>
                <span className="text-[11px] text-slate-400 leading-snug block mt-0.5">
                  {b.desc}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Card */}
        <div className="pt-4 space-y-3">
          <button
            onClick={openProModal}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm sm:text-base transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2.5 mx-auto active:scale-95 cursor-pointer hover:scale-[1.02]"
          >
            <Lock className="w-4 h-4" />
            <span>Desbloquear Acesso Completo no VIP PRO</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Cobrança Automática Kiwify
            </span>
            <span>•</span>
            <span>Cancele quando quiser</span>
          </div>
        </div>
      </div>
    </div>
  );
}
