import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Wallet,
  CreditCard,
  CheckCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { BankAccount, BankAccountType } from '../../types/finance';
import { formatBRL } from '../../utils/format';

const POPULAR_BANKS = [
  'Nubank',
  'Banco Inter',
  'Itaú',
  'Bradesco',
  'Banco do Brasil',
  'Caixa Econômica',
  'Santander',
  'C6 Bank',
  'PicPay',
  'Mercado Pago',
  'XP Investimentos',
  'BTG Pactual',
  'Carteira Física',
  'Outro Banco',
];

const ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança / Reserva',
  wallet: 'Carteira Digital / Dinheiro',
  broker: 'Corretora de Investimentos',
  'credit-card': 'Cartão de Crédito',
};

export default function BanksScreen() {
  const {
    bankAccounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    metrics,
  } = useFinance();

  const [showModal, setShowModal] = useState(false);
  const [editingAcc, setEditingAcc] = useState<BankAccount | null>(null);

  // Form
  const [bankName, setBankName] = useState('Nubank');
  const [accountType, setAccountType] = useState<BankAccountType>('checking');
  const [nickname, setNickname] = useState('');
  const [balance, setBalance] = useState('');

  // Quick edit balance inline
  const [quickBalanceId, setQuickBalanceId] = useState<string | null>(null);
  const [quickBalanceVal, setQuickBalanceVal] = useState('');

  const openNewModal = () => {
    setEditingAcc(null);
    setBankName('Nubank');
    setAccountType('checking');
    setNickname('');
    setBalance('');
    setShowModal(true);
  };

  const openEditModal = (acc: BankAccount) => {
    setEditingAcc(acc);
    setBankName(acc.bankName);
    setAccountType(acc.accountType);
    setNickname(acc.nickname || '');
    setBalance(String(acc.balance));
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(balance.replace(',', '.'));
    if (isNaN(val)) return;

    if (editingAcc) {
      updateBankAccount(editingAcc.id, {
        bankName,
        accountType,
        nickname: nickname.trim(),
        balance: val,
      });
    } else {
      addBankAccount({
        bankName,
        accountType,
        nickname: nickname.trim(),
        balance: val,
      });
    }
    setShowModal(false);
  };

  const handleQuickSaveBalance = (id: string) => {
    const val = parseFloat(quickBalanceVal.replace(',', '.'));
    if (!isNaN(val)) {
      updateBankAccount(id, { balance: val });
    }
    setQuickBalanceId(null);
    setQuickBalanceVal('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Contas & Instituições</h2>
          <p className="text-xs text-slate-400">Gerencie seus saldos, contas bancárias e carteiras</p>
        </div>

        <button
          onClick={openNewModal}
          className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-400/20"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Conta</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="cyber-card rounded-2xl p-5 border-cyan-500/30 bg-cyan-950/20 hud-border-corners">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-widest">// Saldo Consolidado em Contas</span>
            <Building2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono neon-text-cyan">{formatBRL(metrics.bankBalance)}</div>
          <p className="text-[11px] text-cyan-400/80 mt-1 font-mono">
            Total disponível nas suas {bankAccounts.filter((b) => b.accountType !== 'credit-card').length} contas
          </p>
        </div>

        <div className="cyber-card rounded-2xl p-5 border-orange-500/30 bg-orange-950/20 hud-border-corners">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-widest">// Dívida / Faturas de Cartão</span>
            <CreditCard className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400 font-mono">{formatBRL(metrics.creditCardDebt)}</div>
          <p className="text-[11px] text-orange-400/80 mt-1 font-mono">
            Faturas abertas pendentes de quitação
          </p>
        </div>
      </div>

      {/* Bank Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bankAccounts.map((acc) => {
          const isCredit = acc.accountType === 'credit-card';

          return (
            <div
              key={acc.id}
              className="cyber-card rounded-3xl p-5 transition-all flex flex-col justify-between group relative overflow-hidden hud-border-corners"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-lg">
                      {isCredit ? '💳' : acc.accountType === 'wallet' ? '💵' : '🏦'}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm leading-tight">{acc.bankName}</h4>
                      <span className="text-[10px] text-slate-400">
                        {ACCOUNT_TYPE_LABELS[acc.accountType]}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(acc)}
                      className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteBankAccount(acc.id)}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-400 mb-2">
                  Apelido: <span className="text-slate-200 font-semibold">{acc.nickname || 'Principal'}</span>
                </div>
              </div>

              {/* Balance & inline edit */}
              <div className="pt-3 border-t border-white/10">
                {quickBalanceId === acc.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={quickBalanceVal}
                      onChange={(e) => setQuickBalanceVal(e.target.value)}
                      placeholder="Novo saldo"
                      autoFocus
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-cyan-400 text-xs text-white"
                    />
                    <button
                      onClick={() => handleQuickSaveBalance(acc.id)}
                      className="p-1.5 rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Saldo Atual</span>
                      <div className={`text-lg font-black ${isCredit ? 'text-orange-400' : 'text-white'}`}>
                        {formatBRL(acc.balance)}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setQuickBalanceId(acc.id);
                        setQuickBalanceVal(String(acc.balance));
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      Ajustar Saldo
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/15 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-white text-lg">
                {editingAcc ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Bank selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Instituição / Banco</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Conta</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as BankAccountType)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Nickname */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Apelido da Conta</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ex: Conta Salário, Reserva de Emergência, etc."
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Initial Balance */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Saldo Atual (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-lg font-black text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black"
                >
                  Salvar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
