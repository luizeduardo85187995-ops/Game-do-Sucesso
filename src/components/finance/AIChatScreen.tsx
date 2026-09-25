import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { callPollinationsAI, buildHistory, ChatMessage } from '../../lib/pollinations';
import { formatBRL } from '../../utils/format';
import { useSubscription } from '../../context/SubscriptionContext';
import ProFeatureLock from '../subscription/ProFeatureLock';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatScreen() {
  const { isPro } = useSubscription();
  const { transactions, investments, savingGoals, metrics } = useFinance();

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
    transactions,
    investments,
    savingGoals,
  };

  // Initial greeting with dynamic diagnostic
  useEffect(() => {
    const initialText =
      transactions.length === 0
        ? `Olá! Sou o **Dante**, seu consultor financeiro com inteligência artificial no **Minhas Finanças**.\n\nEstou conectado aos seus registros para ajudar você com:\n• 📊 **Diagnóstico financeiro completo** do seu fluxo de caixa e despesas\n• 💡 **Orientações práticas de investimentos** (CDB, Tesouro Selic, FIIs e ações)\n• 🛡️ **Cálculo da reserva de emergência** ideal para sua tranquilidade\n• 🎮 **Estratégias práticas para acelerar sua Jornada da Meta**\n\nCadastre suas receitas e despesas ou digite sua dúvida financeira abaixo!`
        : `Olá! Sou o **Dante**, seu consultor financeiro de inteligência artificial. Seus registros estão sincronizados em tempo real!\n\n**Seu Diagnóstico Atual:**\n• Saldo Total em Contas: **${formatBRL(metrics.balance)}**\n• Resultado deste Mês: **${formatBRL(metrics.monthNet)}**\n• Total em Investimentos: **${formatBRL(metrics.investedTotal)}**\n• Renda Passiva Estimada: **${formatBRL(metrics.estimatedPassiveIncome)}/mês**\n• Lançamentos analisados: **${transactions.length}**\n\nComo posso ajudar você a planejar, economizar ou investir melhor hoje?`;

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

    try {
      const history = buildHistory(
        messages
          .filter((m) => m.id !== 'welcome')
          .concat(userMsg)
          .map((m) => ({ role: m.role, content: m.content }))
      );

      const responseText = await callPollinationsAI(
        promptToSend,
        history.slice(0, -1),
        financeContext
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Falha ao processar a resposta da IA.';
      const errorAssistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ **Aviso:** ${errMsg}\n\nPor favor, tente novamente em instantes.`,
        timestamp: new Date(),
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

  const SUGGESTIONS = [
    { label: 'Como está meu saldo e resultado?', query: 'Como está meu saldo atual e o resultado do meu mês? Faça uma avaliação.' },
    { label: 'Dicas para investir agora', query: 'Com base no meu patrimônio e perfil, quais são as melhores dicas de investimento no Brasil hoje (Selic, FIIs, Tesouro)?' },
    { label: 'Analise meus maiores gastos', query: 'Analise minhas transações e identifique para onde está indo a maior parte do meu dinheiro.' },
    { label: 'Calcular minha reserva ideal', query: 'Quanto eu deveria ter de reserva de emergência com base nos meus gastos mensais e como montar?' },
    { label: 'Regra orçamentária 50/30/20', query: 'Como posso aplicar a regra 50/30/20 na prática com os meus ganhos e despesas atuais?' },
    { label: 'Como acelerar a Jornada da Meta?', query: 'Me dê um plano de ação prático para economizar mais rápido e alcançar o topo da minha meta na Jornada.' },
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
              title: 'Diagnóstico em Tempo Real',
              desc: 'Análise detalhada de gastos, sobras e fluxo de caixa mensal.',
            },
            {
              title: 'Dicas de Investimentos Personalizadas',
              desc: 'Orientações sob medida para Tesouro Selic, CDBs e Fundos Imobiliários.',
            },
            {
              title: 'Cálculo de Reserva de Emergência',
              desc: 'Planejamento automático com base nas suas despesas reais.',
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
                Dante <span className="text-cyan-400 neon-text-cyan">• Consultor Financeiro IA</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ONLINE 24/7
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              Inteligência artificial financeira com telemetria direta dos seus lançamentos e metas.
            </p>
          </div>
        </div>

        {/* Quick HUD Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono relative z-10">
          <div className="bg-slate-900/60 border border-white/10 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400 block text-[9px]">SALDO</span>
            <span className="font-bold text-cyan-300">{formatBRL(metrics.balance)}</span>
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
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-lg ${
                    isAssistant
                      ? 'bg-slate-900/90 border border-white/10 text-slate-100 rounded-tl-sm'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm'
                  }`}
                >
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
                    {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
                <span>Dante está analisando seus dados e preparando a orientação...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-white/5 bg-slate-900/40 overflow-x-auto no-scrollbar flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Sugestões:
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
              placeholder="Ex.: Como economizar R$ 500 este mês? / Analise meus investimentos..."
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
            <span>Dante Inteligência Financeira • Consultor particular em tempo real</span>
            <span className="hidden sm:inline">Pressione Enter para enviar (Shift+Enter para quebrar linha)</span>
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
        <strong key={i} className="font-bold text-cyan-300 print:text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
