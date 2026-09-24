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
  ExternalLink,
  Lock,
  ArrowRight,
  BadgeCheck,
} from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';

export default function ProModal() {
  const { isPro, plan, isProModalOpen, closeProModal, activatePro, downgradeToFree } = useSubscription();
  const { kiwifyMonthlyUrl, kiwifyAnnualUrl } = useSettings();
  const { user } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  if (!isProModalOpen) return null;

  const monthlyUrl = kiwifyMonthlyUrl || 'https://pay.kiwify.com.br/DCGRpFb';
  const annualUrl = kiwifyAnnualUrl || 'https://pay.kiwify.com.br/09lfPE1';
  const targetKiwifyUrl = selectedPlan === 'monthly' ? monthlyUrl : annualUrl;

  const isOwner = user?.email === 'luizeduardo85187995@gmail.com';

  const handleAdminDirectActivation = async () => {
    setIsProcessing(true);
    try {
      await activatePro(selectedPlan, 'Kiwify Recorrente');
      setSuccessNote(`VIP PRO ativado com sucesso para a conta ${user?.email || 'atual'}!`);
      setTimeout(() => {
        setSuccessNote(null);
        closeProModal();
      }, 1800);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevertFree = async () => {
    await downgradeToFree();
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
          title="Fechar"
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
              <h3 className="text-lg sm:text-xl font-black text-white">MINHAS FINANÇAS VIP PRO</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                COBRANÇA AUTOMÁTICA
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
            // Benefícios Inclusos no VIP PRO:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">100% Livre de Anúncios</strong>
                <span className="text-slate-400 text-[11px]">Nenhum banner ou propaganda durante o uso.</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2.5">
              <Bot className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Dante IA Ilimitado</strong>
                <span className="text-slate-400 text-[11px]">Consultoria financeira com IA avançada sem travas diárias.</span>
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
                <span className="text-slate-400 text-[11px]">Projeção automática de proventos futuros e rendimentos.</span>
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
            {/* Monthly Plan (Offer First Month R$ 9,99) */}
            <div
              onClick={() => setSelectedPlan('monthly')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                selectedPlan === 'monthly'
                  ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow">
                1º MÊS POR R$ 9,99
              </span>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">Plano Mensal</h4>
                  <p className="text-[11px] text-slate-400">Cobrança automática no cartão</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedPlan === 'monthly' ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-slate-500'
                  }`}
                >
                  {selectedPlan === 'monthly' && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-slate-400 line-through">R$ 14,90</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">R$ 9,99</span>
                  <span className="text-xs text-slate-400">/1º mês</span>
                </div>
                <span className="text-[10px] text-slate-300 font-mono block mt-0.5">
                  Depois R$ 14,90/mês. Cancele quando quiser.
                </span>
              </div>
            </div>

            {/* Annual Plan */}
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
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedPlan === 'annual' ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-500'
                  }`}
                >
                  {selectedPlan === 'annual' && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white font-mono">R$ 9,99</span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>
                <span className="text-[10px] text-amber-300 font-mono block mt-0.5">
                  Cobrado R$ 119,90 anualmente no cartão
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Kiwify Secure Checkout Action Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950/60 to-purple-950/40 border border-emerald-500/30 space-y-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">
              Plano selecionado: <strong className="text-white">{selectedPlan === 'monthly' ? 'Mensal (R$ 9,99 no 1º mês)' : 'Anual (R$ 119,90/ano)'}</strong>
            </span>
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Checkout Blindado
            </span>
          </div>

          <a
            href={targetKiwifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Assinar com Cobrança Automática na Kiwify</span>
            <ExternalLink className="w-4 h-4 ml-1" />
          </a>

          <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Pagamento 100% Seguro Kiwify
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5 text-cyan-400" />
              Cancele Quando Quiser
            </span>
          </div>
        </div>

        {/* Admin Direct Activation */}
        {isOwner && (
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-purple-300 font-bold flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-purple-400" />
                Painel do Administrador (Luiz Eduardo)
              </span>
              <span className="text-[10px] font-mono text-purple-400">DONO DO APP</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Você pode ativar o plano PRO manualmente na sua conta para testar ou demonstrar para amigos:
            </p>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleAdminDirectActivation}
              className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <span>{isProcessing ? 'Sincronizando...' : 'Ativar VIP PRO Imediatamente (Modo Administrador)'}</span>
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          {isPro && isOwner && (
            <button
              type="button"
              onClick={handleRevertFree}
              className="text-xs text-rose-400 hover:text-rose-300 underline font-medium"
            >
              (Modo Administrador: Voltar para Versão Gratuita)
            </button>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <button
              type="button"
              onClick={closeProModal}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
