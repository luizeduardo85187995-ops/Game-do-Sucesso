export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note?: string;
  bankAccountId?: string;
}

export type BankAccountType =
  | 'checking'
  | 'savings'
  | 'wallet'
  | 'broker'
  | 'credit-card';

export interface BankAccount {
  id: string;
  bankName: string;
  accountType: BankAccountType;
  nickname?: string;
  balance: number;
  updatedAt: string;
  color?: string;
}

export type InvestmentType = 'fii' | 'etf' | 'stock' | 'cdb' | 'treasury';
export type InvestmentFocus = 'income' | 'reserve' | 'growth' | 'diversification';

export interface Investment {
  id: string;
  type: InvestmentType;
  code: string;
  name?: string;
  amount: number;
  date: string;
  quantity?: number;
  monthlyYield?: number;
  lastPrice?: number;
  lastPriceAt?: string;
}

export interface SavingGoal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  categoryTag: string;
  createdAt: string;
  theme?: string;
  skinId?: string;
}

export interface Goals {
  monthly: number;
  reserve: number;
  passiveIncome: number;
  investedPatrimony: number;
}

export interface BaseSettings {
  startingBalance: number;
  fixedIncome: number;
}

export interface MarketIndicator {
  id: string;
  label: string;
  value: number;
  suffix: string;
  source: string;
  note?: string;
}

export interface ParsedTransaction {
  type: 'income' | 'expense';
  amount: number;
  note: string;
  category: string;
  bank?: string;
  confidence: 'high' | 'medium' | 'low';
}
