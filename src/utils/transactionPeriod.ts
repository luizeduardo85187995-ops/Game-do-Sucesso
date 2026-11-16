import type { Transaction } from '../types/finance';

export function shiftMonth(month: string, offset: number): string {
  const [year, number] = month.split('-').map(Number);
  const value = new Date(Date.UTC(year, number - 1 + offset, 1));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function transactionsForMonth(transactions: Transaction[], month: string | null): Transaction[] {
  return transactions.filter(transaction => month === null || transaction.date.slice(0, 7) === month);
}

export function transactionTotals(transactions: Transaction[]): { income: number; expense: number; net: number } {
  let income = 0;
  let expense = 0;
  for (const transaction of transactions) {
    const cents = Math.round(transaction.amount * 100);
    if (transaction.type === 'income') income += cents;
    else expense += cents;
  }
  return { income: income / 100, expense: expense / 100, net: (income - expense) / 100 };
}

export function isValidDate(value: string): boolean {
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function transactionsForRange(transactions: Transaction[], from: string, to: string): Transaction[] {
  if (!isValidDate(from) || !isValidDate(to) || from > to) return [];
  return transactions.filter(tx => tx.date.slice(0, 10) >= from && tx.date.slice(0, 10) <= to);
}
