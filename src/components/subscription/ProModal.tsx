import React, { useState } from 'react';
import {
  X,
  Crown,
  CheckCircle2,
  Sparkles,
  Zap,
  TrendingUp,
  FileSpreadsheet,
  Bot,
  ShieldCheck,
  CreditCard,
  Building,
  HelpCircle,
} from 'lucide-react';
import { useSubscription, SubscriptionPlan } from '../../context/SubscriptionContext';

export default function ProModal() {
  const { isPro, plan, isProModalOpen, closeProModal, activatePro, downgradeToFree } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  if (!isProModalOpen) return null;

  const handleSubscribe = () => {
    setIsProcessing(true);
    setTimeout(() => {
      activatePro(selectedPlan);
      setIsProcessing(false);
      setSuccessNote(`Parabéns! Seu plano PRO (${selectedPlan === 'annual' ? 'Anual' : 'Mensal'}) foi ativado.`);
      setTimeout(() => {
        setSuccessNote(null);
        closeProModal();
      }, 1500);
    }, 800);
  };

  const handleRevertFree = () => {
    downgradeToFree();
    setSuccessNote('Plano revertido para Gratuito com anúncios.');
    setTimeout(() => {
      setSuccessNote(null);
      closeProModal();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-amber-500/40 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar relative">
        {/* Glow corner ambient */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeProModal}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 pb-3 border-b border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/30 shrink-0">
            <Crown className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-white">NEO-FINANCE PRO</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                GOOGLE PLAY
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Desbloqueie todo o poder da inteligência financeira sem anúncios
            </p>
          </div>
        </div>

        {/* Success note */}
        {successNote && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-fade-in flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successNote}</span>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
            // O que está incluso no plano PRO:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">100% Livre de Anúncios</strong>
                <span className="text-slate-400 text-[11px]">Nenhum banner ou tela de propaganda.</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Importação Ilimitada B3</strong>
                <span className="text-slate-400 text-[11px]">Leitura automática de Excel e PDF da Área do Investidor.</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2.5">
              <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Radar de Dividendos B3</strong>
                <span className="text-slate-400 text-[11px]">Projeção de proventos futuros e data com/pagamento.</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2.5">
              <Bot className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Dante IA Ilimitado</strong>
                <span className="text-slate-400 text-[11px]">Consultoria financeira com inteligência avançada.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Options */}
        <div className="space-y-3 pt-2">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            // Selecione seu plano de assinatura:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Annual Plan (Best Value) */}
            <div
              onClick={() => setSelectedPlan('annual')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                selectedPlan === 'annual'
                  ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow">
                Economize 33%
              </span>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">Plano Anual</h4>
                  <p className="text-[11px] text-slate-400">12 meses de acesso VIP</p>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selectedPlan === 'annual' ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-500'
                }`}>
                  {selectedPlan === 'annual' && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white font-mono">R$ 9,99</span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>
                <span className="text-[10px] text-amber-300 font-mono">Cobrado R$ 119,90 anualmente</span>
              </div>
            </div>

            {/* Monthly Plan */}
            <div
              onClick={() => setSelectedPlan('monthly')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedPlan === 'monthly'
                  ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">Plano Mensal</h4>
                  <p className="text-[11px] text-slate-400">Cancele quando quiser</p>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selectedPlan === 'monthly' ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-500'
                }`}>
                  {selectedPlan === 'monthly' && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white font-mono">R$ 14,90</span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Cobrança mensal recorrente</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Store disclaimer */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            Pagamento processado com segurança pela <strong>Google Play Billing</strong>.
            Cancele a qualquer momento nas configurações da sua conta Google Play.
          </span>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          {isPro && (
            <button
              type="button"
              onClick={handleRevertFree}
              className="text-xs text-rose-400 hover:text-rose-300 underline font-medium"
            >
              (Modo Teste: Voltar para Plano Gratuito)
            </button>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <button
              type="button"
              onClick={closeProModal}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-all"
            >
              Agora não
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSubscribe}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              <Crown className="w-4 h-4" />
              <span>{isProcessing ? 'Conectando à Google Play...' : 'Assinar com Google Play'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
