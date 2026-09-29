import React, { useState } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  Gamepad2,
  Sparkles,
  ShieldCheck,
  Coins,
  X,
  Check,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { SavingGoal } from '../../types/finance';
import { formatBRL } from '../../utils/format';
import { useSubscription } from '../../context/SubscriptionContext';
import { Crown, Lock } from 'lucide-react';
import { GOAL_COLORS, GOAL_EMOJIS } from '../../data/colors';
import { EXPENSE_CATEGORY_ICONS, INCOME_CATEGORY_ICONS, getCategoryMeta } from '../../data/categories';

interface PlanningScreenProps {
  onNavigateToGame: (goalId: string) => void;
}

export default function PlanningScreen({ onNavigateToGame }: PlanningScreenProps) {
  const { isPro, openProModal } = useSubscription();
  const {
    savingGoals,
    addSavingGoal,
    updateSavingGoal,
    deleteSavingGoal,
    depositToGoal,
    goals,
    setGoals,
    incomeCategories,
    expenseCategories,
    categoryIcons,
    setCategoryIcon,
    addCategory,
    removeCategory,
  } = useFinance();

  // Goal Modal
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [theme, setTheme] = useState(GOAL_COLORS[0].gradient);
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [categoryTag, setCategoryTag] = useState('Lazer');

  // Quick Deposit modal
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // Category inputs & icons
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [selectedExpenseIcon, setSelectedExpenseIcon] = useState('🛒');
  const [showExpenseIconPicker, setShowExpenseIconPicker] = useState(false);

  const [newIncomeCat, setNewIncomeCat] = useState('');
  const [selectedIncomeIcon, setSelectedIncomeIcon] = useState('💼');
  const [showIncomeIconPicker, setShowIncomeIconPicker] = useState(false);

  // Quick edit icon for existing category
  const [editingCategoryIcon, setEditingCategoryIcon] = useState<{ name: string; type: 'expense' | 'income' } | null>(null);

  // Structural goals edit
  const [isEditingStructural, setIsEditingStructural] = useState(false);
  const [monthlyGoalInput, setMonthlyGoalInput] = useState(String(goals.monthly));
  const [reserveGoalInput, setReserveGoalInput] = useState(String(goals.reserve));
  const [passiveIncomeInput, setPassiveIncomeInput] = useState(String(goals.passiveIncome));
  const [patrimonyGoalInput, setPatrimonyGoalInput] = useState(String(goals.investedPatrimony));

  const openNewGoalModal = () => {
    if (!isPro && savingGoals.length >= 1) {
      openProModal();
      return;
    }
    setEditingGoal(null);
    setName('');
    setEmoji('🎯');
    setTheme(GOAL_COLORS[0].gradient);
    setTargetAmount('');
    setCurrentAmount('');
    setCategoryTag('Lazer');
    setShowGoalModal(true);
  };

  const openEditGoalModal = (goal: SavingGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setEmoji(goal.emoji);
    setTheme(goal.theme || GOAL_COLORS[0].gradient);
    setTargetAmount(String(goal.targetAmount));
    setCurrentAmount(String(goal.currentAmount));
    setCategoryTag(goal.categoryTag);
    setShowGoalModal(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount.replace(',', '.'));
    if (isNaN(target) || target <= 0) return;
    const current = parseFloat(currentAmount.replace(',', '.')) || 0;

    if (editingGoal) {
      updateSavingGoal(editingGoal.id, {
        name: name.trim(),
        emoji,
        targetAmount: target,
        currentAmount: current,
        categoryTag,
        theme,
      });
    } else {
      addSavingGoal({
        name: name.trim(),
        emoji,
        targetAmount: target,
        currentAmount: current,
        categoryTag,
        theme,
      });
    }
    setShowGoalModal(false);
  };

  const handleAddExpenseCategory = () => {
    const trimmed = newExpenseCat.trim();
    if (!trimmed) return;
    addCategory('expense', trimmed, selectedExpenseIcon);
    setNewExpenseCat('');
    setShowExpenseIconPicker(false);
  };

  const handleAddIncomeCategory = () => {
    const trimmed = newIncomeCat.trim();
    if (!trimmed) return;
    addCategory('income', trimmed, selectedIncomeIcon);
    setNewIncomeCat('');
    setShowIncomeIconPicker(false);
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId) return;
    const val = parseFloat(depositAmount.replace(',', '.'));
    if (val > 0) {
      depositToGoal(depositGoalId, val);
    }
    setDepositGoalId(null);
    setDepositAmount('');
  };

  const handleSaveStructuralGoals = () => {
    setGoals({
      monthly: parseFloat(monthlyGoalInput) || 0,
      reserve: parseFloat(reserveGoalInput) || 0,
      passiveIncome: parseFloat(passiveIncomeInput) || 0,
      investedPatrimony: parseFloat(patrimonyGoalInput) || 0,
    });
    setIsEditingStructural(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Planejamento & Metas</h2>
          <p className="text-xs text-slate-400">Defina suas conquistas, reservas e conecte-as à escalada do jogo</p>
        </div>

        <button
          onClick={openNewGoalModal}
          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-amber-400/25"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Meta de Sonho</span>
        </button>
      </div>

      {/* Free Plan Metas Limit Banner */}
      {!isPro && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-white font-bold flex items-center gap-2">
                <span>Limite de Metas:</span>
                <span className="text-amber-400 font-mono bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                  {savingGoals.length} / 1 Meta Ativa (Plano Gratuito)
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                O plano Gratuito permite 1 meta ativa. Assine o VIP PRO para ter metas simultâneas ilimitadas e todas as fases do jogo!
              </p>
            </div>
          </div>
          <button
            onClick={openProModal}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Liberar Metas Ilimitadas</span>
          </button>
        </div>
      )}

      {/* Structural Financial Benchmarks */}
      <div className="cyber-card rounded-3xl p-5 sm:p-6 space-y-4 hud-border-corners">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400">
            <Target className="w-5 h-5" />
            <h3 className="font-bold text-white text-base font-mono">// Metas Estruturais Fundamentais</h3>
          </div>
          <button
            onClick={() => {
              if (isEditingStructural) handleSaveStructuralGoals();
              else setIsEditingStructural(true);
            }}
            className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30"
          >
            {isEditingStructural ? 'Salvar Metas' : 'Editar Metas'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Monthly savings */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-emerald-500/20">
            <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">// Meta de Aporte Mensal</span>
            {isEditingStructural ? (
              <input
                type="number"
                value={monthlyGoalInput}
                onChange={(e) => setMonthlyGoalInput(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-cyan-400 text-sm font-bold text-white font-mono"
              />
            ) : (
              <div className="text-xl font-black text-emerald-400 font-mono mt-1 neon-text-emerald">{formatBRL(goals.monthly)}</div>
            )}
            <p className="text-[10px] font-mono text-slate-500 mt-1">Quanto economizar todo mês</p>
          </div>

          {/* Emergency Reserve */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-cyan-500/20">
            <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">// Reserva de Emergência</span>
            {isEditingStructural ? (
              <input
                type="number"
                value={reserveGoalInput}
                onChange={(e) => setReserveGoalInput(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-cyan-400 text-sm font-bold text-white font-mono"
              />
            ) : (
              <div className="text-xl font-black text-cyan-400 font-mono mt-1 neon-text-cyan">{formatBRL(goals.reserve)}</div>
            )}
            <p className="text-[10px] font-mono text-slate-500 mt-1">Geralmente 6 meses de custos</p>
          </div>

          {/* Passive Income */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-amber-500/20">
            <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">// Renda Passiva Alvo</span>
            {isEditingStructural ? (
              <input
                type="number"
                value={passiveIncomeInput}
                onChange={(e) => setPassiveIncomeInput(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-cyan-400 text-sm font-bold text-white font-mono"
              />
            ) : (
              <div className="text-xl font-black text-amber-400 font-mono mt-1 neon-text-gold">{formatBRL(goals.passiveIncome)}/mês</div>
            )}
            <p className="text-[10px] font-mono text-slate-500 mt-1">Proventos para liberdade financeira</p>
          </div>

          {/* Invested Patrimony */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-purple-500/20">
            <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">// Patrimônio Total</span>
            {isEditingStructural ? (
              <input
                type="number"
                value={patrimonyGoalInput}
                onChange={(e) => setPatrimonyGoalInput(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-cyan-400 text-sm font-bold text-white font-mono"
              />
            ) : (
              <div className="text-xl font-black text-purple-400 font-mono mt-1">{formatBRL(goals.investedPatrimony)}</div>
            )}
            <p className="text-[10px] font-mono text-slate-500 mt-1">Marco maior de patrimônio</p>
          </div>
        </div>
      </div>

      {/* Saving Goals (Dream Goals that link directly to the Mountain Climb Game) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Metas de Sonho & Conquistas</h3>
            <p className="text-xs text-slate-400">Cada meta pode ser selecionada para ser escalada no Jogo da Montanha</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savingGoals.map((goal) => {
            const percent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="glass-card rounded-3xl p-5 border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/10">
                        {goal.emoji}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base leading-tight group-hover:text-amber-300 transition-colors">
                          {goal.name}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-semibold">
                          {goal.categoryTag}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditGoalModal(goal)}
                        className="px-2.5 py-1 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                        title="Abrir Editor de Meta"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar Meta</span>
                      </button>
                      <button
                        onClick={() => deleteSavingGoal(goal.id)}
                        className="p-1.5 rounded-xl hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Guardado:</span>
                      <strong className="text-white">{formatBRL(goal.currentAmount)}</strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Meta:</span>
                      <strong className="text-slate-300">{formatBRL(goal.targetAmount)}</strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Falta:</span>
                      <strong className="text-amber-400">{formatBRL(remaining)}</strong>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Progresso</span>
                      <span className="text-amber-400">{percent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom actions: Climb in Game & Deposit */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
                  <button
                    onClick={() => {
                      setDepositGoalId(goal.id);
                      setDepositAmount('');
                    }}
                    className="py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" /> Aportar
                  </button>

                  <button
                    onClick={() => onNavigateToGame(goal.id)}
                    className="py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-black transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-1 shadow-md shadow-amber-500/20"
                  >
                    <Gamepad2 className="w-3.5 h-3.5" /> Escalar Jogo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span>💳</span>
              <span>Categorias de Despesas</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              {expenseCategories.length} categorias
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {expenseCategories.map((c) => {
              const meta = getCategoryMeta(c, categoryIcons);
              return (
                <div
                  key={c}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 flex items-center gap-1.5 hover:border-white/20 transition-all group"
                >
                  <button
                    type="button"
                    onClick={() => setEditingCategoryIcon({ name: c, type: 'expense' })}
                    title="Clique para trocar o ícone"
                    className="hover:scale-125 transition-transform"
                  >
                    <span>{meta.emoji}</span>
                  </button>
                  <span className="font-medium">{c}</span>
                  {expenseCategories.length > 3 && (
                    <button
                      onClick={() => removeCategory('expense', c)}
                      className="text-slate-500 hover:text-rose-400 ml-1 opacity-70 group-hover:opacity-100 transition-opacity"
                      title="Excluir categoria"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick change icon for existing expense category */}
          {editingCategoryIcon && editingCategoryIcon.type === 'expense' && (
            <div className="p-3 rounded-2xl bg-slate-900 border border-amber-400/40 space-y-2 animate-fade-in shadow-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300 font-bold">
                  Mudar ícone de "{editingCategoryIcon.name}":
                </span>
                <button
                  onClick={() => setEditingCategoryIcon(null)}
                  className="text-white/50 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                {EXPENSE_CATEGORY_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => {
                      setCategoryIcon(editingCategoryIcon.name, ic);
                      setEditingCategoryIcon(null);
                    }}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-amber-400/20 border border-white/10 hover:border-amber-400 text-base flex items-center justify-center transition-all"
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add Category Row with Icon Selector */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <label className="block text-[11px] font-semibold text-slate-400">
              Adicionar Nova Categoria com Ícone:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowExpenseIconPicker(!showExpenseIconPicker);
                  setShowIncomeIconPicker(false);
                }}
                className={`w-11 h-10 rounded-xl border flex items-center justify-center text-xl transition-all shadow-sm ${
                  showExpenseIconPicker
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300 scale-105 ring-2 ring-amber-400/30'
                    : 'bg-white/5 hover:bg-white/10 border-white/15 hover:border-white/30'
                }`}
                title="Clique para escolher o ícone da categoria"
              >
                {selectedExpenseIcon}
              </button>

              <input
                type="text"
                value={newExpenseCat}
                onChange={(e) => setNewExpenseCat(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddExpenseCategory();
                  }
                }}
                placeholder="Ex: Mercado, Farmácia, Lazer..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />

              <button
                type="button"
                onClick={handleAddExpenseCategory}
                disabled={!newExpenseCat.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-amber-400/20 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>

            {/* Expense Icon Picker Grid */}
            {showExpenseIconPicker && (
              <div className="p-3 rounded-2xl bg-slate-900 border border-amber-400/40 space-y-2 animate-fade-in shadow-2xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-300 font-bold">Escolha um Ícone para a Categoria:</span>
                  <button
                    onClick={() => setShowExpenseIconPicker(false)}
                    className="text-white/50 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-36 overflow-y-auto p-1">
                  {EXPENSE_CATEGORY_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => {
                        setSelectedExpenseIcon(ic);
                        setShowExpenseIconPicker(false);
                      }}
                      className={`h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                        selectedExpenseIcon === ic
                          ? 'bg-amber-400/30 border-2 border-amber-400 scale-110 shadow-md'
                          : 'bg-white/5 hover:bg-white/15 border border-white/10'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Income Categories */}
        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span>💰</span>
              <span>Categorias de Receitas</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              {incomeCategories.length} categorias
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {incomeCategories.map((c) => {
              const meta = getCategoryMeta(c, categoryIcons);
              return (
                <div
                  key={c}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 flex items-center gap-1.5 hover:border-white/20 transition-all group"
                >
                  <button
                    type="button"
                    onClick={() => setEditingCategoryIcon({ name: c, type: 'income' })}
                    title="Clique para trocar o ícone"
                    className="hover:scale-125 transition-transform"
                  >
                    <span>{meta.emoji}</span>
                  </button>
                  <span className="font-medium">{c}</span>
                  {incomeCategories.length > 2 && (
                    <button
                      onClick={() => removeCategory('income', c)}
                      className="text-slate-500 hover:text-rose-400 ml-1 opacity-70 group-hover:opacity-100 transition-opacity"
                      title="Excluir categoria"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick change icon for existing income category */}
          {editingCategoryIcon && editingCategoryIcon.type === 'income' && (
            <div className="p-3 rounded-2xl bg-slate-900 border border-emerald-400/40 space-y-2 animate-fade-in shadow-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-300 font-bold">
                  Mudar ícone de "{editingCategoryIcon.name}":
                </span>
                <button
                  onClick={() => setEditingCategoryIcon(null)}
                  className="text-white/50 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                {INCOME_CATEGORY_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => {
                      setCategoryIcon(editingCategoryIcon.name, ic);
                      setEditingCategoryIcon(null);
                    }}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-emerald-400/20 border border-white/10 hover:border-emerald-400 text-base flex items-center justify-center transition-all"
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add Category Row with Icon Selector */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <label className="block text-[11px] font-semibold text-slate-400">
              Adicionar Nova Categoria com Ícone:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowIncomeIconPicker(!showIncomeIconPicker);
                  setShowExpenseIconPicker(false);
                }}
                className={`w-11 h-10 rounded-xl border flex items-center justify-center text-xl transition-all shadow-sm ${
                  showIncomeIconPicker
                    ? 'bg-emerald-400/20 border-emerald-400 text-emerald-300 scale-105 ring-2 ring-emerald-400/30'
                    : 'bg-white/5 hover:bg-white/10 border-white/15 hover:border-white/30'
                }`}
                title="Clique para escolher o ícone da categoria"
              >
                {selectedIncomeIcon}
              </button>

              <input
                type="text"
                value={newIncomeCat}
                onChange={(e) => setNewIncomeCat(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddIncomeCategory();
                  }
                }}
                placeholder="Ex: Salário, Freelance, Rendimentos..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />

              <button
                type="button"
                onClick={handleAddIncomeCategory}
                disabled={!newIncomeCat.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-400/20 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>

            {/* Income Icon Picker Grid */}
            {showIncomeIconPicker && (
              <div className="p-3 rounded-2xl bg-slate-900 border border-emerald-400/40 space-y-2 animate-fade-in shadow-2xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-300 font-bold">Escolha um Ícone para a Categoria:</span>
                  <button
                    onClick={() => setShowIncomeIconPicker(false)}
                    className="text-white/50 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-36 overflow-y-auto p-1">
                  {INCOME_CATEGORY_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => {
                        setSelectedIncomeIcon(ic);
                        setShowIncomeIconPicker(false);
                      }}
                      className={`h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                        selectedIncomeIcon === ic
                          ? 'bg-emerald-400/30 border-2 border-emerald-400 scale-110 shadow-md'
                          : 'bg-white/5 hover:bg-white/15 border border-white/10'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create/Edit Saving Goal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/15 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-lg">
                    {editingGoal ? 'Editor de Meta' : 'Criar Nova Meta'}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    editingGoal
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  }`}>
                    {editingGoal ? 'EDITAR' : 'NOVA'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingGoal ? 'Edite o nome, valor alvo, valor guardado, ícone ou tema' : 'Defina um objetivo para acompanhar e escalar no jogo'}
                </p>
              </div>
              <button
                onClick={() => setShowGoalModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              {/* Emoji Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ícone / Emoji da Meta</label>
                <div className="grid grid-cols-8 gap-1.5 max-h-32 overflow-y-auto p-1 bg-white/[0.02] rounded-xl border border-white/5">
                  {GOAL_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmoji(em)}
                      className={`h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                        emoji === em
                          ? 'bg-amber-400/30 border border-amber-400 scale-110 shadow-md'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tema de Cor</label>
                <div className="grid grid-cols-6 gap-2">
                  {GOAL_COLORS.map((c) => (
                    <button
                      key={c.gradient}
                      type="button"
                      onClick={() => setTheme(c.gradient)}
                      className={`h-9 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center transition-all ${
                        theme === c.gradient ? 'ring-2 ring-white scale-105 shadow-md' : 'opacity-50 hover:opacity-85'
                      }`}
                      title={c.name}
                    >
                      {theme === c.gradient && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Meta</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Viagem para o Japão, Reforma, Carro..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Valor Alvo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="5000,00"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Já Guardado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Category tag */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria Vinculada</label>
                <select
                  value={categoryTag}
                  onChange={(e) => setCategoryTag(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-400/25"
                >
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Deposit Modal */}
      {depositGoalId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Aporte na Meta</h3>
              <button
                onClick={() => setDepositGoalId(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Valor do Aporte (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Ex: 200,00"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-lg font-black text-emerald-400 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex gap-2">
                {[50, 100, 250, 500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDepositAmount(String(val))}
                    className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300"
                  >
                    +{val}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositGoalId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black"
                >
                  Confirmar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
