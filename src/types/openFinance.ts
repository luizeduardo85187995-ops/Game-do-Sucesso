export interface ConnectedAccount {
  id: string;
  itemId: string;
  name: string;
  institution: string;
  type: 'BANK' | 'CREDIT';
  balance: number;
  currency: string;
  updatedAt: string | null;
}

export interface BankStatementEntry {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  direction: 'CREDIT' | 'DEBIT';
  /** Categoria sugerida pelo provedor (pode vir em inglês). */
  providerCategory?: string | null;
  /** PIX, TED, BOLETO, CARD... */
  operation?: string | null;
  /** Nome de quem recebeu (saída) ou pagou (entrada). Nunca contém CPF/CNPJ. */
  counterparty?: string | null;
  installment?: { number: number; total: number } | null;
}

/** Ajustes do usuário sobre uma movimentação bancária. O valor e a data do banco nunca são editáveis. */
export interface BankTxAnnotation {
  category?: string;
  note?: string;
  updatedAt: string;
}

/** Categoria especial: movimentação entre contas do próprio titular (não é receita nem despesa). */
export const INTERNAL_TRANSFER_CATEGORY = 'Transferência entre minhas contas';

export function bankTxKey(tx: Pick<BankStatementEntry, 'accountId' | 'id'>): string {
  return `${tx.accountId}:${tx.id}`;
}

export interface BankSnapshot {
  month: string;
  fetchedAt: string;
  accounts: ConnectedAccount[];
  transactions: BankStatementEntry[];
  warnings: string[];
}

export interface OpenFinanceResponse {
  configured: boolean;
  snapshot: BankSnapshot | null;
  cached?: boolean;
}
