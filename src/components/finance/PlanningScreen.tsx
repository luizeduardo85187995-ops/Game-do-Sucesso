import React, { useState } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  Gamepad2,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Coins,
  X,
  Check,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { SavingGoal } from '../../types/finance';
import { formatBRL } from '../../utils/format';

const EMOJI_OPTIONS = ['🎯', '✈️', '🏠', '🚗', '📚', '💍', '💻', '🎸', '🏖️', '🛡️', '👑', '🚀'];

interface PlanningScreenProps {
  onNavigateToGame: (goalId: string) => void;
}

export default function PlanningScreen({ onNavigateToGame }: PlanningScreenProps) {
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
    addCategory,
    removeCategory,
    resetAllData,
  } = useFinance();

  // Goal Modal
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [categoryTag, setCategoryTag] = useState('Lazer');

  // Quick Deposit modal
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // Category inputs
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [newIncomeCat, setNewIncomeCat] = useState('');

  // Structural goals edit
  const [isEditingStructural, setIsEditingStructural] = useState(false);
  const [monthlyGoalInput, setMonthlyGoalInput] = useState(String(goals.monthly));
  const [reserveGoalInput, setReserveGoalInput] = useState(String(goals.reserve));
  const [passiveIncomeInput, setPassiveIncomeInput] = useState(String(goals.passiveIncome));
  const [patrimonyGoalInput, setPatrimonyGoalInput] = useState(String(goals.investedPatrimony));

  const openNewGoalModal = () => {
    setEditingGoal(null);
    setName('');
    setEmoji('🎯');
    setTargetAmount('');
    setCurrentAmount('');
    setCategoryTag('Lazer');
    setShowGoalModal(true);
  };

  const openEditGoalModal = (goal: SavingGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setEmoji(goal.emoji);
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
      });
    } else {
      addSavingGoal({
        name: name.trim(),
        emoji,
        targetAmount: target,
        currentAmount: current,
        categoryTag,
      });
    }
    setShowGoalModal(false);
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

  const handleExportBackup = () => {
    const data = localStorage.getItem('@financas/state-v2');
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minhas-financas-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        JSON.parse(text); // validate
        localStorage.setItem('@financas/state-v2', text);
        window.location.reload();
      } catch (err) {
        alert('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
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

                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditGoalModal(goal)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteSavingGoal(goal.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
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
        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-3">
          <h4 className="font-bold text-white text-sm">Categorias de Despesas</h4>
          <div className="flex flex-wrap gap-1.5">
            {expenseCategories.map((c) => (
              <span
                key={c}
                className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-1"
              >
                <span>{c}</span>
                {expenseCategories.length > 3 && (
                  <button
                    onClick={() => removeCategory('expense', c)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <input
              type="text"
              value={newExpenseCat}
              onChange={(e) => setNewExpenseCat(e.target.value)}
              placeholder="Nova categoria de despesa..."
              className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
            />
            <button
              onClick={() => {
                addCategory('expense', newExpenseCat);
                setNewExpenseCat('');
              }}
              className="px-3 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-bold"
            >
              Adicionar
            </button>
          </div>
        </div>

        {/* Income Categories */}
        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-3">
          <h4 className="font-bold text-white text-sm">Categorias de Receitas</h4>
          <div className="flex flex-wrap gap-1.5">
            {incomeCategories.map((c) => (
              <span
                key={c}
                className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-1"
              >
                <span>{c}</span>
                {incomeCategories.length > 2 && (
                  <button
                    onClick={() => removeCategory('income', c)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <input
              type="text"
              value={newIncomeCat}
              onChange={(e) => setNewIncomeCat(e.target.value)}
              placeholder="Nova categoria de receita..."
              className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
            />
            <button
              onClick={() => {
                addCategory('income', newIncomeCat);
                setNewIncomeCat('');
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* Backup & Data Management */}
      <div className="glass-card rounded-3xl p-5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-white text-sm">Segurança & Backup dos Dados</h4>
          <p className="text-xs text-slate-400">Exporte seu arquivo JSON para guardar ou restaurar a qualquer momento</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportBackup}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" /> Exportar Backup JSON
          </button>

          <label className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5 text-purple-400" /> Importar Backup
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (confirm('Tem certeza de que deseja resetar os dados para o estado inicial de demonstração?')) {
                resetAllData();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão
          </button>
        </div>
      </div>

      {/* Modal: Create/Edit Saving Goal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/15 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-white text-lg">
                {editingGoal ? 'Editar Meta de Sonho' : 'Nova Meta de Sonho'}
              </h3>
              <button
                onClick={() => setShowGoalModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              {/* Emoji Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ícone / Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmoji(em)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                        emoji === em
                          ? 'bg-amber-400/30 border border-amber-400 scale-110'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {em}
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
