import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  BankAccount,
  BaseSettings,
  Goals,
  Investment,
  InvestmentFocus,
  MarketIndicator,
  SavingGoal,
  Transaction,
  TransactionType,
} from '../types/finance';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_MARKET_INDICATORS,
  ESTIMATED_MONTHLY_YIELD,
} from '../data/categories';
import { monthKey, todayISO } from '../utils/format';

export interface FinanceMetrics {
  balance: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  investedTotal: number;
  estimatedPassiveIncome: number;
  bankBalance: number;
  creditCardDebt: number;
  savingsRate: number;
}

interface FinanceContextValue {
  transactions: Transaction[];
  investments: Investment[];
  bankAccounts: BankAccount[];
  savingGoals: SavingGoal[];
  incomeCategories: string[];
  expenseCategories: string[];
  goals: Goals;
  base: BaseSettings;
  investmentFocus: InvestmentFocus;
  marketIndicators: MarketIndicator[];
  activeGoalId: string | null;
  setActiveGoalId: (id: string | null) => void;
  metrics: FinanceMetrics;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id'>) => Transaction;
  updateTransaction: (id: string, changes: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: string) => void;

  addBankAccount: (acc: Omit<BankAccount, 'id' | 'updatedAt'>) => BankAccount;
  updateBankAccount: (id: string, changes: Partial<Omit<BankAccount, 'id'>>) => void;
  deleteBankAccount: (id: string) => void;

  addInvestment: (inv: Omit<Investment, 'id'>) => Investment;
  deleteInvestment: (id: string) => void;

  addSavingGoal: (goal: Omit<SavingGoal, 'id' | 'createdAt'>) => SavingGoal;
  updateSavingGoal: (id: string, changes: Partial<Omit<SavingGoal, 'id'>>) => void;
  deleteSavingGoal: (id: string) => void;
  depositToGoal: (id: string, amount: number) => void;
  withdrawFromGoal: (id: string, amount: number) => void;

  setGoals: (goals: Partial<Goals>) => void;
  setBase: (base: Partial<BaseSettings>) => void;
  setInvestmentFocus: (focus: InvestmentFocus) => void;
  addCategory: (type: TransactionType, name: string) => void;
  removeCategory: (type: TransactionType, name: string) => void;
  resetAllData: () => void;
}

const STORAGE_KEY = '@financas/state-v3-zeroed';

const INITIAL_ACCOUNTS: BankAccount[] = [
  { id: 'bank-1', bankName: 'Conta Corrente', accountType: 'checking', nickname: 'Principal', balance: 0.00, updatedAt: new Date().toISOString(), color: '#06B6D4' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [];

const INITIAL_INVESTMENTS: Investment[] = [];

const INITIAL_GOALS: SavingGoal[] = [
  { id: 'goal-1', name: 'Minha Primeira Meta', emoji: '🎯', targetAmount: 1000.00, currentAmount: 0.00, categoryTag: 'Geral', createdAt: todayISO(), theme: 'gold', skinId: 'climber' },
];

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(INITIAL_ACCOUNTS);
  const [investments, setInvestments] = useState<Investment[]>(INITIAL_INVESTMENTS);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>(INITIAL_GOALS);
  const [incomeCategories, setIncomeCategories] = useState<string[]>(DEFAULT_INCOME_CATEGORIES);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [goals, setGoalsState] = useState<Goals>({ monthly: 0, reserve: 0, passiveIncome: 0, investedPatrimony: 0 });
  const [base, setBaseState] = useState<BaseSettings>({ startingBalance: 0, fixedIncome: 0 });
  const [investmentFocus, setInvestmentFocus] = useState<InvestmentFocus>('income');
  const [activeGoalId, setActiveGoalId] = useState<string | null>('goal-1');
  const [marketIndicators] = useState<MarketIndicator[]>(DEFAULT_MARKET_INDICATORS);

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.bankAccounts) setBankAccounts(parsed.bankAccounts);
        if (parsed.investments) setInvestments(parsed.investments);
        if (parsed.savingGoals) setSavingGoals(parsed.savingGoals);
        if (parsed.incomeCategories) setIncomeCategories(parsed.incomeCategories);
        if (parsed.expenseCategories) setExpenseCategories(parsed.expenseCategories);
        if (parsed.goals) setGoalsState(parsed.goals);
        if (parsed.base) setBaseState(parsed.base);
        if (parsed.investmentFocus) setInvestmentFocus(parsed.investmentFocus);
        if (parsed.activeGoalId) setActiveGoalId(parsed.activeGoalId);
      }
    } catch (e) {
      console.warn('Could not load saved finance data:', e);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (!loaded) return;
    try {
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
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Could not save finance data:', e);
    }
  }, [loaded, transactions, bankAccounts, investments, savingGoals, incomeCategories, expenseCategories, goals, base, investmentFocus, activeGoalId]);

  // Computed metrics
  const metrics = useMemo<FinanceMetrics>(() => {
    const currentMKey = monthKey(todayISO());

    let monthIncome = 0;
    let monthExpense = 0;

    for (const tx of transactions) {
      if (monthKey(tx.date) === currentMKey) {
        if (tx.type === 'income') monthIncome += tx.amount;
        else monthExpense += tx.amount;
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

    let investedTotal = 0;
    let estimatedPassiveIncome = 0;
    for (const inv of investments) {
      investedTotal += inv.amount;
      const rate = inv.monthlyYield || ESTIMATED_MONTHLY_YIELD[inv.type] || 0.8;
      estimatedPassiveIncome += (inv.amount * rate) / 100;
    }

    // Consolidated Balance: Sum of bank accounts + starting base adjustment
    const balance = bankBalance - creditCardDebt;
    const savingsRate = monthIncome > 0 ? Math.max(0, Math.min(100, (monthNet / monthIncome) * 100)) : 0;

    return {
      balance,
      monthIncome,
      monthExpense,
      monthNet,
      investedTotal,
      estimatedPassiveIncome,
      bankBalance,
      creditCardDebt,
      savingsRate,
    };
  }, [transactions, bankAccounts, investments]);

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
    const newInv: Investment = {
      ...inv,
      id: 'inv-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    };
    setInvestments((prev) => [newInv, ...prev]);
    return newInv;
  };

  const deleteInvestment = (id: string) => {
    setInvestments((prev) => prev.filter((inv) => inv.id !== id));
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

  const addCategory = (type: TransactionType, name: string) => {
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
  };

  const removeCategory = (type: TransactionType, name: string) => {
    if (type === 'income') {
      setIncomeCategories((prev) => prev.filter((c) => c !== name));
    } else {
      setExpenseCategories((prev) => prev.filter((c) => c !== name));
    }
  };

  const resetAllData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setTransactions([]);
    setBankAccounts(INITIAL_ACCOUNTS);
    setInvestments([]);
    setSavingGoals(INITIAL_GOALS);
    setIncomeCategories(DEFAULT_INCOME_CATEGORIES);
    setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
    setGoalsState({ monthly: 0, reserve: 0, passiveIncome: 0, investedPatrimony: 0 });
    setBaseState({ startingBalance: 0, fixedIncome: 0 });
    setActiveGoalId('goal-1');
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
        goals,
        base,
        investmentFocus,
        marketIndicators,
        activeGoalId,
        setActiveGoalId,
        metrics,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        addInvestment,
        deleteInvestment,
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
        resetAllData,
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
