import React, { useState } from 'react';
import {
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  Printer,
  Download,
  Calendar,
  Layers,
  Building2,
  Target,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBRL, formatDateBR, monthKey } from '../../utils/format';
import { CATEGORY_COLORS } from '../../data/categories';
import { useSubscription } from '../../context/SubscriptionContext';
import { Crown, Lock, ShieldCheck, Check, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ReportsScreen() {
  const { user } = useAuth();
  const { isPro, openProModal } = useSubscription();
  const { transactions, metrics, savingGoals, bankAccounts, investments, goals } = useFinance();
  const [activeChartType, setActiveChartType] = useState<'categories' | 'monthly' | 'distribution'>('categories');
  const [filterPeriod, setFilterPeriod] = useState<'all' | '3m' | '6m'>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Group expenses by category
  const expenseByCategory: Record<string, number> = {};
  let totalExpense = 0;

  // Group income by category
  const incomeByCategory: Record<string, number> = {};
  let totalIncome = 0;

  // Group by month
  const monthMap: Record<string, { income: number; expense: number; label: string }> = {};

  transactions.forEach((tx) => {
    if (tx.type === 'expense') {
      expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + tx.amount;
      totalExpense += tx.amount;
    } else {
      incomeByCategory[tx.category] = (incomeByCategory[tx.category] || 0) + tx.amount;
      totalIncome += tx.amount;
    }

    if (tx.date) {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase();
      if (!monthMap[key]) {
        monthMap[key] = { income: 0, expense: 0, label };
      }
      if (tx.type === 'income') {
        monthMap[key].income += tx.amount;
      } else {
        monthMap[key].expense += tx.amount;
      }
    }
  });

  const sortedExpenses = Object.entries(expenseByCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percent: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const sortedIncome = Object.entries(incomeByCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percent: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const monthlyTimeline = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => ({ key, ...data }));

  const maxMonthValue = Math.max(
    ...monthlyTimeline.map((m) => Math.max(m.income, m.expense)),
    100
  );

  // High precision print/PDF generation
  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 250);
  };

  // CSV export
  const handleExportCSV = () => {
    if (!isPro) {
      openProModal();
      return;
    }
    const headers = ['Data', 'Tipo', 'Categoria', 'Valor', 'Conta', 'Observação'];
    const rows = transactions.map((t) => [
      t.date ? formatDateBR(t.date) : '',
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.category,
      t.amount.toFixed(2),
      bankAccounts.find((b) => b.id === t.bankAccountId)?.bankName || 'Geral',
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_financeiro_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Donut calculation
  const getDonutSlices = (items: typeof sortedExpenses, total: number) => {
    let cumulative = 0;
    const colors = [
      '#f97316', '#06b6d4', '#10b981', '#a855f7', '#ec4899',
      '#eab308', '#3b82f6', '#14b8a6', '#f43f5e', '#64748b'
    ];

    return items.slice(0, 8).map((item, idx) => {
      const startAngle = (cumulative / total) * 360;
      cumulative += item.amount;
      const endAngle = (cumulative / total) * 360;

      return {
        ...item,
        color: colors[idx % colors.length],
        startAngle,
        endAngle,
      };
    });
  };

  const donutExpenses = getDonutSlices(sortedExpenses, totalExpense || 1);

  return (
    <>
      {/* ========================================================
          1. ON-SCREEN INTERACTIVE DASHBOARD (HIDDEN ON PRINT)
         ======================================================== */}
      <div className="space-y-6 animate-fade-in print:hidden">
        {/* Top Header & Export Toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-cyan-500/15">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Relatórios & Gráficos Financeiros
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono font-bold">
                PDF EXPORT
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Análise detalhada de fluxo de caixa, distribuição por categorias e evolução mensal
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Exportar CSV</span>
              {!isPro && (
                <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 ml-0.5">
                  PRO
                </span>
              )}
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-2 transition active:scale-95 shadow-lg shadow-cyan-500/25"
            >
              <Printer className="w-4 h-4" />
              <span>{isExporting ? 'Preparando...' : 'Exportar Relatório em PDF'}</span>
              {!isPro && (
                <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 ml-0.5 shadow">
                  PRO
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Snapshot Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="cyber-card rounded-2xl p-4 border-emerald-500/30 bg-emerald-950/20 hud-border-corners">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
              // Total Entradas
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1 neon-text-emerald">
              {formatBRL(totalIncome)}
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-1 block">
              {sortedIncome.length} categorias cadastradas
            </span>
          </div>

          <div className="cyber-card rounded-2xl p-4 border-orange-500/30 bg-orange-950/20 hud-border-corners">
            <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-wider block">
              // Total Saídas
            </span>
            <div className="text-xl sm:text-2xl font-black text-orange-400 font-mono mt-1">
              {formatBRL(totalExpense)}
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-1 block">
              {sortedExpenses.length} categorias de gastos
            </span>
          </div>

          <div className="cyber-card rounded-2xl p-4 border-cyan-500/30 bg-cyan-950/20 hud-border-corners">
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
              // Resultado Líquido
            </span>
            <div
              className={`text-xl sm:text-2xl font-black font-mono mt-1 ${
                totalIncome - totalExpense >= 0
                  ? 'text-cyan-400 neon-text-cyan'
                  : 'text-rose-400'
              }`}
            >
              {formatBRL(totalIncome - totalExpense)}
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-1 block">
              Saldo acumulado do período
            </span>
          </div>

          <div className="cyber-card rounded-2xl p-4 border-amber-500/30 bg-amber-950/20 hud-border-corners">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
              // Taxa de Poupança
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-1 neon-text-gold">
              {metrics.savingsRate.toFixed(0)}%
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-1 block">
              Da renda total convertida em saldo
            </span>
          </div>
        </div>

        {/* Interactive Charts Section */}
        <div className="cyber-card rounded-3xl p-5 sm:p-6 space-y-6">
          {/* Chart Selector Tab Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-black text-white font-mono">
                Visualização Gráfica
              </h3>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveChartType('categories')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeChartType === 'categories'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PieChartIcon className="w-3.5 h-3.5" />
                <span>Categorias</span>
              </button>
              <button
                onClick={() => setActiveChartType('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeChartType === 'monthly'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Evolução Mensal</span>
              </button>
            </div>
          </div>

          {/* Chart View 1: Categorias (Donut & Barra) */}
          {activeChartType === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* SVG Interactive Donut */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-4">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      className="stroke-slate-800 fill-none"
                      strokeWidth="16"
                    />
                    {totalExpense > 0 &&
                      donutExpenses.map((slice, i) => {
                        const circumference = 2 * Math.PI * 38;
                        const strokeDasharray = `${(slice.amount / totalExpense) * circumference} ${circumference}`;
                        const strokeDashoffset = -((slice.startAngle / 360) * circumference);

                        return (
                          <circle
                            key={i}
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke={slice.color}
                            strokeWidth="15"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-700 hover:stroke-[17] cursor-pointer"
                          />
                        );
                      })}
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                      Despesas
                    </span>
                    <span className="text-sm sm:text-base font-black text-white font-mono">
                      {formatBRL(totalExpense)}
                    </span>
                    <span className="text-[9px] font-mono text-cyan-400">
                      {sortedExpenses.length} grupos
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-sm">
                  {donutExpenses.map((slice, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-[11px] font-mono text-slate-300">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span>{slice.category}: {slice.percent.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Ranking Horizontal Bars */}
              <div className="lg:col-span-7 space-y-3">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  // Detalhamento e Peso das Despesas
                </h4>
                {sortedExpenses.length === 0 ? (
                  <p className="text-xs text-slate-500">Nenhum gasto registrado para gerar gráfico.</p>
                ) : (
                  <div className="space-y-2.5">
                    {sortedExpenses.slice(0, 6).map((item, idx) => {
                      const style = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Outros'];
                      return (
                        <div key={idx} className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 font-bold text-white">
                              <span>{style.emoji}</span>
                              <span>{item.category}</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-slate-400 text-[11px]">
                                {item.percent.toFixed(1)}%
                              </span>
                              <span className="text-orange-400 font-bold">
                                {formatBRL(item.amount)}
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chart View 2: Evolução Mensal */}
          {activeChartType === 'monthly' && (
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                // Comparativo Mensal: Entradas vs Saídas
              </h4>

              {monthlyTimeline.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">Nenhum dado com data para timeline mensal.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-end gap-3 sm:gap-6 h-56 pt-6 px-2 border-b border-white/10">
                    {monthlyTimeline.map((item, idx) => {
                      const incHeight = maxMonthValue > 0 ? (item.income / maxMonthValue) * 100 : 0;
                      const expHeight = maxMonthValue > 0 ? (item.expense / maxMonthValue) * 100 : 0;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                          <div className="flex items-end gap-1.5 w-full justify-center h-40">
                            <div
                              style={{ height: `${Math.max(incHeight, 4)}%` }}
                              className="w-1/2 max-w-[28px] rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-400 transition-all group-hover:brightness-125 relative"
                              title={`Receitas: ${formatBRL(item.income)}`}
                            />
                            <div
                              style={{ height: `${Math.max(expHeight, 4)}%` }}
                              className="w-1/2 max-w-[28px] rounded-t-md bg-gradient-to-t from-rose-600 to-orange-400 transition-all group-hover:brightness-125 relative"
                              title={`Despesas: ${formatBRL(item.expense)}`}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 font-bold whitespace-nowrap">
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-center gap-6 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-emerald-500" />
                      <span className="text-slate-300">Receitas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-rose-500" />
                      <span className="text-slate-300">Despesas</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detailed Tables for On-Screen Review */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receitas por Categoria */}
          <div className="cyber-card rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base font-mono">
                  Receitas por Categoria
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {formatBRL(totalIncome)}
              </span>
            </div>

            {sortedIncome.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">Nenhuma receita registrada.</div>
            ) : (
              <div className="space-y-2.5">
                {sortedIncome.map((item, idx) => {
                  const style = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Outros'];
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{style.emoji}</span>
                          <span className="font-bold text-white">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-400 text-[11px]">{item.percent.toFixed(1)}%</span>
                          <strong className="text-emerald-400">{formatBRL(item.amount)}</strong>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Patrimônio e Metas */}
          <div className="cyber-card rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base font-mono">
                  Alocação e Metas Ativas
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                {savingGoals.length} Metas
              </span>
            </div>

            {savingGoals.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">Nenhuma meta configurada ainda.</div>
            ) : (
              <div className="space-y-3">
                {savingGoals.map((goal) => {
                  const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                  return (
                    <div key={goal.id} className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-white">
                          <span>{goal.emoji || '🎯'}</span>
                          <span>{goal.name}</span>
                        </div>
                        <span className="font-mono text-amber-400 font-bold">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Atual: {formatBRL(goal.currentAmount)}</span>
                        <span>Alvo: {formatBRL(goal.targetAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          2. DEDICATED AUDITED CORPORATE REPORT (PRINT & PDF ONLY)
         ======================================================== */}
      <div className="hidden print:block w-full text-slate-900 bg-white space-y-6 text-xs font-sans">
        {/* Executive Header */}
        <div className="border-b-2 border-slate-900 pb-4">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black tracking-widest text-slate-800 uppercase font-mono">
                  MINHAS FINANÇAS • CONTROLE PATRIMONIAL
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-slate-100 border border-slate-400 text-slate-800 font-bold font-mono">
                  DEMONSTRATIVO CONSOLIDADO
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight mt-1.5 uppercase">
                Relatório Financeiro & de Fluxo de Caixa
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Demonstrativo oficial de receitas, despesas, alocação por categorias, bancos e investimentos
              </p>
            </div>

            <div className="text-right text-xs font-mono border-l-2 border-slate-300 pl-4 space-y-0.5 shrink-0">
              <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Data de Emissão</div>
              <div className="font-bold text-slate-950">
                {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-[11px] text-slate-700 font-medium">
                {user?.displayName || user?.email || 'Titular da Conta'}
              </div>
              <div className="text-[9px] text-slate-400">
                Doc Ref: MF-{Date.now().toString(36).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* 1. Indicadores Principais de Desempenho */}
        <div className="print-avoid-break">
          <h2 className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-2 flex items-center gap-1.5">
            <span>1.</span> Indicadores Principais de Desempenho (Consolidado)
          </h2>
          <div className="grid grid-cols-4 gap-3">
            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-600 block">
                Total de Receitas
              </span>
              <div className="text-lg font-black font-mono text-emerald-800 mt-1">
                {formatBRL(totalIncome)}
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">
                {sortedIncome.length} categorias cadastradas
              </span>
            </div>

            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-600 block">
                Total de Despesas
              </span>
              <div className="text-lg font-black font-mono text-rose-800 mt-1">
                {formatBRL(totalExpense)}
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">
                {sortedExpenses.length} categorias cadastradas
              </span>
            </div>

            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-600 block">
                Resultado Líquido
              </span>
              <div className={`text-lg font-black font-mono mt-1 ${totalIncome - totalExpense >= 0 ? 'text-blue-800' : 'text-rose-800'}`}>
                {formatBRL(totalIncome - totalExpense)}
              </div>
              <span className="text-[9px] text-slate-600 font-mono mt-0.5 block font-bold">
                {totalIncome - totalExpense >= 0 ? 'Superávit no período' : 'Déficit no período'}
              </span>
            </div>

            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-600 block">
                Saldo Geral em Contas
              </span>
              <div className="text-lg font-black font-mono text-slate-900 mt-1">
                {formatBRL(metrics.balance)}
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">
                Poupança: {metrics.savingsRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* 2. Saldos por Conta Bancária & Carteira */}
        <div className="print-avoid-break">
          <h2 className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-2 flex items-center gap-1.5">
            <span>2.</span> Saldos por Conta Bancária e Carteira
          </h2>
          <table className="w-full text-left text-xs border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-mono text-[11px]">
                <th className="py-2 px-3">Instituição / Conta</th>
                <th className="py-2 px-3">Tipo de Conta</th>
                <th className="py-2 px-3 text-right">Saldo Atual (R$)</th>
                <th className="py-2 px-3 text-right">Participação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bankAccounts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-3 text-center text-slate-500">
                    Nenhuma conta bancária registrada.
                  </td>
                </tr>
              ) : (
                bankAccounts.map((b) => {
                  const pct = metrics.bankBalance > 0 ? (b.balance / metrics.bankBalance) * 100 : 0;
                  return (
                    <tr key={b.id}>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {b.bankName} {b.nickname ? `(${b.nickname})` : ''}
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                        {b.accountType === 'checking' ? 'Conta Corrente' : b.accountType === 'savings' ? 'Poupança / Reserva' : b.accountType === 'credit-card' ? 'Cartão de Crédito' : 'Carteira Digital'}
                      </td>
                      <td className={`py-2 px-3 text-right font-mono font-bold ${b.balance >= 0 ? 'text-slate-900' : 'text-rose-700'}`}>
                        {formatBRL(b.balance)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        {pct > 0 ? `${pct.toFixed(1)}%` : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 font-mono">
                <td colSpan={2} className="py-2 px-3 text-slate-900">
                  Total Consolidado em Bancos
                </td>
                <td className="py-2 px-3 text-right text-slate-950 font-black">
                  {formatBRL(metrics.bankBalance)}
                </td>
                <td className="py-2 px-3 text-right text-slate-600">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 3. Detalhamento de Despesas por Categoria */}
        <div className="print-avoid-break">
          <h2 className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-2 flex items-center gap-1.5">
            <span>3.</span> Detalhamento de Despesas por Categoria
          </h2>
          <table className="w-full text-left text-xs border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-mono text-[11px]">
                <th className="py-2 px-3">Categoria</th>
                <th className="py-2 px-3 text-right">Valor Total (R$)</th>
                <th className="py-2 px-3 text-right">Participação (%)</th>
                <th className="py-2 px-3 w-48">Proporção Visual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-3 text-center text-slate-500">
                    Nenhuma despesa registrada.
                  </td>
                </tr>
              ) : (
                sortedExpenses.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="py-2 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{CATEGORY_COLORS[item.category]?.emoji || '🏷️'}</span>
                      <span>{item.category}</span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-950">
                      {formatBRL(item.amount)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {item.percent.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3">
                      <div className="w-full h-2.5 rounded bg-slate-200 overflow-hidden border border-slate-300">
                        <div
                          className="h-full bg-slate-800 rounded-sm"
                          style={{ width: `${Math.min(item.percent, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 font-mono">
                <td className="py-2 px-3 text-slate-900">Total Geral de Despesas</td>
                <td className="py-2 px-3 text-right text-rose-800 font-black">{formatBRL(totalExpense)}</td>
                <td className="py-2 px-3 text-right">100%</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 4. Histórico Mensal */}
        <div className="print-avoid-break">
          <h2 className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-2 flex items-center gap-1.5">
            <span>4.</span> Evolução Mensal do Fluxo de Caixa
          </h2>
          <table className="w-full text-left text-xs border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-mono text-[11px]">
                <th className="py-2 px-3">Mês / Período</th>
                <th className="py-2 px-3 text-right">Receitas (R$)</th>
                <th className="py-2 px-3 text-right">Despesas (R$)</th>
                <th className="py-2 px-3 text-right">Saldo do Mês (R$)</th>
                <th className="py-2 px-3 text-center">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {monthlyTimeline.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-3 text-center text-slate-500">
                    Nenhum histórico mensal registrado.
                  </td>
                </tr>
              ) : (
                monthlyTimeline.map((item, idx) => {
                  const net = item.income - item.expense;
                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="py-2 px-3 font-bold font-mono text-slate-900">
                        {item.label}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-800 font-bold">
                        {formatBRL(item.income)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-rose-800 font-bold">
                        {formatBRL(item.expense)}
                      </td>
                      <td className={`py-2 px-3 text-right font-mono font-black ${net >= 0 ? 'text-blue-900' : 'text-rose-800'}`}>
                        {formatBRL(net)}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-[10px]">
                        <span className={`px-2 py-0.5 rounded font-bold border ${net >= 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'}`}>
                          {net >= 0 ? 'SUPERÁVIT' : 'DÉFICIT'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Carteira de Investimentos (se houver) */}
        {investments.length > 0 && (
          <div className="print-avoid-break">
            <h2 className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-2 flex items-center gap-1.5">
              <span>5.</span> Carteira de Investimentos e Ativos
            </h2>
            <table className="w-full text-left text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-mono text-[11px]">
                  <th className="py-2 px-3">Código / Ativo</th>
                  <th className="py-2 px-3">Classe</th>
                  <th className="py-2 px-3 text-right">Qtd</th>
                  <th className="py-2 px-3 text-right">Preço Médio</th>
                  <th className="py-2 px-3 text-right">Total Aplicado (R$)</th>
                  <th className="py-2 px-3 text-right">Renda Mensal Est.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {investments.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2 px-3 font-bold text-slate-900 font-mono">
                      {inv.code} {inv.name ? `— ${inv.name}` : ''}
                    </td>
                    <td className="py-2 px-3 uppercase text-slate-600 font-mono text-[10px]">
                      {inv.type}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {inv.quantity ?? 1}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {formatBRL(inv.averagePrice ?? inv.currentPrice ?? (inv.quantity ? inv.amount / inv.quantity : inv.amount))}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatBRL(inv.amount)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-800 font-bold">
                      {inv.monthlyYield ? `+${formatBRL((inv.amount * inv.monthlyYield) / 100)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 font-mono">
                  <td colSpan={4} className="py-2 px-3 text-slate-900">Total Investido em Ativos</td>
                  <td className="py-2 px-3 text-right text-slate-950 font-black">{formatBRL(metrics.investedTotal)}</td>
                  <td className="py-2 px-3 text-right text-emerald-800 font-black">{formatBRL(metrics.estimatedPassiveIncome)}/mês</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* 6. Metas da Jornada de Economia */}
        <div className="print-avoid-break">
          <h2 className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-2 flex items-center gap-1.5">
            <span>{investments.length > 0 ? '6.' : '5.'}</span> Metas da Jornada de Economia
          </h2>
          <table className="w-full text-left text-xs border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-mono text-[11px]">
                <th className="py-2 px-3">Meta / Objetivo</th>
                <th className="py-2 px-3 text-right">Alvo (R$)</th>
                <th className="py-2 px-3 text-right">Poupado (R$)</th>
                <th className="py-2 px-3 text-right">Progresso</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {savingGoals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-3 text-center text-slate-500">
                    Nenhuma meta cadastrada no momento.
                  </td>
                </tr>
              ) : (
                savingGoals.map((goal) => {
                  const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                  return (
                    <tr key={goal.id}>
                      <td className="py-2 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{goal.emoji || '🎯'}</span>
                        <span>{goal.name}</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">
                        {formatBRL(goal.targetAmount)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-amber-800">
                        {formatBRL(goal.currentAmount)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-950">
                        {pct.toFixed(0)}%
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-[10px]">
                        <span className={`px-2 py-0.5 rounded font-bold border ${pct >= 100 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-50 text-slate-700 border-slate-300'}`}>
                          {pct >= 100 ? 'CONCLUÍDO' : 'EM ANDAMENTO'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 7. Extrato Detalhado dos Lançamentos (sem truncar textos!) */}
        <div className="print-avoid-break">
          <h2 className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-2 flex items-center gap-1.5">
            <span>{investments.length > 0 ? '7.' : '6.'}</span> Extrato dos Lançamentos Registrados ({Math.min(transactions.length, 50)} de {transactions.length})
          </h2>
          <table className="w-full text-left text-xs border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-mono text-[10px]">
                <th className="py-1.5 px-2">Data</th>
                <th className="py-1.5 px-2">Tipo</th>
                <th className="py-1.5 px-2">Categoria</th>
                <th className="py-1.5 px-2">Descrição / Observação</th>
                <th className="py-1.5 px-2">Conta</th>
                <th className="py-1.5 px-2 text-right">Valor (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-3 text-center text-slate-500">
                    Nenhum lançamento registrado.
                  </td>
                </tr>
              ) : (
                transactions.slice(0, 50).map((t) => {
                  const bank = bankAccounts.find((b) => b.id === t.bankAccountId)?.bankName || 'Geral';
                  return (
                    <tr key={t.id}>
                      <td className="py-1.5 px-2 font-mono text-slate-700 whitespace-nowrap">
                        {t.date ? formatDateBR(t.date) : '-'}
                      </td>
                      <td className="py-1.5 px-2 font-mono text-[9px]">
                        <span className={`px-1.5 py-0.5 rounded font-bold border ${t.type === 'income' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'}`}>
                          {t.type === 'income' ? 'ENTRADA' : 'SAÍDA'}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 font-bold text-slate-900 whitespace-nowrap">
                        {t.category}
                      </td>
                      <td className="py-1.5 px-2 text-slate-800 break-words">
                        {t.note || '-'}
                      </td>
                      <td className="py-1.5 px-2 text-slate-600 whitespace-nowrap">
                        {bank}
                      </td>
                      <td className={`py-1.5 px-2 text-right font-mono font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-800' : 'text-rose-800'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatBRL(t.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Corporate Legal & Audited Footer */}
        <div className="pt-6 border-t-2 border-slate-300 text-center text-[10px] text-slate-500 font-mono space-y-1 print-avoid-break">
          <p className="font-semibold text-slate-700">
            Documento emitido para simples conferência e planejamento financeiro pessoal.
          </p>
          <p className="text-slate-500">
            Minhas Finanças • Controle Financeiro Pessoal & Investimentos • Documento Gerado em {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </>
  );
}
