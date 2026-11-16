import type { Transaction } from '../types/finance';

// Legacy transactions already changed bank balances when created.
export function isSettled(transaction: Pick<Transaction, 'status'>): boolean {
  return transaction.status !== 'pending';
}

export function bankMovement(transaction: Pick<Transaction, 'status' | 'type' | 'amount'>): number {
  if (!isSettled(transaction)) return 0;
  return transaction.type === 'income' ? transaction.amount : -transaction.amount;
}
