import React, { useRef, useState } from 'react';
import type { Transaction } from '../../types/finance';
import { dateInMonth, prepareExpenseRepeats } from '../../utils/repeatExpenses';
import { formatBRL, formatDateBR, monthLabel, todayISO } from '../../utils/format';
import { shiftMonth, transactionTotals } from '../../utils/transactionPeriod';

interface Props {
  transactions: Transaction[];
  source?: Transaction;
  onClose: () => void;
  onRepeat: (ids: string[], targetMonth: string) => void;
}

export default function RepeatExpensesModal({ transactions, source, onClose, onRepeat }: Props) {
  const currentMonth = todayISO().slice(0, 7);
  const [sourceMonth, setSourceMonth] = useState(source?.date.slice(0, 7) || shiftMonth(currentMonth, -1));
  const [targetMonth, setTargetMonth] = useState(currentMonth);
  const [selected, setSelected] = useState<string[]>(source ? [source.id] : []);
  const submitting = useRef(false);
  const validMonth = /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(targetMonth);
  const candidates = transactions.filter(tx => tx.type === 'expense' && tx.date.slice(0, 7) === sourceMonth);
  const preview = validMonth ? prepareExpenseRepeats(transactions, selected, targetMonth) : { additions: [], skipped: 0 };
  const occupied = new Set(transactions.filter(tx => tx.date.slice(0, 7) === targetMonth).map(tx => tx.repeatSourceId || tx.id));
  const availableIds = candidates.filter(tx => validMonth && !occupied.has(tx.repeatSourceId || tx.id)).map(tx => tx.id);

  return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="repeat-expenses-title" className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-cyan-500/30 p-5 space-y-4 text-white">
      <div className="flex justify-between gap-3 items-start">
        <h3 id="repeat-expenses-title" className="text-lg font-bold">Repetir despesas em outro mês</h3>
        <button aria-label="Fechar repetição" onClick={onClose} className="text-sm text-slate-300">Fechar</button>
      </div>
      <p className="text-sm text-slate-300">Escolha as despesas e confira o destino. As novas cópias ficarão pendentes, sem descontar do saldo. Os registros originais serão mantidos.</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-300">Copiar do mês
          <input aria-label="Mês de origem das despesas" type="month" value={sourceMonth} onChange={event => { setSourceMonth(event.target.value); setSelected([]); }} className="mt-1 block w-full bg-slate-800 border border-slate-600 rounded-lg p-2" />
        </label>
        <label className="text-xs text-slate-300">Repetir no mês
          <input aria-label="Mês de destino das despesas" type="month" value={targetMonth} onChange={event => setTargetMonth(event.target.value)} className="mt-1 block w-full bg-slate-800 border border-slate-600 rounded-lg p-2" />
        </label>
      </div>
      <div className="flex gap-4 text-xs text-cyan-300">
        <button onClick={() => setTargetMonth(currentMonth)}>Usar este mês</button>
        <button onClick={() => setSelected(availableIds)}>Selecionar disponíveis</button>
        <button onClick={() => setSelected([])}>Limpar seleção</button>
      </div>
      {!validMonth && <p role="alert" className="text-rose-300 text-sm">Selecione um mês de destino válido.</p>}
      <div className="space-y-2">
        {candidates.map(tx => {
          const duplicate = validMonth && occupied.has(tx.repeatSourceId || tx.id);
          return <label key={tx.id} className={`flex items-start gap-3 rounded-xl border border-slate-700 p-3 ${duplicate ? 'opacity-50' : ''}`}>
            <input type="checkbox" aria-label={`Repetir ${tx.note || tx.category}`} disabled={duplicate || !validMonth} checked={selected.includes(tx.id) && !duplicate} onChange={event => setSelected(ids => event.target.checked ? [...ids, tx.id] : ids.filter(id => id !== tx.id))} />
            <span className="flex-1 text-sm">{tx.note || tx.category}<span className="block text-xs text-slate-400">{duplicate ? 'Já existe neste mês — não será repetida.' : validMonth ? `Nova data: ${formatDateBR(dateInMonth(targetMonth, tx.repeatDay || Number(tx.date.slice(8, 10))))}` : ''}</span></span>
            <span className="text-sm font-mono">{formatBRL(tx.amount)}</span>
          </label>;
        })}
        {candidates.length === 0 && <p className="text-sm text-slate-400">Não há despesas no mês de origem selecionado.</p>}
      </div>
      <p className="text-sm text-slate-200">{preview.additions.length} despesa(s) · {formatBRL(transactionTotals(preview.additions).expense)}{validMonth ? ` · ${monthLabel(targetMonth)}` : ''}</p>
      <p className="text-xs text-slate-400">Dias 29, 30 e 31 são ajustados para o último dia quando necessário. Uma despesa repetida por este recurso só é criada uma vez em cada mês. Confira também lançamentos semelhantes cadastrados manualmente.</p>
      <button disabled={!preview.additions.length} onClick={() => { if (submitting.current || !preview.additions.length) return; submitting.current = true; onRepeat(selected, targetMonth); }} className="w-full bg-cyan-400 text-slate-950 rounded-xl p-3 text-sm font-bold disabled:opacity-40">Criar {preview.additions.length} despesa(s) pendente(s)</button>
    </section>
  </div>;
}
