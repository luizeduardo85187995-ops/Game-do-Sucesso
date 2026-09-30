import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Table,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBRL, formatDateBR } from '../../utils/format';
import { CATEGORY_COLORS, getCategoryMeta } from '../../data/categories';
import { exportExcelWithCharts, exportCSVForExcel } from '../../services/spreadsheetExportService';

interface SpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SpreadsheetModal({ isOpen, onClose }: SpreadsheetModalProps) {
  const { transactions, bankAccounts, expenseCategories, incomeCategories } = useFinance();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Totais
  const totalIncome = useMemo(
    () => transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalExpense = useMemo(
    () => transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, (netBalance / totalIncome) * 100) : 0;

  // Despesas agrupadas por categoria
  const expenseBreakdown = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = t.category || 'Outros';
        if (!map[cat]) map[cat] = { total: 0, count: 0 };
        map[cat].total += t.amount;
        map[cat].count += 1;
      });

    return Object.entries(map)
      .map(([cat, data]) => ({
        category: cat,
        amount: data.total,
        count: data.count,
        percent: totalExpense > 0 ? (data.total / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, totalExpense]);

  // Evolução Mensal
  const monthlyTimeline = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((t) => {
      const cleanDate = t.date ? (t.date.includes('T') ? t.date.split('T')[0] : t.date) : '';
      const mKey = cleanDate.slice(0, 7) || 'Outros';
      if (!map[mKey]) map[mKey] = { income: 0, expense: 0 };
      if (t.type === 'income') map[mKey].income += t.amount;
      else map[mKey].expense += t.amount;
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({ key, ...data }));
  }, [transactions]);

  // Transações filtradas para a grade
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatDateBR(t.date).includes(searchTerm);

      const matchesType =
        selectedType === 'all' ? true : t.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [transactions, searchTerm, selectedType]);

  const handleDownloadExcel = async () => {
    setIsExportingExcel(true);
    try {
      await exportExcelWithCharts(transactions, bankAccounts, expenseCategories, incomeCategories);
      setExportSuccessMsg('Planilha Excel (.xlsx) com gráficos baixada com sucesso!');
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (e) {
      console.error('Erro ao exportar Excel:', e);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleDownloadCSV = () => {
    setIsExportingCSV(true);
    try {
      exportCSVForExcel(transactions, bankAccounts);
      setExportSuccessMsg('Arquivo CSV compatível com Excel Brasil baixado com sucesso!');
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (e) {
      console.error('Erro ao exportar CSV:', e);
    } finally {
      setIsExportingCSV(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden hud-border-corners text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/30 shrink-0">
              <FileSpreadsheet className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white font-mono tracking-tight">
                  Planilha Financeira &amp; Dashboard com Gráficos
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold uppercase">
                  Excel Multi-Abas
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Visualize seus dados estruturados com gráficos ou baixe em formato Excel nativo (.xlsx)
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <button
              onClick={handleDownloadExcel}
              disabled={isExportingExcel}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-500/25 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingExcel ? 'Gerando...' : 'Baixar Excel (.xlsx)'}</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              disabled={isExportingCSV}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>CSV (Brasil)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success toast */}
        {exportSuccessMsg && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-4 py-2.5 flex items-center gap-2 text-xs font-mono text-emerald-300 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{exportSuccessMsg}</span>
          </div>
        )}

        {/* Tab switchers */}
        <div className="px-5 py-2.5 border-b border-white/10 bg-slate-950/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Dashboard &amp; Gráficos</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition ${
                activeTab === 'table'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Grade de Transações ({transactions.length})</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Planilha 100% estruturada
          </span>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/30">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                Total Receitas
              </span>
              <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-1">
                {formatBRL(totalIncome)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-rose-500/30">
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider block">
                Total Despesas
              </span>
              <div className="text-lg sm:text-xl font-black text-rose-400 font-mono mt-1">
                {formatBRL(totalExpense)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-cyan-500/30">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                Resultado Líquido
              </span>
              <div className={`text-lg sm:text-xl font-black font-mono mt-1 ${
                netBalance >= 0 ? 'text-cyan-300' : 'text-rose-400'
              }`}>
                {formatBRL(netBalance)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-500/30">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                Taxa de Poupança
              </span>
              <div className="text-lg sm:text-xl font-black text-amber-400 font-mono mt-1">
                {savingsRate.toFixed(0)}%
              </div>
            </div>
          </div>

          {/* TAB 1: DASHBOARD & GRÁFICOS */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Gráficos de Categorias e Evolução Mensal */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ranking de Categorias com Barras Visuais */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PieChartIcon className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-sm font-bold text-white font-mono">
                        Distribuição por Categoria
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {expenseBreakdown.length} categorias
                    </span>
                  </div>

                  {expenseBreakdown.length === 0 ? (
                    <div className="text-center py-8 text-xs font-mono text-slate-500">
                      Nenhuma despesa cadastrada ainda.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {expenseBreakdown.slice(0, 8).map((item, idx) => {
                        const meta = getCategoryMeta(item.category);
                        const colors = ['bg-cyan-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-teal-500', 'bg-indigo-500'];
                        const barColor = colors[idx % colors.length];

                        return (
                          <div key={item.category} className="space-y-1 text-xs font-mono">
                            <div className="flex items-center justify-between text-slate-300">
                              <span className="flex items-center gap-1.5 font-medium truncate max-w-[60%]">
                                <span>{meta.emoji}</span>
                                <span className="truncate">{item.category}</span>
                              </span>
                              <span className="font-bold text-white">
                                {formatBRL(item.amount)}{' '}
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({item.percent.toFixed(1)}%)
                                </span>
                              </span>
                            </div>
                            {/* Barra de Progresso Visual */}
                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${barColor} transition-all duration-500`}
                                style={{ width: `${Math.min(100, item.percent)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Evolução Mensal em Barras */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-bold text-white font-mono">
                        Balanço por Mês (Entradas vs Saídas)
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {monthlyTimeline.length} períodos
                    </span>
                  </div>

                  {monthlyTimeline.length === 0 ? (
                    <div className="text-center py-8 text-xs font-mono text-slate-500">
                      Nenhum período registrado ainda.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {monthlyTimeline.slice(-6).map((m) => {
                        const maxVal = Math.max(m.income, m.expense, 100);
                        const incPct = (m.income / maxVal) * 100;
                        const expPct = (m.expense / maxVal) * 100;

                        return (
                          <div key={m.key} className="space-y-1.5 text-xs font-mono p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                            <div className="flex items-center justify-between text-slate-300">
                              <span className="font-bold text-cyan-300">{m.key}</span>
                              <span className={`text-[11px] font-bold ${
                                m.income >= m.expense ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                Saldo: {formatBRL(m.income - m.expense)}
                              </span>
                            </div>

                            {/* Barras Comparativas */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-emerald-400 w-12 shrink-0">Entrada</span>
                                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{ width: `${incPct}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400 w-16 text-right">
                                  {formatBRL(m.income)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-rose-400 w-12 shrink-0">Saída</span>
                                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-rose-500"
                                    style={{ width: `${expPct}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400 w-16 text-right">
                                  {formatBRL(m.expense)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GRADE DE TRANSAÇÕES (ESTILO EXCEL) */}
          {activeTab === 'table' && (
            <div className="space-y-4">
              {/* Filtros e Busca */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-white/10">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar por categoria, data ou nota..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    onClick={() => setSelectedType('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                      selectedType === 'all'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setSelectedType('expense')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                      selectedType === 'expense'
                        ? 'bg-rose-500 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Despesas
                  </button>
                  <button
                    onClick={() => setSelectedType('income')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                      selectedType === 'income'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Receitas
                  </button>
                </div>
              </div>

              {/* Tabela Interativa de Planilha */}
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-slate-950/70 shadow-lg">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead className="bg-slate-900/90 text-cyan-400 border-b border-white/10 sticky top-0 z-10 select-none">
                      <tr>
                        <th className="p-3">Data</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3">Categoria</th>
                        <th className="p-3 text-right">Valor</th>
                        <th className="p-3">Conta Bancária</th>
                        <th className="p-3">Observação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            Nenhum registro encontrado para os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((t, idx) => {
                          const bankName =
                            bankAccounts.find((b) => b.id === t.bankAccountId)?.bankName || 'Conta Corrente';
                          const isIncome = t.type === 'income';

                          return (
                            <tr
                              key={t.id}
                              className={`hover:bg-white/5 transition-colors ${
                                idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'
                              }`}
                            >
                              <td className="p-3 whitespace-nowrap text-slate-300 font-bold">
                                {formatDateBR(t.date)}
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isIncome
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  }`}
                                >
                                  {isIncome ? 'Receita' : 'Despesa'}
                                </span>
                              </td>
                              <td className="p-3 whitespace-nowrap text-white font-medium">
                                {t.category}
                              </td>
                              <td
                                className={`p-3 whitespace-nowrap text-right font-black ${
                                  isIncome ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {isIncome ? '+' : '-'} {formatBRL(t.amount)}
                              </td>
                              <td className="p-3 whitespace-nowrap text-slate-400">
                                {bankName}
                              </td>
                              <td className="p-3 text-slate-400 max-w-xs truncate" title={t.note}>
                                {t.note || '-'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Exporte para Excel com abas separadas, formatação de moeda e gráficos visuais.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadExcel}
              disabled={isExportingExcel}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Arquivo .XLSX</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
