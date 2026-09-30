/**
 * 🐾 Dante Agent Service - Ultra-Inteligência e Execução Automática de Ações
 *
 * Transforma o Dante de um simples chat de texto em um AGENTE FINANCEIRO EXECUTOR:
 * - Detecta e executa lançamentos automáticos diretamente pelas conversas do chat
 * - Atualiza metas e caixinhas automaticamente
 * - Calcula orçamento diário de sobrevivência e folga em tempo real
 * - Identifica ralos invisíveis e anomalias nas despesas
 */

import { Transaction, BankAccount, SavingGoal } from '../types/finance';
import { formatBRL, formatDateBR, todayISO } from '../utils/format';

export interface DanteActionExecuted {
  id: string;
  type: 'ADD_TRANSACTION' | 'CONTRIBUTE_GOAL' | 'BUDGET_CALC';
  title: string;
  description: string;
  badge: string;
  data: any;
  reversible?: boolean;
}

export interface DanteAnalysisResult {
  detectedAction: DanteActionExecuted | null;
  enrichedPromptAddition?: string;
  immediateReply?: string;
}

// Normaliza texto removendo acentos e pontuação
export function normalizeDanteText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Analisa e extrai parâmetros de lançamento de uma frase do usuário
 */
export function extractTransactionIntent(
  text: string,
  expenseCategories: string[],
  incomeCategories: string[],
  bankAccounts: BankAccount[]
): {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  note: string;
  bankAccountId?: string;
} | null {
  const norm = normalizeDanteText(text);

  // Palavras de gatilho que indicam intenção de lançamento
  const isLaunchIntent =
    /\b(lanca|lancar|lance|anota|anote|cadastra|cadastre|registra|registre|gastei|comprei|paguei|recebi|ganhei|entrou|saiu|coloque|botei|despesa|receita)\b/i.test(
      norm
    ) ||
    // Ou frases diretas como "Internet 150", "Almoço 45", "Salário 2500"
    /^([a-zà-ú\s]{2,20})\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i.test(text.trim());

  if (!isLaunchIntent) return null;

  // 1. Extração de valor numérico
  let amount = 0;
  let textWithoutAmount = text;

  // Regex para R$ 1.450,50 ou 1450,50 ou 150 ou 45.90
  const currencyMatch = text.match(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i);
  if (currencyMatch && currencyMatch[1]) {
    const rawNum = currencyMatch[1];
    if (rawNum.includes('.') && rawNum.includes(',')) {
      amount = parseFloat(rawNum.replace(/\./g, '').replace(',', '.'));
    } else if (rawNum.includes(',')) {
      amount = parseFloat(rawNum.replace(',', '.'));
    } else {
      amount = parseFloat(rawNum);
    }
    textWithoutAmount = text.replace(currencyMatch[0], ' ').trim();
  }

  if (!amount || isNaN(amount) || amount <= 0) return null;

  // 2. Extração de Data Inteligente
  let targetDate = todayISO();
  let textWithoutDate = textWithoutAmount;

  const dateMatch = textWithoutAmount.match(/(?:dia\s+)?(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/i);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10);
    let year = dateMatch[3] ? parseInt(dateMatch[3], 10) : new Date().getFullYear();
    if (year < 100) year += 2000;

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      targetDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      textWithoutDate = textWithoutAmount.replace(dateMatch[0], ' ').trim();
    }
  } else {
    const normText = normalizeDanteText(textWithoutAmount);
    if (normText.includes('amanha')) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      targetDate = d.toISOString().slice(0, 10);
      textWithoutDate = textWithoutAmount.replace(/amanh[aã]/gi, ' ').trim();
    } else if (normText.includes('ontem')) {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      targetDate = d.toISOString().slice(0, 10);
      textWithoutDate = textWithoutAmount.replace(/ontem/gi, ' ').trim();
    } else if (normText.includes('proximo mes') || normText.includes('mes que vem')) {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      targetDate = d.toISOString().slice(0, 10);
      textWithoutDate = textWithoutAmount.replace(/pr[oó]ximo\s+m[eê]s|m[eê]s\s+que\s+vem/gi, ' ').trim();
    }
  }

  // 3. Detecção de Conta Bancária
  let selectedBankId = bankAccounts[0]?.id;
  let textWithoutBank = textWithoutDate;

  for (const acc of bankAccounts) {
    const normBank = normalizeDanteText(acc.bankName);
    const normNick = acc.nickname ? normalizeDanteText(acc.nickname) : '';
    const normCur = normalizeDanteText(textWithoutDate);

    if ((normBank && normCur.includes(normBank)) || (normNick && normCur.includes(normNick))) {
      selectedBankId = acc.id;
      textWithoutBank = textWithoutDate
        .replace(new RegExp(acc.bankName, 'gi'), ' ')
        .replace(new RegExp(acc.nickname || '', 'gi'), ' ')
        .trim();
      break;
    }
  }

  // 4. Reconhecimento de Categoria e Tipo
  // Remove preposições e palavras de comando
  const cleanTokens = textWithoutBank
    .replace(/\b(lanca|lancar|lance|anota|anote|cadastra|cadastre|registra|registre|gastei|comprei|paguei|recebi|ganhei|entrou|saiu|de|do|da|dos|das|no|na|nos|nas|em|para|pra|com|por|o|a|os|as|um|uma|r\$|reais)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const normQuery = normalizeDanteText(cleanTokens || textWithoutBank);

  let matchedCategory = '';
  let matchedType: 'income' | 'expense' = 'expense';

  // Verifica se é receita explícita
  const isIncomeVerb = /\b(recebi|ganhei|entrou|salario|pagamento|rendimento|dividendo|provento|freela|bonus|comissao|pix recebido)\b/i.test(
    norm
  );

  // A. Match com categorias de Receita
  for (const cat of incomeCategories) {
    const normCat = normalizeDanteText(cat);
    if (normQuery === normCat || normQuery.includes(normCat) || (normCat.length > 3 && normCat.includes(normQuery))) {
      matchedCategory = cat;
      matchedType = 'income';
      break;
    }
  }

  // B. Match com categorias de Despesa
  if (!matchedCategory) {
    for (const cat of expenseCategories) {
      const normCat = normalizeDanteText(cat);
      if (normQuery === normCat || normQuery.includes(normCat) || (normCat.length > 3 && normCat.includes(normQuery))) {
        matchedCategory = cat;
        matchedType = 'expense';
        break;
      }
    }
  }

  // C. Dicionário de Sinônimos Comportamentais
  if (!matchedCategory) {
    if (isIncomeVerb || normQuery.includes('salario') || normQuery.includes('holerite')) {
      matchedCategory = incomeCategories.find((c) => normalizeDanteText(c).includes('salari')) || 'Salário';
      matchedType = 'income';
    } else if (normQuery.includes('bonus') || normQuery.includes('plr')) {
      matchedCategory = incomeCategories.find((c) => normalizeDanteText(c).includes('bonu')) || 'Bônus';
      matchedType = 'income';
    } else if (normQuery.includes('freela') || normQuery.includes('bico')) {
      matchedCategory = incomeCategories.find((c) => normalizeDanteText(c).includes('freela')) || 'Freelance';
      matchedType = 'income';
    } else if (normQuery.includes('dividendo') || normQuery.includes('rendimento')) {
      matchedCategory = incomeCategories.find((c) => normalizeDanteText(c).includes('invest')) || 'Investimentos';
      matchedType = 'income';
    } else if (normQuery.includes('internet') || normQuery.includes('wifi') || normQuery.includes('fibra')) {
      matchedCategory = expenseCategories.find((c) => normalizeDanteText(c).includes('internet')) || 'Internet';
      matchedType = 'expense';
    } else if (normQuery.includes('energia') || normQuery.includes('luz') || normQuery.includes('enel') || normQuery.includes('cemig')) {
      matchedCategory = expenseCategories.find((c) => normalizeDanteText(c).includes('energia') || normalizeDanteText(c).includes('luz')) || 'Energia';
      matchedType = 'expense';
    } else if (normQuery.includes('agua') || normQuery.includes('sabesp') || normQuery.includes('copasa')) {
      matchedCategory = expenseCategories.find((c) => normalizeDanteText(c).includes('agua')) || 'Aguá';
      matchedType = 'expense';
    } else if (normQuery.includes('academia') || normQuery.includes('gym') || normQuery.includes('smartfit')) {
      matchedCategory = expenseCategories.find((c) => normalizeDanteText(c).includes('academia')) || 'Academia';
      matchedType = 'expense';
    } else if (normQuery.includes('aluguel') || normQuery.includes('condominio') || normQuery.includes('apartamento') || normQuery.includes('moradia')) {
      matchedCategory = expenseCategories.find((c) => normalizeDanteText(c).includes('moradia') || normalizeDanteText(c).includes('aluguel')) || 'Moradia';
      matchedType = 'expense';
    } else if (normQuery.includes('cartao') || normQuery.includes('fatura') || normQuery.includes('credito') || normQuery.includes('99') || normQuery.includes('nubank')) {
      matchedCategory = expenseCategories.find((c) => normalizeDanteText(c).includes('cartao') || normalizeDanteText(c).includes('credito')) || 'Cartão de Credito';
      matchedType = 'expense';
    } else if (normQuery.includes('mercado') || normQuery.includes('supermercado') || normQuery.includes('comida') || normQuery.includes('almoco') || normQuery.includes('jantar') || normQuery.includes('ifood')) {
      matchedCategory = expenseCategories.find((c) => normalizeDanteText(c).includes('mercado') || normalizeDanteText(c).includes('aliment')) || 'Mercado';
      matchedType = 'expense';
    } else if (normQuery.includes('dentista') || normQuery.includes('medico') || normQuery.includes('farmacia') || normQuery.includes('remedio') || normQuery.includes('saude')) {
      matchedCategory = expenseCategories.find((c) => normalizeDanteText(c).includes('saude') || normalizeDanteText(c).includes('farmacia')) || 'Saúde';
      matchedType = 'expense';
    } else if (normQuery.includes('uber') || normQuery.includes('gasolina') || normQuery.includes('transporte') || normQuery.includes('onibus')) {
      matchedCategory = expenseCategories.find((c) => normalizeDanteText(c).includes('transporte')) || 'Transporte';
      matchedType = 'expense';
    } else {
      matchedCategory = isIncomeVerb ? (incomeCategories[0] || 'Outros') : (expenseCategories.find((c) => c === 'Outros') || expenseCategories[0] || 'Outros');
      matchedType = isIncomeVerb ? 'income' : 'expense';
    }
  }

  // Gera uma nota descritiva limpa
  const note = cleanTokens.length > 0 ? cleanTokens : `${matchedCategory} ${formatBRL(amount)}`;

  return {
    type: matchedType,
    amount,
    category: matchedCategory,
    date: targetDate,
    note,
    bankAccountId: selectedBankId,
  };
}

/**
 * Calcula o orçamento diário seguro (Safe Daily Budget) até o fim do mês
 */
export function calculateSafeDailyBudget(realFreeBalance: number): {
  daysRemaining: number;
  dailyBudget: number;
  status: 'safe' | 'tight' | 'negative';
  message: string;
} {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, lastDay - currentDay + 1);

  const dailyBudget = realFreeBalance > 0 ? realFreeBalance / daysRemaining : 0;

  if (realFreeBalance <= 0) {
    return {
      daysRemaining,
      dailyBudget: 0,
      status: 'negative',
      message: `Atenção: Seu saldo livre está em ${formatBRL(realFreeBalance)}. É hora de travar gastos variáveis e priorizar apenas necessidades básicas.`,
    };
  }

  if (dailyBudget < 25) {
    return {
      daysRemaining,
      dailyBudget,
      status: 'tight',
      message: `Você tem ${formatBRL(realFreeBalance)} livres para os próximos ${daysRemaining} dias. Isso dá exatamente **${formatBRL(dailyBudget)}/dia**. Cuidado com delivery e pequenos gastos!`,
    };
  }

  return {
    daysRemaining,
    dailyBudget,
    status: 'safe',
    message: `Você tem ${formatBRL(realFreeBalance)} livres para os próximos ${daysRemaining} dias. Seu limite diário seguro é de **${formatBRL(dailyBudget)}/dia** para fechar o mês com total tranquilidade!`,
  };
}

/**
 * Faz a auditoria rápida dos 3 maiores ralos de dinheiro
 */
export function auditTopExpenseLeaks(transactions: Transaction[]): {
  topCategories: { category: string; amount: number; percent: number }[];
  totalExpense: number;
  summary: string;
} {
  const now = new Date();
  const currentMonthKey = now.toISOString().slice(0, 7);

  const expenseMap: Record<string, number> = {};
  let totalExpense = 0;

  transactions.forEach((t) => {
    if (t.type === 'expense') {
      const tMonth = t.date ? t.date.slice(0, 7) : '';
      if (tMonth === currentMonthKey || t.date >= now.toISOString().slice(0, 10)) {
        expenseMap[t.category] = (expenseMap[t.category] || 0) + t.amount;
        totalExpense += t.amount;
      }
    }
  });

  const sorted = Object.entries(expenseMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category, amount]) => ({
      category,
      amount,
      percent: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    }));

  const summary = sorted.length > 0
    ? sorted.map((s) => `• **${s.category}**: ${formatBRL(s.amount)} (${s.percent.toFixed(1)}% das suas despesas)`).join('\n')
    : 'Nenhuma despesa expressiva cadastrada no período.';

  return {
    topCategories: sorted,
    totalExpense,
    summary,
  };
}
