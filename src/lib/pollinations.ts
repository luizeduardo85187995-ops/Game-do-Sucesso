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

REGRA DE OURO: SALDO REAL vs ENTRADAS DO MÊS vs DESPESAS FUTURAS:
1. DISTINÇÃO FUNDAMENTAL: NUNCA confunda "Entradas do Mês" com "Dinheiro que Sobrou na Conta"!
   - Se o usuário registrou uma entrada de R$ 1.100 este mês, mas o saldo em conta dele hoje é de apenas R$ 206,00, NÃO SOBROU R$ 1.100! O saldo real que ele tem na mão é R$ 206,00. O restante dos R$ 1.100 já foi utilizado, pago ou absorvido.
2. DESPESAS DO PRÓXIMO MÊS E DESPESAS FUTURAS (PLANEJAMENTO ANTECIPADO):
   - Se o usuário já cadastrou despesas para o próximo mês (ou contas agendadas), elogie muito essa atitude! Lançar contas futuras com antecedência é a melhor estratégia de organização preventiva.
   - Reconheça com total clareza: na prática, o saldo que a pessoa tem na conta hoje (ex: R$ 206) é exatamente o que será usado para pagar essas despesas futuras!
   - Portanto, esse dinheiro NÃO está livre nem "sobrando". Se a pessoa tem R$ 206 na conta e contas futuras já cadastradas, o saldo dela já está 100% comprometido.
   - NUNCA diga para uma pessoa nessas condições mandar dinheiro para a meta de investimentos ou gastar achando que "sobrou 1.100".
3. SE O USUÁRIO PERGUNTAR POR QUE ANTES DISSE "SOBROU 1.100" OU QUESTIONAR O ERRO:
   - Explique com humildade, empatia e sem rodeios:
     a) O sistema calculou o resultado contábil do mês corrente (Receitas de R$ 1.100 menos Despesas datadas neste mês = R$ 1.100) e usou a palavra "sobra" de forma equivocada.
     b) Porém, na vida real da pessoa, o que manda é o SALDO REAL EM CONTA (R$ 206) e as CONTAS JÁ AGENDADAS PARA O PRÓXIMO MÊS.
     c) O usuário está COBERTO DE RAZÃO: as despesas futuras já consom o saldo atual que ele tem. Não tem R$ 1.100 sobrando.
     d) Dê os parabéns ao usuário por ter essa visão preventiva inteligente, e trace com ele o plano para proteger os R$ 206 para garantir as contas do início do mês.

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
• Analise os dados reais do usuário (saldo real em conta, despesas futuras agendadas, metas) de forma simples e humana.
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

  // Separa transações por período (deste mês vs futuras)
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

  // Detalhes das despesas futuras agendadas
  const futureExpensesSummary = futureExpensesList
    .slice(0, 5)
    .map((t) => {
      const [y, m, d] = t.date.split('-');
      const dateBR = d && m ? `${d}/${m}` : t.date;
      const note = t.note ? ` ("${t.note}")` : '';
      return `• [Prevista para ${dateBR}] ${t.category}: ${formatBRL(t.amount)}${note}`;
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
  const monthExpense = context.monthExpense;
  const committedFuture = totalFutureExpenses || context.futureExpenses || 0;
  const projectedBalance = balance - committedFuture;

  let statusHumano = '';
  if (context.transactions.length === 0) {
    statusHumano = 'Usuário novo, ainda não lançou receitas ou despesas.';
  } else if (committedFuture > 0) {
    statusHumano = `ALERTA DE COMPROMISSO REAL: O usuário tem saldo de ${formatBRL(balance)} em conta, mas já cadastrou ${formatBRL(committedFuture)} em despesas futuras (para o próximo mês). Na vida real, o saldo atual já está comprometido para pagar essas contas! Não há folga livre de ${formatBRL(monthIncome)}. Saldo projetado após contas: ${formatBRL(projectedBalance)}.`;
  } else if (balance < context.monthNet) {
    statusHumano = `ALERTA DE SALDO: Entraram ${formatBRL(monthIncome)} no mês, mas o saldo real em conta é de ${formatBRL(balance)} (o restante já foi gasto ou pago). Não sobrou ${formatBRL(context.monthNet)}! O dinheiro disponível na mão hoje é de ${formatBRL(balance)}.`;
  } else if (context.monthNet > 0 && balance > 0) {
    statusHumano = `Saldo em conta de ${formatBRL(balance)} e resultado do mês positivo em +${formatBRL(context.monthNet)}. Se não houver contas futuras agendadas, pode separar um valor seguro para a meta.`;
  } else if (context.monthNet < 0 || balance < 0) {
    statusHumano = `Conta apertada ou no vermelho (${formatBRL(balance)} em conta). Precisa de acolhimento e foco em segurar gastos essenciais.`;
  } else {
    statusHumano = `Equilíbrio entre entradas e saídas. Saldo em conta: ${formatBRL(balance)}.`;
  }

  const contextText = `
DIAGNÓSTICO FINANCEIRO REAL:
- Saldo REAL em contas hoje: ${formatBRL(balance)} (o que realmente existe no banco)
- Quanto entrou com data deste mês: ${formatBRL(monthIncome)}
- Quanto saiu com data deste mês: ${formatBRL(monthExpense)}
- Despesas futuras já agendadas (próximo mês): ${formatBRL(committedFuture)} ${committedFuture > 0 ? '(CONTA REALMENTE COMPROMETIDA!)' : ''}
- Saldo Livre Projetado (Saldo menos despesas futuras): ${formatBRL(projectedBalance)}
- Leitura da Situação: ${statusHumano}
- Total em investimentos: ${context.investedTotal > 0 ? formatBRL(context.investedTotal) : 'Zero investido ainda (iniciante total)'}

DESPESAS FUTURAS AGENDADAS (QUE CONSOMEM O SALDO ATUAL):
${futureExpensesSummary || '• Nenhuma despesa futura agendada além do mês atual.'}

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
 * Fallback amigável e inteligente baseado no Saldo Real e Despesas Futuras caso a API caia
 */
function getSmartLocalFallback(context: FinanceContextData): string {
  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const committedFuture = context.nextMonthExpenses || context.futureExpenses || 0;

  if (committedFuture > 0) {
    return `Oi! Tô aqui de prontidão 🐾\n\nAnalisei suas contas: seu saldo em conta é de **${formatBRL(context.balance)}**, mas você já tem **${formatBRL(committedFuture)}** agendados em despesas para o próximo mês.\n\n💡 **Visão realista do Dante:** Você fez certinho em lançar essas despesas futuras com antecedência! O seu saldo atual é o que vai cobrir essas contas, por isso esse dinheiro já está comprometido. O foco agora é proteger cada centavo até as contas caírem!\n\nMe diga: quer que a gente revise essas despesas futuras para garantir que tudo fique em ordem?`;
  }

  if (context.balance < context.monthNet) {
    return `Oi! Tô aqui de prontidão 🐾\n\nVi que entraram **${formatBRL(context.monthIncome)}** no mês, mas o seu saldo real em conta hoje é de **${formatBRL(context.balance)}**.\n\n💡 **Visão realista do Dante:** Na prática, o que você tem na mão são esses **${formatBRL(context.balance)}**. Vamos cuidar desse saldo com carinho para não apertar nos próximos dias. Como posso te apoiar agora?`;
  }

  if (context.monthNet > 0 && context.balance > 0) {
    return `Oi! Tô por aqui 🐾\n\nSeu saldo em conta está em **${formatBRL(context.balance)}** e o mês está favorável com **${formatBRL(context.monthNet)}** de fluxo positivo.\n\nSe você não tiver contas para o início do próximo mês, que tal colocar uma pequena fatia (R$ 10 ou R$ 20) na sua meta para subir mais um passo na montanha? Me conte o que você prefere fazer!`;
  }

  return `Oi! Tô por aqui 🐾\n\nSeu saldo em conta está em **${formatBRL(context.balance)}**. Em momentos mais justos, o mais importante é não se desesperar: a gente dá um passo de cada vez para estancar gastos desnecessários.\n\nQual conta ou gasto está tirando mais o seu sono hoje? Vamos desatar esse nó juntos!`;
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
