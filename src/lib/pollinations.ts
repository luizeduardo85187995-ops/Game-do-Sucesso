/**
 * 🤖 Serviço de IA usando Pollinations AI
 *
 * ✅ 100% Gratuito
 * ✅ Sem chave API
 * ✅ Sem conta
 * ✅ Sem limites
 * ✅ Focado em Educação Comportamental e Mudança de Hábitos Financeiros
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface FinanceContextData {
  balance: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  investedTotal: number;
  estimatedPassiveIncome: number;
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
• Você lida com pessoas que AINDA NÃO INVESTEM, pessoas que NUNCA tiveram educação financeira na escola, pessoas DESORGANIZADAS financeiramente ou com a conta no vermelho.
• Sua missão principal NÃO é vender ações ou teorias econômicas. Sua missão é AJUDAR A PESSOA A MUDAR DE HÁBITOS, dar o primeiro passo, recuperar o controle da vida financeira e encontrar paz e tranquilidade com o dinheiro.
• Você NUNCA julga, NUNCA dá bronca e NUNCA faz a pessoa se sentir culpada ou envergonhada pelos erros do passado. Todo mundo já se enrolou com dinheiro; o importante é o que fazemos hoje.

DIRETRIZES DE LINGUAGEM E DIDÁTICA (ZERO FINANCÊS):
1. Use Português do Brasil natural, caloroso, simples e direto.
2. NUNCA use termos técnicos sem explicar ou palavras intimidadoras como: "superávit", "déficit", "telemetria", "benchmarking", "hedge", "volatilidade", "portfólio de equities".
3. Substitua termos técnicos por linguagem do dia a dia:
   - Em vez de "déficit": diga "as saídas foram maiores do que as entradas este mês / fechou no vermelho".
   - Em vez de "superávit": diga "sobrou um dinheirinho este mês / conta positiva".
   - Em vez de "reserva de liquidez": diga "caixinha de emergência / reserva para imprevistos".
   - Em vez de "ativos geradores de renda": diga "dinheiro que trabalha para você e pinga na conta todo mês".
4. Use exemplos práticos da vida real: delivery por cansaço, cafezinho diário, compras por impulso no cartão, parcelamento sem fim, medo de abrir o aplicativo do banco.

ESTRATÉGIAS COMPORTAMENTAIS PRÁTICAS QUE VOCÊ ENSINA:
1. Micro-hábitos (Começar Pequeno): Se a pessoa não consegue guardar R$ 300, incentive-a a guardar R$ 10, R$ 20 ou R$ 50 no dia que o dinheiro cair na conta. O que importa no começo é o MÚSCULO DO HÁBITO, não o valor.
2. A Regra do Pague-se Primeiro: Antes de pagar o boleto ou gastar no final de semana, tire R$ 20 para sua meta da Jornada da Meta.
3. A Regra das 24 Horas para Impulso: Bateu vontade de comprar algo que não é comida ou remédio? Espere 24 horas. Na maioria das vezes a vontade passa.
4. Identificar os "Ralos Invisíveis": Pequenos gastos diários (aplicativos de entrega por preguiça, taxas de conta que pode isentar, assinaturas esquecidas).
5. Estratégia para Dívidas: Focar em parar de usar o rotativo do cartão e cheque especial (que têm juros abusivos), renegociar com desconto e pagar uma de cada vez (método bola de neve).
6. Se a pessoa tiver zero investimentos: NUNCA recomende ações ou FIIs de cara. O primeiro passo dela é montar uma pequena reserva em um lugar 100% seguro (Tesouro Selic ou CDB com liquidez diária do próprio banco, que rende mais que a poupança e tem segurança total).

COMO RESPONDER:
• Comece com empatia ou reconhecimento positivo do esforço da pessoa.
• Analise os dados reais do usuário (saldo, gastos principais, metas) de forma simples e humana.
• Dê no máximo 2 ou 3 passos práticos e fáceis de aplicar ainda hoje (Passo 1, Passo 2, Passo 3).
• Conecte com a "Jornada da Meta" para animar o usuário a escalar a montanha e comemorar pequenas vitórias.
• Formate com negritos nos pontos-chave e emojis amigáveis (💡, 🎯, 🚀, 🛡️, 👏, 💰).
• Respostas concisas, humanas e motivadoras (entre 120 e 200 palavras).

CONTEXTO REAL DO USUÁRIO AGORA:
{FINANCE_CONTEXT}`;

function buildSystemPrompt(context: FinanceContextData): string {
  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // Calcula maiores categorias de despesa
  const expenseByCategory: Record<string, number> = {};
  let totalExpenses = 0;

  context.transactions.forEach((t) => {
    if (t.type === 'expense') {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      totalExpenses += t.amount;
    }
  });

  const sortedCategories = Object.entries(expenseByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([cat, val]) => {
      const pct = totalExpenses > 0 ? Math.round((val / totalExpenses) * 100) : 0;
      return `• ${cat}: ${formatBRL(val)} (${pct}% do que gastou)`;
    })
    .join('\n');

  // Últimas transações com descrição
  const recentTransactions = context.transactions
    .slice(0, 10)
    .map((t) => {
      const type = t.type === 'income' ? '🟢 Entrou' : '🔴 Saiu';
      const note = t.note ? ` ("${t.note}")` : '';
      return `• ${type} ${formatBRL(t.amount)} em ${t.category}${note}`;
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

  // Diagnóstico amigável para o Dante
  const net = context.monthNet;
  let statusHumano = '';
  if (context.transactions.length === 0) {
    statusHumano = 'Usuário novo, ainda não lançou receitas ou despesas este mês.';
  } else if (net > 0) {
    statusHumano = `Sobrou dinheiro este mês (+${formatBRL(net)} de folga). Oportunidade perfeita para mandar um pedacinho para a meta!`;
  } else if (net < 0) {
    statusHumano = `Está no vermelho este mês em -${formatBRL(Math.abs(net))}. Precisa de acolhimento e passos simples para estancar despesas supérfluas sem desespero.`;
  } else {
    statusHumano = 'Empatou certinho receitas e despesas este mês (nem sobrou, nem faltou).';
  }

  const contextText = `
DIAGNÓSTICO RESUMIDO:
- Saldo em contas hoje: ${formatBRL(context.balance)}
- Quanto entrou no mês: ${formatBRL(context.monthIncome)}
- Quanto saiu no mês: ${formatBRL(context.monthExpense)}
- Situação do mês: ${statusHumano}
- Total em investimentos: ${context.investedTotal > 0 ? formatBRL(context.investedTotal) : 'Zero investido ainda (iniciante total)'}

MAIORES GASTOS RECENTES POR CATEGORIA:
${sortedCategories || '• Nenhuma despesa lançada ainda.'}

ÚLTIMAS MOVIMENTAÇÕES REGISTRADAS:
${recentTransactions || '• Nenhuma movimentação recente.'}

METAS DA JORNADA DA MONTANHA:
${goalsSummary || '• Nenhuma meta cadastrada ainda (ótima oportunidade para sugerir criar uma!).'}
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

  // Tentativa 1: Endpoint OpenAI / GPT-4o-mini
  try {
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai',
        messages,
        temperature: 0.7,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    }
  } catch (error) {
    console.warn('Tentativa primária Pollinations openai falhou, tentando fallback:', error);
  }

  // Fallback 1: Endpoint simples do Pollinations (POST /)
  try {
    const response2 = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: 'openai',
      }),
    });

    if (response2.ok) {
      const contentType = response2.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data2 = await response2.json();
        const text2 = data2?.choices?.[0]?.message?.content || data2?.text;
        if (text2 && text2.trim().length > 0) return text2.trim();
      } else {
        const textPlain = await response2.text();
        if (textPlain && textPlain.trim().length > 0) return textPlain.trim();
      }
    }
  } catch (error2) {
    console.warn('Fallback 1 Pollinations falhou:', error2);
  }

  // Fallback 2: Chamada com URL encode
  try {
    const promptCombined = `${systemPrompt}\n\nPergunta do Usuário: ${userMessage}`;
    const url = `https://text.pollinations.ai/${encodeURIComponent(promptCombined)}?model=openai`;
    const res = await fetch(url);
    if (res.ok) {
      const plain = await res.text();
      if (plain && plain.trim().length > 0) return plain.trim();
    }
  } catch (error3) {
    console.warn('Fallback 2 Pollinations falhou:', error3);
  }

  throw new Error('Não consegui me conectar no momento. Verifique sua conexão com a internet e vamos tentar de novo!');
}

export function buildHistory(
  messages: { role: 'user' | 'assistant'; content: string }[]
): ChatMessage[] {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}
