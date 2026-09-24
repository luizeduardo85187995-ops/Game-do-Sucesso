import React, { useState } from 'react';
import { X, Rocket, Wallet, TrendingUp, TrendingDown, Flame, Check, Sparkles, UserCheck, RotateCcw, AlertTriangle } from 'lucide-react';
import { Goal, GoalColor, CharacterSkinId } from '../types';
import { GOAL_COLORS, GOAL_EMOJIS, PRESET_GOALS } from '../data/colors';
import { CHARACTER_SKINS } from '../data/skins';

// -------------------------------------------------------------------
// 1. Modal para Criar Nova Meta
// -------------------------------------------------------------------
interface CreateGoalModalProps {
  onClose: () => void;
  onCreate: (name: string, targetAmount: number, color: string, emoji: string, initialSaved?: number) => void;
  currentBalance: number;
  formatCurrency: (value: number) => string;
}

export function CreateGoalModal({ onClose, onCreate, currentBalance, formatCurrency }: CreateGoalModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [initialSaved, setInitialSaved] = useState('');
  const [selectedColor, setSelectedColor] = useState(GOAL_COLORS[0].gradient);
  const [selectedEmoji, setSelectedEmoji] = useState(GOAL_EMOJIS[0]);

  const applyPreset = (preset: typeof PRESET_GOALS[0]) => {
    setName(preset.name);
    setAmount(preset.amount.toString());
    setSelectedEmoji(preset.emoji);
    setSelectedColor(preset.color);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!name.trim() || isNaN(num) || num <= 0) return;
    const savedNum = Math.max(0, parseFloat(initialSaved) || 0);
    onCreate(name.trim(), num, selectedColor, selectedEmoji, savedNum);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-elevated rounded-3xl p-6 sm:p-7 z-10 border border-white/15 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-lg border border-amber-400/30">
              🎯
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nova Meta de Conquista</h2>
              <p className="text-xs text-white/50">Defina o alvo e inicie a jornada de escalada</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Carousel */}
        <div className="mb-5">
          <label className="block text-[11px] font-semibold text-white/60 mb-2 uppercase tracking-wider">
            Sugestões Rápidas:
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {PRESET_GOALS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white flex items-center gap-1.5 transition-all hover:scale-105"
              >
                <span>{preset.emoji}</span>
                <span>{preset.name}</span>
                <span className="text-[10px] text-amber-300 font-mono">
                  ({formatCurrency(preset.amount)})
                </span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
              Nome da Meta
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Viagem à praia, Computador Novo..."
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-amber-400/60 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Valor Alvo (R$)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 5000"
                step="0.01"
                min="1"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-amber-400/60 number-display transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Já Guardado (R$ Opcional)
              </label>
              <input
                type="number"
                value={initialSaved}
                onChange={(e) => setInitialSaved(e.target.value)}
                placeholder="0,00"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-400/60 number-display transition-colors"
              />
            </div>
          </div>

          {/* Emoji Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-white/60 mb-2 uppercase tracking-wider">
              Ícone da Meta
            </label>
            <div className="grid grid-cols-8 gap-1.5">
              {GOAL_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    selectedEmoji === emoji
                      ? 'bg-amber-400/30 border-2 border-amber-400 scale-110 shadow-lg'
                      : 'bg-white/5 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-white/60 mb-2 uppercase tracking-wider">
              Tema de Cor
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c.gradient}
                  type="button"
                  onClick={() => setSelectedColor(c.gradient)}
                  className={`h-11 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center transition-all ${
                    selectedColor === c.gradient
                      ? 'ring-2 ring-white scale-105 shadow-xl'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                  title={c.name}
                >
                  {selectedColor === c.gradient && <Check className="w-4 h-4 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Rocket className="w-4 h-4" />
            Começar Escalada
          </button>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// 2. Modal para Depósito ou Retirada de Valor na Meta
// -------------------------------------------------------------------
interface AmountModalProps {
  goal: Goal;
  type: 'deposit' | 'withdraw';
  onClose: () => void;
  onConfirm: (amount: number, fromWallet: boolean) => void;
  formatCurrency: (value: number) => string;
  maxAmount: number;
}

export function AmountModal({ goal, type, onClose, onConfirm, formatCurrency, maxAmount }: AmountModalProps) {
  const isDeposit = type === 'deposit';
  const [amount, setAmount] = useState('');
  const [isDirectDeposit, setIsDirectDeposit] = useState<boolean>(maxAmount <= 0);

  const quickAmounts = [20, 50, 100, 250, 500];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    if (!isDeposit) {
      if (val > maxAmount) return;
      onConfirm(val, true);
    } else {
      if (!isDirectDeposit && val > maxAmount) return;
      onConfirm(val, !isDirectDeposit);
    }
  };

  const isExceeded = !isDeposit
    ? parseFloat(amount) > maxAmount
    : (!isDirectDeposit && parseFloat(amount) > maxAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md glass-elevated rounded-3xl p-6 sm:p-7 z-10 border border-white/15">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${goal.color} flex items-center justify-center text-xl shadow-md`}
            >
              {goal.emoji}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isDeposit ? 'Guardar Dinheiro na Meta' : 'Retirar da Meta'}
              </h2>
              <p className="text-xs text-white/50">{goal.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balances Display */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">
              Guardado na Meta
            </p>
            <p className="text-sm font-bold text-white number-display">
              {formatCurrency(goal.currentAmount)}
            </p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">
              {isDeposit ? 'Disponível na Carteira' : 'Limite de Retirada'}
            </p>
            <p className="text-sm font-bold text-emerald-400 number-display">
              {formatCurrency(maxAmount)}
            </p>
          </div>
        </div>

        {/* Source Selector for Deposits */}
        {isDeposit && (
          <div className="mb-4 p-1 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsDirectDeposit(true)}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                isDirectDeposit
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>💳</span>
              <span>Aporte Real Direto</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDirectDeposit(false)}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                !isDirectDeposit
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>💼</span>
              <span>Da Carteira ({formatCurrency(maxAmount)})</span>
            </button>
          </div>
        )}

        {!isDeposit && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200 flex items-start gap-2">
            <Flame className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>
              Ao retirar dinheiro, seu personagem escorregará degraus abaixo na escada. O valor retornará à sua carteira.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
              {isDeposit ? (isDirectDeposit ? 'Valor do Aporte Real (R$)' : 'Valor a transferir (R$)') : 'Valor da Retirada (R$)'}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              step="0.01"
              min="0.01"
              max={(!isDeposit || !isDirectDeposit) ? maxAmount : undefined}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-amber-400/60 number-display transition-colors"
            />
          </div>

          {/* Quick Amounts */}
          <div>
            <div className="flex gap-2 flex-wrap">
              {quickAmounts.map((qa) => (
                <button
                  key={qa}
                  type="button"
                  onClick={() => setAmount(qa.toString())}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-white font-medium transition-all"
                >
                  +R${qa}
                </button>
              ))}
              {maxAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(maxAmount.toString())}
                  className="px-3 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-xs text-amber-300 font-bold transition-all ml-auto"
                >
                  Tudo ({formatCurrency(maxAmount)})
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isExceeded || !amount || parseFloat(amount) <= 0}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
              isDeposit
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-emerald-500/20 hover:brightness-110 active:scale-95'
                : 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/20 hover:brightness-110 active:scale-95'
            } disabled:opacity-40 disabled:pointer-events-none`}
          >
            {isDeposit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isDeposit ? 'Confirmar Depósito & Subir' : 'Confirmar Retirada'}
          </button>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// 3. Modal de Ajuste / Recarga da Carteira Simulada
// -------------------------------------------------------------------
interface WalletModalProps {
  currentBalance: number;
  onClose: () => void;
  onAddFunds: (amount: number) => void;
  formatCurrency: (value: number) => string;
}

export function WalletModal({ currentBalance, onClose, onAddFunds, formatCurrency }: WalletModalProps) {
  const [amount, setAmount] = useState('500');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    onAddFunds(val);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md glass-elevated rounded-3xl p-6 sm:p-7 z-10 border border-white/15">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl border border-blue-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Saldo da Carteira</h2>
              <p className="text-xs text-white/50">Adicione fundos para simular sua economia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-5 text-center">
          <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">
            Saldo Atual Disponível
          </p>
          <p className="text-2xl font-black text-emerald-400 number-display">
            {formatCurrency(currentBalance)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
              Adicionar Renda / Salário (R$)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
              step="10"
              min="10"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-amber-400/60 number-display transition-colors"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[100, 500, 1000, 5000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(v.toString())}
                className="py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white transition-all"
              >
                +R${v}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-blue-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Adicionar à Carteira
          </button>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// 4. Modal de Troca / Seleção de Personagem (Melhoria do Personagem)
// -------------------------------------------------------------------
interface SkinSelectorModalProps {
  currentSkin: CharacterSkinId;
  onSelectSkin: (skinId: CharacterSkinId) => void;
  onClose: () => void;
}

export function SkinSelectorModal({ currentSkin, onSelectSkin, onClose }: SkinSelectorModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-elevated rounded-3xl p-6 sm:p-7 z-10 border border-white/15 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-xl border border-amber-400/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Escolha seu Herói</h2>
              <p className="text-xs text-white/50">Personalize quem irá subir a escada até sua meta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {CHARACTER_SKINS.map((skin) => {
            const isSelected = skin.id === currentSkin;
            return (
              <div
                key={skin.id}
                onClick={() => {
                  onSelectSkin(skin.id);
                  onClose();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                  isSelected
                    ? 'bg-amber-400/15 border-amber-400/60 shadow-lg shadow-amber-400/20 ring-1 ring-amber-400/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${skin.accentColor} flex items-center justify-center text-2xl shadow-md shrink-0 overflow-hidden`}
                >
                  {skin.id === 'dante_dog' ? (
                    <img
                      src="/dante_dog.jpg"
                      alt="Dante Cão Robô"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    skin.icon
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-white">{skin.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-medium">
                      {skin.title}
                    </span>
                    {isSelected && (
                      <span className="ml-auto text-xs text-amber-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 leading-snug">{skin.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// 6. Modal para Zerar Dados / Começar com Dados Reais
// -------------------------------------------------------------------
interface ResetDataModalProps {
  onClose: () => void;
  onConfirmReset: () => void;
}

export function ResetDataModal({ onClose, onConfirmReset }: ResetDataModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md glass-elevated rounded-3xl p-6 z-10 border border-red-500/20 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-lg border border-red-500/30">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Zerar Dados do App</h2>
              <p className="text-xs text-white/50">Limpar dados demonstrativos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200/90 leading-relaxed">
              Isso irá <strong>zerar todas as metas e o saldo da carteira (R$ 0,00)</strong> para você cadastrar suas <strong>metas e valores reais</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-bold transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmReset();
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-xs shadow-lg shadow-red-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Zerar Tudo Agora
          </button>
        </div>
      </div>
    </div>
  );
}

