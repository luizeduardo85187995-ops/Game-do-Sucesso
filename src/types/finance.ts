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
  amount: number; // Valor investido original / custo total
  date: string;
  quantity?: number;
  monthlyYield?: number;
  lastPrice?: number;
  lastPriceAt?: string;
  averagePrice?: number;
  currentPrice?: number;
  priceChange24h?: number;
  dividendYield?: number;
  pvp?: number;
  sector?: string;
  totalCurrentValue?: number;
  totalProfitLoss?: number;
  totalProfitLossPercent?: number;
}

export type DividendType = 'rendimento' | 'dividendo' | 'jcp' | 'bonificacao';
export type DividendStatus = 'scheduled' | 'paid' | 'projected';

export interface DividendEvent {
  id: string;
  investmentId?: string;
  ticker: string;
  assetName: string;
  type: DividendType;
  dataCom: string; // Data de corte (YYYY-MM-DD)
  paymentDate: string; // Data em que cai o pagamento (YYYY-MM-DD)
  ratePerShare: number; // Valor por cota / ação (R$)
  quantity: number; // Quantidade de cotas
  totalAmount: number; // ratePerShare * quantity
  status: DividendStatus;
  creditedToAccount?: boolean;
  bankAccountId?: string;
  notes?: string;
}

export interface B3AssetQuote {
  ticker: string;
  name: string;
  type: InvestmentType;
  price: number;
  changePercent: number;
  dividendYield: number; // DY 12m em %
  pvp?: number;
  sector: string;
  lastDividendPerShare?: number;
  dividendFrequency?: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  nextDataCom?: string;
  nextPaymentDate?: string;
  estimatedNextRate?: number;
  lastUpdate: string;
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

export interface B3BrokerConnection {
  id: string;
  name: string;
  code: string;
  connected: boolean;
  assetCount: number;
  totalValue: number;
}

export interface B3IntegrationState {
  // A carteira é configurada/importada pelo usuário. Não representa autenticação oficial com a B3.
  isPortfolioConfigured: boolean;
  isConnected?: boolean; // compatibilidade com telas/estados antigos; significa apenas perfil configurado
  connectedCpf?: string;
  investorName?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  linkedBrokers: B3BrokerConnection[];
  autoSyncDividends: boolean;
  importedAssetsCount: number;
  integrationMode: 'extrato_manual' | 'planilha_b3' | 'perfil_investidor';
}
