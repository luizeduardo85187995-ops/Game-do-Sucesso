import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import {
  BankAccount,
  BaseSettings,
  DividendEvent,
  Goals,
  Investment,
  InvestmentFocus,
  MarketIndicator,
  SavingGoal,
  Transaction,
  TransactionType,
  B3IntegrationState,
  B3BrokerConnection,
} from '../types/finance';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_MARKET_INDICATORS,
  ESTIMATED_MONTHLY_YIELD,
} from '../data/categories';
import { monthKey, todayISO, nextMonthKey } from '../utils/format';
import {
  B3_CATALOG,
  fetchB3Quote,
  generateDividendScheduleForPortfolio,
  DEFAULT_LINKED_BROKERS,
} from '../services/b3MarketService';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface FinanceMetrics {
  balance: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  investedTotal: number;
  investedCostTotal: number;
  investedProfitLoss: number;
  investedProfitLossPercent: number;
  estimatedPassiveIncome: number;
  upcomingDividendsThisMonth: number;
  bankBalance: number;
  creditCardDebt: number;
  savingsRate: number;
  futureExpenses: number;
  nextMonthExpenses: number;
  projectedBalance: number;
  realFreeBalance: number;
}

interface FinanceContextValue {
  transactions: Transaction[];
  investments: Investment[];
  bankAccounts: BankAccount[];
  savingGoals: SavingGoal[];
  incomeCategories: string[];
  expenseCategories: string[];
  categoryIcons: Record<string, string>;
  goals: Goals;
  base: BaseSettings;
  investmentFocus: InvestmentFocus;
  marketIndicators: MarketIndicator[];
  activeGoalId: string | null;
  setActiveGoalId: (id: string | null) => void;
  metrics: FinanceMetrics;

  // Cloud & Data Persistence
  cloudSyncStatus: 'synced' | 'syncing' | 'saved_locally';
  lastCloudSyncAt: string | null;
  triggerCloudSync: () => Promise<void>;

  // B3 & Proventos
  dividendEvents: DividendEvent[];
  isSyncingB3: boolean;
  lastB3SyncAt: string | null;
  b3Integration: B3IntegrationState;
  syncB3Quotes: () => Promise<void>;
  confirmDividendPayout: (eventId: string, bankAccountId?: string) => void;
  addManualDividend: (event: Omit<DividendEvent, 'id'>) => DividendEvent;
  connectB3Account: (cpf: string, investorName?: string, selectedBrokerIds?: string[]) => Promise<boolean>;
  disconnectB3Account: () => void;
  importB3PortfolioAssets: (assets: Omit<Investment, 'id'>[], replaceExisting?: boolean) => void;
  syncB3InvestorAccount: () => Promise<void>;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id'>) => Transaction;
  updateTransaction: (id: string, changes: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: string) => void;

  addBankAccount: (acc: Omit<BankAccount, 'id' | 'updatedAt'>) => BankAccount;
  updateBankAccount: (id: string, changes: Partial<Omit<BankAccount, 'id'>>) => void;
  deleteBankAccount: (id: string) => void;

  addInvestment: (inv: Omit<Investment, 'id'>) => Investment;
  updateInvestment: (id: string, changes: Partial<Omit<Investment, 'id'>>) => void;
  deleteInvestment: (id: string) => void;
  clearAllInvestments: () => void;

  addSavingGoal: (goal: Omit<SavingGoal, 'id' | 'createdAt'>) => SavingGoal;
  updateSavingGoal: (id: string, changes: Partial<Omit<SavingGoal, 'id'>>) => void;
  deleteSavingGoal: (id: string) => void;
  depositToGoal: (id: string, amount: number) => void;
  withdrawFromGoal: (id: string, amount: number) => void;

  setGoals: (goals: Partial<Goals>) => void;
  setBase: (base: Partial<BaseSettings>) => void;
  setInvestmentFocus: (focus: InvestmentFocus) => void;
  addCategory: (type: TransactionType, name: string, icon?: string) => void;
  removeCategory: (type: TransactionType, name: string) => void;
  setCategoryIcon: (categoryName: string, icon: string) => void;
  resetAllData: () => void;
  exportAllData: () => any;
  importAllData: (data: any) => boolean;
}

const PRIMARY_STORAGE_KEY = '@financas/state-v3-zeroed';
const BACKUP_STORAGE_KEY = '@financas/backup_v1';
const LEGACY_STORAGE_KEYS = [
  PRIMARY_STORAGE_KEY,
  BACKUP_STORAGE_KEY,
  '@financas/state-v3',
  '@financas/state-v2',
  '@financas/state-v1',
  '@financas/state',
  'financas_state',
  'financial_data',
];

const INITIAL_ACCOUNTS: BankAccount[] = [
  { id: 'bank-1', bankName: 'Conta Corrente', accountType: 'checking', nickname: 'Principal', balance: 0.00, updatedAt: new Date().toISOString(), color: '#06B6D4' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [];

const INITIAL_INVESTMENTS: Investment[] = [];

const INITIAL_GOALS: SavingGoal[] = [
  { id: 'goal-1', name: 'Minha Primeira Meta', emoji: '🎯', targetAmount: 1000.00, currentAmount: 0.00, categoryTag: 'Geral', createdAt: todayISO(), theme: 'gold', skinId: 'climber' },
];

const INITIAL_B3_INTEGRATION: B3IntegrationState = {
  isConnected: false,
  syncStatus: 'idle',
  linkedBrokers: DEFAULT_LINKED_BROKERS,
  autoSyncDividends: true,
  importedAssetsCount: 0,
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(INITIAL_ACCOUNTS);
  const [investments, setInvestments] = useState<Investment[]>(INITIAL_INVESTMENTS);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>(INITIAL_GOALS);
  const [incomeCategories, setIncomeCategories] = useState<string[]>(DEFAULT_INCOME_CATEGORIES);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({});
  const [goals, setGoalsState] = useState<Goals>({ monthly: 0, reserve: 0, passiveIncome: 0, investedPatrimony: 0 });
  const [base, setBaseState] = useState<BaseSettings>({ startingBalance: 0, fixedIncome: 0 });
  const [investmentFocus, setInvestmentFocus] = useState<InvestmentFocus>('income');
  const [activeGoalId, setActiveGoalId] = useState<string | null>('goal-1');
  const [marketIndicators] = useState<MarketIndicator[]>(DEFAULT_MARKET_INDICATORS);

  // Cloud Sync State
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'saved_locally'>('saved_locally');
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<string | null>(null);
  const cloudSaveTimerRef = useRef<any>(null);

  // B3 & Proventos State
  const [isSyncingB3, setIsSyncingB3] = useState(false);
  const [lastB3SyncAt, setLastB3SyncAt] = useState<string | null>(null);
  const [manualDividends, setManualDividends] = useState<DividendEvent[]>([]);
  const [b3Integration, setB3Integration] = useState<B3IntegrationState>(INITIAL_B3_INTEGRATION);

  // Helper to load parsed data safely into state
  const applyStatePayload = (parsed: any) => {
    if (!parsed || typeof parsed !== 'object') return;
    if (Array.isArray(parsed.transactions)) setTransactions(parsed.transactions);
    if (Array.isArray(parsed.bankAccounts) && parsed.bankAccounts.length > 0) setBankAccounts(parsed.bankAccounts);
    if (Array.isArray(parsed.investments)) {
      // Sanitize only malformed items, never wipe real tickers
      const valid = parsed.investments.filter((inv: any) => inv && inv.code && typeof inv.amount === 'number' && isFinite(inv.amount));
      setInvestments(valid);
    }
    if (Array.isArray(parsed.savingGoals) && parsed.savingGoals.length > 0) setSavingGoals(parsed.savingGoals);
    if (Array.isArray(parsed.incomeCategories) && parsed.incomeCategories.length > 0) setIncomeCategories(parsed.incomeCategories);
    if (Array.isArray(parsed.expenseCategories) && parsed.expenseCategories.length > 0) setExpenseCategories(parsed.expenseCategories);
    if (parsed.categoryIcons && typeof parsed.categoryIcons === 'object') setCategoryIcons(parsed.categoryIcons);
    if (parsed.goals) setGoalsState(parsed.goals);
    if (parsed.base) setBaseState(parsed.base);
    if (parsed.investmentFocus) setInvestmentFocus(parsed.investmentFocus);
    if (parsed.activeGoalId) setActiveGoalId(parsed.activeGoalId);
    if (Array.isArray(parsed.manualDividends)) setManualDividends(parsed.manualDividends);
    if (parsed.lastB3SyncAt) setLastB3SyncAt(parsed.lastB3SyncAt);
    if (parsed.b3Integration) setB3Integration(parsed.b3Integration);
  };

  // 1. Initial Load: Check primary and all legacy keys to guarantee NO CLIENT DATA IS LOST
  useEffect(() => {
    try {
      let foundData: any = null;

      // Scan all legacy and current storage keys
      for (const key of LEGACY_STORAGE_KEYS) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            const hasData =
              (Array.isArray(parsed.transactions) && parsed.transactions.length > 0) ||
              (Array.isArray(parsed.bankAccounts) && parsed.bankAccounts.some((a: any) => a.balance !== 0 || a.nickname)) ||
              (Array.isArray(parsed.investments) && parsed.investments.length > 0);

            if (hasData) {
              foundData = parsed;
              break;
            } else if (!foundData) {
              foundData = parsed;
            }
          }
        } catch {
          // ignore single key error
        }
      }

      if (foundData) {
        applyStatePayload(foundData);
        // Write to primary and backup keys immediately to secure the data
        localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(foundData));
        localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(foundData));
      }
    } catch (e) {
      console.warn('Could not load saved finance data:', e);
    } finally {
      setLoaded(true);
    }
  }, []);

  // 2. Firebase Cloud Sync: When user is authenticated, sync with Firestore
  useEffect(() => {
    if (!user || !loaded) return;
    const uid = user.uid;
    let isCancelled = false;

    async function syncCloudOnAuth() {
      try {
        setCloudSyncStatus('syncing');
        const userDocRef = doc(db, 'users', uid, 'financialData', 'state');
        const snap = await getDoc(userDocRef);

        if (snap.exists() && !isCancelled) {
          const cloudData = snap.data();
          const cloudHasRecords =
            (Array.isArray(cloudData.transactions) && cloudData.transactions.length > 0) ||
            (Array.isArray(cloudData.bankAccounts) && cloudData.bankAccounts.some((a: any) => a.balance !== 0));

          // If cloud has data, load it
          if (cloudHasRecords) {
            applyStatePayload(cloudData);
            localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(cloudData));
            localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(cloudData));
          } else {
            // Cloud has no transactions yet, but local storage does: upload local data to cloud!
            const localPayload = {
              transactions,
              bankAccounts,
              investments,
              savingGoals,
              incomeCategories,
              expenseCategories,
              categoryIcons,
              goals,
              base,
              investmentFocus,
              activeGoalId,
              manualDividends,
              lastB3SyncAt,
              b3Integration,
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, localPayload, { merge: true });
          }
          setCloudSyncStatus('synced');
          setLastCloudSyncAt(new Date().toLocaleTimeString('pt-BR'));
        } else if (!isCancelled) {
          // Document does not exist in cloud yet: create it with current state
          const localPayload = {
            transactions,
            bankAccounts,
            investments,
            savingGoals,
            incomeCategories,
            expenseCategories,
            categoryIcons,
            goals,
            base,
            investmentFocus,
            activeGoalId,
            manualDividends,
            lastB3SyncAt,
            b3Integration,
            updatedAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, localPayload, { merge: true });
          setCloudSyncStatus('synced');
          setLastCloudSyncAt(new Date().toLocaleTimeString('pt-BR'));
        }
      } catch (err) {
        console.warn('Erro ao sincronizar com Firestore:', err);
        setCloudSyncStatus('saved_locally');
      }
    }

    syncCloudOnAuth();
    return () => {
      isCancelled = true;
    };
  }, [user, loaded]);

  // 3. Save to localStorage (Primary & Backup) + Debounced Firestore Cloud Save
  useEffect(() => {
    if (!loaded) return;
    const stateToSave = {
      transactions,
      bankAccounts,
      investments,
      savingGoals,
      incomeCategories,
      expenseCategories,
      categoryIcons,
      goals,
      base,
      investmentFocus,
      activeGoalId,
      manualDividends,
      lastB3SyncAt,
      b3Integration,
      savedAt: new Date().toISOString(),
    };

    // Immediate save to both localStorage keys (zero data loss guarantee)
    try {
      const serial = JSON.stringify(stateToSave);
      localStorage.setItem(PRIMARY_STORAGE_KEY, serial);
      localStorage.setItem(BACKUP_STORAGE_KEY, serial);
    } catch (e) {
      console.warn('Could not save finance data locally:', e);
    }

    // Debounced Cloud Firestore save if user is logged in
    if (user) {
      setCloudSyncStatus('syncing');
      if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);

      cloudSaveTimerRef.current = setTimeout(async () => {
        try {
          const userDocRef = doc(db, 'users', user.uid, 'financialData', 'state');
          await setDoc(userDocRef, stateToSave, { merge: true });
          setCloudSyncStatus('synced');
          setLastCloudSyncAt(new Date().toLocaleTimeString('pt-BR'));
        } catch (err) {
          console.warn('Erro ao salvar na nuvem Firestore:', err);
          setCloudSyncStatus('saved_locally');
        }
      }, 800);
    } else {
      setCloudSyncStatus('saved_locally');
    }

    return () => {
      if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
    };
  }, [
    loaded,
    transactions,
    bankAccounts,
    investments,
    savingGoals,
    incomeCategories,
    expenseCategories,
    goals,
    base,
    investmentFocus,
    activeGoalId,
    manualDividends,
    lastB3SyncAt,
    b3Integration,
    user,
  ]);

  // Explicit manual trigger for cloud sync
  const triggerCloudSync = async () => {
    if (!user) return;
    try {
      setCloudSyncStatus('syncing');
      const stateToSave = {
        transactions,
        bankAccounts,
        investments,
        savingGoals,
        incomeCategories,
        expenseCategories,
        goals,
        base,
        investmentFocus,
        activeGoalId,
        manualDividends,
        lastB3SyncAt,
        b3Integration,
        updatedAt: new Date().toISOString(),
      };
      const userDocRef = doc(db, 'users', user.uid, 'financialData', 'state');
      await setDoc(userDocRef, stateToSave, { merge: true });
      setCloudSyncStatus('synced');
      setLastCloudSyncAt(new Date().toLocaleTimeString('pt-BR'));
    } catch (err) {
      console.warn('Falha no triggerCloudSync:', err);
      setCloudSyncStatus('saved_locally');
    }
  };

  // Radar de Proventos Automático (Estilo Investidor10) baseado nas cotas da carteira
  const portfolioDividendEvents = useMemo(() => {
    return generateDividendScheduleForPortfolio(investments);
  }, [investments]);

  // Lista consolidada de proventos (automáticos da carteira + manuais)
  const dividendEvents = useMemo(() => {
    const combined = [...portfolioDividendEvents];
    manualDividends.forEach((manual) => {
      const exists = combined.some((c) => c.id === manual.id);
      if (!exists) combined.push(manual);
    });
    return combined.sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
  }, [portfolioDividendEvents, manualDividends]);

  // Computed metrics
  const metrics = useMemo<FinanceMetrics>(() => {
    const currentMKey = monthKey(todayISO());
    const nextMKey = nextMonthKey(todayISO());
    const todayStr = todayISO();

    let monthIncome = 0;
    let monthExpense = 0;
    let futureExpenses = 0;
    let nextMonthExpenses = 0;

    for (const tx of transactions) {
      if (monthKey(tx.date) === currentMKey) {
        if (tx.type === 'income') monthIncome += tx.amount;
        else monthExpense += tx.amount;
      }

      if (tx.type === 'expense') {
        if (tx.date > todayStr || monthKey(tx.date) > currentMKey) {
          futureExpenses += tx.amount;
        }
        if (monthKey(tx.date) === nextMKey) {
          nextMonthExpenses += tx.amount;
        }
      }
    }

    const monthNet = monthIncome - monthExpense;

    let bankBalance = 0;
    let creditCardDebt = 0;
    for (const acc of bankAccounts) {
      if (acc.accountType === 'credit-card') {
        creditCardDebt += Math.abs(acc.balance);
      } else {
        bankBalance += acc.balance;
      }
    }

    let investedCostTotal = 0;
    let investedTotal = 0;
    let estimatedPassiveIncome = 0;

    for (const inv of investments) {
      const cost = inv.amount || 0;
      investedCostTotal += cost;

      const qty = inv.quantity || 1;
      const currentPrice = inv.currentPrice || inv.lastPrice || (inv.quantity ? inv.amount / inv.quantity : inv.amount);
      const curVal = currentPrice ? currentPrice * qty : cost;
      investedTotal += curVal;

      const rate = inv.monthlyYield || ESTIMATED_MONTHLY_YIELD[inv.type] || 0.8;
      estimatedPassiveIncome += (curVal * rate) / 100;
    }

    const investedProfitLoss = investedTotal - investedCostTotal;
    const investedProfitLossPercent = investedCostTotal > 0 ? (investedProfitLoss / investedCostTotal) * 100 : 0;

    // Proventos previstos para cair este mês (estilo Investidor10)
    let upcomingDividendsThisMonth = 0;
    for (const ev of dividendEvents) {
      if (monthKey(ev.paymentDate) === currentMKey) {
        upcomingDividendsThisMonth += ev.totalAmount;
      }
    }

    // Consolidated Balance: Sum of bank accounts + starting base adjustment
    const balance = bankBalance - creditCardDebt;
    const savingsRate = monthIncome > 0 ? Math.max(0, Math.min(100, (monthNet / monthIncome) * 100)) : 0;

    // As transações já abateram o saldo bancário ao serem cadastradas.
    // Portanto, o balance (ex: R$ 206,00) JÁ É o saldo líquido final que sobra após abater todas as despesas lançadas!
    const realFreeBalance = balance;
    const projectedBalance = balance;

    return {
      balance,
      monthIncome,
      monthExpense,
      monthNet,
      investedTotal,
      investedCostTotal,
      investedProfitLoss,
      investedProfitLossPercent,
      estimatedPassiveIncome,
      upcomingDividendsThisMonth,
      bankBalance,
      creditCardDebt,
      savingsRate,
      futureExpenses,
      nextMonthExpenses,
      projectedBalance,
      realFreeBalance,
    };
  }, [transactions, bankAccounts, investments, dividendEvents]);

  // Sincronização em tempo real com a Bolsa de Valores (B3)
  const syncB3Quotes = async () => {
    if (investments.length === 0) {
      setLastB3SyncAt(new Date().toISOString());
      return;
    }

    setIsSyncingB3(true);
    try {
      const updated = await Promise.all(
        investments.map(async (inv) => {
          const quote = await fetchB3Quote(inv.code);
          if (!quote) return inv;

          const qty = inv.quantity || Math.max(1, Math.round(inv.amount / (quote.price || 10)));
          const avgPrice = inv.averagePrice || (inv.amount / qty);
          const curVal = quote.price * qty;
          const profitLoss = curVal - inv.amount;
          const profitLossPct = inv.amount > 0 ? (profitLoss / inv.amount) * 100 : 0;

          return {
            ...inv,
            name: inv.name || quote.name,
            currentPrice: quote.price,
            lastPrice: quote.price,
            lastPriceAt: quote.lastUpdate,
            priceChange24h: quote.changePercent,
            dividendYield: quote.dividendYield,
            pvp: quote.pvp,
            sector: quote.sector,
            averagePrice: Number(avgPrice.toFixed(2)),
            totalCurrentValue: Number(curVal.toFixed(2)),
            totalProfitLoss: Number(profitLoss.toFixed(2)),
            totalProfitLossPercent: Number(profitLossPct.toFixed(2)),
          };
        })
      );

      setInvestments(updated);
      setLastB3SyncAt(new Date().toISOString());
    } catch (e) {
      console.warn('Erro ao sincronizar com B3:', e);
    } finally {
      setIsSyncingB3(false);
    }
  };

  // Actions
  const addTransaction = (tx: Omit<Transaction, 'id'>): Transaction => {
    const newTx: Transaction = {
      ...tx,
      id: 'tx-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    };
    setTransactions((prev) => [newTx, ...prev]);

    // If associated with a bank account, update its balance automatically
    if (tx.bankAccountId) {
      setBankAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id !== tx.bankAccountId) return acc;
          const delta = tx.type === 'income' ? tx.amount : -tx.amount;
          return { ...acc, balance: acc.balance + delta, updatedAt: new Date().toISOString() };
        })
      );
    }
    return newTx;
  };

  const updateTransaction = (id: string, changes: Partial<Omit<Transaction, 'id'>>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...changes } : tx))
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const addBankAccount = (acc: Omit<BankAccount, 'id' | 'updatedAt'>): BankAccount => {
    const newAcc: BankAccount = {
      ...acc,
      id: 'bank-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      updatedAt: new Date().toISOString(),
    };
    setBankAccounts((prev) => [...prev, newAcc]);
    return newAcc;
  };

  const updateBankAccount = (id: string, changes: Partial<Omit<BankAccount, 'id'>>) => {
    setBankAccounts((prev) =>
      prev.map((acc) =>
        acc.id === id ? { ...acc, ...changes, updatedAt: new Date().toISOString() } : acc
      )
    );
  };

  const deleteBankAccount = (id: string) => {
    setBankAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  const addInvestment = (inv: Omit<Investment, 'id'>): Investment => {
    // Busca informações de mercado no catálogo B3 se disponíveis
    const catalogItem = B3_CATALOG.find((c) => c.ticker === inv.code.toUpperCase());
    const qty = inv.quantity || (catalogItem?.price ? Math.max(1, Math.round(inv.amount / catalogItem.price)) : 10);
    const curPrice = inv.currentPrice || catalogItem?.price || (inv.amount / qty);
    const avgPrice = inv.averagePrice || (inv.amount / qty);
    const curVal = curPrice * qty;
    const profitLoss = curVal - inv.amount;
    const profitLossPct = inv.amount > 0 ? (profitLoss / inv.amount) * 100 : 0;

    const newInv: Investment = {
      ...inv,
      id: 'inv-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      quantity: qty,
      averagePrice: Number(avgPrice.toFixed(2)),
      currentPrice: curPrice ? Number(curPrice.toFixed(2)) : undefined,
      lastPrice: curPrice ? Number(curPrice.toFixed(2)) : undefined,
      lastPriceAt: new Date().toISOString(),
      priceChange24h: catalogItem?.changePercent,
      dividendYield: catalogItem?.dividendYield || (inv.monthlyYield ? inv.monthlyYield * 12 : undefined),
      pvp: catalogItem?.pvp,
      sector: catalogItem?.sector,
      totalCurrentValue: Number(curVal.toFixed(2)),
      totalProfitLoss: Number(profitLoss.toFixed(2)),
      totalProfitLossPercent: Number(profitLossPct.toFixed(2)),
    };

    setInvestments((prev) => [newInv, ...prev]);
    return newInv;
  };

  const updateInvestment = (id: string, changes: Partial<Omit<Investment, 'id'>>) => {
    setInvestments((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;
        const merged = { ...inv, ...changes };
        const qty = merged.quantity || 1;
        const curPrice = merged.currentPrice || merged.lastPrice || (merged.amount / qty);
        const curVal = curPrice * qty;
        const profitLoss = curVal - merged.amount;
        const profitLossPct = merged.amount > 0 ? (profitLoss / merged.amount) * 100 : 0;

        return {
          ...merged,
          totalCurrentValue: Number(curVal.toFixed(2)),
          totalProfitLoss: Number(profitLoss.toFixed(2)),
          totalProfitLossPercent: Number(profitLossPct.toFixed(2)),
        };
      })
    );
  };

  const deleteInvestment = (id: string) => {
    setInvestments((prev) => prev.filter((inv) => inv.id !== id));
  };

  const clearAllInvestments = () => {
    setInvestments([]);
    setB3Integration((prev) => ({
      ...prev,
      importedAssetsCount: 0,
    }));
    try {
      const saved = localStorage.getItem(PRIMARY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.investments = [];
        localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(parsed));
        localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn('Error clearing investments in localStorage:', e);
    }
  };

  // Confirmar recebimento do provento e creditar na conta bancária (Gera receita real)
  const confirmDividendPayout = (eventId: string, bankAccountId?: string) => {
    const event = dividendEvents.find((e) => e.id === eventId);
    if (!event) return;

    const targetAccount = bankAccountId
      ? bankAccounts.find((a) => a.id === bankAccountId)
      : bankAccounts[0];

    // Registra como transação de receita automática
    addTransaction({
      type: 'income',
      amount: event.totalAmount,
      category: 'Investimentos',
      date: todayISO(),
      note: `Provento B3 recebido: ${event.ticker} (${event.type.toUpperCase()}) - ${event.quantity} cotas a R$ ${event.ratePerShare.toFixed(2)}`,
      bankAccountId: targetAccount?.id,
    });

    // Atualiza status do provento
    setManualDividends((prev) => {
      const idx = prev.findIndex((p) => p.id === eventId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], status: 'paid', creditedToAccount: true, bankAccountId: targetAccount?.id };
        return copy;
      }
      return [...prev, { ...event, status: 'paid', creditedToAccount: true, bankAccountId: targetAccount?.id }];
    });
  };

  const addManualDividend = (event: Omit<DividendEvent, 'id'>): DividendEvent => {
    const newDiv: DividendEvent = {
      ...event,
      id: 'div-man-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    };
    setManualDividends((prev) => [newDiv, ...prev]);
    return newDiv;
  };

  // Conectar com a Área do Investidor B3 / CEI / Open Finance
  const connectB3Account = async (
    cpf: string,
    investorName?: string,
    selectedBrokerIds?: string[]
  ): Promise<boolean> => {
    setB3Integration((prev) => ({ ...prev, syncStatus: 'syncing' }));

    // Simulação do handshake criptografado com a B3
    await new Promise((resolve) => setTimeout(resolve, 800));

    const cleanCpf = cpf.replace(/\D/g, '');
    const maskedCpf = cleanCpf.length >= 6
      ? `***.${cleanCpf.slice(3, 6)}.${cleanCpf.slice(6, 9) || '***'}-**`
      : '***.***.123-**';

    const updatedBrokers = DEFAULT_LINKED_BROKERS.map((b) => ({
      ...b,
      connected: selectedBrokerIds ? selectedBrokerIds.includes(b.id) : b.connected,
    }));

    setB3Integration({
      isConnected: true,
      connectedCpf: maskedCpf,
      investorName: investorName || 'Investidor B3',
      connectedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      syncStatus: 'success',
      linkedBrokers: updatedBrokers,
      autoSyncDividends: true,
      importedAssetsCount: investments.length,
    });

    return true;
  };

  const disconnectB3Account = () => {
    setB3Integration({
      isConnected: false,
      syncStatus: 'idle',
      linkedBrokers: DEFAULT_LINKED_BROKERS.map((b) => ({ ...b, connected: false })),
      autoSyncDividends: false,
      importedAssetsCount: 0,
    });
  };

  const syncB3InvestorAccount = async () => {
    setB3Integration((prev) => ({ ...prev, syncStatus: 'syncing' }));
    await syncB3Quotes();
    setB3Integration((prev) => ({
      ...prev,
      lastSyncAt: new Date().toISOString(),
      syncStatus: 'success',
    }));
  };

  const importB3PortfolioAssets = (assets: Omit<Investment, 'id'>[], replaceExisting = false) => {
    const newItems: Investment[] = assets.map((a) => ({
      ...a,
      id: 'inv-b3-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    }));

    if (replaceExisting) {
      setInvestments(newItems);
    } else {
      setInvestments((prev) => {
        const merged = [...prev];
        newItems.forEach((item) => {
          const existingIdx = merged.findIndex((m) => m.code.toUpperCase() === item.code.toUpperCase());
          if (existingIdx >= 0) {
            const cur = merged[existingIdx];
            const totalQty = (cur.quantity || 1) + (item.quantity || 1);
            const totalCost = cur.amount + item.amount;
            const avgPrice = totalCost / totalQty;
            merged[existingIdx] = {
              ...cur,
              amount: totalCost,
              quantity: totalQty,
              averagePrice: Number(avgPrice.toFixed(2)),
              currentPrice: item.currentPrice || cur.currentPrice,
              totalCurrentValue: Number(((item.currentPrice || cur.currentPrice || avgPrice) * totalQty).toFixed(2)),
            };
          } else {
            merged.push(item);
          }
        });
        return merged;
      });
    }

    setB3Integration((prev) => ({
      ...prev,
      importedAssetsCount: (prev.importedAssetsCount || 0) + assets.length,
      lastSyncAt: new Date().toISOString(),
    }));
  };

  const addSavingGoal = (goal: Omit<SavingGoal, 'id' | 'createdAt'>): SavingGoal => {
    const newGoal: SavingGoal = {
      ...goal,
      id: 'goal-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      createdAt: todayISO(),
    };
    setSavingGoals((prev) => [...prev, newGoal]);
    return newGoal;
  };

  const updateSavingGoal = (id: string, changes: Partial<Omit<SavingGoal, 'id'>>) => {
    setSavingGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...changes } : g))
    );
  };

  const deleteSavingGoal = (id: string) => {
    setSavingGoals((prev) => prev.filter((g) => g.id !== id));
    if (activeGoalId === id) {
      const remaining = savingGoals.filter((g) => g.id !== id);
      setActiveGoalId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const depositToGoal = (id: string, amount: number) => {
    if (amount <= 0) return;
    setSavingGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g))
    );
  };

  const withdrawFromGoal = (id: string, amount: number) => {
    if (amount <= 0) return;
    setSavingGoals((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, currentAmount: Math.max(0, g.currentAmount - amount) } : g
      )
    );
  };

  const setGoals = (newGoals: Partial<Goals>) => {
    setGoalsState((prev) => ({ ...prev, ...newGoals }));
  };

  const setBase = (newBase: Partial<BaseSettings>) => {
    setBaseState((prev) => ({ ...prev, ...newBase }));
  };

  const addCategory = (type: TransactionType, name: string, icon?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (type === 'income') {
      if (!incomeCategories.includes(trimmed)) {
        setIncomeCategories((prev) => [...prev, trimmed]);
      }
    } else {
      if (!expenseCategories.includes(trimmed)) {
        setExpenseCategories((prev) => [...prev, trimmed]);
      }
    }
    if (icon) {
      setCategoryIcons((prev) => ({ ...prev, [trimmed]: icon }));
    }
  };

  const setCategoryIcon = (categoryName: string, icon: string) => {
    if (!categoryName || !icon) return;
    setCategoryIcons((prev) => ({ ...prev, [categoryName]: icon }));
  };

  const removeCategory = (type: TransactionType, name: string) => {
    if (type === 'income') {
      setIncomeCategories((prev) => prev.filter((c) => c !== name));
    } else {
      setExpenseCategories((prev) => prev.filter((c) => c !== name));
    }
    setCategoryIcons((prev) => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const resetAllData = () => {
    try {
      localStorage.removeItem(PRIMARY_STORAGE_KEY);
      localStorage.removeItem(BACKUP_STORAGE_KEY);
    } catch {
      // ignore
    }
    setTransactions([]);
    setBankAccounts(INITIAL_ACCOUNTS);
    setInvestments([]);
    setSavingGoals(INITIAL_GOALS);
    setIncomeCategories(DEFAULT_INCOME_CATEGORIES);
    setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
    setCategoryIcons({});
    setGoalsState({ monthly: 0, reserve: 0, passiveIncome: 0, investedPatrimony: 0 });
    setBaseState({ startingBalance: 0, fixedIncome: 0 });
    setActiveGoalId('goal-1');
  };

  const exportAllData = () => {
    return {
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      transactions,
      bankAccounts,
      investments,
      savingGoals,
      incomeCategories,
      expenseCategories,
      categoryIcons,
      goals,
      base,
      investmentFocus,
      activeGoalId,
    };
  };

  const importAllData = (data: any): boolean => {
    try {
      if (!data || typeof data !== 'object') return false;
      if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (Array.isArray(data.bankAccounts)) setBankAccounts(data.bankAccounts);
      if (Array.isArray(data.investments)) setInvestments(data.investments);
      if (Array.isArray(data.savingGoals)) setSavingGoals(data.savingGoals);
      if (Array.isArray(data.incomeCategories)) setIncomeCategories(data.incomeCategories);
      if (Array.isArray(data.expenseCategories)) setExpenseCategories(data.expenseCategories);
      if (data.categoryIcons && typeof data.categoryIcons === 'object') setCategoryIcons(data.categoryIcons);
      if (data.goals) setGoalsState(data.goals);
      if (data.base) setBaseState(data.base);
      if (data.investmentFocus) setInvestmentFocus(data.investmentFocus);
      if (data.activeGoalId) setActiveGoalId(data.activeGoalId);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        investments,
        bankAccounts,
        savingGoals,
        incomeCategories,
        expenseCategories,
        categoryIcons,
        goals,
        base,
        investmentFocus,
        marketIndicators,
        activeGoalId,
        setActiveGoalId,
        metrics,
        cloudSyncStatus,
        lastCloudSyncAt,
        triggerCloudSync,
        dividendEvents,
        isSyncingB3,
        lastB3SyncAt,
        b3Integration,
        syncB3Quotes,
        confirmDividendPayout,
        addManualDividend,
        connectB3Account,
        disconnectB3Account,
        importB3PortfolioAssets,
        syncB3InvestorAccount,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        clearAllInvestments,
        addSavingGoal,
        updateSavingGoal,
        deleteSavingGoal,
        depositToGoal,
        withdrawFromGoal,
        setGoals,
        setBase,
        setInvestmentFocus,
        addCategory,
        removeCategory,
        setCategoryIcon,
        resetAllData,
        exportAllData,
        importAllData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return ctx;
}
