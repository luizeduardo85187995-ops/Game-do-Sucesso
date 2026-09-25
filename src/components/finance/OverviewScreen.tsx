import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Target,
  Sparkles,
  Building2,
  ChevronRight,
  PieChart,
  Gamepad2,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Radio,
  Zap,
  Activity,
  ShieldCheck,
  Bot,
  Crown,
  Compass,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBRL, formatDateBR } from '../../utils/format';
import { CATEGORY_COLORS } from '../../data/categories';
import SmartQuickLauncher from './SmartQuickLauncher';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogo } from '../icons/GoogleLogo';
import { useSettings } from '../../context/SettingsContext';
import { useSubscription } from '../../context/SubscriptionContext';

interface OverviewScreenProps {
  onNavigateToGame: (goalId?: string) => void;
  onOpenNewTransaction: (type?: 'income' | 'expense') => void;
  onNavigateToTab: (tab: string) => void;
}

export default function OverviewScreen({
  onNavigateToGame,
  onOpenNewTransaction,
  onNavigateToTab,
}: OverviewScreenProps) {
  const {
    metrics,
    transactions,
    bankAccounts,
    savingGoals,
    activeGoalId,
    goals,
  } = useFinance();
  const { formatMoney } = useSettings();

  const activeGoal = savingGoals.find((g) => g.id === activeGoalId) || savingGoals[0];
  const goalPercent = activeGoal
    ? Math.min(100, (activeGoal.currentAmount / activeGoal.targetAmount) * 100)
    : 0;

  const recentTransactions = transactions.slice(0, 5);
  const { user } = useAuth();
  const { isPro, openProModal } = useSubscription();

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Google Account Welcome Badge if connected or CTA if not */}
      {user ? (
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md shadow-emerald-500/5">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Usuário'}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-xl border border-emerald-400 object-cover shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0">
                {user.displayName?.charAt(0) || 'G'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  Olá, {user.displayName || user.email}!
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold">
                  CONTA GOOGLE ATIVA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Sua sessão está autenticada via Firebase OAuth 2.0
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('google')}
            className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 transition"
          >
            <span>Gerenciar conta</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <GoogleLogo className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                Sincronize seu perfil financeiro com a Conta Google
              </span>
              <p className="text-[11px] text-slate-400">
                Acesso com 1 clique, sem precisar memorizar senhas.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('google')}
            className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition flex items-center gap-2 shadow-sm shrink-0 active:scale-95"
          >
            <GoogleLogo className="w-3.5 h-3.5" />
            <span>Entrar com Google</span>
          </button>
        </div>
      )}

      {/* Top Command Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-cyan-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border dark:border-cyan-400/30 flex items-center justify-center shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Visão Geral Financeira
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-400/30 dark:text-emerald-300 text-[10px] font-bold tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Atualizado
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Controle integrado de receitas, despesas, saldos bancários e metas
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigateToTab('ai')}
            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 dark:bg-gradient-to-r dark:from-cyan-500/25 dark:to-blue-600/25 dark:hover:from-cyan-500/35 dark:border-cyan-400/60 dark:text-cyan-200 text-xs font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95"
          >
            <Bot className="w-4 h-4 text-blue-600 dark:text-cyan-300" />
            <span>Dante (IA)</span>
          </button>
          <button
            onClick={() => onOpenNewTransaction('income')}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>+ Receita</span>
          </button>
          <button
            onClick={() => onOpenNewTransaction('expense')}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>- Despesa</span>
          </button>
          <button
            onClick={() => onNavigateToGame()}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Compass className="w-4 h-4" />
            <span>Jornada da Meta</span>
          </button>
        </div>
      </div>

      {/* Auto-Lançador por Linguagem Natural */}
      <SmartQuickLauncher />

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Saldo Consolidado */}
        <div className="cyber-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Saldo em Contas
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 dark:bg-cyan-500/20 dark:border dark:border-cyan-400/30 dark:text-cyan-300 flex items-center justify-center shadow-sm">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
            {formatBRL(metrics.balance)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-cyan-400/80 mt-1 flex items-center gap-1 font-mono">
            <Zap className="w-3 h-3 text-blue-500 dark:text-cyan-400" />
            <span>{bankAccounts.length} {bankAccounts.length === 1 ? 'instituição ativa' : 'instituições ativas'}</span>
          </div>
        </div>

        {/* Entradas do Mês */}
        <div className="cyber-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400/90 uppercase tracking-wider">
              Entradas do Mês
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:border dark:border-emerald-400/40 dark:text-emerald-300 flex items-center justify-center shadow-sm">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
            {formatBRL(metrics.monthIncome)}
          </div>
          <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/70 mt-1 font-mono font-medium">
            Receitas Confirmadas
          </div>
        </div>

        {/* Saídas do Mês */}
        <div className="cyber-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rose-700 dark:text-orange-400/90 uppercase tracking-wider">
              Saídas do Mês
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 dark:bg-orange-500/20 dark:border dark:border-orange-400/40 dark:text-orange-300 flex items-center justify-center shadow-sm">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-orange-400 tracking-tight font-mono">
            {formatBRL(metrics.monthExpense)}
          </div>
          <div className="text-[11px] text-rose-700/80 dark:text-orange-400/70 mt-1 font-mono font-medium">
            Despesas do Período
          </div>
        </div>

        {/* Resultado Líquido */}
        <div className="cyber-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Resultado Líquido
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
              metrics.monthNet >= 0
                ? 'bg-emerald-50 text-emerald-700 dark:bg-cyan-500/20 dark:border dark:border-cyan-400/40 dark:text-cyan-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:border dark:border-rose-400/40 dark:text-rose-300'
            }`}>
              {metrics.monthNet >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-black tracking-tight font-mono ${
            metrics.monthNet >= 0 ? 'text-emerald-600 dark:text-cyan-300' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatBRL(metrics.monthNet)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-mono">
            <span>Taxa de Poupança: <strong className="text-amber-600 dark:text-amber-400 font-bold">{metrics.savingsRate.toFixed(0)}%</strong></span>
          </div>
        </div>
      </div>

      {/* Goal Journey Banner */}
      <div className="relative rounded-3xl p-5 sm:p-6 cyber-card-gold overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl shrink-0 shadow-lg shadow-amber-500/20">
              {activeGoal ? activeGoal.emoji : '🎯'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Compass className="w-3 h-3" /> Jornada da Meta Ativa
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Progresso em Tempo Real</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 group-hover:text-amber-700 dark:group-hover:text-amber-200 transition-colors">
                {activeGoal ? activeGoal.name : 'Selecione uma Meta para Acompanhar'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Economize para avançar degrau a degrau rumo ao seu objetivo patrimonial
              </p>
            </div>
          </div>

          {/* Progress gauge and action button */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
            {activeGoal && (
              <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-amber-400/30 rounded-2xl p-3 min-w-[200px] shadow-sm">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Progresso</span>
                  <span className="text-amber-700 dark:text-amber-400 font-bold">{goalPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                    style={{ width: `${goalPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1.5">
                  <span>{formatBRL(activeGoal.currentAmount)}</span>
                  <span>Alvo: {formatBRL(activeGoal.targetAmount)}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => onNavigateToGame(activeGoal?.id)}
              className="py-3 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm transition-all shadow-md hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group/btn"
            >
              <Compass className="w-4 h-4 group-hover/btn:rotate-45 transition-transform" />
              <span>ACOMPANHAR META</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Middle Grid: Banks & Asset Portfolio Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bank Accounts & Liquidity */}
        <div className="lg:col-span-2 cyber-card rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-base">Instituições & Liquidez</h3>
            </div>

            <button
              onClick={() => onNavigateToTab('banks')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 group"
            >
              <span>Ver todas</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bankAccounts.map((acc) => {
              const isCredit = acc.accountType === 'credit-card';
              return (
                <div
                  key={acc.id}
                  className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-400/40 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                      {isCredit ? '💳' : acc.accountType === 'wallet' ? '💵' : '🏦'}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs leading-tight group-hover:text-cyan-300 transition-colors">
                        {acc.bankName}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {acc.nickname || (isCredit ? 'Fatura' : 'Corrente')}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-xs sm:text-sm font-black font-mono ${isCredit ? 'text-orange-400' : 'text-white'}`}>
                      {formatBRL(acc.balance)}
                    </div>
                    <span className="text-[9px] text-slate-500 uppercase">
                      {isCredit ? 'A Pagar' : 'Disponível'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Investment Snapshot */}
        <div className="cyber-card rounded-3xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <PieChart className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-base">Carteira de Ativos</h3>
              </div>
              <button
                onClick={() => onNavigateToTab('investments')}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
              >
                Gerenciar
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Patrimônio Alocado</span>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {formatBRL(metrics.investedTotal)}
              </div>
              <div className="text-[11px] text-purple-300/90 mt-2 flex items-center justify-between border-t border-purple-500/20 pt-2 font-mono">
                <span>Renda Passiva Mensal:</span>
                <strong className="text-emerald-400">+{formatBRL(metrics.estimatedPassiveIncome)}/mês</strong>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Dividendos e juros geram fluxo de caixa contínuo para financiar seus aportes de escalada.
            </p>
          </div>

          <button
            onClick={() => onNavigateToTab('investments')}
            className="w-full py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all"
          >
            Ver Detalhes dos Ativos (FIIs, Ações)
          </button>
        </div>
      </div>

      {/* Recent Ledger Transactions */}
      <div className="cyber-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Lançamentos Recentes</h3>
          </div>

          <button
            onClick={() => onNavigateToTab('transactions')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 group"
          >
            <span>Ver Extrato Completo</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-2xl bg-white/[0.02] border border-dashed border-cyan-500/20">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 mx-auto flex items-center justify-center mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <h5 className="font-bold text-white text-sm">Aplicativo Zerado e Pronto!</h5>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 font-mono">
              Nenhuma movimentação registrada. Toque em "+ Receita" ou "- Despesa" acima para lançar seus dados reais.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentTransactions.map((tx) => {
              const isInc = tx.type === 'income';
              const catStyle = CATEGORY_COLORS[tx.category] || CATEGORY_COLORS['Outros'];

              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-white/[0.02] px-2 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                        isInc
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                          : 'bg-orange-500/15 border border-orange-500/30 text-orange-400'
                      }`}
                    >
                      {catStyle.emoji}
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-xs sm:text-sm">{tx.note || tx.category}</h5>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{formatDateBR(tx.date)}</span>
                        <span>•</span>
                        <span>{tx.category}</span>
                        {tx.bankAccountId && (
                          <>
                            <span>•</span>
                            <span className="text-slate-300 font-medium">
                              {bankAccounts.find((b) => b.id === tx.bankAccountId)?.bankName || 'Banco'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xs sm:text-sm font-black font-mono ${
                        isInc ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {isInc ? '+' : '-'} {formatBRL(tx.amount)}
                    </div>
                    <span className="text-[10px] text-emerald-400/80 uppercase font-mono">
                      Efetivado
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VIP PRO Upgrade Banner for Free Users */}
      {!isPro && (
        <div className="rounded-3xl bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 border border-amber-500/30 p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/30 shrink-0">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-black text-white">Desbloqueie o NEO-FINANCE VIP PRO</h4>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  PIX INSTANTÂNEO
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Zero anúncios, Dante IA sem limites, importação B3 e radar de proventos por apenas R$ 9,99/mês.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openProModal}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 shrink-0"
          >
            <Crown className="w-4 h-4" />
            <span>Assinar VIP PRO</span>
          </button>
        </div>
      )}
    </div>
  );
}
