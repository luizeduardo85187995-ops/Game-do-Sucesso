import { auth } from './firebase';

export type DanteMode = 'equilibrado' | 'vira_homem';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface FinanceContextData {
  balance: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  investedTotal: number;
  investedCostTotal?: number;
  investedProfitLoss?: number;
  investedProfitLossPercent?: number;
  estimatedPassiveIncome: number;
  upcomingDividendsThisMonth?: number;
  bankBalance?: number;
  creditCardDebt?: number;
  savingsRate?: number;
  futureExpenses?: number;
  nextMonthExpenses?: number;
  projectedBalance?: number;
  realFreeBalance?: number;
  transactions: Array<{
    id: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    date: string;
    note?: string;
    bankAccountId?: string;
  }>;
  bankAccounts: Array<{
    id: string;
    bankName: string;
    accountType: string;
    nickname?: string;
    balance: number;
    updatedAt?: string;
  }>;
  investments: Array<{
    id: string;
    type: string;
    code: string;
    name?: string;
    amount: number;
    date: string;
    quantity?: number;
    monthlyYield?: number;
    currentPrice?: number;
    totalCurrentValue?: number;
    totalProfitLoss?: number;
    totalProfitLossPercent?: number;
    dividendYield?: number;
    sector?: string;
  }>;
  savingGoals: Array<{
    id: string;
    name: string;
    emoji: string;
    targetAmount: number;
    currentAmount: number;
    categoryTag: string;
    createdAt?: string;
  }>;
  dividendEvents?: Array<{
    id: string;
    ticker: string;
    assetName: string;
    type: string;
    paymentDate: string;
    totalAmount: number;
    status: string;
  }>;
  goals?: {
    monthly?: number;
    reserve?: number;
    passiveIncome?: number;
    investedPatrimony?: number;
  };
  base?: {
    startingBalance?: number;
    fixedIncome?: number;
  };
  investmentFocus?: string;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(value) ? value : 0);
}

function getSmartLocalFallback(context: FinanceContextData, mode: DanteMode): string {
  const balance = Number.isFinite(context.balance) ? context.balance : 0;
  const monthExpense = Number.isFinite(context.monthExpense) ? context.monthExpense : 0;
  const monthIncome = Number.isFinite(context.monthIncome) ? context.monthIncome : 0;

  if (balance < 0) {
    const base = `O motor do Dante está temporariamente indisponível. Pelos dados do app, você está no vermelho em **${formatBRL(
      Math.abs(balance)
    )}**.`;
    return mode === 'vira_homem'
      ? `${base}\n\nSem enrolação: **trave gasto não essencial agora** e volte aqui em alguns minutos para eu fazer a análise completa.`
      : `${base}\n\nPor enquanto, evite novos gastos não essenciais e tente novamente em alguns minutos. Seus dados continuam salvos normalmente.`;
  }

  if (monthIncome > 0 && monthExpense > monthIncome) {
    return `O motor do Dante está temporariamente indisponível, mas o app mostra que suas despesas do mês (**${formatBRL(
      monthExpense
    )}**) já passaram suas receitas (**${formatBRL(monthIncome)}**). ${
      mode === 'vira_homem'
        ? 'Isso precisa de corte imediato nos gastos que não são essenciais.'
        : 'Vale segurar os gastos não essenciais até a situação voltar ao controle.'
    } Tente novamente em alguns minutos para eu detalhar onde está o problema.`;
  }

  return `O Dante está temporariamente sem conexão com o motor de IA. Seu saldo atual informado pelo app é **${formatBRL(
    balance
  )}**. Seus lançamentos continuam funcionando normalmente; tente a pergunta novamente em alguns minutos.`;
}

export async function callDanteAI(
  userMessage: string,
  history: ChatMessage[],
  context: FinanceContextData,
  mode: DanteMode
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Faça login com o Google para usar o Dante.');

  const idToken = await user.getIdToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 24_000);

  try {
    const response = await fetch('/api/dante', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        message: userMessage,
        mode,
        history: history.slice(-12),
        context: {
          ...context,
          // O backend usa TODOS estes itens para cálculos e agregações, mas só envia
          // um resumo compacto e linhas relevantes para a IA.
          transactions: context.transactions.slice(0, 2000),
          bankAccounts: context.bankAccounts.slice(0, 30),
          investments: context.investments.slice(0, 120),
          savingGoals: context.savingGoals.slice(0, 80),
          dividendEvents: (context.dividendEvents || []).slice(0, 150),
        },
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(payload?.message || 'Acesso ao Dante não autorizado.');
      }
      console.warn('[Dante] API indisponível:', payload?.message || response.statusText);
      return getSmartLocalFallback(context, mode);
    }

    return String(payload.text || '').trim() || getSmartLocalFallback(context, mode);
  } catch (error: any) {
    if (
      error?.message?.includes('plano PRO') ||
      error?.message?.includes('login') ||
      error?.message?.includes('autorizado')
    ) {
      throw error;
    }
    console.warn('[Dante] fallback local:', error?.message || error);
    return getSmartLocalFallback(context, mode);
  } finally {
    clearTimeout(timeout);
  }
}

export function buildHistory(rawMessages: { role: string; content: string }[]): ChatMessage[] {
  return rawMessages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-12)
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content.slice(0, 5000),
    }));
}
