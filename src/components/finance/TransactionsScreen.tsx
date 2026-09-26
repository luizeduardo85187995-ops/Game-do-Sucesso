import React, { useState } from 'react';
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Edit2,
  Sparkles,
  ClipboardCheck,
  Filter,
  Calendar,
  Wallet,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types/finance';
import { formatBRL, formatDateBR, monthKey, todayISO } from '../../utils/format';
import { CATEGORY_COLORS, getCategoryMeta } from '../../data/categories';
import { parseBankNotification } from '../../utils/bankParser';

interface TransactionsScreenProps {
  onAddPrompt?: boolean;
}

export default function TransactionsScreen({}: TransactionsScreenProps) {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    bankAccounts,
    incomeCategories,
    expenseCategories,
    categoryIcons,
  } = useFinance();

  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Smart paste notification tool
  const [showNotificationImporter, setShowNotificationImporter] = useState(false);
  const [notificationText, setNotificationText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ReturnType<typeof parseBankNotification>>(null);

  // Modal Form State
  const [formType, setFormType] = useState<TransactionType>('expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('Mercado');
  const [formDate, setFormDate] = useState(todayISO());
  const [formNote, setFormNote] = useState('');
  const [formBankId, setFormBankId] = useState('');

  const openNewModal = (initialType: TransactionType = 'expense') => {
    setEditingTx(null);
    setFormType(initialType);
    setFormAmount('');
    setFormCategory(initialType === 'income' ? 'Salário' : 'Mercado');
    setFormDate(todayISO());
    setFormNote('');
    setFormBankId(bankAccounts[0]?.id || '');
    setShowModal(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setFormType(tx.type);
    setFormAmount(String(tx.amount));
    setFormCategory(tx.category);
    setFormDate(tx.date);
    setFormNote(tx.note || '');
    setFormBankId(tx.bankAccountId || '');
    setShowModal(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(formAmount.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    if (editingTx) {
      updateTransaction(editingTx.id, {
        type: formType,
        amount: val,
        category: formCategory,
        date: formDate,
        note: formNote.trim(),
        bankAccountId: formBankId || undefined,
      });
    } else {
      addTransaction({
        type: formType,
        amount: val,
        category: formCategory,
        date: formDate,
        note: formNote.trim(),
        bankAccountId: formBankId || undefined,
      });
    }

    setShowModal(false);
  };

  const handleParseNotification = () => {
    const res = parseBankNotification(notificationText);
    setParsedPreview(res);
  };

  const handleApplyParsed = () => {
    if (!parsedPreview) return;
    addTransaction({
      type: parsedPreview.type,
      amount: parsedPreview.amount,
      category: parsedPreview.category,
      date: todayISO(),
      note: parsedPreview.note,
      bankAccountId: bankAccounts[0]?.id,
    });
    setNotificationText('');
    setParsedPreview(null);
    setShowNotificationImporter(false);
  };

  // Filter logic
  const filtered = transactions.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNote = (tx.note || '').toLowerCase().includes(q);
      const matchCat = tx.category.toLowerCase().includes(q);
      if (!matchNote && !matchCat) return false;
    }
    return true;
  });

  const totalFilteredIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const totalFilteredExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with quick buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Lançamentos Financeiros</h2>
          <p className="text-xs text-slate-400">Controle detalhado de todas as suas receitas e despesas</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowNotificationImporter(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold hover:bg-purple-500/30 transition-all flex items-center justify-center gap-1.5"
            title="Importar notificação de Pix ou compra de banco"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Colar Pix / Notificação</span>
          </button>

          <button
            onClick={() => openNewModal('expense')}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-400/20"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Summary Chips for Filtered View */}
      <div className="grid grid-cols-3 gap-3">
        <div className="cyber-card p-3 rounded-2xl border-emerald-500/30 bg-emerald-950/20 text-center hud-border-corners">
          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">// Total Entradas</span>
          <div className="text-sm sm:text-base font-black text-emerald-400 mt-0.5 font-mono neon-text-emerald">
            {formatBRL(totalFilteredIncome)}
          </div>
        </div>

        <div className="cyber-card p-3 rounded-2xl border-orange-500/30 bg-orange-950/20 text-center hud-border-corners">
          <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-wider">// Total Saídas</span>
          <div className="text-sm sm:text-base font-black text-orange-400 mt-0.5 font-mono">
            {formatBRL(totalFilteredExpense)}
          </div>
        </div>

        <div className="cyber-card p-3 rounded-2xl text-center hud-border-corners">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">// Balanço Filtro</span>
          <div className={`text-sm sm:text-base font-black mt-0.5 font-mono ${
            totalFilteredIncome - totalFilteredExpense >= 0 ? 'text-cyan-400 neon-text-cyan' : 'text-rose-400'
          }`}>
            {formatBRL(totalFilteredIncome - totalFilteredExpense)}
          </div>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="cyber-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Type Toggle Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 w-full sm:w-auto">
          <button
            onClick={() => setTypeFilter('all')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              typeFilter === 'all' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas ({transactions.length})
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              typeFilter === 'income' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            Receitas
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              typeFilter === 'expense' ? 'bg-orange-500 text-slate-950' : 'text-slate-400 hover:text-orange-400'
            }`}
          >
            Despesas
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por descrição..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="glass-card rounded-3xl p-5 border border-white/10">
        {filtered.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <div className="text-3xl">🧾</div>
            <p className="text-sm font-bold text-slate-300">Nenhum lançamento encontrado</p>
            <p className="text-xs text-slate-500">Tente ajustar os filtros ou cadastre uma nova transação.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((tx) => {
              const catStyle = getCategoryMeta(tx.category, categoryIcons);
              const bank = bankAccounts.find((b) => b.id === tx.bankAccountId);

              return (
                <div
                  key={tx.id}
                  className="py-3.5 flex items-center justify-between gap-3 group hover:bg-white/[0.02] px-2 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0">
                      {catStyle.emoji}
                    </div>

                    <div>
                      <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                        <span>{tx.note || tx.category}</span>
                        {bank && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-normal">
                            {bank.bankName}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{formatDateBR(tx.date)}</span>
                        <span>•</span>
                        <span className={`font-semibold ${catStyle.text}`}>{tx.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`text-xs sm:text-sm font-black text-right ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-orange-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'} {formatBRL(tx.amount)}
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(tx)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white text-xs"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Smart Notification Importer Modal */}
      {showNotificationImporter && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-purple-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">Leitor Inteligente de Notificação</h3>
              </div>
              <button
                onClick={() => setShowNotificationImporter(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Copie o texto de uma notificação do seu banco (Nubank, Itaú, Inter, Bradesco, etc.) e cole aqui. Identificaremos o valor, o tipo e a categoria automaticamente!
            </p>

            <textarea
              rows={3}
              value={notificationText}
              onChange={(e) => setNotificationText(e.target.value)}
              placeholder="Ex: Você recebeu uma transferência Pix de R$ 150,00 de João Silva..."
              className="w-full p-3 rounded-2xl bg-white/5 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
            />

            <button
              onClick={handleParseNotification}
              disabled={!notificationText.trim()}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all"
            >
              Analisar Notificação
            </button>

            {parsedPreview && (
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2 text-xs">
                <div className="font-bold text-purple-300">Resultado Identificado:</div>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>Tipo: <strong className={parsedPreview.type === 'income' ? 'text-emerald-400' : 'text-orange-400'}>{parsedPreview.type === 'income' ? 'Receita' : 'Despesa'}</strong></div>
                  <div>Valor: <strong className="text-white">{formatBRL(parsedPreview.amount)}</strong></div>
                  <div>Categoria: <strong className="text-white">{parsedPreview.category}</strong></div>
                  <div>Banco: <strong className="text-white">{parsedPreview.bank || 'Não detectado'}</strong></div>
                </div>
                <div className="text-[11px] text-slate-400">Descrição: {parsedPreview.note}</div>

                <button
                  onClick={handleApplyParsed}
                  className="w-full mt-2 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <ClipboardCheck className="w-4 h-4" /> Confirmar e Cadastrar Lançamento
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/15 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-white text-lg">
                {editingTx ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('expense');
                    setFormCategory('Mercado');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    formType === 'expense' ? 'bg-orange-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Despesa (Saída)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('income');
                    setFormCategory('Salário');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    formType === 'income' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Receita (Entrada)
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-lg font-black text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Categoria</label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                  {(formType === 'income' ? incomeCategories : expenseCategories).map((cat) => {
                    const style = getCategoryMeta(cat, categoryIcons);
                    const isSelected = formCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/30'
                        }`}
                      >
                        <span>{style.emoji}</span>
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Note / Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição / Nota</label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Ex: Almoço com amigos, Salário mensal..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Date & Bank Account */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Conta Bancária</label>
                  <select
                    value={formBankId}
                    onChange={(e) => setFormBankId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">Sem vínculo</option>
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} ({b.nickname || 'Principal'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black transition-all"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
