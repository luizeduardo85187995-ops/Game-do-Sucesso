import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Landmark, Lock, RefreshCw, Search, StickyNote } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { classify, type ClassifiedTx } from '../../../api/_lib/bankAnalysis';
import { INTERNAL_TRANSFER_CATEGORY, type BankSnapshot, type OpenFinanceResponse } from '../../types/openFinance';
import { formatBRL, formatDateBR } from '../../utils/format';

type Filter = 'all' | 'expense' | 'income' | 'pix' | 'uncategorized';

const PAGE_SIZE = 50;
const KIND_LABEL: Record<ClassifiedTx['kind'], string> = {
  income: 'Entrada',
  expense: 'Saída',
  internal: 'Entre contas / fatura',
  refund: 'Estorno',
};

interface Props {
  month: string;
}

/**
 * Bank-linked movements (read-only amount/date). The user may only set a category and a note, which are
 * stored in the finance state and read server-side by Dante. Manual entries stay separate ("desvinculadas").
 */
export default function BankTransactionsTab({ month }: Props) {
  const { user } = useAuth();
  const { expenseCategories, incomeCategories, bankTxAnnotations, annotateBankTransaction, addCategory } = useFinance();
  const [snapshot, setSnapshot] = useState<BankSnapshot | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const controller = useRef<AbortController | null>(null);

  const load = useCallback(async (refresh: boolean): Promise<void> => {
    if (!user) return;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/open-finance?month=${encodeURIComponent(month)}`, {
        method: refresh ? 'POST' : 'GET',
        headers: { Authorization: `Bearer ${token}` },
        signal: abort.signal,
      });
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('A consulta bancária precisa da API do servidor.');
      }
      const data: OpenFinanceResponse & { message?: string } = await response.json();
      if (!response.ok) throw new Error(data.message || 'Não foi possível consultar o banco.');
      if (abort.signal.aborted) return;
      setConfigured(data.configured);
      // A GET with nothing saved for the month triggers the first read automatically.
      if (!refresh && data.configured && !data.snapshot) { setBusy(false); void load(true); return; }
      setSnapshot(data.snapshot);
    } catch (caught: unknown) {
      if (abort.signal.aborted) return;
      setError(caught instanceof Error ? caught.message : 'Não foi possível consultar o banco.');
    } finally {
      if (!abort.signal.aborted) setBusy(false);
    }
  }, [user, month]);

  useEffect(() => {
    setSnapshot(null);
    setPage(1);
    void load(false);
    return () => controller.current?.abort();
  }, [load]);

  const rows = useMemo<ClassifiedTx[]>(() => {
    if (!snapshot) return [];
    return snapshot.transactions.map((tx) => classify(tx, snapshot.accounts.find((a) => a.id === tx.accountId), bankTxAnnotations[`${tx.accountId}:${tx.id}`]));
  }, [snapshot, bankTxAnnotations]);

  const totals = useMemo(() => {
    const sum = (kind: ClassifiedTx['kind']) => rows.filter((r) => r.kind === kind).reduce((s, r) => s + r.value, 0);
    const income = sum('income');
    const expense = sum('expense') - sum('refund');
    return { income, expense, net: income - expense, internal: sum('internal') };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === 'expense' && r.kind !== 'expense') return false;
      if (filter === 'income' && r.kind !== 'income') return false;
      if (filter === 'pix' && !(r.operation === 'PIX' || /\bpix\b/i.test(r.description))) return false;
      if (filter === 'uncategorized' && r.categorySource === 'usuario') return false;
      if (!q) return true;
      return `${r.description} ${r.counterparty ?? ''} ${r.category} ${r.note ?? ''}`.toLowerCase().includes(q);
    });
  }, [rows, filter, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((Math.min(page, pages) - 1) * PAGE_SIZE, Math.min(page, pages) * PAGE_SIZE);

  const changeCategory = (row: ClassifiedTx, value: string): void => {
    if (value === '__new__') {
      const name = window.prompt('Nome da nova categoria (ex.: Financiamento, Aluguel, Alimentação):')?.trim();
      if (!name) return;
      addCategory(row.direction === 'CREDIT' ? 'income' : 'expense', name.slice(0, 40));
      annotateBankTransaction(row.key, { category: name.slice(0, 40) });
      return;
    }
    annotateBankTransaction(row.key, { category: value || null });
  };

  if (!user) return <p className="cyber-card rounded-2xl p-4 text-sm text-slate-300">Entre com sua conta Google para ver o extrato do banco.</p>;

  return (
    <section aria-label="Movimentações do banco" className="space-y-4">
      <div className="cyber-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-white">Extrato do banco · vinculado</h3>
              <p className="text-xs text-slate-400">Valores e datas vêm do banco e não podem ser editados. Você pode mudar a categoria e escrever uma nota: o Dante usa isso na análise.</p>
            </div>
          </div>
          <button disabled={busy} onClick={() => void load(true)} className="flex items-center gap-2 rounded-xl bg-cyan-400 text-slate-950 px-4 py-2 font-bold text-xs disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />{busy ? 'Consultando…' : 'Atualizar do banco'}
          </button>
        </div>
        {error && <p role="alert" className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        {configured === false && <p className="text-sm text-amber-200">A conexão bancária ainda não foi configurada no servidor.</p>}
        {snapshot && <p className="text-[11px] text-slate-500">Consulta de {new Date(snapshot.fetchedAt).toLocaleString('pt-BR')}. O Meu Pluggy atualiza os dados do banco cerca de 1x por dia.</p>}
      </div>

      {snapshot && <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard label="Entradas" value={totals.income} tone="text-emerald-300" />
          <SummaryCard label="Saídas reais" value={totals.expense} tone="text-rose-300" />
          <SummaryCard label="Resultado" value={totals.net} tone={totals.net >= 0 ? 'text-emerald-300' : 'text-rose-300'} />
          <SummaryCard label="Entre contas / fatura (não conta)" value={totals.internal} tone="text-slate-300" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {([['all', 'Todas'], ['expense', 'Saídas'], ['income', 'Entradas'], ['pix', 'Pix'], ['uncategorized', 'Sem minha categoria']] as Array<[Filter, string]>).map(([value, label]) => (
            <button key={value} onClick={() => { setFilter(value); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${filter === value ? 'bg-cyan-400 text-slate-950 border-cyan-300' : 'border-white/10 text-slate-300'}`}>{label}</button>
          ))}
          <label className="flex items-center gap-2 ml-auto bg-slate-800 border border-slate-600 rounded-lg px-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input aria-label="Buscar no extrato" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Buscar nome, descrição, nota" className="bg-transparent py-1.5 text-xs text-white outline-none w-44" />
          </label>
        </div>

        <ul className="space-y-2">
          {visible.map((row) => {
            const options = row.direction === 'CREDIT' ? incomeCategories : expenseCategories;
            const userCategory = bankTxAnnotations[row.key]?.category || '';
            const providerLabel = row.categorySource === 'usuario' ? null : row.category;
            const sign = row.kind === 'income' || row.kind === 'refund' ? '+' : row.kind === 'internal' ? '↔ ' : '-';
            return (
              <li key={row.key} className="cyber-card rounded-xl p-3 grid gap-2 sm:grid-cols-[1fr_auto] items-start">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{row.counterparty || row.description}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {formatDateBR(row.date)} · {row.accountLabel}{row.operation ? ` · ${row.operation}` : ''}{row.installment ? ` · parcela ${row.installment.number}/${row.installment.total}` : ''} · {KIND_LABEL[row.kind]}
                    {row.counterparty && row.counterparty !== row.description ? ` · ${row.description}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select aria-label={`Categoria de ${row.counterparty || row.description}`} value={userCategory} onChange={(e) => changeCategory(row, e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg p-1.5 text-xs text-white max-w-[14rem]">
                      <option value="">{providerLabel ? `Banco: ${providerLabel}` : 'Sem categoria'}</option>
                      {options.map((c) => <option key={c} value={c}>{c}</option>)}
                      <option value={INTERNAL_TRANSFER_CATEGORY}>↔ {INTERNAL_TRANSFER_CATEGORY}</option>
                      {userCategory && !options.includes(userCategory) && userCategory !== INTERNAL_TRANSFER_CATEGORY && <option value={userCategory}>{userCategory}</option>}
                      <option value="__new__">+ Nova categoria…</option>
                    </select>
                    <NoteField key={`${row.key}:${bankTxAnnotations[row.key]?.note ?? ''}`} initial={bankTxAnnotations[row.key]?.note ?? ''} onSave={(note) => annotateBankTransaction(row.key, { note })} />
                  </div>
                </div>
                <p className={`font-mono text-sm whitespace-nowrap flex items-center gap-1 justify-end ${row.kind === 'income' || row.kind === 'refund' ? 'text-emerald-300' : row.kind === 'internal' ? 'text-slate-400' : 'text-rose-300'}`} title="Valor do banco: não editável">
                  <Lock className="w-3 h-3 opacity-60" />{sign}{formatBRL(row.value)}
                </p>
              </li>
            );
          })}
        </ul>
        {filtered.length === 0 && <p className="text-sm text-slate-400">Nenhuma movimentação com esse filtro neste mês.</p>}
        {pages > 1 && <div className="flex items-center gap-4 text-sm text-slate-300">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="underline disabled:opacity-40">Anterior</button>
          <span>Página {Math.min(page, pages)} de {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="underline disabled:opacity-40">Próxima</button>
        </div>}
      </>}
    </section>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="cyber-card rounded-xl p-3">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className={`font-mono text-lg font-bold ${tone}`}>{formatBRL(value)}</p>
    </div>
  );
}

function NoteField({ initial, onSave }: { initial: string; onSave: (note: string) => void }) {
  const [value, setValue] = useState(initial);
  const commit = (): void => { if (value.trim() !== initial.trim()) onSave(value); };
  return (
    <label className="flex items-center gap-1 flex-1 min-w-[10rem] bg-slate-800 border border-slate-600 rounded-lg px-2">
      <StickyNote className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <input aria-label="Nota" value={value} maxLength={200} onChange={(e) => setValue(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} placeholder="Nota: ex. aluguel de novembro" className="bg-transparent py-1.5 text-xs text-white outline-none w-full" />
    </label>
  );
}
