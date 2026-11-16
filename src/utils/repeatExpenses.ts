import type { Transaction } from '../types/finance';

export function dateInMonth(month: string, preferredDay: number): string {
  if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month) || !Number.isInteger(preferredDay) || preferredDay < 1 || preferredDay > 31) {
    throw new Error('Informe um mês e um dia válidos.');
  }
  const [year, number] = month.split('-').map(Number);
  const day = Math.min(preferredDay, new Date(Date.UTC(year, number, 0)).getUTCDate());
  return `${month}-${String(day).padStart(2, '0')}`;
}

export function prepareExpenseRepeats(
  transactions: Transaction[], sourceIds: string[], targetMonth: string,
): { additions: Transaction[]; skipped: number } {
  dateInMonth(targetMonth, 1);
  const selected = new Set(sourceIds);
  const occupied = new Set(transactions.filter(tx => tx.date.slice(0, 7) === targetMonth)
    .map(tx => tx.repeatSourceId || tx.id));
  const additions: Transaction[] = [];
  let skipped = 0;
  for (const source of transactions) {
    if (!selected.has(source.id)) continue;
    const rootId = source.repeatSourceId || source.id;
    if (source.type !== 'expense' || occupied.has(rootId) || !Number.isFinite(source.amount) || source.amount <= 0) {
      skipped += 1;
      continue;
    }
    const preferredDay = source.repeatDay || Number(source.date.slice(8, 10));
    const copy: Transaction = {
      id: `repeat:${rootId}:${targetMonth}`,
      type: 'expense', amount: source.amount, category: source.category,
      date: dateInMonth(targetMonth, preferredDay), status: 'pending', paymentDate: '',
      repeatSourceId: rootId, repeatDay: preferredDay,
      ...(source.note ? { note: source.note } : {}),
      ...(source.bankAccountId ? { bankAccountId: source.bankAccountId } : {}),
    };
    additions.push(copy);
    occupied.add(rootId);
  }
  return { additions, skipped };
}
