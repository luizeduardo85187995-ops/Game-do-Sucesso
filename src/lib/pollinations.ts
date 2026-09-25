/**
 * 🤖 Serviço de IA usando Pollinations AI
 *
 * ✅ 100% Gratuito
 * ✅ Sem chave API
 * ✅ Sem conta
 * ✅ Sem limites
 * ✅ Funciona via fetch direto no navegador e no APK
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

const SYSTEM_PROMPT = `Você é o Dante, o consultor financeiro de inteligência artificial do aplicativo "Minhas Finanças + Jornada da Meta": um mentor experiente, pragmático e altamente qualificado em economia pessoal, investimentos e finanças no Brasil.
Você se comunica sempre com empatia, objetividade, clareza e com Português do Brasil gramaticalmente perfeito, sem erros de concordância ou acentuação.

CONTEXTO FINANCEIRO DO USUÁRIO EM TEMPO REAL:
{FINANCE_CONTEXT}

DIRETRIZES DE COMUNICAÇÃO:
1. Sempre use a moeda brasileira (R$) e formate números no padrão oficial (ex.: R$ 1.500,00).
2. Baseie rigorosamente suas análises nos dados reais de saldo, receitas, despesas, investimentos e metas fornecidos no contexto.
3. Analise as categorias e descrições dos lançamentos para oferecer soluções concretas e planos de ação práticos.
4. Seja direto, motivador e focado em resultados — evite respostas genéricas, termos jurídicos prolixos ou jargões desnecessários.
5. Formate as respostas com elegância: utilize **negrito** para dados importantes e listas com marcadores (•) para facilitar a leitura rápida.
6. Ofereça conselhos alinhados ao mercado brasileiro: Taxa Selic, CDI, Tesouro Direto (Selic, IPCA+), CDBs com liquidez diária, Fundos Imobiliários (FIIs) e ações/ETFs na B3.
7. Incentive boas práticas comprovadas: Reserva de Emergência (3 a 6 meses de custos fixos) e a divisão orçamentária 50/30/20 (50% necessidades básicas, 30% estilo de vida, 20% poupança e investimentos).
8. Conecte suas recomendações com os objetivos da "Jornada da Meta" para estimular a disciplina de economizar.
9. Mantenha as respostas concisas e ricas em valor prático (~140 a 220 palavras).
10. Gramática e Ortografia: escreva sempre com correção gramatical impecável em Português do Brasil.
11. Caso o usuário faça perguntas não relacionadas a finanças ou orçamento, responda cordialmente de forma breve e convide-o a focar na gestão do seu patrimônio.`;

function buildSystemPrompt(context: FinanceContextData): string {
  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const recentTransactions = context.transactions
    .slice(0, 15)
    .map((t) => {
      const date = t.date ? new Date(t.date).toLocaleDateString('pt-BR') : '';
      const type = t.type === 'income' ? 'ENTRADA' : 'SAÍDA';
      const note = t.note ? ` | ${t.note}` : '';
      return `• ${date} | ${type} | ${t.category} | ${formatBRL(t.amount)}${note}`;
    })
    .join('\n');

  const investments = context.investments
    .slice(0, 10)
    .map((inv) => {
      const yieldInfo = inv.monthlyYield ? ` (rend. aprox. ${inv.monthlyYield}%/mês)` : '';
      return `• ${inv.code} (${inv.type.toUpperCase()}) - ${formatBRL(inv.amount)}${yieldInfo}`;
    })
    .join('\n');

  const goals = context.savingGoals
    .map((g) => {
      const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
      return `• ${g.emoji || '🎯'} ${g.name} - Meta: ${formatBRL(g.targetAmount)} (Atual: ${formatBRL(g.currentAmount)} | ${pct}%)`;
    })
    .join('\n');

  const contextText = `
SALDO ATUAL TOTAL: ${formatBRL(context.balance)}
ENTRADAS DO MÊS: ${formatBRL(context.monthIncome)}
SAÍDAS DO MÊS: ${formatBRL(context.monthExpense)}
RESULTADO LÍQUIDO DO MÊS: ${formatBRL(context.monthNet)}
TOTAL INVESTIDO EM ATIVOS: ${formatBRL(context.investedTotal)}
RENDA PASSIVA ESTIMADA: ${formatBRL(context.estimatedPassiveIncome)}/mês

ÚLTIMAS TRANSAÇÕES REGISTRADAS:
${recentTransactions || 'Nenhuma transação registrada ainda.'}

CARTEIRA DE INVESTIMENTOS:
${investments || 'Nenhum investimento registrado ainda.'}

METAS DA JORNADA:
${goals || 'Nenhuma meta de economia cadastrada ainda.'}
`.trim();

  return SYSTEM_PROMPT.replace('{FINANCE_CONTEXT}', contextText);
}

/**
 * Chama a API da Pollinations AI (sem chave, sem login, 100% gratuita)
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
    console.warn('Tentativa primária Pollinations openai falhou, tentando fallback GET/POST:', error);
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

  throw new Error('Não foi possível conectar ao Dante IA no momento. Verifique sua conexão com a internet e tente novamente.');
}

export function buildHistory(
  messages: { role: 'user' | 'assistant'; content: string }[]
): ChatMessage[] {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}
