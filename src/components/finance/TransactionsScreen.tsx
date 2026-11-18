import RepeatExpensesModal from './RepeatExpensesModal';
import BankTransactionsTab from './BankTransactionsTab';
import { dateInMonth } from '../../utils/repeatExpenses';
import React, { useState } from 'react';
import {
  Plus,
  Copy,
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
import { formatBRL, formatDateBR, monthKey, monthLabel, todayISO } from '../../utils/format';
import { CATEGORY_COLORS, getCategoryMeta, EXPENSE_CATEGORY_ICONS, INCOME_CATEGORY_ICONS } from '../../data/categories';
import { shiftMonth, transactionTotals, transactionsForMonth, transactionsForRange, isValidDate } from '../../utils/transactionPeriod';
import { isSettled } from '../../utils/transactions';
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
    repeatExpenses,
    bankAccounts,
    incomeCategories,
    expenseCategories,
    categoryIcons,
    addCategory,
    setCategoryIcon,
  } = useFinance();

  const [source, setSource] = useState<'manual' | 'bank'>('manual');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedMonth, setSelectedMonth] = useState(todayISO().slice(0, 7));
  const [periodMode, setPeriodMode] = useState<'month' | 'range' | 'all'>('month');
  const showAllMonths = periodMode === 'all';
  const [dateFrom, setDateFrom] = useState(`${todayISO().slice(0, 7)}-01`);
  const [dateTo, setDateTo] = useState(todayISO());
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'settled'>('all');
  const [repeatDialog, setRepeatDialog] = useState<{ source?: Transaction } | null>(null);
  const [repeatNotice, setRepeatNotice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // New Category with Icon inline creator
  const [showAddCatInline, setShowAddCatInline] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🛒');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [editingCatIconFor, setEditingCatIconFor] = useState<string | null>(null);

  // Smart paste notification tool
  const [showNotificationImporter, setShowNotificationImporter] = useState(false);
  const [notificationText, setNotificationText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ReturnType<typeof parseBankNotification>>(null);

  // Modal Form State
  const [formType, setFormType] = useState<TransactionType>('expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('Mercado');
  const [formDate, setFormDate] = useState(todayISO());
  const [formStatus, setFormStatus] = useState<'pending' | 'settled'>('settled');
  const [formPaymentDate, setFormPaymentDate] = useState(todayISO());
  const [formNote, setFormNote] = useState('');
  const [formBankId, setFormBankId] = useState('');

  const openNewModal = (initialType: TransactionType = 'expense') => {
    setSource('manual');
    setEditingTx(null);
    setFormType(initialType);
    setFormAmount('');
    setFormCategory(initialType === 'income' ? 'Salário' : 'Mercado');
    const initialDate = periodMode === 'month' ? dateInMonth(selectedMonth, Number(todayISO().slice(8, 10))) : todayISO();
    setFormDate(initialDate);
    setFormStatus(initialDate > todayISO() ? 'pending' : 'settled');
    setFormPaymentDate(todayISO());
    setFormNote('');
    setFormBankId(bankAccounts[0]?.id || '');
    setShowAddCatInline(false);
    setShowIconPicker(false);
    setEditingCatIconFor(null);
    setShowModal(true);
  };

  const handleAddNewCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    addCategory(formType, trimmed, newCatIcon);
    setFormCategory(trimmed);
    setNewCatName('');
    setShowAddCatInline(false);
    setShowIconPicker(false);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setFormType(tx.type);
    setFormAmount(String(tx.amount));
    setFormCategory(tx.category);
    setFormDate(tx.date);
    setFormStatus(isSettled(tx) ? 'settled' : 'pending');
    setFormPaymentDate(tx.paymentDate || tx.date);
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
        status: formStatus,
        paymentDate: formStatus === 'settled' ? formPaymentDate : '',
        note: formNote.trim(),
        bankAccountId: formBankId || undefined,
      });
    } else {
      addTransaction({
        type: formType,
        amount: val,
        category: formCategory,
        date: formDate,
        status: formStatus,
        paymentDate: formStatus === 'settled' ? formPaymentDate : '',
        note: formNote.trim(),
        bankAccountId: formBankId || undefined,
      });
    }

    setSelectedMonth(formDate.slice(0, 7));
    setPeriodMode('month');
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

  const currentMonth = todayISO().slice(0, 7);
  const rangeValid = isValidDate(dateFrom) && isValidDate(dateTo) && dateFrom <= dateTo;
  const periodLabel = showAllMonths ? 'Todos os meses' : periodMode === 'range' ? `${formatDateBR(dateFrom)} a ${formatDateBR(dateTo)}` : monthLabel(selectedMonth);
  const periodTransactions = periodMode === 'range' ? transactionsForRange(transactions, dateFrom, dateTo) : transactionsForMonth(transactions, showAllMonths ? null : selectedMonth);
  const filtered = periodTransactions.filter((transaction) => {
    if (statusFilter === 'pending' && isSettled(transaction)) return false;
    if (statusFilter === 'settled' && !isSettled(transaction)) return false;
    if (typeFilter !== 'all' && transaction.type !== typeFilter) return false;
    const query = searchQuery.trim().toLocaleLowerCase('pt-BR');
    return !query || (transaction.note || '').toLocaleLowerCase('pt-BR').includes(query)
      || transaction.category.toLocaleLowerCase('pt-BR').includes(query);
  }).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  const totals = transactionTotals(filtered);
  const totalFilteredIncome = totals.income;
  const totalFilteredExpense = totals.expense;
  const changeMonth = (month: string): void => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return;
    setSelectedMonth(month);
    setPeriodMode('month');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with quick buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Lançamentos Financeiros</h2>
          <p className="text-xs text-slate-400">Controle detalhado de todas as suas receitas e despesas</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => { setSource('manual'); setShowNotificationImporter(true); }}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold hover:bg-purple-500/30 transition-all flex items-center justify-center gap-1.5"
            title="Importar notificação de Pix ou compra de banco"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Colar Pix / Notificação</span>
          </button>

          <button onClick={() => { setSource('manual'); setRepeatNotice(''); setRepeatDialog({}); }} className="px-3 py-2.5 rounded-xl border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center gap-2"><Copy className="w-4 h-4" />Repetir despesas</button>
          <button
            onClick={() => openNewModal('expense')}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-400/20"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      <div role="tablist" aria-label="Origem dos lançamentos" className="flex flex-wrap items-center gap-2">
        <button role="tab" aria-selected={source === 'manual'} onClick={() => setSource('manual')} className={`px-4 py-2 rounded-xl text-xs font-black border ${source === 'manual' ? 'bg-cyan-400 text-slate-950 border-cyan-300' : 'border-white/10 text-slate-300'}`}>✍️ Manuais (desvinculados)</button>
        <button role="tab" aria-selected={source === 'bank'} onClick={() => setSource('bank')} className={`px-4 py-2 rounded-xl text-xs font-black border ${source === 'bank' ? 'bg-cyan-400 text-slate-950 border-cyan-300' : 'border-white/10 text-slate-300'}`}>🏦 Banco (vinculado)</button>
        {source === 'bank' && <label className="ml-auto text-xs text-slate-300 flex items-center gap-2">Mês
          <input aria-label="Mês do extrato do banco" type="month" value={selectedMonth} onChange={event => changeMonth(event.target.value)} className="bg-slate-800 text-white border border-slate-600 rounded-lg p-2" />
        </label>}
      </div>

      {source === 'bank' ? <BankTransactionsTab month={selectedMonth} /> : <>
      {repeatNotice && <p role="status" className="text-sm text-emerald-300">{repeatNotice}</p>}
      <section aria-label="Período dos lançamentos" className="cyber-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-xs text-slate-400">Mês de referência</p>
              <h3 data-testid="transaction-period" className="font-bold text-white">{periodLabel}</h3>
            </div>
          </div>
          <label className="text-xs text-slate-300">Escolher mês
            <input aria-label="Escolher mês dos lançamentos" type="month" value={selectedMonth} onChange={event => changeMonth(event.target.value)} className="block mt-1 bg-slate-800 text-white border border-slate-600 rounded-lg p-2" />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => changeMonth(shiftMonth(selectedMonth, -1))} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-200">← Mês anterior</button>
          <button type="button" onClick={() => changeMonth(currentMonth)} className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950">Mês atual</button>
          <button type="button" onClick={() => changeMonth(shiftMonth(selectedMonth, 1))} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-200">Próximo mês →</button>
          <button type="button" aria-pressed={periodMode === 'range'} onClick={() => setPeriodMode('range')} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-200">Intervalo de datas</button>
          <button type="button" aria-pressed={showAllMonths} onClick={() => setPeriodMode('all')} className={`rounded-lg border px-3 py-2 text-xs ${showAllMonths ? 'border-amber-400 text-amber-300 bg-amber-500/10' : 'border-white/15 text-slate-400'}`}>Todos os meses</button>
        </div>
        {periodMode === 'range' && <div className="space-y-2">
          <div className="flex flex-wrap gap-3">
            <label className="text-xs text-slate-300">De<input aria-label="Data inicial do período" type="date" value={dateFrom} onChange={event => setDateFrom(event.target.value)} className="block mt-1 rounded-lg border border-slate-600 bg-slate-800 p-2" /></label>
            <label className="text-xs text-slate-300">Até<input aria-label="Data final do período" type="date" value={dateTo} onChange={event => setDateTo(event.target.value)} className="block mt-1 rounded-lg border border-slate-600 bg-slate-800 p-2" /></label>
          </div>
          {!rangeValid && <p role="alert" className="text-xs text-rose-300">Informe as duas datas; a data final deve ser igual ou posterior à inicial.</p>}
        </div>}
        <label className="block text-xs text-slate-300">Situação dos lançamentos
          <select aria-label="Filtrar situação dos lançamentos" value={statusFilter} onChange={event => setStatusFilter(event.target.value as 'all' | 'pending' | 'settled')} className="block mt-1 rounded-lg bg-slate-800 border border-slate-600 p-2">
            <option value="all">Todas as situações</option><option value="pending">Pendentes</option><option value="settled">Pagos / recebidos</option>
          </select>
        </label>
        <p className={`text-xs ${showAllMonths ? 'text-amber-300' : 'text-slate-400'}`}>
          {showAllMonths ? 'Visão acumulada: passado, presente e futuro estão incluídos por sua escolha.' : `Lista e totais incluem somente ${periodLabel}, conforme a data de referência.`}
          {' '}Tipo, situação e busca refinam também os totais. Com todas as situações, pendentes também são incluídos; o resultado não é o saldo bancário.
        </p>
      </section>

      {/* Summary Chips for Filtered View */}
      <div className="grid grid-cols-3 gap-3">
        <div className="cyber-card p-3 rounded-2xl border-emerald-500/30 bg-emerald-950/20 text-center hud-border-corners">
          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">// Receitas do período</span>
          <div className="text-sm sm:text-base font-black text-emerald-400 mt-0.5 font-mono neon-text-emerald">
            <span data-testid="period-income">{formatBRL(totalFilteredIncome)}</span>
          </div>
        </div>

        <div className="cyber-card p-3 rounded-2xl border-orange-500/30 bg-orange-950/20 text-center hud-border-corners">
          <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-wider">// Despesas do período</span>
          <div className="text-sm sm:text-base font-black text-orange-400 mt-0.5 font-mono">
            <span data-testid="period-expense">{formatBRL(totalFilteredExpense)}</span>
          </div>
        </div>

        <div className="cyber-card p-3 rounded-2xl text-center hud-border-corners">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">// Resultado do período</span>
          <div className={`text-sm sm:text-base font-black mt-0.5 font-mono ${
            totalFilteredIncome - totalFilteredExpense >= 0 ? 'text-cyan-400 neon-text-cyan' : 'text-rose-400'
          }`}>
            <span data-testid="period-net">{formatBRL(totals.net)}</span>
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
            Todas ({periodTransactions.length})
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
                        <span>{formatDateBR(tx.date)} · {isSettled(tx) ? (tx.type === 'expense' ? 'Pago' : 'Recebido') : 'Pendente'}</span>
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
                      {tx.type === 'expense' && <button aria-label={`Repetir despesa ${tx.note || tx.category}`} title="Repetir em outro mês" onClick={() => { setRepeatNotice(''); setRepeatDialog({ source: tx }); }} className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-cyan-300"><Copy className="w-3.5 h-3.5" /></button>}
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

      {repeatDialog && <RepeatExpensesModal transactions={transactions} source={repeatDialog.source} onClose={() => setRepeatDialog(null)} onRepeat={(ids, month) => {
        repeatExpenses(ids, month);
        changeMonth(month);
        setTypeFilter('expense');
        setStatusFilter('pending');
        setSearchQuery('');
        setRepeatDialog(null);
        setRepeatNotice(`Despesas repetidas como pendentes em ${monthLabel(month)}. O saldo bancário não foi alterado.`);
      }} />}

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
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-white/15 p-6 space-y-4 shadow-2xl">
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Categoria da {formType === 'income' ? 'Receita' : 'Despesa'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCatInline(!showAddCatInline);
                      setNewCatIcon(formType === 'income' ? '💼' : '🛒');
                      setShowIconPicker(false);
                      setEditingCatIconFor(null);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showAddCatInline ? 'Fechar' : 'Nova Categoria com Ícone'}</span>
                  </button>
                </div>

                {/* Inline Category Creator with Icon Picker */}
                {showAddCatInline && (
                  <div className="p-3 mb-2 rounded-2xl bg-slate-900 border border-cyan-500/40 space-y-2.5 animate-fade-in shadow-xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-300">
                        Nova Categoria com Ícone ({formType === 'income' ? 'Receita' : 'Despesa'}):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCatInline(false);
                          setShowIconPicker(false);
                        }}
                        className="text-slate-400 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowIconPicker(!showIconPicker)}
                        className={`w-11 h-10 rounded-xl border flex items-center justify-center text-xl transition-all shadow-sm ${
                          showIconPicker
                            ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 scale-105'
                            : 'bg-white/5 hover:bg-white/10 border-white/20'
                        }`}
                        title="Clique para escolher o ícone da categoria"
                      >
                        {newCatIcon}
                      </button>

                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewCategory();
                          }
                        }}
                        placeholder="Nome da categoria (ex: Pets, Café, Academia...)"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        autoFocus
                      />

                      <button
                        type="button"
                        onClick={handleAddNewCategory}
                        disabled={!newCatName.trim()}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-xs font-black transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Criar</span>
                      </button>
                    </div>

                    {/* Icon Picker Grid */}
                    {showIconPicker && (
                      <div className="pt-2 border-t border-white/10 space-y-1.5">
                        <span className="text-[11px] text-slate-400 block font-mono">
                          Escolha o ícone / emoji para esta categoria:
                        </span>
                        <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-32 overflow-y-auto p-1 bg-black/30 rounded-xl border border-white/5">
                          {(formType === 'income' ? INCOME_CATEGORY_ICONS : EXPENSE_CATEGORY_ICONS).map((icon) => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() => {
                                setNewCatIcon(icon);
                                setShowIconPicker(false);
                              }}
                              className={`h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                                newCatIcon === icon
                                  ? 'bg-cyan-500/30 border-2 border-cyan-400 scale-110 shadow-md'
                                  : 'bg-white/5 hover:bg-white/15 border border-white/10'
                              }`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Edit Icon for Existing Category */}
                {editingCatIconFor && (
                  <div className="p-3 mb-2 rounded-2xl bg-slate-900 border border-amber-400/40 space-y-2 animate-fade-in shadow-xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-300">
                        Alterar ícone da categoria "{editingCatIconFor}":
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingCatIconFor(null)}
                        className="text-slate-400 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-28 overflow-y-auto p-1 bg-black/30 rounded-xl border border-white/5">
                      {(formType === 'income' ? INCOME_CATEGORY_ICONS : EXPENSE_CATEGORY_ICONS).map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => {
                            setCategoryIcon(editingCatIconFor, icon);
                            setEditingCatIconFor(null);
                          }}
                          className="h-8 rounded-lg bg-white/5 hover:bg-amber-400/20 border border-white/10 hover:border-amber-400 text-base flex items-center justify-center transition-all"
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories Pills */}
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                  {(formType === 'income' ? incomeCategories : expenseCategories).map((cat) => {
                    const style = getCategoryMeta(cat, categoryIcons);
                    const isSelected = formCategory === cat;
                    return (
                      <div
                        key={cat}
                        className={`inline-flex items-center rounded-xl border transition-all text-xs font-semibold ${
                          isSelected
                            ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-sm'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/30'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCatIconFor(editingCatIconFor === cat ? null : cat);
                          }}
                          className="pl-2.5 pr-1 py-1.5 hover:scale-125 transition-transform"
                          title="Clique para mudar o ícone desta categoria"
                        >
                          <span className="text-sm">{style.emoji}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormCategory(cat)}
                          className="pr-3 pl-1 py-1.5 text-left"
                        >
                          <span>{cat}</span>
                        </button>
                      </div>
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data de referência (mês da receita/despesa)</label>
                  <input
                    type="date"
                    value={formDate}
                    required
                    onChange={(e) => { setFormDate(e.target.value); if (!editingTx) setFormStatus(e.target.value > todayISO() ? 'pending' : 'settled'); }}
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

              <div className="space-y-3">
                <label className="block text-xs text-slate-300">Situação
                  <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as 'pending' | 'settled')} className="block w-full bg-slate-800 rounded-xl p-3 mt-1">
                    <option value="pending">Pendente — não movimentar o saldo</option>
                    <option value="settled">{formType === 'expense' ? 'Pago' : 'Recebido'} — movimentar o saldo</option>
                  </select>
                </label>
                {formStatus === 'settled' && <label className="block text-xs text-slate-300">Data do pagamento/recebimento
                  <input required type="date" max={todayISO()} value={formPaymentDate} onChange={(e) => setFormPaymentDate(e.target.value)} className="block bg-slate-800 p-3 rounded-xl mt-1" />
                </label>}
                <p className="text-xs text-slate-400">O mês é definido pela data de referência. Apenas valores pagos ou recebidos alteram o saldo da conta. Para quitar uma pendência, edite e altere a situação.</p>
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
      </>}
    </div>
  );
}
