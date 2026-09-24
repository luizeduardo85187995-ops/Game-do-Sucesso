import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Coins,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Building2,
  Wallet,
  ChevronRight,
  Filter,
  Info,
  DollarSign,
  Layers,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { DividendEvent, DividendStatus } from '../../types/finance';
import {
  calculateMonthlyDividendsOverview,
  formatPaymentDaysNotice,
  getDaysUntil,
} from '../../services/b3MarketService';
import { formatBRL, formatDateBR, monthLabel } from '../../utils/format';

interface DividendRadarScreenProps {
  onOpenNewAssetModal?: () => void;
}

export default function DividendRadarScreen({ onOpenNewAssetModal }: DividendRadarScreenProps) {
  const {
    dividendEvents,
    investments,
    bankAccounts,
    confirmDividendPayout,
    metrics,
  } = useFinance();

  const [filterStatus, setFilterStatus] = useState<'upcoming' | 'paid' | 'all'>('upcoming');
  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filtra proventos conforme a aba selecionada
  const filteredEvents = useMemo(() => {
    if (filterStatus === 'upcoming') {
      return dividendEvents.filter((e) => e.status !== 'paid');
    }
    if (filterStatus === 'paid') {
      return dividendEvents.filter((e) => e.status === 'paid');
    }
    return dividendEvents;
  }, [dividendEvents, filterStatus]);

  // Próximo provento mais próximo a cair
  const nextPayout = useMemo(() => {
    const upcoming = dividendEvents.filter((e) => e.status !== 'paid');
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [dividendEvents]);

  // Proventos a receber neste mês corrente
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const thisMonthTotal = useMemo(() => {
    return dividendEvents
      .filter((e) => e.paymentDate.startsWith(currentMonthKey))
      .reduce((sum, e) => sum + e.totalAmount, 0);
  }, [dividendEvents, currentMonthKey]);

  // Total provisionado em todos os meses futuros
  const totalProvisionedFuture = useMemo(() => {
    return dividendEvents
      .filter((e) => e.status !== 'paid')
      .reduce((sum, e) => sum + e.totalAmount, 0);
  }, [dividendEvents]);

  // Dados mensais para o gráfico de barras Jan a Dez estilo Investidor10
  const monthlyChartData = useMemo(() => {
    return calculateMonthlyDividendsOverview(dividendEvents);
  }, [dividendEvents]);

  const maxMonthValue = useMemo(() => {
    const max = Math.max(...monthlyChartData.map((d) => d.amount));
    return max > 0 ? max : 100;
  }, [monthlyChartData]);

  // Lida com o depósito do provento na conta bancária
  const handleConfirmPayout = (eventId: string, ticker: string, amount: number) => {
    confirmDividendPayout(eventId, selectedBankId);
    setSuccessToast(`Provento de ${formatBRL(amount)} do ${ticker} creditado na sua conta com sucesso!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast de Sucesso */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-3 shadow-lg shadow-emerald-500/10 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs font-bold">{successToast}</div>
        </div>
      )}

      {/* Hero Header do Radar Investidor10 */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-cyan-950/30 border border-purple-500/30 hud-border-corners shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                RADAR DE PROVENTOS & DIVIDENDOS
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                // Inspirado no Investidor10
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>Quando Vai Cair?</span>
              <Coins className="w-6 h-6 text-amber-400 inline" />
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Acompanhe as datas exatas em que os dividendos, JCP e rendimentos de FIIs vão cair na sua conta,
              calculados automaticamente pela quantidade de cotas que você possui.
            </p>
          </div>

          {/* Quick Bank Selector for Credit */}
          {bankAccounts.length > 0 && (
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shrink-0">
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Conta para crédito dos proventos
              </label>
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/15 text-xs font-bold text-white focus:outline-none focus:border-purple-400"
              >
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bankName} {acc.nickname ? `(${acc.nickname})` : ''} - Saldo: {formatBRL(acc.balance)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Top Cards Resumo de Proventos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total a Cair Este Mês */}
        <div className="cyber-card rounded-2xl p-5 border-emerald-500/40 bg-emerald-950/20 hud-border-corners">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              // Vai Cair Este Mês
            </span>
            <Coins className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono neon-text-emerald">
            {formatBRL(thisMonthTotal)}
          </div>
          <p className="text-[11px] text-emerald-400/80 mt-1 font-mono">
            {dividendEvents.filter((e) => e.paymentDate.startsWith(currentMonthKey)).length} pagamentos neste mês
          </p>
        </div>

        {/* Próximo a Cair em Destaque */}
        <div className="cyber-card rounded-2xl p-5 border-cyan-500/40 bg-cyan-950/20 hud-border-corners relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              // Próximo Provento
            </span>
            <Clock className="w-5 h-5 text-cyan-400" />
          </div>

          {nextPayout ? (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-white">{nextPayout.ticker}</span>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {formatBRL(nextPayout.totalAmount)}
                </span>
              </div>
              <div className="mt-2">
                {(() => {
                  const notice = formatPaymentDaysNotice(nextPayout.paymentDate, nextPayout.status === 'paid');
                  return (
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${notice.badgeColor}`}>
                      {notice.text} • {formatDateBR(nextPayout.paymentDate)}
                    </span>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 pt-2 font-mono">Nenhum provento agendado</div>
          )}
        </div>

        {/* Total Provisionado Futuro */}
        <div className="cyber-card rounded-2xl p-5 border-purple-500/40 bg-purple-950/20 hud-border-corners">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              // Total Provisionado
            </span>
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">
            {formatBRL(totalProvisionedFuture)}
          </div>
          <p className="text-[11px] text-purple-400/80 mt-1 font-mono">
            Previsão confirmada & projetada
          </p>
        </div>

        {/* Média Mensal Estimada */}
        <div className="cyber-card rounded-2xl p-5 border-amber-500/40 bg-amber-950/20 hud-border-corners">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              // Renda Passiva / Mês
            </span>
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
            {formatBRL(metrics.estimatedPassiveIncome)}
          </div>
          <p className="text-[11px] text-amber-400/80 mt-1 font-mono">
            Projeção anual de {formatBRL(metrics.estimatedPassiveIncome * 12)}
          </p>
        </div>
      </div>

      {/* Gráfico de Proventos Mês a Mês (Estilo Investidor10) */}
      <div className="cyber-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Evolução Mensal de Proventos (Jan a Dez)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Visualização de renda passiva creditada e provisionada ao longo do ano
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Pago / Atual
            </span>
            <span className="flex items-center gap-1 text-purple-400">
              <span className="w-2.5 h-2.5 rounded bg-purple-500/60 inline-block" /> Provisionado
            </span>
          </div>
        </div>

        {/* Gráfico de Barras Customizado */}
        <div className="pt-4 pb-2">
          <div className="h-44 flex items-end justify-between gap-1.5 sm:gap-2 px-1">
            {monthlyChartData.map((item, idx) => {
              const currentMonthIndex = new Date().getMonth();
              const isCurrent = idx === currentMonthIndex;
              const heightPercent = maxMonthValue > 0 ? Math.max(8, (item.amount / maxMonthValue) * 100) : 8;

              return (
                <div key={item.month} className="flex-1 flex flex-col items-center h-full justify-end group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold text-white mb-1.5 whitespace-nowrap bg-slate-900 border border-white/20 px-2 py-0.5 rounded-lg shadow-xl pointer-events-none">
                    {formatBRL(item.amount)}
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[36px] rounded-t-lg transition-all duration-500 relative ${
                      item.amount > 0
                        ? item.isFuture
                          ? 'bg-gradient-to-t from-purple-600/70 to-purple-400/90 hover:from-purple-500 hover:to-purple-300'
                          : isCurrent
                          ? 'bg-gradient-to-t from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/30'
                          : 'bg-gradient-to-t from-cyan-600/70 to-cyan-400/90 hover:from-cyan-500 hover:to-cyan-300'
                        : 'bg-white/5 border border-white/5'
                    }`}
                  />

                  {/* Label */}
                  <span className={`text-[10px] sm:text-xs font-mono font-semibold mt-2 ${
                    isCurrent ? 'text-emerald-400 font-black' : 'text-slate-400'
                  }`}>
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feed "Quando Vai Cair?" com Filtros */}
      <div className="cyber-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-400" />
              <span>Agenda de Pagamentos da Carteira</span>
            </h3>
            <p className="text-xs text-slate-400">
              Proventos agendados calculados com base na sua posição atual
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'upcoming', label: 'A Cair (Provisionados)' },
              { id: 'paid', label: 'Já Creditados' },
              { id: 'all', label: 'Todos' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterStatus === tab.id
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-400/60 shadow-md shadow-purple-500/20'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Pagamentos */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 space-y-3 bg-white/[0.02] rounded-2xl border border-white/5">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-white">Nenhum provento neste filtro</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {investments.length === 0
                ? 'Cadastre seus investimentos (como MXRF11, PETR4, HGLG11) com a quantidade de cotas para ver exatamente quando os dividendos vão cair!'
                : 'Não há proventos para o filtro selecionado. Mude o filtro para visualizar outros meses ou ativos.'}
            </p>
            {investments.length === 0 && onOpenNewAssetModal && (
              <button
                onClick={onOpenNewAssetModal}
                className="mt-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-black shadow-lg shadow-purple-500/25 transition-all"
              >
                + Cadastrar Meu Primeiro FII / Ação
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event) => {
              const notice = formatPaymentDaysNotice(event.paymentDate, event.status === 'paid');
              const isPaid = event.status === 'paid';

              return (
                <div
                  key={event.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isPaid
                      ? 'bg-white/[0.02] border-white/10 opacity-75'
                      : notice.isUrgent
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                      : 'bg-white/[0.04] border-white/15 hover:border-purple-500/40'
                  }`}
                >
                  {/* Left: Ticker & Asset Info */}
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                      event.type === 'rendimento'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : event.type === 'jcp'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {event.ticker.slice(0, 4)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-white text-base font-mono">
                          {event.ticker}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          event.type === 'rendimento'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : event.type === 'jcp'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {event.type}
                        </span>
                        <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full ${notice.badgeColor}`}>
                          {notice.text}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 font-medium mt-0.5">
                        {event.assetName} • Sua posição: <strong className="text-white">{event.quantity} cotas</strong>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Dates (Data COM & Data de Pagamento) */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-6 bg-white/[0.03] p-2.5 rounded-xl border border-white/5 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Data COM (Corte)</span>
                      <strong className="text-slate-200">{formatDateBR(event.dataCom)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Quando Vai Cair</span>
                      <strong className="text-emerald-400 font-black">{formatDateBR(event.paymentDate)}</strong>
                    </div>
                  </div>

                  {/* Right: Amounts & Action */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-mono text-slate-400 block">
                        R$ {event.ratePerShare.toFixed(3)} / cota
                      </span>
                      <div className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                        +{formatBRL(event.totalAmount)}
                      </div>
                    </div>

                    {!isPaid ? (
                      <button
                        onClick={() => handleConfirmPayout(event.id, event.ticker, event.totalAmount)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                        title="Depositar este valor na minha conta bancária e lançar como receita de investimento"
                      >
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                        <span>Receber na Conta</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Creditado</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
