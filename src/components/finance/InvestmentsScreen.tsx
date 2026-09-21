import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Trash2,
  PieChart,
  Lightbulb,
  DollarSign,
  ShieldCheck,
  Building,
  Coins,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Investment, InvestmentFocus, InvestmentType } from '../../types/finance';
import {
  ESTIMATED_MONTHLY_YIELD,
  INVESTMENT_FOCUS,
  INVESTMENT_IDEAS,
  INVESTMENT_TYPES,
} from '../../data/categories';
import { formatBRL, todayISO } from '../../utils/format';

export default function InvestmentsScreen() {
  const {
    investments,
    addInvestment,
    deleteInvestment,
    investmentFocus,
    setInvestmentFocus,
    marketIndicators,
    metrics,
  } = useFinance();

  const [showModal, setShowModal] = useState(false);

  // Form state
  const [code, setCode] = useState('XPML11');
  const [type, setType] = useState<InvestmentType>('fii');
  const [name, setName] = useState('XP Malls FII');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [yieldPercent, setYieldPercent] = useState('0.85');

  const openNewModalWithIdea = (idea: { code: string; type: InvestmentType; name: string }) => {
    setCode(idea.code);
    setType(idea.type);
    setName(idea.name);
    setYieldPercent(String(ESTIMATED_MONTHLY_YIELD[idea.type] || 0.85));
    setAmount('1000');
    setQuantity('10');
    setShowModal(true);
  };

  const handleSaveInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    const qty = parseInt(quantity, 10) || undefined;
    const yld = parseFloat(yieldPercent.replace(',', '.')) || ESTIMATED_MONTHLY_YIELD[type];

    addInvestment({
      code: code.trim().toUpperCase(),
      name: name.trim() || undefined,
      type,
      amount: val,
      quantity: qty,
      monthlyYield: yld,
      date: todayISO(),
    });

    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Carteira de Investimentos</h2>
          <p className="text-xs text-slate-400">Patrimônio acumulado, dividendos de FIIs e renda passiva mensal</p>
        </div>

        <button
          onClick={() => {
            setCode('');
            setName('');
            setAmount('');
            setQuantity('');
            setShowModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-purple-500/25"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Ativo / Investimento</span>
        </button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Invested */}
        <div className="cyber-card rounded-2xl p-5 border-purple-500/40 bg-purple-950/20 hud-border-corners">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-widest">// Patrimônio Investido</span>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{formatBRL(metrics.investedTotal)}</div>
          <p className="text-[11px] text-purple-400/80 mt-1 font-mono">
            Total alocado em {investments.length} ativos
          </p>
        </div>

        {/* Estimated Monthly Passive Income */}
        <div className="cyber-card rounded-2xl p-5 border-emerald-500/40 bg-emerald-950/20 hud-border-corners">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-widest">// Renda Passiva Mensal</span>
            <Coins className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono neon-text-emerald">{formatBRL(metrics.estimatedPassiveIncome)}</div>
          <p className="text-[11px] text-emerald-400/80 mt-1 font-mono">
            Estimativa de proventos e juros todo mês
          </p>
        </div>

        {/* Projeção Anual */}
        <div className="cyber-card rounded-2xl p-5 border-cyan-500/40 bg-cyan-950/20 hud-border-corners">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-widest">// Rendimento Anual Projetado</span>
            <DollarSign className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono neon-text-cyan">
            {formatBRL(metrics.estimatedPassiveIncome * 12)}
          </div>
          <p className="text-[11px] text-cyan-400/80 mt-1 font-mono">
            Juros compostos trabalhando por você
          </p>
        </div>
      </div>

      {/* Market Indicators Bar (Selic, CDI, IPCA, Ibov) */}
      <div className="cyber-card rounded-2xl p-4 hud-border-corners">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest">// Indicadores do Mercado Oficial</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {marketIndicators.map((ind) => (
            <div key={ind.id} className="p-3 rounded-xl bg-white/[0.03] border border-cyan-500/20">
              <span className="text-[10px] font-mono text-slate-400 font-semibold">{ind.label}</span>
              <div className="text-base font-black text-white font-mono mt-0.5">
                {ind.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {ind.suffix}
              </div>
              <span className="text-[9px] font-mono text-slate-500 block mt-0.5">{ind.source}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Investments List */}
      <div className="cyber-card rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-white text-sm">Meus Ativos Cadastrados</h3>
          </div>
          <span className="text-xs text-slate-400">{investments.length} posições</span>
        </div>

        {investments.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            Você ainda não cadastrou nenhum investimento. Clique em "+ Novo Ativo" ou escolha uma ideia abaixo!
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {investments.map((inv) => {
              const expectedMonthYield = (inv.amount * (inv.monthlyYield || 0.85)) / 100;

              return (
                <div
                  key={inv.id}
                  className="py-3.5 flex items-center justify-between gap-3 group hover:bg-white/[0.02] px-2 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-black text-purple-300 text-xs shrink-0">
                      {inv.type.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                        <span>{inv.code}</span>
                        {inv.quantity && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-400">
                            {inv.quantity} cotas
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {inv.name || 'Ativo Financeiro'} • Provento: ~{(inv.monthlyYield || 0.85).toFixed(2)}%/mês
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-black text-white">
                        {formatBRL(inv.amount)}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        +{formatBRL(expectedMonthYield)}/mês
                      </div>
                    </div>

                    <button
                      onClick={() => deleteInvestment(inv.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs opacity-70 group-hover:opacity-100 transition-opacity"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Investment Strategy & Ideas */}
      <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-400">
            <Lightbulb className="w-4 h-4" />
            <h3 className="font-bold text-white text-sm">Ideias e Sugestões por Estratégia</h3>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {INVESTMENT_FOCUS.map((f) => (
              <button
                key={f.value}
                onClick={() => setInvestmentFocus(f.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  investmentFocus === f.value
                    ? 'bg-purple-500/30 border-purple-400 text-purple-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {INVESTMENT_IDEAS[investmentFocus].map((idea) => (
            <div
              key={idea.code}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between hover:border-purple-400/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-white text-sm">{idea.code}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold uppercase">
                    {idea.type}
                  </span>
                </div>
                <h5 className="text-xs font-semibold text-slate-300 mb-1">{idea.name}</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed">{idea.reason}</p>
              </div>

              <button
                onClick={() => openNewModalWithIdea(idea)}
                className="mt-3 w-full py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar à Carteira
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/15 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-white text-lg">Novo Investimento</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvestment} className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Ativo</label>
                <select
                  value={type}
                  onChange={(e) => {
                    const t = e.target.value as InvestmentType;
                    setType(t);
                    setYieldPercent(String(ESTIMATED_MONTHLY_YIELD[t] || 0.8));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400"
                >
                  {INVESTMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Código / Ticker</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: XPML11, CDB 100%, PETR4, Tesouro Selic"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs font-bold text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome / Descrição (Opcional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: FII de Shoppings, CDB Banco Inter..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Amount and Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm font-bold text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quantidade / Cotas</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Ex: 10"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm font-bold text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Monthly Yield % */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Rendimento Estimado (% ao mês)</label>
                <input
                  type="number"
                  step="0.01"
                  value={yieldPercent}
                  onChange={(e) => setYieldPercent(e.target.value)}
                  placeholder="Ex: 0.85"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-black shadow-lg shadow-purple-500/25"
                >
                  Salvar Ativo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
