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
