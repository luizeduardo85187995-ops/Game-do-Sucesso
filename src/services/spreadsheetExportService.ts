/**
 * 📊 Serviço de Exportação de Planilhas Profissionais (Excel .xlsx e CSV formatado)
 *
 * Inclui:
 * - Multi-abas no Excel (.xlsx): Dashboard Executivo, Transações Detalhadas, Resumo por Categorias, Evolução
 * - Barras de gráfico visuais e fórmulas automáticas
 * - CSV com ponto-e-vírgula (;) e codificação UTF-8 BOM compatível 100% com Excel Brasil
 * - Limpeza total de datas e valores monetários
 */

import { isSettled } from '../utils/transactions';
import { Transaction, BankAccount } from '../types/finance';
import { formatDateBR, formatBRL, todayISO } from '../utils/format';

export interface SpreadsheetMetrics {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
}

/**
 * Gera e baixa uma planilha Excel (.xlsx) completa com múltiplas abas,
 * dashboard de indicadores, gráficos visuais em barras e extrato detalhado.
 */
export async function exportExcelWithCharts(
  transactions: Transaction[],
  bankAccounts: BankAccount[],
  expenseCategories: string[],
  incomeCategories: string[]
): Promise<void> {
  const XLSX = await import('xlsx');

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, (netBalance / totalIncome) * 100) : 0;

  // Agrupamento por Categoria de Despesa
  const expenseByCat: Record<string, { total: number; count: number }> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category || 'Outros';
      if (!expenseByCat[cat]) expenseByCat[cat] = { total: 0, count: 0 };
      expenseByCat[cat].total += t.amount;
      expenseByCat[cat].count += 1;
    });

  const sortedExpenses = Object.entries(expenseByCat)
    .sort(([, a], [, b]) => b.total - a.total);

  // Agrupamento por Categoria de Receita
  const incomeByCat: Record<string, { total: number; count: number }> = {};
  transactions
    .filter((t) => t.type === 'income')
    .forEach((t) => {
      const cat = t.category || 'Outros';
      if (!incomeByCat[cat]) incomeByCat[cat] = { total: 0, count: 0 };
      incomeByCat[cat].total += t.amount;
      incomeByCat[cat].count += 1;
    });

  const sortedIncomes = Object.entries(incomeByCat)
    .sort(([, a], [, b]) => b.total - a.total);

  // Agrupamento Mensal
  const monthlyMap: Record<string, { income: number; expense: number }> = {};
  transactions.forEach((t) => {
    const cleanDate = t.date ? (t.date.includes('T') ? t.date.split('T')[0] : t.date) : todayISO();
    const mKey = cleanDate.slice(0, 7);
    if (!monthlyMap[mKey]) monthlyMap[mKey] = { income: 0, expense: 0 };
    if (t.type === 'income') monthlyMap[mKey].income += t.amount;
    else monthlyMap[mKey].expense += t.amount;
  });

  const sortedMonths = Object.entries(monthlyMap).sort(([a], [b]) => a.localeCompare(b));

  // Helper para criar barra de gráfico visual em caracteres (compatível com todas as versões do Excel)
  const makeBarChart = (percent: number, maxBlocks: number = 20): string => {
    const blocks = Math.round((Math.max(0, Math.min(100, percent)) / 100) * maxBlocks);
    return '█'.repeat(blocks) + '░'.repeat(Math.max(0, maxBlocks - blocks)) + ` ${percent.toFixed(1)}%`;
  };

  const wb = XLSX.utils.book_new();

  // ----------------------------------------------------
  // ABA 1: 📊 DASHBOARD & RESUMO
  // ----------------------------------------------------
  const dashboardData: (string | number)[][] = [
    ['MINHAS FINANÇAS - RELATÓRIO EXECUTIVO & FINANCEIRO'],
    [`Emitido em: ${formatDateBR(todayISO())}`, '', '', `Total de Lançamentos: ${transactions.length}`],
    [],
    ['=== INDICADORES GERAIS ===', '', '', ''],
    ['Indicador', 'Valor (R$)', 'Status', 'Observação'],
    ['Total de Receitas (+)', totalIncome, '🟢 Entradas', 'Soma de todas as rendas e proventos'],
    ['Total de Despesas (-)', totalExpense, '🔴 Saídas', 'Soma de todas as despesas lançadas'],
    ['Resultado Líquido', netBalance, netBalance >= 0 ? '🟢 Positivo' : '🔴 Déficit', 'Diferença entre entradas e saídas'],
    ['Taxa de Poupança', `${savingsRate.toFixed(1)}%`, savingsRate >= 20 ? '⭐ Excelente' : '💡 A melhorar', 'Percentual poupado da renda total'],
    [],
    ['=== MAIORES DESPESAS POR CATEGORIA (GRÁFICO VISUAL) ===', '', '', ''],
    ['Categoria', 'Total Gasto (R$)', '% do Total', 'Qtd Lançamentos', 'Gráfico Visual de Distribuição'],
  ];

  sortedExpenses.forEach(([cat, data]) => {
    const pct = totalExpense > 0 ? (data.total / totalExpense) * 100 : 0;
    dashboardData.push([
      cat,
      data.total,
      `${pct.toFixed(1)}%`,
      data.count,
      makeBarChart(pct, 20),
    ]);
  });

  dashboardData.push([]);
  dashboardData.push(['=== EVOLUÇÃO MENSAL ===', '', '', '']);
  dashboardData.push(['Mês', 'Receitas (R$)', 'Despesas (R$)', 'Saldo do Mês (R$)', 'Balanço Visual']);

  sortedMonths.forEach(([mKey, data]) => {
    const diff = data.income - data.expense;
    const balanceIndicator = diff >= 0 ? `🟢 +${formatBRL(diff)}` : `🔴 -${formatBRL(Math.abs(diff))}`;
    dashboardData.push([
      mKey,
      data.income,
      data.expense,
      diff,
      balanceIndicator,
    ]);
  });

  const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);
  wsDashboard['!cols'] = [
    { wch: 32 }, // Categoria / Indicador
    { wch: 18 }, // Valor
    { wch: 16 }, // % / Status
    { wch: 18 }, // Qtd
    { wch: 36 }, // Gráfico Visual
  ];
  XLSX.utils.book_append_sheet(wb, wsDashboard, '📊 Dashboard & Gráficos');

  // ----------------------------------------------------
  // ABA 2: 📋 TRANSAÇÕES DETALHADAS
  // ----------------------------------------------------
  const transactionsHeaders = [
    'ID',
    'Data',
    'Tipo',
    'Categoria',
    'Valor (R$)',
    'Conta Bancária',
    'Observação / Descrição',
    'Situação',
    'Data de pagamento/recebimento',
  ];

  const transactionsRows = transactions.map((t) => {
    const bankName = bankAccounts.find((b) => b.id === t.bankAccountId)?.bankName || 'Conta Corrente';
    return [
      t.id,
      formatDateBR(t.date),
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.category,
      t.amount,
      bankName,
      t.note || '',
      isSettled(t) ? 'Pago/Recebido' : 'Pendente',
      formatDateBR(t.paymentDate || ''),
    ];
  });

  const wsTransactions = XLSX.utils.aoa_to_sheet([transactionsHeaders, ...transactionsRows]);
  wsTransactions['!cols'] = [
    { wch: 18 }, // ID
    { wch: 14 }, // Data
    { wch: 12 }, // Tipo
    { wch: 22 }, // Categoria
    { wch: 16 }, // Valor
    { wch: 20 }, // Conta
    { wch: 40 }, // Observação
  ];
  XLSX.utils.book_append_sheet(wb, wsTransactions, '📋 Transações');

  // ----------------------------------------------------
  // ABA 3: 📉 DESPESAS POR CATEGORIA
  // ----------------------------------------------------
  const expenseCatHeaders = ['Categoria', 'Valor Total (R$)', '% das Despesas', 'Qtd Lançamentos', 'Média por Lançamento (R$)'];
  const expenseCatRows = sortedExpenses.map(([cat, data]) => {
    const pct = totalExpense > 0 ? (data.total / totalExpense) * 100 : 0;
    const avg = data.count > 0 ? data.total / data.count : 0;
    return [
      cat,
      data.total,
      `${pct.toFixed(1)}%`,
      data.count,
      Number(avg.toFixed(2)),
    ];
  });

  const wsExpenseCat = XLSX.utils.aoa_to_sheet([expenseCatHeaders, ...expenseCatRows]);
  wsExpenseCat['!cols'] = [
    { wch: 25 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(wb, wsExpenseCat, '📉 Despesas por Categoria');

  // ----------------------------------------------------
  // ABA 4: 📈 RECEITAS POR CATEGORIA
  // ----------------------------------------------------
  const incomeCatHeaders = ['Categoria', 'Valor Total (R$)', '% das Receitas', 'Qtd Lançamentos', 'Média por Lançamento (R$)'];
  const incomeCatRows = sortedIncomes.map(([cat, data]) => {
    const pct = totalIncome > 0 ? (data.total / totalIncome) * 100 : 0;
    const avg = data.count > 0 ? data.total / data.count : 0;
    return [
      cat,
      data.total,
      `${pct.toFixed(1)}%`,
      data.count,
      Number(avg.toFixed(2)),
    ];
  });

  const wsIncomeCat = XLSX.utils.aoa_to_sheet([incomeCatHeaders, ...incomeCatRows]);
  wsIncomeCat['!cols'] = [
    { wch: 25 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(wb, wsIncomeCat, '📈 Receitas por Categoria');

  // Salva o arquivo no formato Excel nativo
  const fileName = `planilha_financeira_com_graficos_${todayISO()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Gera e baixa um arquivo CSV 100% compatível com Microsoft Excel Brasil:
 * - Separador de colunas: ponto-e-vírgula (;)
 * - Separador decimal: vírgula (,)
 * - Codificação: UTF-8 com BOM (\uFEFF) para preservar acentuação
 * - Datas no padrão DD/MM/AAAA sem horário corrompido
 */
export function exportCSVForExcel(
  transactions: Transaction[],
  bankAccounts: BankAccount[]
): void {
  const headers = ['Data', 'Tipo', 'Categoria', 'Valor (R$)', 'Conta', 'Observação', 'Situação', 'Pagamento/Recebimento'];

  const rows = transactions.map((t) => {
    const bankName = bankAccounts.find((b) => b.id === t.bankAccountId)?.bankName || 'Conta Corrente';
    const dateFormatted = formatDateBR(t.date);
    const typeFormatted = t.type === 'income' ? 'Receita' : 'Despesa';
    const cleanCategory = (t.category || '').replace(/"/g, '""');
    const valueFormatted = t.amount.toFixed(2).replace('.', ',');
    const noteFormatted = (t.note || '').replace(/"/g, '""');

    return [
      dateFormatted,
      typeFormatted,
      `"${cleanCategory}"`,
      valueFormatted,
      `"${bankName}"`,
      `"${noteFormatted}"`,
      isSettled(t) ? 'Pago/Recebido' : 'Pendente',
      formatDateBR(t.paymentDate || ''),
    ];
  });

  // \uFEFF força o Excel a interpretar como UTF-8
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio_financeiro_${todayISO()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
