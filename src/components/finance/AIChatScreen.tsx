import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Wallet,
  PiggyBank,
  PieChart,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Undo2,
  Calendar,
  Building2,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Flame,
  Zap,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { callDanteAI, buildHistory, DanteMode } from '../../lib/danteAI';
import { useAuth } from '../../context/AuthContext';
import { formatBRL, formatDateBR } from '../../utils/format';
import { useSubscription } from '../../context/SubscriptionContext';
import ProFeatureLock from '../subscription/ProFeatureLock';
import { getCategoryMeta } from '../../data/categories';
import {
  extractTransactionIntent,
  calculateSafeDailyBudget,
  auditTopExpenseLeaks,
  DanteActionExecuted,
} from '../../services/danteAgentService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionExecuted?: {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    date: string;
    bankName: string;
    note: string;
    undone?: boolean;
  };
  budgetCard?: {
    dailyBudget: number;
    daysRemaining: number;
    status: 'safe' | 'tight' | 'negative';
  };
}

export default function AIChatScreen() {
  const { isPro } = useSubscription();
  const { user } = useAuth();
  const {
    transactions,
    investments,
    savingGoals,
    metrics,
    bankAccounts,
    dividendEvents,
    goals,
    base,
    investmentFocus,
    expenseCategories,
    incomeCategories,
    categoryIcons,
    addTransaction,
    deleteTransaction,
  } = useFinance();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [danteMode, setDanteMode] = useState<DanteMode>('equilibrado');
  const [historyReady, setHistoryReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadedHistoryIdentityRef = useRef<string | null>(null);

  const identityKey = user?.uid || 'guest';
  const historyStorageKey = `@dante/history_v2_${identityKey}`;
  const modeStorageKey = `@dante/mode_v2_${identityKey}`;

  // Financial Context
  const financeContext = {
    ...metrics,
    transactions,
    bankAccounts,
    investments,
    savingGoals,
    dividendEvents,
    goals,
    base,
    investmentFocus,
  };

  // Preview do comando digitado ao vivo para feedback instantâneo
  const livePreview = useMemo(() => {
    if (!input.trim() || input.length < 3) return null;
    return extractTransactionIntent(input, expenseCategories, incomeCategories, bankAccounts);
  }, [input, expenseCategories, incomeCategories, bankAccounts]);

  const buildWelcomeMessage = (): Message => {
    const committedFuture = metrics.nextMonthExpenses || metrics.futureExpenses || 0;
    const balance = metrics.balance;
    const intro =
      transactions.length === 0
        ? `Oi! Sou o **Dante**, seu consultor e treinador financeiro 🐾\n\nMeu trabalho é te ajudar a criar bons hábitos com dinheiro, não só responder perguntas. Conforme você registra sua vida financeira, eu consigo enxergar padrões, desperdícios, metas e evolução.\n\nPode começar simples: *"onde estou errando?"*, *"quanto posso gastar por dia?"* ou *"lança 150 de internet"*.`
        : `Oi! Sou o **Dante**, seu consultor e treinador financeiro 🐾\n\nJá tenho acesso ao contexto do seu app nesta conversa: **${transactions.length} lançamentos**, **${savingGoals.length} meta(s)** e **${investments.length} investimento(s)**.\n\n• Saldo atual: **${formatBRL(balance)}**\n• Entradas no mês: **${formatBRL(metrics.monthIncome)}**\n• Saídas no mês: **${formatBRL(metrics.monthExpense)}**${committedFuture > 0 ? `\n• Despesas futuras cadastradas: **${formatBRL(committedFuture)}**` : ''}\n\nMe pergunte algo que eu vou analisar seu comportamento financeiro de verdade, usando seus dados — não conselho genérico.`;

    return {
      id: 'welcome',
      role: 'assistant',
      content: intro,
      timestamp: new Date(),
    };
  };

  // Carrega preferência de personalidade e histórico do Dante por usuário.
  useEffect(() => {
    loadedHistoryIdentityRef.current = null;
    setHistoryReady(false);

    try {
      const savedMode = localStorage.getItem(modeStorageKey);
      if (savedMode === 'vira_homem' || savedMode === 'equilibrado') {
        setDanteMode(savedMode);
      } else {
        setDanteMode('equilibrado');
      }

      const rawHistory = localStorage.getItem(historyStorageKey);
      if (rawHistory) {
        const parsed = JSON.parse(rawHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const restored = parsed.slice(-30).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp || Date.now()),
          })) as Message[];
          setMessages(restored);
          loadedHistoryIdentityRef.current = identityKey;
          setHistoryReady(true);
          return;
        }
      }
    } catch (error) {
      console.warn('Não foi possível restaurar a conversa do Dante:', error);
    }

    setMessages([buildWelcomeMessage()]);
    loadedHistoryIdentityRef.current = identityKey;
    setHistoryReady(true);
  }, [identityKey]);

  // Mantém a memória recente do acompanhamento no dispositivo.
  useEffect(() => {
    if (!historyReady || messages.length === 0 || loadedHistoryIdentityRef.current !== identityKey) return;
    try {
      localStorage.setItem(historyStorageKey, JSON.stringify(messages.slice(-30)));
    } catch (error) {
      console.warn('Não foi possível salvar a memória do Dante:', error);
    }
  }, [messages, historyReady, historyStorageKey]);

  useEffect(() => {
    if (!historyReady || loadedHistoryIdentityRef.current !== identityKey) return;
    try {
      localStorage.setItem(modeStorageKey, danteMode);
    } catch {
      // Preferência de estilo não é crítica.
    }
  }, [danteMode, historyReady, modeStorageKey]);

  const changeDanteMode = (nextMode: DanteMode) => {
    if (nextMode === danteMode) return;

    if (nextMode === 'vira_homem') {
      const accepted = window.confirm(
        'Ativar o modo "Vira Homem"?\n\nNesse modo o Dante será propositalmente duro, sarcástico e poderá usar palavrões ao confrontar gastos desnecessários. A bronca será sobre o comportamento financeiro, não sobre você como pessoa.'
      );
      if (!accepted) return;
    }

    setDanteMode(nextMode);
  };

  const clearDanteHistory = () => {
    const accepted = window.confirm('Limpar a conversa e começar um novo acompanhamento com o Dante?');
    if (!accepted) return;
    try {
      localStorage.removeItem(historyStorageKey);
    } catch {
      // ignore
    }
    setMessages([buildWelcomeMessage()]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || input).trim();
    if (!promptToSend || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: promptToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setIsTyping(true);

    // ==========================================================
    // ETAPA 1: DETECÇÃO DE AÇÕES AUTOMÁTICAS (AGENTIC EXECUTION)
    // ==========================================================
    let actionExecutedData: Message['actionExecuted'] | undefined = undefined;
    let budgetCardData: Message['budgetCard'] | undefined = undefined;
    let systemInjection = '';

    // A. Detecção de Lançamento Automático
    const detectedTx = extractTransactionIntent(
      promptToSend,
      expenseCategories,
      incomeCategories,
      bankAccounts
    );

    if (detectedTx) {
      const createdTx = addTransaction({
        type: detectedTx.type,
        amount: detectedTx.amount,
        category: detectedTx.category,
        date: detectedTx.date,
        note: detectedTx.note,
        bankAccountId: detectedTx.bankAccountId,
      });

      const bankObj = bankAccounts.find((b) => b.id === detectedTx.bankAccountId);

      actionExecutedData = {
        id: createdTx.id,
        type: createdTx.type,
        amount: createdTx.amount,
        category: createdTx.category,
        date: createdTx.date,
        bankName: bankObj?.bankName || 'Conta Corrente',
        note: createdTx.note || '',
      };

      systemInjection += `\n[COMANDO AUTOMÁTICO EXECUTADO PELO SISTEMA: O lançamento de ${
        createdTx.type === 'income' ? 'RECEITA' : 'DESPESA'
      } no valor de ${formatBRL(createdTx.amount)} na categoria "${
        createdTx.category
      }" para a data ${formatDateBR(
        createdTx.date
      )} JÁ FOI AUTOMATICAMENTE REGISTRADO NO BANCO DE DADOS PELO SISTEMA. Confirme alegremente ao usuário que a ação foi executada com sucesso, mencione o valor e a categoria com clareza, e mostre como isso impacta o saldo dele.]\n`;
    }

    // B. Detecção de Pergunta sobre Limite Diário Seguro
    const normPrompt = promptToSend.toLowerCase();
    if (
      normPrompt.includes('quanto posso gastar') ||
      normPrompt.includes('limite diario') ||
      normPrompt.includes('por dia') ||
      normPrompt.includes('posso gastar hoje')
    ) {
      const budgetInfo = calculateSafeDailyBudget(metrics.realFreeBalance || metrics.balance);
      budgetCardData = {
        dailyBudget: budgetInfo.dailyBudget,
        daysRemaining: budgetInfo.daysRemaining,
        status: budgetInfo.status,
      };

      systemInjection += `\n[CÁLCULO EXATO DE LIMITE DIÁRIO: Saldo livre = ${formatBRL(
        metrics.realFreeBalance || metrics.balance
      )}, Dias restantes = ${budgetInfo.daysRemaining}, Limite diário seguro = ${formatBRL(
        budgetInfo.dailyBudget
      )}/dia. Explique isso com didática e firmeza ao usuário.]\n`;
    }

    // C. Detecção de Pergunta sobre Ralos de Dinheiro
    if (
      normPrompt.includes('ralos') ||
      normPrompt.includes('onde estou gastando') ||
      normPrompt.includes('maiores gastos') ||
      normPrompt.includes('cortar gastos')
    ) {
      const leaks = auditTopExpenseLeaks(transactions);
      systemInjection += `\n[AUDITORIA DE RALOS EXECUTADA:\n${leaks.summary}\nUse exatamente esses números reais nos seus conselhos.]\n`;
    }

    try {
      const history = buildHistory(
        messages
          .filter((m) => m.id !== 'welcome')
          .concat(userMsg)
          .map((m) => ({ role: m.role, content: m.content }))
      );

      const effectivePrompt = systemInjection
        ? `${promptToSend}\n\n${systemInjection}`
        : promptToSend;

      const responseText = await callDanteAI(
        effectivePrompt,
        history.slice(0, -1),
        financeContext,
        danteMode
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        actionExecuted: actionExecutedData,
        budgetCard: budgetCardData,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Falha ao processar a resposta da IA.';
      const fallbackText = actionExecutedData
        ? `✅ **Lançamento Registrado com Sucesso!**\n\nLancei automaticamente ${
            actionExecutedData.type === 'income' ? '🟢 Receita' : '🔴 Despesa'
          } de **${formatBRL(actionExecutedData.amount)}** em **${
            actionExecutedData.category
          }** na sua conta.\n\nSeu saldo foi atualizado no sistema!`
        : `⚠️ **Aviso:** ${errMsg}\n\nPor favor, tente novamente em instantes.`;

      const errorAssistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackText,
        timestamp: new Date(),
        actionExecuted: actionExecutedData,
        budgetCard: budgetCardData,
      };
      setMessages((prev) => [...prev, errorAssistantMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Desfazer lançamento feito pelo Dante
  const handleUndoTransaction = (messageId: string, transactionId: string) => {
    deleteTransaction(transactionId);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId && m.actionExecuted) {
          return {
            ...m,
            actionExecuted: {
              ...m.actionExecuted,
              undone: true,
            },
          };
        }
        return m;
      })
    );
  };

  const SUGGESTIONS = [
    {
      label: '⚡ Lançar 150 de Internet',
      query: 'Lança 150 de internet pra mim dia 10',
    },
    {
      label: '💵 Quanto posso gastar por dia?',
      query: 'Quanto posso gastar por dia até o final do mês sem ficar no vermelho?',
    },
    {
      label: '🔍 Meus 3 maiores ralos de dinheiro',
      query: 'Dá uma olhada nos meus lançamentos e me mostra onde está indo a maior parte do meu dinheiro e onde dá pra cortar.',
    },
    {
      label: '⚖️ Meu saldo aguenta as contas?',
      query: 'Dá uma olhada no meu saldo real em conta e nas despesas já lançadas. O meu dinheiro vai dar conta com tranquilidade?',
    },
    {
      label: '🛍️ Como parar de gastar por impulso?',
      query: 'Tenho muita dificuldade com compras por impulso e delivery. Quais hábitos fáceis você me ensina pra frear isso?',
    },
    {
      label: '🧗 Como acelerar minha Meta na montanha?',
      query: 'Com base no meu saldo e nos meus gastos de hoje, qual o plano de ação mais realista para eu avançar na minha Meta?',
    },
    {
      label: '🧠 Onde estou me sabotando?',
      query: 'Analise meu histórico, categorias e descrições e me diga onde meus hábitos estão atrapalhando minhas metas. Use números reais e não passe pano.',
    },
  ];

  if (!isPro) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <ProFeatureLock
          title="Dante IA: Consultor Financeiro Particular"
          subtitle="Tenha um treinador financeiro conectado aos seus lançamentos, categorias, metas e investimentos para mudar hábitos de verdade."
          icon={<Bot className="w-10 h-10 text-slate-950" />}
          benefits={[
            {
              title: 'Lançamento Automático por Voz ou Texto',
              desc: 'Diga "Gastei 50 no almoço" e o Dante lança direto no seu extrato.',
            },
            {
              title: 'Cálculo de Limite Diário Seguro',
              desc: 'Saiba exatamente quanto pode gastar por dia para não faltar dinheiro.',
            },
            {
              title: 'Análise de Hábitos e Ralos',
              desc: 'O Dante compara meses, categorias e descrições para encontrar padrões que estão sabotando suas metas.',
            },
            {
              title: 'Modo Equilibrado ou Vira Homem 🔥',
              desc: 'Escolha entre orientação firme e didática ou uma cobrança direta, sem passar pano para gasto desnecessário.',
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Top Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-cyan-950/70 via-slate-900/90 to-blue-950/70 border border-cyan-400/40 p-4 sm:p-6 shadow-2xl backdrop-blur-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden hud-border-corners group">
        <div className="holo-scanline" />
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-xl shadow-cyan-500/30 shrink-0 ring-2 ring-cyan-300/40">
            <Bot className="w-7 h-7 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white font-mono tracking-tight flex items-center gap-2">
                Dante <span className="text-cyan-400 neon-text-cyan">• Consultor & Treinador Financeiro</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                AUTO-EXECUÇÃO
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              Ele lê seus lançamentos, metas, contas e investimentos para te ajudar a construir bons hábitos financeiros.
            </p>
          </div>
        </div>

        {/* Quick HUD Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono relative z-10">
          <div className="bg-slate-900/60 border border-white/10 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400 block text-[9px]">
              {metrics.balance >= 0 ? 'SALDO LIVRE' : 'SALDO (NO VERMELHO)'}
            </span>
            <span
              className={`font-bold ${
                metrics.balance >= 0 ? 'text-cyan-300' : 'text-rose-400 font-mono'
              }`}
            >
              {formatBRL(metrics.balance)}
            </span>
          </div>
          <div className="bg-slate-900/60 border border-white/10 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400 block text-[9px]">INVESTIDO</span>
            <span className="font-bold text-emerald-400">{formatBRL(metrics.investedTotal)}</span>
          </div>
          <div className="bg-slate-900/60 border border-white/10 rounded-xl px-2.5 py-1.5 col-span-2 sm:col-span-1">
            <span className="text-slate-400 block text-[9px]">TRANSAÇÕES</span>
            <span className="font-bold text-amber-300">{transactions.length} registros</span>
          </div>
        </div>
      </div>

      {/* Personalidade do Dante */}
      <div className="rounded-2xl bg-slate-950/75 border border-white/10 px-3.5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${danteMode === 'vira_homem' ? 'bg-orange-500/20 border border-orange-400/40 text-orange-300' : 'bg-cyan-500/15 border border-cyan-400/30 text-cyan-300'}`}>
            {danteMode === 'vira_homem' ? <Flame className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </div>
          <div>
            <div className="text-xs font-bold text-white">Estilo do Dante</div>
            <div className="text-[10px] text-slate-400 font-mono">
              {danteMode === 'vira_homem'
                ? 'Direto, duro e sem passar pano para gasto desnecessário.'
                : 'Didático, firme e focado em criar hábitos que duram.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-xl bg-slate-900 border border-white/10">
            <button
              onClick={() => changeDanteMode('equilibrado')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition ${
                danteMode === 'equilibrado'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Equilibrado
            </button>
            <button
              onClick={() => changeDanteMode('vira_homem')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1 ${
                danteMode === 'vira_homem'
                  ? 'bg-orange-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-orange-300'
              }`}
            >
              <Flame className="w-3 h-3" /> Vira Homem
            </button>
          </div>
          <button
            onClick={clearDanteHistory}
            className="h-9 px-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition"
            title="Nova conversa"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="relative rounded-3xl bg-slate-950/85 border border-cyan-500/30 shadow-2xl backdrop-blur-2xl flex flex-col h-[540px] sm:h-[600px] overflow-hidden hud-border-corners">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isAssistant = msg.role === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
              >
                {isAssistant && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 shadow-sm shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-slate-950" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-lg ${
                    isAssistant
                      ? 'bg-slate-900/90 border border-white/10 text-slate-100 rounded-tl-sm'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm'
                  }`}
                >
                  {/* Card de Ação Executada Automaticamente */}
                  {msg.actionExecuted && (
                    <div className="mb-3 p-3 rounded-xl bg-slate-950/90 border border-cyan-400/40 shadow-inner space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                          Lançado Automaticamente no Extrato
                        </span>
                        {msg.actionExecuted.undone ? (
                          <span className="text-[10px] font-mono text-rose-400 font-bold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30">
                            Desfeito
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              handleUndoTransaction(msg.id, msg.actionExecuted!.id)
                            }
                            className="text-[10px] font-mono text-slate-400 hover:text-rose-300 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/5 transition"
                            title="Desfazer este lançamento"
                          >
                            <Undo2 className="w-3 h-3" />
                            <span>Desfazer</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                            msg.actionExecuted.type === 'income'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {msg.actionExecuted.type === 'income' ? (
                            <>
                              <ArrowUpRight className="w-3 h-3" /> Receita
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="w-3 h-3" /> Despesa
                            </>
                          )}
                        </span>

                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          <span>
                            {categoryIcons[msg.actionExecuted.category] ||
                              getCategoryMeta(msg.actionExecuted.category).emoji}
                          </span>
                          <span>{msg.actionExecuted.category}</span>
                        </span>

                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/10 text-white">
                          {formatBRL(msg.actionExecuted.amount)}
                        </span>

                        <span className="px-2 py-0.5 rounded-lg text-[10px] text-slate-300 bg-white/5 border border-white/10 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDateBR(msg.actionExecuted.date)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Card de Orçamento Diário Seguro */}
                  {msg.budgetCard && (
                    <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-950/80 border border-emerald-400/40 shadow-inner flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                          Limite Diário Seguro
                        </span>
                        <div className="text-base sm:text-lg font-black text-emerald-300 font-mono mt-0.5">
                          {formatBRL(msg.budgetCard.dailyBudget)}{' '}
                          <span className="text-[10px] font-normal text-slate-400">/ dia</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-400 block">
                          Dias Restantes
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan-300">
                          {msg.budgetCard.daysRemaining} dias
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Texto da Resposta */}
                  <div className="whitespace-pre-wrap font-sans space-y-1.5">
                    {msg.content.split('\n').map((line, idx) => {
                      if (line.startsWith('• ') || line.startsWith('- ')) {
                        return (
                          <div key={idx} className="flex items-start gap-1.5 ml-1">
                            <span className="text-cyan-400 font-bold">•</span>
                            <span>{renderFormattedText(line.substring(2))}</span>
                          </div>
                        );
                      }
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return (
                          <div key={idx} className="font-bold text-cyan-300 text-sm mt-1">
                            {line.replace(/\*\*/g, '')}
                          </div>
                        );
                      }
                      return <p key={idx}>{renderFormattedText(line)}</p>;
                    })}
                  </div>

                  <div
                    className={`text-[10px] font-mono mt-2 text-right ${
                      isAssistant ? 'text-slate-500' : 'text-cyan-200'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {!isAssistant && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-1 shadow-sm font-mono">
                    EU
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="rounded-2xl px-4 py-2.5 bg-slate-900/90 border border-white/10 text-cyan-400 font-mono text-xs flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>{danteMode === 'vira_homem' ? 'Dante está procurando onde você está se sabotando...' : 'Dante está analisando seu histórico financeiro e seus hábitos...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Live Input Detection HUD */}
        {livePreview && (
          <div className="px-4 py-1.5 bg-cyan-950/60 border-t border-cyan-500/30 flex items-center gap-2 text-xs font-mono animate-fade-in">
            <span className="text-[10px] font-bold text-cyan-300 uppercase flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" /> Dante vai lançar automaticamente:
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                livePreview.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {livePreview.type === 'income' ? '+ Receita' : '- Despesa'} {formatBRL(livePreview.amount)}
            </span>
            <span className="text-slate-400 text-[10px]">em {livePreview.category}</span>
            <span className="text-slate-500 text-[10px]">({formatDateBR(livePreview.date)})</span>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-white/5 bg-slate-900/40 overflow-x-auto no-scrollbar flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Ações Rápidas:
          </span>
          {SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.query)}
              disabled={isTyping}
              className="text-[11px] font-mono whitespace-nowrap px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 hover:border-cyan-500/40 border border-white/10 text-slate-300 hover:text-cyan-300 transition shrink-0 active:scale-95 disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#070d1e]/90">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma dúvida ou ordene: 'Lança 150 de internet', 'Gastei 45 no almoço'..."
              rows={2}
              className="flex-1 bg-slate-900/80 border border-white/15 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 resize-none font-sans"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="h-11 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline font-mono text-xs">ENVIAR</span>
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 px-1">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" />
              Auto-Execução Ativa: Lançamentos digitados são salvos automaticamente no extrato
            </span>
            <span className="hidden sm:inline">
              Pressione Enter para enviar (Shift+Enter para quebrar linha)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to parse simple bold markdown text
function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong
          key={i}
          className="font-bold text-cyan-300 [.theme-pro_light_&]:text-blue-700 print:text-slate-900"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
