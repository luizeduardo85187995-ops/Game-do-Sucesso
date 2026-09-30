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
import { callPollinationsAI, buildHistory, ChatMessage } from '../../lib/pollinations';
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
  const {
    transactions,
    investments,
    savingGoals,
    metrics,
    bankAccounts,
    expenseCategories,
    incomeCategories,
    categoryIcons,
    addTransaction,
    deleteTransaction,
  } = useFinance();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Financial Context
  const financeContext = {
    balance: metrics.balance,
    monthIncome: metrics.monthIncome,
    monthExpense: metrics.monthExpense,
    monthNet: metrics.monthNet,
    investedTotal: metrics.investedTotal,
    estimatedPassiveIncome: metrics.estimatedPassiveIncome,
    futureExpenses: metrics.futureExpenses,
    nextMonthExpenses: metrics.nextMonthExpenses,
    projectedBalance: metrics.projectedBalance,
    realFreeBalance: metrics.realFreeBalance,
    transactions,
    investments,
    savingGoals,
  };

  // Preview do comando digitado ao vivo para feedback instantâneo
  const livePreview = useMemo(() => {
    if (!input.trim() || input.length < 3) return null;
    return extractTransactionIntent(input, expenseCategories, incomeCategories, bankAccounts);
  }, [input, expenseCategories, incomeCategories, bankAccounts]);

  // Initial greeting with dynamic diagnostic
  useEffect(() => {
    let situacaoTexto = '';
    const committedFuture = metrics.nextMonthExpenses || metrics.futureExpenses || 0;
    const isNegative = metrics.balance < 0;
    const isPositive = metrics.balance > 0;
    const isZero = metrics.balance === 0;

    let saldoLinha = '';
    let sobraLinha = '';

    if (isNegative) {
      const deficit = Math.abs(metrics.balance);
      saldoLinha = `• 🔴 Saldo em conta: **-${formatBRL(deficit)}** (no vermelho / cheque especial)`;
      sobraLinha = `• ⚠️ Saldo livre disponível: **R$ 0,00** (Esgotado - você está com um déficit de ${formatBRL(deficit)})`;
      situacaoTexto = `🔴 Suas despesas cadastradas ultrapassaram as entradas em **${formatBRL(deficit)}**. É hora de estancar gastos supérfluos e avaliar novas entradas para zerar esse negativo com calma.`;
    } else if (isPositive) {
      saldoLinha = `• 💰 Saldo em conta: **${formatBRL(metrics.balance)}**`;
      sobraLinha = `• 🛡️ Saldo líquido livre disponível: **${formatBRL(metrics.balance)}** (sobra real)`;
      if (committedFuture > 0) {
        situacaoTexto = `🟢 Você já lançou e abateu **${formatBRL(committedFuture)}** em despesas (inclusive do próximo mês) e ainda tem **${formatBRL(metrics.balance)} livres sobrando** na conta! Excelente controle!`;
      } else {
        situacaoTexto = `🟢 Saldo positivo e livre de **${formatBRL(metrics.balance)}** nas suas contas.`;
      }
    } else {
      saldoLinha = `• ⚪ Saldo em conta: **R$ 0,00**`;
      sobraLinha = `• ⚠️ Saldo livre disponível: **R$ 0,00** (Sem folga no momento)`;
      situacaoTexto = `⚪ Saldo zerado nas contas.`;
    }

    const futureDetails =
      committedFuture > 0
        ? `\n• 📋 Despesas já abatidas no saldo: **${formatBRL(committedFuture)}** (já descontadas das suas contas)\n${sobraLinha}`
        : `\n${sobraLinha}`;

    const initialText =
      transactions.length === 0
        ? `Oi! Sou o **Dante**, seu mentor e parceiro inteligente aqui no **Minhas Finanças** 🐾⚡\n\nAgora sou **100% automático e proativo**: você pode conversar comigo OU pedir para eu lançar coisas diretamente aqui no chat!\n\n**O que você pode fazer:**\n• ⚡ **Lançamento Automático:** Digite *"Lança 150 de internet"*, *"Gastei 45 no almoço"* ou *"Recebi 2500 de salário"*, e eu lanço no seu extrato na hora!\n• 💵 **Limite Diário Seguro:** Me pergunte *"Quanto posso gastar por dia?"* e eu calculo sua cota diária até o fim do mês.\n• 🔍 **Auditoria de Ralos:** Me pergunte *"Onde estou gastando muito?"* e eu mostro os maiores vilões do seu orçamento.\n\nQual conta ou dúvida está no seu radar agora?`
        : `Oi! Sou o **Dante**, seu mentor financeiro ultra inteligente 🐾⚡\n\nJá analisei suas contas em tempo real:\n${saldoLinha}${futureDetails}\n• 📊 Situação real: ${situacaoTexto}\n• 📝 Lançamentos registrados: **${transactions.length} movimentações**\n• 🎯 Metas ativas na montanha: **${savingGoals.length} meta(s)**\n\n💡 **Comandos Automáticos:** Pode me pedir coisas como *"Lança 150 de internet"*, *"Gastei 40 no uber"*, ou perguntar *"Quanto posso gastar por dia até o fim do mês?"*! O que quer fazer agora?`;

    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: initialText,
        timestamp: new Date(),
      },
    ]);
  }, []);

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

      const responseText = await callPollinationsAI(
        effectivePrompt,
        history.slice(0, -1),
        financeContext
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
  ];

  if (!isPro) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <ProFeatureLock
          title="Dante IA: Consultor Financeiro Particular"
          subtitle="Tenha um consultor financeiro particular inteligente conectado aos seus lançamentos, receitas, despesas e metas em tempo real."
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
              title: 'Auditoria de Ralos e Desperdícios',
              desc: 'Identificação imediata de onde cortar sem sofrimento.',
            },
            {
              title: 'Estratégias para o Jogo da Meta',
              desc: 'Planos de ação práticos para economizar mais rápido e subir de nível.',
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
                Dante <span className="text-cyan-400 neon-text-cyan">• Mentor Financeiro Ultra Inteligente</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                AUTO-EXECUÇÃO
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              Peça para lançar despesas, calcular limite diário ou auditar gastos: o Dante faz tudo na hora!
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
                <span>Dante está analisando suas contas e executando ações...</span>
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
