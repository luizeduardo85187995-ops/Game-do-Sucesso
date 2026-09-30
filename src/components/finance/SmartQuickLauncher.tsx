import React, { useState, useMemo } from 'react';
import {
  Wand2,
  Send,
  CheckCircle2,
  Calendar,
  Building2,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  HelpCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBRL, formatDateBR, todayISO } from '../../utils/format';
import { getCategoryMeta } from '../../data/categories';
import { BankAccount } from '../../types/finance';

interface ParsedTransaction {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  note: string;
  bankAccountId?: string;
  confidence: number;
}

export default function SmartQuickLauncher() {
  const { addTransaction, bankAccounts, expenseCategories, incomeCategories, categoryIcons } = useFinance();
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastExecuted, setLastExecuted] = useState<{
    text: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
    bankName: string;
  } | null>(null);

  // Helper de normalização (remove acentos e pontuação)
  const normalize = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  /**
   * Parser Inteligente de Linguagem Natural Conectado às Categorias Reais do Usuário
   */
  const parseInput = (rawText: string): ParsedTransaction | null => {
    const text = rawText.trim();
    if (!text) return null;

    // 1. Extração de Valor Numérico (ex: 1.450,00, 1450, 45.90, R$ 150, 150)
    let amount = 0;
    let textWithoutAmount = text;

    // Procura por R$ ou números com decimais ou inteiros
    const currencyMatch = text.match(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i);
    if (currencyMatch && currencyMatch[1]) {
      const numStr = currencyMatch[1];
      // Se tem ponto de milhar e vírgula decimal (ex: 1.450,50)
      if (numStr.includes('.') && numStr.includes(',')) {
        amount = parseFloat(numStr.replace(/\./g, '').replace(',', '.'));
      } else if (numStr.includes(',')) {
        // Ex: 45,90
        amount = parseFloat(numStr.replace(',', '.'));
      } else {
        // Ex: 1450 ou 45.90
        amount = parseFloat(numStr);
      }
      textWithoutAmount = text.replace(currencyMatch[0], '').trim();
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return null;
    }

    // 2. Extração de Data Inteligente (ex: "dia 08/10", "08/10", "amanhã", "ontem", "hoje", "próximo mês")
    let targetDate = todayISO(); // Padrão YYYY-MM-DD rigoroso
    let textWithoutDate = textWithoutAmount;

    const dateRegex = /(?:dia\s+)?(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/i;
    const dateMatch = textWithoutAmount.match(dateRegex);

    if (dateMatch) {
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10);
      let year = dateMatch[3] ? parseInt(dateMatch[3], 10) : new Date().getFullYear();
      if (year < 100) year += 2000;

      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        targetDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        textWithoutDate = textWithoutAmount.replace(dateMatch[0], '').trim();
      }
    } else {
      const normLower = normalize(textWithoutAmount);
      if (normLower.includes('amanha')) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        targetDate = d.toISOString().slice(0, 10);
        textWithoutDate = textWithoutAmount.replace(/amanh[aã]/gi, '').trim();
      } else if (normLower.includes('ontem')) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        targetDate = d.toISOString().slice(0, 10);
        textWithoutDate = textWithoutAmount.replace(/ontem/gi, '').trim();
      } else if (normLower.includes('proximo mes') || normLower.includes('mes que vem')) {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        targetDate = d.toISOString().slice(0, 10);
        textWithoutDate = textWithoutAmount.replace(/pr[oó]ximo\s+m[eê]s|m[eê]s\s+que\s+vem/gi, '').trim();
      }
    }

    // 3. Detecção de Conta Bancária
    let selectedBankId = bankAccounts[0]?.id;
    let textWithoutBank = textWithoutDate;

    for (const acc of bankAccounts) {
      const normAccName = normalize(acc.bankName);
      const normAccNick = acc.nickname ? normalize(acc.nickname) : '';
      const normText = normalize(textWithoutDate);

      if (
        (normAccName && normText.includes(normAccName)) ||
        (normAccNick && normText.includes(normAccNick))
      ) {
        selectedBankId = acc.id;
        textWithoutBank = textWithoutDate
          .replace(new RegExp(acc.bankName, 'gi'), '')
          .replace(new RegExp(acc.nickname || '', 'gi'), '')
          .trim();
        break;
      }
    }

    // 4. Reconhecimento de Categoria e Tipo (Baseado nas Categorias do Usuário!)
    // Limpa preposições e palavras vazias
    const cleanTokens = textWithoutBank
      .replace(/\b(de|do|da|dos|das|no|na|nos|nas|em|para|pra|com|por|o|a|os|as|um|uma)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const normQuery = normalize(cleanTokens || textWithoutBank);

    let matchedCategory = '';
    let matchedType: 'income' | 'expense' = 'expense';
    let confidence = 0.5;

    // ETAPA 4.1: Comparação direta com categorias de RECEITA do usuário
    for (const cat of incomeCategories) {
      const normCat = normalize(cat);
      if (normQuery === normCat) {
        matchedCategory = cat;
        matchedType = 'income';
        confidence = 1.0;
        break;
      }
      if (normQuery.includes(normCat) || (normCat.length > 3 && normCat.includes(normQuery))) {
        matchedCategory = cat;
        matchedType = 'income';
        confidence = 0.9;
        break;
      }
    }

    // ETAPA 4.2: Comparação direta com categorias de DESPESA do usuário (prioridade alta)
    if (!matchedCategory) {
      for (const cat of expenseCategories) {
        const normCat = normalize(cat);
        if (normQuery === normCat) {
          matchedCategory = cat;
          matchedType = 'expense';
          confidence = 1.0;
          break;
        }
        if (normQuery.includes(normCat) || (normCat.length > 3 && normCat.includes(normQuery))) {
          matchedCategory = cat;
          matchedType = 'expense';
          confidence = 0.9;
          break;
        }
      }
    }

    // ETAPA 4.3: Dicionário Semântico Inteligente de Sinônimos
    if (!matchedCategory) {
      // Receitas conhecidas
      if (
        normQuery.includes('salario') ||
        normQuery.includes('ordenado') ||
        normQuery.includes('holerite') ||
        normQuery.includes('pagamento')
      ) {
        matchedCategory = incomeCategories.find((c) => normalize(c).includes('salari')) || 'Salário';
        matchedType = 'income';
        confidence = 0.85;
      } else if (normQuery.includes('freela') || normQuery.includes('freelance') || normQuery.includes('bico')) {
        matchedCategory = incomeCategories.find((c) => normalize(c).includes('freela')) || 'Freelance';
        matchedType = 'income';
        confidence = 0.85;
      } else if (normQuery.includes('bonus') || normQuery.includes('comissao') || normQuery.includes('premiacao') || normQuery.includes('plr')) {
        matchedCategory = incomeCategories.find((c) => normalize(c).includes('bonu')) || 'Bônus';
        matchedType = 'income';
        confidence = 0.85;
      } else if (normQuery.includes('dividendo') || normQuery.includes('rendimento') || normQuery.includes('provento') || normQuery.includes('jcp')) {
        matchedCategory = incomeCategories.find((c) => normalize(c).includes('invest')) || 'Investimentos';
        matchedType = 'income';
        confidence = 0.85;
      } else if (normQuery.includes('recebi') || normQuery.includes('ganhei') || normQuery.includes('pix recebido') || normQuery.includes('venda')) {
        matchedCategory = 'Outros';
        matchedType = 'income';
        confidence = 0.75;
      }
      // Despesas Conhecidas com Mapeamento para as Categorias do Usuário
      else if (normQuery.includes('internet') || normQuery.includes('wifi') || normQuery.includes('fibra') || normQuery.includes('net') || normQuery.includes('vivo') || normQuery.includes('claro') || normQuery.includes('tim')) {
        matchedCategory = expenseCategories.find((c) => normalize(c).includes('internet')) || 'Internet';
        matchedType = 'expense';
        confidence = 0.9;
      } else if (normQuery.includes('energia') || normQuery.includes('luz') || normQuery.includes('enel') || normQuery.includes('cemig') || normQuery.includes('cpfl')) {
        matchedCategory = expenseCategories.find((c) => normalize(c).includes('energia') || normalize(c).includes('luz')) || 'Energia';
        matchedType = 'expense';
        confidence = 0.9;
      } else if (normQuery.includes('agua') || normQuery.includes('sabesp') || normQuery.includes('copasa') || normQuery.includes('sanepar')) {
        matchedCategory = expenseCategories.find((c) => normalize(c).includes('agua')) || 'Aguá';
        matchedType = 'expense';
        confidence = 0.9;
      } else if (normQuery.includes('academia') || normQuery.includes('gym') || normQuery.includes('smartfit') || normQuery.includes('treino') || normQuery.includes('crossfit')) {
        matchedCategory = expenseCategories.find((c) => normalize(c).includes('academia')) || 'Academia';
        matchedType = 'expense';
        confidence = 0.9;
      } else if (normQuery.includes('cartao') || normQuery.includes('fatura') || normQuery.includes('credito') || normQuery.includes('emprestimo') || normQuery.includes('99')) {
        matchedCategory = expenseCategories.find((c) => normalize(c).includes('cartao') || normalize(c).includes('credito')) || 'Cartão de Credito';
        matchedType = 'expense';
        confidence = 0.85;
      } else if (normQuery.includes('aluguel') || normQuery.includes('condominio') || normQuery.includes('iptu') || normQuery.includes('financiamento') || normQuery.includes('apartamento') || normQuery.includes('moradia')) {
        matchedCategory = expenseCategories.find((c) => normalize(c).includes('moradia') || normalize(c).includes('aluguel')) || 'Moradia';
        matchedType = 'expense';
        confidence = 0.85;
      } else if (normQuery.includes('dentista') || normQuery.includes('medico') || normQuery.includes('farmacia') || normQuery.includes('remedio') || normQuery.includes('saude') || normQuery.includes('consulta') || normQuery.includes('exame')) {
        matchedCategory = expenseCategories.find((c) => normalize(c).includes('saude') || normalize(c).includes('farmacia')) || 'Saúde';
        matchedType = 'expense';
        confidence = 0.85;
      } else if (normQuery.includes('uber') || normQuery.includes('gasolina') || normQuery.includes('combustivel') || normQuery.includes('onibus') || normQuery.includes('metro') || normQuery.includes('transporte') || normQuery.includes('pedagio')) {
        matchedCategory = expenseCategories.find((c) => normalize(c).includes('transporte')) || 'Transporte';
        matchedType = 'expense';
        confidence = 0.85;
      } else if (normQuery.includes('mercado') || normQuery.includes('supermercado') || normQuery.includes('almoco') || normQuery.includes('ifood') || normQuery.includes('comida') || normQuery.includes('padaria') || normQuery.includes('acougue')) {
        matchedCategory = expenseCategories.find((c) => normalize(c).includes('mercado') || normalize(c).includes('aliment')) || 'Mercado';
        matchedType = 'expense';
        confidence = 0.85;
      } else if (normQuery.includes('cinema') || normQuery.includes('jogo') || normQuery.includes('steam') || normQuery.includes('bar') || normQuery.includes('festa') || normQuery.includes('viagem') || normQuery.includes('lazer') || normQuery.includes('locacao')) {
        matchedCategory = expenseCategories.find((c) => normalize(c).includes('lazer')) || 'Outros';
        matchedType = 'expense';
        confidence = 0.75;
      } else if (normQuery.includes('netflix') || normQuery.includes('spotify') || normQuery.includes('youtube') || normQuery.includes('prime') || normQuery.includes('assinatura')) {
        matchedCategory = expenseCategories.find((c) => normalize(c).includes('assinatura')) || 'Assinaturas';
        matchedType = 'expense';
        confidence = 0.85;
      } else if (normQuery.includes('curso') || normQuery.includes('livro') || normQuery.includes('faculdade') || normQuery.includes('escola') || normQuery.includes('educacao')) {
        matchedCategory = expenseCategories.find((c) => normalize(c).includes('educa')) || 'Educação';
        matchedType = 'expense';
        confidence = 0.85;
      } else {
        matchedCategory = 'Outros';
        matchedType = 'expense';
        confidence = 0.5;
      }
    }

    return {
      type: matchedType,
      amount,
      category: matchedCategory,
      date: targetDate,
      note: text,
      bankAccountId: selectedBankId,
      confidence,
    };
  };

  // Análise em tempo real do texto digitado
  const livePreview = useMemo(() => {
    return parseInput(command);
  }, [command, expenseCategories, incomeCategories, bankAccounts]);

  const handleExecute = () => {
    const parsed = parseInput(command);
    if (!parsed) return;

    setIsProcessing(true);

    addTransaction({
      type: parsed.type,
      amount: parsed.amount,
      category: parsed.category,
      date: parsed.date,
      note: parsed.note,
      bankAccountId: parsed.bankAccountId,
    });

    const bankObj = bankAccounts.find((b) => b.id === parsed.bankAccountId);

    setLastExecuted({
      text: parsed.note,
      amount: parsed.amount,
      type: parsed.type,
      category: parsed.category,
      date: parsed.date,
      bankName: bankObj?.bankName || 'Conta Corrente',
    });

    setCommand('');
    setTimeout(() => {
      setIsProcessing(false);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  const EXAMPLES = [
    'Internet 150',
    'Energia 190',
    'Aguá 200',
    'Academia 119',
    'Aluguel 500 dia 08/10',
    'Dentista 200',
    'Salário 2700',
    'Bônus 1100',
    'Cartão de crédito 400',
  ];

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
                Auto-Lançador Dante <span className="text-cyan-400 neon-text-cyan">• Inteligência de Categorias</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[9px] font-mono font-bold uppercase tracking-wider">
                AUTO-DETECT
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Digite livremente (ex: <span className="text-cyan-300">"Internet 150"</span>, <span className="text-amber-300">"Aluguel 500 dia 08/10"</span>, <span className="text-emerald-300">"Salário 2700"</span>)
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
              placeholder="Digite o gasto ou receita com valor e categoria..."
              className="w-full pl-9 pr-24 py-2.5 rounded-2xl bg-slate-950/80 border border-cyan-500/40 text-xs sm:text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300 transition shadow-inner"
            />
            <button
              onClick={handleExecute}
              disabled={!livePreview || isProcessing}
              className="absolute right-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-md shadow-cyan-500/30"
            >
              <Send className="w-3.5 h-3.5" />
              <span>LANÇAR</span>
            </button>
          </div>

          {/* HUD de Reconhecimento em Tempo Real */}
          {livePreview && (
            <div className="mt-2 p-2 rounded-xl bg-slate-950/90 border border-cyan-400/40 flex items-center gap-2 flex-wrap text-xs font-mono animate-fade-in">
              <span className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Dante Entendeu:
              </span>

              {/* Tipo */}
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                  livePreview.type === 'income'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {livePreview.type === 'income' ? (
                  <>
                    <ArrowUpRight className="w-3 h-3" /> Receita
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-3 h-3" /> Despesa
                  </>
                )}
              </span>

              {/* Categoria */}
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>{categoryIcons[livePreview.category] || getCategoryMeta(livePreview.category).emoji}</span>
                <span>{livePreview.category}</span>
              </span>

              {/* Valor */}
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/10 text-white font-mono">
                {formatBRL(livePreview.amount)}
              </span>

              {/* Data */}
              <span className="px-2 py-0.5 rounded-lg text-[10px] text-slate-300 bg-white/5 border border-white/10 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {formatDateBR(livePreview.date)}
              </span>
            </div>
          )}

          {/* Quick Click Chips */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-mono text-slate-500 shrink-0">Testar:</span>
            {EXAMPLES.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCommand(ex);
                }}
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
        <div className="mt-3.5 pt-3 border-t border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono animate-fade-in bg-cyan-950/20 px-3.5 py-2.5 rounded-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300">
              Lançamento registrado: <strong className="text-white">"{lastExecuted.text}"</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-cyan-300 text-[10px]">
              {categoryIcons[lastExecuted.category] || '🏷️'} {lastExecuted.category}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-400 text-[10px]">
              📅 {formatDateBR(lastExecuted.date)}
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
