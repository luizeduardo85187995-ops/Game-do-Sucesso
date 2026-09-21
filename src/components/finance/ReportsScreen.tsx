import React, { useState } from 'react';
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  Printer,
  Calendar,
  DollarSign,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBRL, formatDateBR, monthKey } from '../../utils/format';
import { CATEGORY_COLORS } from '../../data/categories';

export default function ReportsScreen() {
  const { transactions, metrics, savingGoals, bankAccounts, investments } = useFinance();

  // Category breakdown for expenses
  const expenseByCategory: Record<string, number> = {};
  let totalExpense = 0;

  for (const tx of transactions) {
    if (tx.type === 'expense') {
      expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + tx.amount;
      totalExpense += tx.amount;
    }
  }

  const sortedExpenses = Object.entries(expenseByCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percent: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Category breakdown for income
  const incomeByCategory: Record<string, number> = {};
  let totalIncome = 0;

  for (const tx of transactions) {
    if (tx.type === 'income') {
      incomeByCategory[tx.category] = (incomeByCategory[tx.category] || 0) + tx.amount;
      totalIncome += tx.amount;
    }
  }

  const sortedIncome = Object.entries(incomeByCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percent: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Relatórios Financeiros</h2>
          <p className="text-xs text-slate-400">Distribuição de despesas, receitas e fluxo patrimonial</p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
        >
          <Printer className="w-4 h-4 text-cyan-400" />
          <span>Imprimir / Gerar PDF</span>
        </button>
      </div>

      {/* Snapshot Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="cyber-card rounded-2xl p-4 border-emerald-500/30 bg-emerald-950/20 hud-border-corners">
          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">// Total Entradas</span>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1 neon-text-emerald">{formatBRL(totalIncome)}</div>
          <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">{sortedIncome.length} fontes</span>
        </div>

        <div className="cyber-card rounded-2xl p-4 border-orange-500/30 bg-orange-950/20 hud-border-corners">
          <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-wider">// Total Saídas</span>
          <div className="text-xl font-black text-orange-400 font-mono mt-1">{formatBRL(totalExpense)}</div>
          <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">{sortedExpenses.length} categorias</span>
        </div>

        <div className="cyber-card rounded-2xl p-4 border-cyan-500/30 bg-cyan-950/20 hud-border-corners">
          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">// Resultado Acumulado</span>
          <div className={`text-xl font-black font-mono mt-1 ${totalIncome - totalExpense >= 0 ? 'text-cyan-400 neon-text-cyan' : 'text-rose-400'}`}>
            {formatBRL(totalIncome - totalExpense)}
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">Líquido</span>
        </div>

        <div className="cyber-card rounded-2xl p-4 border-amber-500/30 bg-amber-950/20 hud-border-corners">
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">// Taxa de Poupança</span>
          <div className="text-xl font-black text-amber-400 font-mono mt-1 neon-text-gold">{metrics.savingsRate.toFixed(0)}%</div>
          <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">Da renda retida</span>
        </div>
      </div>

      {/* Main Breakdown: Expenses by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses List */}
        <div className="cyber-card rounded-3xl p-6 space-y-4 hud-border-corners">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-orange-400" />
              <h3 className="font-bold text-white text-base font-mono">// Despesas por Categoria</h3>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400">{formatBRL(totalExpense)}</span>
          </div>

          {sortedExpenses.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">Nenhuma despesa registrada.</div>
          ) : (
            <div className="space-y-3.5">
              {sortedExpenses.map((item) => {
                const style = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Outros'];
                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{style.emoji}</span>
                        <span className="font-bold text-white">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{item.percent.toFixed(1)}%</span>
                        <strong className="text-orange-400">{formatBRL(item.amount)}</strong>
                      </div>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Incomes Breakdown */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Receitas por Categoria</h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">{formatBRL(totalIncome)}</span>
          </div>

          {sortedIncome.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">Nenhuma receita registrada.</div>
          ) : (
            <div className="space-y-3.5">
              {sortedIncome.map((item) => {
                const style = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Outros'];
                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{style.emoji}</span>
                        <span className="font-bold text-white">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{item.percent.toFixed(1)}%</span>
                        <strong className="text-emerald-400">{formatBRL(item.amount)}</strong>
                      </div>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
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
    </div>
  );
}
