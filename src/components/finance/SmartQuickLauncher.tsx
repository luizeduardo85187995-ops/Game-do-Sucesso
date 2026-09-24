import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Check,
  Send,
  Wand2,
  CheckCircle2,
  Calendar,
  Tag,
  Building2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBRL } from '../../utils/format';

export default function SmartQuickLauncher() {
  const { addTransaction, bankAccounts, expenseCategories, incomeCategories } = useFinance();
  const [command, setCommand] = useState('');
  const [lastExecuted, setLastExecuted] = useState<{
    text: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Exemplo de comandos quânticos
  const EXAMPLES = [
    'Almoço 45',
    'Uber 28.50',
    'Salário 3500',
    'Supermercado 142.90',
    'Farmácia 60',
    'Freelance 400',
  ];

  const parseAndExecute = (inputStr: string) => {
    const text = inputStr.trim();
    if (!text) return;

    setIsProcessing(true);

    // 1. Extração de valor numérico (suporta 45, 45.90, 45,90, 1500)
    const numberMatch = text.match(/(?:R\$\s*)?(\d+(?:[.,]\d{1,2})?)/i);
    let amount = 0;
    if (numberMatch) {
      amount = parseFloat(numberMatch[1].replace(',', '.'));
    }

    if (amount <= 0) {
      setIsProcessing(false);
      return;
    }

    // 2. Extração de texto sem o número
    const rawCategory = text.replace(numberMatch ? numberMatch[0] : '', '').trim().toLowerCase();

    // 3. Detecção inteligente de tipo e categoria
    let type: 'income' | 'expense' = 'expense';
    let category = 'Outros';

    if (
      rawCategory.includes('salario') ||
      rawCategory.includes('salário') ||
      rawCategory.includes('freela') ||
      rawCategory.includes('freelance') ||
      rawCategory.includes('recebi') ||
      rawCategory.includes('pix recebido') ||
      rawCategory.includes('rendimento') ||
      rawCategory.includes('dividendo') ||
      rawCategory.includes('venda')
    ) {
      type = 'income';
      if (rawCategory.includes('salár') || rawCategory.includes('salar')) category = 'Salário';
      else if (rawCategory.includes('freel')) category = 'Freelance';
      else if (rawCategory.includes('divid') || rawCategory.includes('rend')) category = 'Investimentos';
      else category = 'Outros';
    } else {
      // É despesa
      type = 'expense';
      if (rawCategory.includes('almoç') || rawCategory.includes('almoc') || rawCategory.includes('mercado') || rawCategory.includes('supermercado') || rawCategory.includes('restaurante') || rawCategory.includes('lanche') || rawCategory.includes('ifood') || rawCategory.includes('comida') || rawCategory.includes('padaria')) {
        category = 'Mercado';
      } else if (rawCategory.includes('uber') || rawCategory.includes('gasolina') || rawCategory.includes('combustivel') || rawCategory.includes('onibus') || rawCategory.includes('metro') || rawCategory.includes('transporte') || rawCategory.includes('pedagio')) {
        category = 'Transporte';
      } else if (rawCategory.includes('aluguel') || rawCategory.includes('condominio') || rawCategory.includes('luz') || rawCategory.includes('agua') || rawCategory.includes('energia') || rawCategory.includes('internet') || rawCategory.includes('gas')) {
        category = 'Moradia';
      } else if (rawCategory.includes('cinema') || rawCategory.includes('jogos') || rawCategory.includes('game') || rawCategory.includes('bar') || rawCategory.includes('festa') || rawCategory.includes('viagem') || rawCategory.includes('praia')) {
        category = 'Lazer';
      } else if (rawCategory.includes('farmacia') || rawCategory.includes('farmácia') || rawCategory.includes('remedio') || rawCategory.includes('medico') || rawCategory.includes('dentista') || rawCategory.includes('consulta') || rawCategory.includes('exame')) {
        category = 'Saúde';
      } else if (rawCategory.includes('curso') || rawCategory.includes('livro') || rawCategory.includes('faculdade') || rawCategory.includes('escola')) {
        category = 'Educação';
      } else if (rawCategory.includes('netflix') || rawCategory.includes('spotify') || rawCategory.includes('youtube') || rawCategory.includes('prime') || rawCategory.includes('assinatura')) {
        category = 'Assinaturas';
      } else {
        category = 'Outros';
      }
    }

    const defaultBank = bankAccounts[0]?.id;

    // Registra a transação no contexto
    addTransaction({
      type,
      amount,
      category,
      note: text,
      date: new Date().toISOString(),
      bankAccountId: defaultBank,
    });

    setLastExecuted({
      text,
      amount,
      type,
      category,
    });

    setCommand('');
    setTimeout(() => {
      setIsProcessing(false);
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      parseAndExecute(command);
    }
  };

  return (
    <div className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-slate-900/90 via-[#0a1128]/95 to-slate-900/90 border border-cyan-400/40 shadow-2xl backdrop-blur-2xl overflow-hidden hud-border-corners group">
      {/* Laser Scanline */}
      <div className="holo-scanline" />

      {/* Decorative Orbs */}
      <div className="absolute top-0 right-1/4 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/30 shrink-0">
            <Wand2 className="w-5 h-5 text-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white font-mono tracking-tight flex items-center gap-1.5">
                Terminal Quântico Dante <span className="text-cyan-400 neon-text-cyan">• Auto-Lançador</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[9px] font-mono font-bold uppercase tracking-wider">
                IA NATIVA
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Digite em linguagem natural (ex: <span className="text-cyan-300">"Almoço 35"</span> ou <span className="text-emerald-300">"Salário 2500"</span>)
            </p>
          </div>
        </div>

        {/* Command Input Form */}
        <div className="w-full md:w-auto flex-1 max-w-xl">
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-cyan-400 font-mono font-bold text-xs select-none">
              &gt;_
            </span>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite o gasto ou receita instantânea..."
              className="w-full pl-9 pr-24 py-2.5 rounded-2xl bg-slate-950/80 border border-cyan-500/40 text-xs sm:text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300 transition shadow-inner"
            />
            <button
              onClick={() => parseAndExecute(command)}
              disabled={!command.trim() || isProcessing}
              className="absolute right-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-md shadow-cyan-500/30"
            >
              <Send className="w-3.5 h-3.5" />
              <span>LANÇAR</span>
            </button>
          </div>

          {/* Quick Click Chips */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-mono text-slate-500 shrink-0">Testar:</span>
            {EXAMPLES.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => parseAndExecute(ex)}
                className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-400 border border-white/5 transition shrink-0 active:scale-95"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Flash Card */}
      {lastExecuted && (
        <div className="mt-3.5 pt-3 border-t border-cyan-500/20 flex items-center justify-between gap-3 text-xs font-mono animate-fade-in bg-cyan-950/20 px-3 py-2 rounded-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">
              Registrado com sucesso: <strong className="text-white">"{lastExecuted.text}"</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-cyan-300 text-[10px]">
              {lastExecuted.category}
            </span>
            <span className={`font-bold ${lastExecuted.type === 'income' ? 'text-emerald-400' : 'text-orange-400'}`}>
              {lastExecuted.type === 'income' ? '+' : '-'} {formatBRL(lastExecuted.amount)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
