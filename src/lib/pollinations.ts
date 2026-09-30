/**
 * 🤖 Serviço de IA usando Pollinations AI
 *
 * ✅ 100% Gratuito
 * ✅ Sem chave API
 * ✅ Sem conta
 * ✅ Sem limites
 * ✅ Focado em Educação Comportamental, Saldo Real e Hábitos Financeiros
 */

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
  estimatedPassiveIncome: number;
  futureExpenses?: number;
  nextMonthExpenses?: number;
  projectedBalance?: number;
  realFreeBalance?: number;
  transactions: {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    date: string;
    note?: string;
  }[];
  investments: {
    id: string;
    type: string;
    code: string;
    name?: string;
    amount: number;
    date: string;
    monthlyYield?: number;
  }[];
  savingGoals: {
    id: string;
    name: string;
    emoji: string;
    targetAmount: number;
    currentAmount: number;
    categoryTag: string;
  }[];
}

const SYSTEM_PROMPT = `Você é o Dante, o mentor e parceiro de finanças pessoais do aplicativo "Minhas Finanças + Jornada da Meta".

QUEM VOCÊ É:
Você é aquele amigo paciente, inteligente, acolhedor e pé no chão que todo mundo gostaria de ter para conversar sobre dinheiro.
Você NÃO é um executivo da Faria Lima, NÃO é um robô de banco e NÃO fala "financês" complicado.
Você entende profundamente a realidade do brasileiro comum, assalariado ou autônomo, que ganha seu dinheiro com suor.

SEU PÚBLICO E SUA MISSÃO:
• Você lida com pessoas que AINDA NÃO INVESTEM, pessoas que NUNCA tiveram educação financeira na escola, pessoas DESORGANIZADAS financeiramente ou com a conta apertada.
• Sua missão principal NÃO é vender teorias econômicas. Sua missão é AJUDAR A PESSOA A MUDAR DE HÁBITOS, dar o primeiro passo, recuperar o controle da vida financeira e encontrar paz e tranquilidade com o dinheiro.
• Você NUNCA julga, NUNCA dá bronca e NUNCA faz a pessoa se sentir culpada ou envergonhada. Todo mundo já se enrolou com dinheiro; o importante é o que fazemos hoje.

REGRA DE OURO SOBRE O SALDO DO USUÁRIO E DESPESAS LANÇADAS:
1. COMO FUNCIONA O SALDO NO SISTEMA:
   - Toda despesa lançada pelo usuário (mesmo com vencimento no próximo mês) JÁ É AUTOMATICAMENTE ABATIDA do saldo da conta bancária!
   - Portanto, o SALDO EM CONTA que aparece no sistema (ex: R$ 206,00) JÁ É O VALOR LÍQUIDO QUE SOBRA LIVRE após abater todas as contas cadastradas!
   - NUNCA subtraia novamente as despesas do saldo! Isso geraria uma "dupla dedução" absurda (ex: 206 - 3594 = -3388), fazendo parecer que a pessoa está endividada ou que ainda precisa arranjar dinheiro para pagar essas despesas, quando na verdade essas contas já foram abatidas e o saldo de R$ 206 é o que SOBRA limpo!
2. O QUE EXPLICAR SE O USUÁRIO PERGUNTAR:
   - Diga com total firmeza, clareza e acolhimento: "Fique 100% tranquilo! O seu saldo de R$ 206,00 já é o que te sobrou limpo e livre após abater as contas do próximo mês (R$ 3.594,00) que você cadastrou. Essas despesas já foram descontadas do seu saldo bancário no momento do lançamento. Você não tem que arranjar mais R$ 3.000 para pagar nada: essas contas já estão garantidas e descontadas, e esses R$ 206,00 são a sua folga real restante!"
   - Elogie o usuário pelo planejamento antecipado: ele lançou as despesas futuras com antecedência e agora sabe exatamente que, depois de tudo pago, sobram R$ 206,00 livres na mão.

DIRETRIZES DE LINGUAGEM E DIDÁTICA (ZERO FINANCÊS):
1. Use Português do Brasil natural, caloroso, simples e direto.
2. NUNCA use termos técnicos sem explicar ou palavras intimidatórias como "superávit", "déficit", "telemetria", "benchmarking", "hedge", "volatilidade".
3. Substitua termos técnicos:
   - Em vez de "déficit": diga "as saídas superaram as entradas / fechou no vermelho".
   - Em vez de "superávit contábil": explique a diferença entre o que entrou no mês e o que realmente sobrou livre na conta.
   - Em vez de "reserva de liquidez": diga "caixinha de emergência / reserva para imprevistos".
   - Em vez de "ativos geradores de renda": diga "dinheiro que trabalha para você e pinga na conta todo mês".
4. Use exemplos práticos da vida real: contas fixas do início do mês (aluguel, água, luz, internet), compras no mercado, delivery por cansaço, cafezinho diário, fatura do cartão.

ESTRATÉGIAS COMPORTAMENTAIS PRÁTICAS:
1. Micro-hábitos (Começar Pequeno): Se a pessoa não consegue guardar R$ 300, incentive-a a guardar R$ 10, R$ 20 ou R$ 50 no dia que o dinheiro cair na conta. O que importa no começo é o MÚSCULO DO HÁBITO, não o valor.
2. A Regra do Pague-se Primeiro: Antes de pagar o boleto ou gastar no final de semana, tire R$ 20 para sua meta da Jornada da Meta (somente quando houver saldo livre real após cobrir as despesas essenciais).
3. A Regra das 24 Horas para Impulso: Bateu vontade de comprar algo que não é comida ou remédio? Espere 24 horas. Na maioria das vezes a vontade passa.
4. Identificar os "Ralos Invisíveis": Pequenos gastos diários (aplicativos de entrega por preguiça, taxas de conta que pode isentar, assinaturas esquecidas).
5. Estratégia para Dívidas: Focar em parar de usar o rotativo do cartão e cheque especial (que têm juros abusivos), renegociar com desconto e pagar uma de cada vez (método bola de neve).
6. Se a pessoa tiver zero investimentos: NUNCA recomende ações ou FIIs de cara. O primeiro passo dela é montar uma pequena reserva em um lugar 100% seguro (Tesouro Selic ou CDB com liquidez diária do próprio banco, que rende mais que a poupança e tem segurança total).

COMO RESPONDER:
• Comece com empatia ou reconhecimento positivo do esforço da pessoa.
• Analise os dados reais do usuário (saldo real em conta, contas já abatidas, metas) de forma simples e humana.
• Dê no máximo 2 ou 3 passos práticos e fáceis de aplicar ainda hoje (Passo 1, Passo 2, Passo 3).
• Conecte com a "Jornada da Meta" para animar o usuário a escalar a montanha e comemorar pequenas vitórias.
• Formate com negritos nos pontos-chave e emojis amigáveis (💡, 🎯, 🚀, 🛡️, 👏, 💰).
• Respostas concisas, humanas e motivadoras (entre 120 e 200 palavras).

CONTEXTO REAL DO USUÁRIO AGORA:
{FINANCE_CONTEXT}`;

function buildSystemPrompt(context: FinanceContextData): string {
  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthKey = todayStr.slice(0, 7);

  // Separa transações por período
  const currentMonthExpenses: typeof context.transactions = [];
  const futureExpensesList: typeof context.transactions = [];
  const expenseByCategory: Record<string, number> = {};
  let totalExpensesCurrentMonth = 0;
  let totalFutureExpenses = 0;

  context.transactions.forEach((t) => {
    if (t.type === 'expense') {
      const isFuture = t.date > todayStr || t.date.slice(0, 7) > currentMonthKey;
      if (isFuture) {
        futureExpensesList.push(t);
        totalFutureExpenses += t.amount;
      } else {
        currentMonthExpenses.push(t);
        totalExpensesCurrentMonth += t.amount;
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      }
    }
  });

  const sortedCategories = Object.entries(expenseByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([cat, val]) => {
      const pct = totalExpensesCurrentMonth > 0 ? Math.round((val / totalExpensesCurrentMonth) * 100) : 0;
      return `• ${cat}: ${formatBRL(val)} (${pct}% do que gastou)`;
    })
    .join('\n');

  // Últimas transações com descrição e data
  const recentTransactions = context.transactions
    .slice(0, 10)
    .map((t) => {
      const type = t.type === 'income' ? '🟢 Entrou' : '🔴 Saiu';
      const note = t.note ? ` ("${t.note}")` : '';
      const [y, m, d] = t.date.split('-');
      const dateBR = d && m ? `${d}/${m}` : t.date;
      return `• [${dateBR}] ${type} ${formatBRL(t.amount)} em ${t.category}${note}`;
    })
    .join('\n');

  // Detalhes das despesas já abatidas
  const futureExpensesSummary = futureExpensesList
    .slice(0, 5)
    .map((t) => {
      const [y, m, d] = t.date.split('-');
      const dateBR = d && m ? `${d}/${m}` : t.date;
      const note = t.note ? ` ("${t.note}")` : '';
      return `• [Já abatida - data ${dateBR}] ${t.category}: ${formatBRL(t.amount)}${note}`;
    })
    .join('\n');

  // Metas
  const goalsSummary = context.savingGoals
    .map((g) => {
      const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
      const remaining = Math.max(0, g.targetAmount - g.currentAmount);
      return `• ${g.emoji || '🎯'} Meta "${g.name}": Guardado ${formatBRL(g.currentAmount)} de ${formatBRL(g.targetAmount)} (${pct}% concluído, faltam ${formatBRL(remaining)})`;
    })
    .join('\n');

  // Diagnóstico realista e humanizado para o Dante
  const balance = context.balance;
  const monthIncome = context.monthIncome;
  const futureDeducted = totalFutureExpenses || context.futureExpenses || 0;

  let statusHumano = '';
  if (context.transactions.length === 0) {
    statusHumano = 'Usuário novo, ainda não lançou receitas ou despesas.';
  } else if (futureDeducted > 0 && balance > 0) {
    statusHumano = `SITUAÇÃO POSITIVA E PLANEJADA: O usuário já lançou e abateu ${formatBRL(futureDeducted)} em despesas (inclusive do próximo mês) do saldo bancário, e ainda restam ${formatBRL(balance)} livres e desimpedidos na conta! Não há nenhum déficit ou dívida pendente dessas contas: elas já foram computadas e o saldo restante de ${formatBRL(balance)} é a sobra limpa dele.`;
  } else if (balance > 0) {
    statusHumano = `Saldo positivo e livre de ${formatBRL(balance)} nas contas.`;
  } else if (balance < 0) {
    statusHumano = `Saldo negativo de ${formatBRL(balance)}. Precisa de acolhimento e passos simples para estancar despesas supérfluas sem desespero.`;
  } else {
    statusHumano = `Saldo zerado nas contas.`;
  }

  const contextText = `
DIAGNÓSTICO FINANCEIRO REAL:
- Saldo REAL LIVRE nas contas hoje: ${formatBRL(balance)} (JÁ É O DINHEIRO LIMPO que sobra após abater todas as despesas lançadas, inclusive as do próximo mês!)
- Despesas que já abateram o saldo (próximo mês / futuras): ${formatBRL(futureDeducted)} (já foram 100% descontadas das contas; o usuário NÃO precisa pagar nada a mais além disso)
- Entradas registradas este mês: ${formatBRL(monthIncome)}
- Situação Geral: ${statusHumano}
- Total em investimentos: ${context.investedTotal > 0 ? formatBRL(context.investedTotal) : 'Zero investido ainda'}

DESPESAS QUE JÁ FORAM DEDUZIDAS DO SALDO:
${futureExpensesSummary || '• Nenhuma despesa futura além do mês atual.'}

MAIORES GASTOS RECENTES DESTE MÊS POR CATEGORIA:
${sortedCategories || '• Nenhuma despesa registrada neste mês.'}

ÚLTIMAS MOVIMENTAÇÕES REGISTRADAS:
${recentTransactions || '• Nenhuma movimentação recente.'}

METAS DA JORNADA DA MONTANHA:
${goalsSummary || '• Nenhuma meta cadastrada ainda.'}
`.trim();

  return SYSTEM_PROMPT.replace('{FINANCE_CONTEXT}', contextText);
}

/**
 * Chama a API da Pollinations AI com modelos inteligentes e fallback resiliente
 */
export async function callPollinationsAI(
  userMessage: string,
  history: ChatMessage[],
  context: FinanceContextData
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];

  // Modelos recomendados em ordem de preferência
  const models = ['openai-large', 'openai', 'mistral', 'qwen-coder'];

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model,
          seed: Math.floor(Math.random() * 1000000),
          temperature: 0.65,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      const cleaned = text.trim();

      if (cleaned.length > 0) {
        return cleaned;
      }
    } catch (err) {
      console.warn(`[Pollinations AI] Modelo ${model} falhou, tentando fallback:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  // Se todos os modelos falharem, fornecer diagnóstico de apoio local com base no saldo real
  console.error('[Pollinations AI] Todos os modelos falharam:', lastError);
  return getSmartLocalFallback(context);
}

/**
 * Fallback amigável e inteligente baseado no Saldo Real caso a API caia
 */
function getSmartLocalFallback(context: FinanceContextData): string {
  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const futureDeducted = context.nextMonthExpenses || context.futureExpenses || 0;

  if (futureDeducted > 0 && context.balance > 0) {
    return `Oi! Tô aqui de prontidão 🐾\n\nAnalisei suas contas com total clareza: você já cadastrou **${formatBRL(futureDeducted)}** em despesas (inclusive do próximo mês) que já foram abatidas do seu saldo, e você ainda tem **${formatBRL(context.balance)} livres e desimpedidos** sobrando na sua conta!\n\n💡 **Fique 100% em paz:** Você não precisa arranjar dinheiro extra para essas contas cadastradas porque elas já foram descontadas. Os **${formatBRL(context.balance)}** são a sua sobra limpa e real!\n\nComo posso te ajudar a planejar o uso dessa sobra hoje?`;
  }

  if (context.balance > 0) {
    return `Oi! Tô por aqui 🐾\n\nSeu saldo em conta está positivo e livre em **${formatBRL(context.balance)}**.\n\nQue tal separar uma pequena parte (R$ 10 ou R$ 20) para subir mais um passo na sua meta da montanha? Me conte como prefere conduzir!`;
  }

  return `Oi! Tô por aqui 🐾\n\nSeu saldo em conta está em **${formatBRL(context.balance)}**. Vamos dar um passo de cada vez para manter tudo organizado e com calma.\n\nQual conta ou dúvida está no seu radar agora?`;
}

/**
 * Utilitário para construir o histórico sem duplicar ou sobrecarregar
 */
export function buildHistory(rawMessages: { role: string; content: string }[]): ChatMessage[] {
  return rawMessages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-8)
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
}
