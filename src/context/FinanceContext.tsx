import { prepareExpenseRepeats } from '../utils/repeatExpenses';
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
import { bankMovement, isSettled } from '../utils/transactions';
import { monthKey, todayISO, nextMonthKey } from '../utils/format';
import {
  B3_CATALOG,
  fetchB3Quote,
  generateDividendScheduleForPortfolio,
  DEFAULT_LINKED_BROKERS,
} from '../services/b3MarketService';
import { useAuth } from './AuthContext';
import { db, logOut } from '../lib/firebase';
import { doc, getDocFromServer, setDoc } from 'firebase/firestore';
import type { BankTxAnnotation } from '../types/openFinance';

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
  /** Categoria/nota do usuário para movimentações do banco, por chave `${accountId}:${txId}`. */
  bankTxAnnotations: Record<string, BankTxAnnotation>;
  annotateBankTransaction: (key: string, changes: { category?: string | null; note?: string | null }) => void;

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
  repeatExpenses: (sourceIds: string[], targetMonth: string) => void;

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

const GUEST_STORAGE_KEY = '@financas/state_guest';
const USER_STORAGE_KEY_PREFIX = '@financas/state_user_';

const INITIAL_ACCOUNTS: BankAccount[] = [
  { id: 'bank-1', bankName: 'Conta Corrente', accountType: 'checking', nickname: 'Principal', balance: 0.00, updatedAt: new Date().toISOString(), color: '#06B6D4' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [];

const INITIAL_INVESTMENTS: Investment[] = [];

const INITIAL_GOALS: SavingGoal[] = [
  { id: 'goal-1', name: 'Minha Primeira Meta', emoji: '🎯', targetAmount: 1000.00, currentAmount: 0.00, categoryTag: 'Geral', createdAt: todayISO(), theme: 'gold', skinId: 'climber' },
];

const INITIAL_B3_INTEGRATION: B3IntegrationState = {
  isPortfolioConfigured: false,
  isConnected: false,
  syncStatus: 'idle',
  linkedBrokers: DEFAULT_LINKED_BROKERS,
  autoSyncDividends: true,
  importedAssetsCount: 0,
  integrationMode: 'extrato_manual',
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

/**
 * Removes this device's copies of an account's private data (Dante chat history always; the finance
 * state and its recovery copy only when `includeFinanceState`, i.e. the cloud already has them).
 */
export function clearLocalAccountData(uid: string, includeFinanceState: boolean): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.includes(uid)) keys.push(key);
    }
    for (const key of keys) {
      const isFinanceState = key.startsWith(USER_STORAGE_KEY_PREFIX);
      if (!isFinanceState || includeFinanceState) localStorage.removeItem(key);
    }
  } catch (error: unknown) {
    console.warn('Não foi possível limpar os dados locais da conta:', error);
  }
}

type StoredAnnotation = BankTxAnnotation & { key: string };

function annotationsToList(map: Record<string, BankTxAnnotation>): StoredAnnotation[] {
  return Object.entries(map).map(([key, value]) => ({ key, ...value }));
}

function annotationsFromStored(raw: unknown): Record<string, BankTxAnnotation> {
  const out: Record<string, BankTxAnnotation> = {};
  const entries: Array<[string, unknown]> = Array.isArray(raw)
    ? raw.filter((e) => e && typeof e.key === 'string').map((e) => [e.key, e])
    : raw && typeof raw === 'object' ? Object.entries(raw as Record<string, unknown>) : [];
  for (const [key, value] of entries) {
    if (!value || typeof value !== 'object') continue;
    const v = value as Record<string, unknown>;
    const category = typeof v.category === 'string' && v.category ? v.category : undefined;
    const note = typeof v.note === 'string' && v.note ? v.note : undefined;
    if (category || note) out[key] = { ...(category ? { category } : {}), ...(note ? { note } : {}), updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : '' };
  }
  return out;
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const skipHydrationSaveRef = useRef(false);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(INITIAL_ACCOUNTS);
  const [investments, setInvestments] = useState<Investment[]>(INITIAL_INVESTMENTS);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>(INITIAL_GOALS);
  const [incomeCategories, setIncomeCategories] = useState<string[]>(DEFAULT_INCOME_CATEGORIES);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({});
  const [bankTxAnnotations, setBankTxAnnotations] = useState<Record<string, BankTxAnnotation>>({});
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

  // Identidade ativa e trava contra mistura de dados entre contas
  const currentIdentityRef = useRef<string | null>(null);
  const isSyncReadyRef = useRef<boolean>(false);

  const applyCleanInitialState = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setBankAccounts(INITIAL_ACCOUNTS);
    setInvestments(INITIAL_INVESTMENTS);
    setSavingGoals(INITIAL_GOALS);
    setIncomeCategories(DEFAULT_INCOME_CATEGORIES);
    setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
    setCategoryIcons({});
    setBankTxAnnotations({});
    setGoalsState({ monthly: 0, reserve: 0, passiveIncome: 0, investedPatrimony: 0 });
    setBaseState({ startingBalance: 0, fixedIncome: 0 });
    setInvestmentFocus('income');
    setActiveGoalId('goal-1');
    setManualDividends([]);
    setLastB3SyncAt(null);
    setB3Integration(INITIAL_B3_INTEGRATION);
  };

  // Helper to load parsed data safely into state
  const applyStatePayload = (parsed: any) => {
    if (!parsed || typeof parsed !== 'object') return;
    if (Array.isArray(parsed.transactions)) setTransactions(parsed.transactions);
    if (Array.isArray(parsed.bankAccounts)) setBankAccounts(parsed.bankAccounts);
    if (Array.isArray(parsed.investments)) {
      // Sanitize only malformed items, never wipe real tickers
      const valid = parsed.investments.filter((inv: any) => inv && inv.code && typeof inv.amount === 'number' && isFinite(inv.amount));
      setInvestments(valid);
    }
    if (Array.isArray(parsed.savingGoals)) setSavingGoals(parsed.savingGoals);
    if (Array.isArray(parsed.incomeCategories) && parsed.incomeCategories.length > 0) setIncomeCategories(parsed.incomeCategories);
    if (Array.isArray(parsed.expenseCategories) && parsed.expenseCategories.length > 0) setExpenseCategories(parsed.expenseCategories);
    if (parsed.categoryIcons && typeof parsed.categoryIcons === 'object') setCategoryIcons(parsed.categoryIcons);
    if (parsed.bankTxAnnotations) setBankTxAnnotations(annotationsFromStored(parsed.bankTxAnnotations));
    if (parsed.goals) setGoalsState(parsed.goals);
    if (parsed.base) setBaseState(parsed.base);
    if (parsed.investmentFocus) setInvestmentFocus(parsed.investmentFocus);
    if ('activeGoalId' in parsed) setActiveGoalId(parsed.activeGoalId);
    if (Array.isArray(parsed.manualDividends)) setManualDividends(parsed.manualDividends);
    if (parsed.lastB3SyncAt) setLastB3SyncAt(parsed.lastB3SyncAt);
    if (parsed.b3Integration) setB3Integration(parsed.b3Integration);
  };

  // Mirror of cloudSyncStatus readable inside effects without re-running them.
  const cloudSyncStatusRef = useRef(cloudSyncStatus);
  useEffect(() => { cloudSyncStatusRef.current = cloudSyncStatus; }, [cloudSyncStatus]);

  // 1. Carregamento e isolamento estrito por identidade (visitante ou UID autenticado)
  useEffect(() => {
    if (authLoading) return;

    let isCancelled = false;
    const newUid = user ? user.uid : null;
    const previousUid = currentIdentityRef.current;
    // On logout, wipe this device's copy of the account only when the cloud already holds it;
    // otherwise the local copy is the only one with the latest changes and must survive.
    if (previousUid && previousUid !== newUid) {
      clearLocalAccountData(previousUid, cloudSyncStatusRef.current === 'synced');
    }
    if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
    isSyncReadyRef.current = false;
    skipHydrationSaveRef.current = true;
    setLoaded(false);
    setLoadError(null);
    setLastCloudSyncAt(null);
    applyCleanInitialState();

    async function switchIdentityAndLoad(): Promise<void> {
      try {
        if (!newUid) {
          const raw = localStorage.getItem(GUEST_STORAGE_KEY);
          if (raw) applyStatePayload(JSON.parse(raw));
          setCloudSyncStatus('saved_locally');
        } else {
          setCloudSyncStatus('syncing');
          // A cache hit cannot prove that the account has no cloud document.
          const snap = await getDocFromServer(doc(db, 'users', newUid, 'financialData', 'state'));
          if (isCancelled) return;
          const userKey = `${USER_STORAGE_KEY_PREFIX}${newUid}`;
          if (snap.exists()) {
            const cloudData = snap.data();
            applyStatePayload(cloudData);
            try {
              const oldCache = localStorage.getItem(userKey);
              // Preserve previous local data for recovery; never promote it by clock alone.
              if (oldCache && oldCache !== JSON.stringify(cloudData) && !localStorage.getItem(`${userKey}:recovery`)) {
                localStorage.setItem(`${userKey}:recovery`, oldCache);
              }
              localStorage.setItem(userKey, JSON.stringify(cloudData));
            } catch (error: unknown) {
              console.warn('Não foi possível atualizar o cache local:', error);
            }
          } else {
            // Existing UID-specific data may be recovered; guest data is never imported implicitly.
            const raw = localStorage.getItem(userKey);
            if (raw) applyStatePayload(JSON.parse(raw));
          }
          setCloudSyncStatus(snap.exists() ? 'synced' : 'saved_locally');
          if (snap.exists()) setLastCloudSyncAt(new Date().toLocaleTimeString('pt-BR'));
        }
        if (!isCancelled) {
          currentIdentityRef.current = newUid;
          isSyncReadyRef.current = true;
        }
      } catch (error: unknown) {
        if (isCancelled) return;
        console.warn('Falha ao carregar os dados financeiros:', error);
        const code = typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code) : 'erro-de-leitura';
        setLoadError(`Não foi possível confirmar os dados da sua conta (${code}). Nenhum dado será enviado à nuvem. Verifique a conexão e tente novamente.`);
        setCloudSyncStatus('saved_locally');
      } finally {
        if (!isCancelled) setLoaded(true);
      }
    }

    void switchIdentityAndLoad();
    return () => {
      isCancelled = true;
      isSyncReadyRef.current = false;
      if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
    };
  }, [user?.uid, authLoading]);

  // 2. Persistência isolada por identidade + salvamento debounced no Firestore
  useEffect(() => {
    if (!loaded || !isSyncReadyRef.current) return;

    const currentUid = user ? user.uid : null;
    if (currentIdentityRef.current !== currentUid) return;

    if (skipHydrationSaveRef.current) {
      skipHydrationSaveRef.current = false;
      return;
    }

    const stateToSave = {
      transactions,
      bankAccounts,
      investments,
      savingGoals,
      incomeCategories,
      expenseCategories,
      categoryIcons,
      // Stored as a list: setDoc(merge) deep-merges maps, so a removed key would never be deleted remotely.
      bankTxAnnotations: annotationsToList(bankTxAnnotations),
      goals,
      base,
      investmentFocus,
      activeGoalId,
      manualDividends,
      lastB3SyncAt,
      b3Integration,
      savedAt: new Date().toISOString(),
    };

    const payloadStr = JSON.stringify(stateToSave);
    try {
      if (currentUid) localStorage.setItem(`${USER_STORAGE_KEY_PREFIX}${currentUid}`, payloadStr);
      else localStorage.setItem(GUEST_STORAGE_KEY, payloadStr);
    } catch (e) {
      console.warn('Não foi possível salvar os dados financeiros localmente:', e);
    }

    if (currentUid) {
      setCloudSyncStatus('syncing');
      if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
      const uidAtSchedule = currentUid;
      cloudSaveTimerRef.current = setTimeout(async () => {
        // Evita uma gravação atrasada da conta anterior depois de logout/troca de usuário.
        if (currentIdentityRef.current !== uidAtSchedule) return;
        try {
          const userDocRef = doc(db, 'users', uidAtSchedule, 'financialData', 'state');
          await setDoc(userDocRef, JSON.parse(JSON.stringify(stateToSave)), { merge: true });
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
    user,
    transactions,
    bankAccounts,
    investments,
    savingGoals,
    incomeCategories,
    expenseCategories,
    categoryIcons,
    bankTxAnnotations,
    goals,
    base,
    investmentFocus,
    activeGoalId,
    manualDividends,
    lastB3SyncAt,
    b3Integration,
  ]);

  // Explicit manual trigger for cloud sync
  const triggerCloudSync = async () => {
    if (!user || !isSyncReadyRef.current || currentIdentityRef.current !== user.uid) return;
    try {
      setCloudSyncStatus('syncing');
      const stateToSave = {
        transactions,
        bankAccounts,
        investments,
        savingGoals,
        incomeCategories,
        expenseCategories,
        categoryIcons,
        bankTxAnnotations: annotationsToList(bankTxAnnotations),
        goals,
        base,
        investmentFocus,
        activeGoalId,
        manualDividends,
        lastB3SyncAt,
        b3Integration,
        savedAt: new Date().toISOString(),
      };
      const userDocRef = doc(db, 'users', user.uid, 'financialData', 'state');
      await setDoc(userDocRef, JSON.parse(JSON.stringify(stateToSave)), { merge: true });
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

      if (tx.type === 'expense' && !isSettled(tx)) {
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

    const pendingNet = transactions.reduce((total, tx) =>
      isSettled(tx) ? total : total + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
    const pendingExpenses = transactions.reduce((total, tx) =>
      !isSettled(tx) && tx.type === 'expense' ? total + tx.amount : total, 0);
    const realFreeBalance = balance - pendingExpenses;
    const projectedBalance = balance + pendingNet;

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
      status: tx.status ?? (tx.date > todayISO() ? 'pending' : 'settled'),
      id: 'tx-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    };
    setTransactions((prev) => [newTx, ...prev]);

    // If associated with a bank account, update its balance automatically
    if (tx.bankAccountId) {
      setBankAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id !== tx.bankAccountId) return acc;
          const delta = bankMovement(newTx);
          return { ...acc, balance: acc.balance + delta, updatedAt: new Date().toISOString() };
        })
      );
    }
    return newTx;
  };

  const updateTransaction = (id: string, changes: Partial<Omit<Transaction, 'id'>>) => {
    const previous = transactions.find((tx) => tx.id === id);
    if (!previous) return;

    const updated: Transaction = { ...previous, ...changes };
    setTransactions((prev) => prev.map((tx) => (tx.id === id ? updated : tx)));

    // Reconcile the account balance: undo the old movement, then apply the edited one.
    const movement = bankMovement;
    const accountDeltas = new Map<string, number>();
    if (previous.bankAccountId) {
      accountDeltas.set(previous.bankAccountId, (accountDeltas.get(previous.bankAccountId) || 0) - movement(previous));
    }
    if (updated.bankAccountId) {
      accountDeltas.set(updated.bankAccountId, (accountDeltas.get(updated.bankAccountId) || 0) + movement(updated));
    }

    if (accountDeltas.size > 0) {
      setBankAccounts((prev) => prev.map((account) => {
        const delta = accountDeltas.get(account.id);
        return delta === undefined
          ? account
          : { ...account, balance: account.balance + delta, updatedAt: new Date().toISOString() };
      }));
    }
  };

  const deleteTransaction = (id: string) => {
    const transaction = transactions.find((tx) => tx.id === id);
    if (!transaction) return;

    setTransactions((prev) => prev.filter((tx) => tx.id !== id));

    // Deleting a movement must also undo its effect on the linked bank account.
    if (transaction.bankAccountId) {
      const delta = -bankMovement(transaction);
      setBankAccounts((prev) => prev.map((account) =>
        account.id === transaction.bankAccountId
          ? { ...account, balance: account.balance + delta, updatedAt: new Date().toISOString() }
          : account
      ));
    }
  };

  const repeatExpenses = (sourceIds: string[], targetMonth: string): void => {
    setTransactions(previous => {
      const { additions } = prepareExpenseRepeats(previous, sourceIds, targetMonth);
      return additions.length ? [...additions, ...previous] : previous;
    });
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
      const activeKey = user ? `${USER_STORAGE_KEY_PREFIX}${user.uid}` : GUEST_STORAGE_KEY;
      const saved = localStorage.getItem(activeKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.investments = [];
        parsed.savedAt = new Date().toISOString();
        localStorage.setItem(activeKey, JSON.stringify(parsed));
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

  // Configura o perfil de investimentos. Não autentica nem conecta oficialmente com a B3.
  const connectB3Account = async (
    cpf: string,
    investorName?: string,
    selectedBrokerIds?: string[]
  ): Promise<boolean> => {
    setB3Integration((prev) => ({ ...prev, syncStatus: 'syncing' }));

    const cleanCpf = cpf.replace(/\D/g, '');
    const maskedCpf = cleanCpf.length >= 6
      ? `***.${cleanCpf.slice(3, 6)}.${cleanCpf.slice(6, 9) || '***'}-**`
      : '***.***.123-**';

    const updatedBrokers = DEFAULT_LINKED_BROKERS.map((b) => ({
      ...b,
      connected: selectedBrokerIds ? selectedBrokerIds.includes(b.id) : b.connected,
    }));

    setB3Integration({
      isPortfolioConfigured: true,
      isConnected: true,
      connectedCpf: maskedCpf,
      investorName: investorName || 'Investidor B3',
      connectedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      syncStatus: 'success',
      linkedBrokers: updatedBrokers,
      autoSyncDividends: true,
      importedAssetsCount: investments.length,
      integrationMode: 'perfil_investidor',
    });

    return true;
  };

  const disconnectB3Account = () => {
    setB3Integration({
      isPortfolioConfigured: false,
      isConnected: false,
      syncStatus: 'idle',
      linkedBrokers: DEFAULT_LINKED_BROKERS.map((b) => ({ ...b, connected: false })),
      autoSyncDividends: false,
      importedAssetsCount: 0,
      integrationMode: 'extrato_manual',
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
      isPortfolioConfigured: true,
      isConnected: true,
      integrationMode: 'planilha_b3',
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
      const activeKey = user ? `${USER_STORAGE_KEY_PREFIX}${user.uid}` : GUEST_STORAGE_KEY;
      localStorage.removeItem(activeKey);
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

  const annotateBankTransaction = (key: string, changes: { category?: string | null; note?: string | null }): void => {
    if (!/^[\w-]{1,80}:[\w-]{1,80}$/.test(key)) return;
    setBankTxAnnotations((prev) => {
      const current = prev[key] || { updatedAt: '' };
      const category = 'category' in changes ? (changes.category?.trim().slice(0, 60) || undefined) : current.category;
      const note = 'note' in changes ? (changes.note?.trim().slice(0, 200) || undefined) : current.note;
      const next = { ...prev };
      // Firestore rejects undefined fields; drop empty annotations entirely.
      if (!category && !note) delete next[key];
      else next[key] = { ...(category ? { category } : {}), ...(note ? { note } : {}), updatedAt: new Date().toISOString() };
      return next;
    });
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
        bankTxAnnotations,
        annotateBankTransaction,
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
        repeatExpenses,
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
      {loadError ? (
        <main role="alert" className="min-h-screen bg-slate-950 text-white p-8">
          <h1 className="text-xl font-bold">Seus dados não foram carregados</h1>
          <p className="my-4">{loadError}</p>
          <button onClick={() => window.location.reload()} className="rounded bg-emerald-700 px-4 py-2">Tentar novamente</button>
          <button onClick={() => void logOut()} className="ml-4 underline">Sair da conta</button>
        </main>
      ) : authLoading || !loaded || currentIdentityRef.current !== (user?.uid ?? null) ? (
        <main role="status" className="min-h-screen bg-slate-950 text-white p-8">Carregando os dados da sua conta…</main>
      ) : children}
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
