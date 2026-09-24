import React, { useState, useRef } from 'react';
import {
  Palette,
  Moon,
  Sun,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  Check,
  AlertTriangle,
  RefreshCw,
  Smartphone,
  Database,
  Coins,
  Calendar,
  Layers,
  ChevronRight,
  Info,
  Sliders,
  CheckCircle2,
  Lock,
  ExternalLink,
  DollarSign,
  Megaphone,
  BadgePercent,
  Copy,
} from 'lucide-react';
import { useSettings, AppTheme, AppCurrency } from '../../context/SettingsContext';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { formatBRL, formatDateBR } from '../../utils/format';

export default function SettingsScreen({ onNavigateToGoogle }: { onNavigateToGoogle?: () => void }) {
  const {
    theme,
    setTheme,
    hideValues,
    toggleHideValues,
    visualEffects,
    setVisualEffects,
    soundEffects,
    setSoundEffects,
    compactDensity,
    setCompactDensity,
    currency,
    setCurrency,
    budgetClosingDay,
    setBudgetClosingDay,
    savingsTargetRate,
    setSavingsTargetRate,
    highExpenseAlert,
    setHighExpenseAlert,
    googleAdSenseClientId,
    setGoogleAdSenseClientId,
    googleAdSenseSlotId,
    setGoogleAdSenseSlotId,
    affiliateCustomUrl,
    setAffiliateCustomUrl,
    pixKey,
    setPixKey,
    pixName,
    setPixName,
    checkoutUrl,
    setCheckoutUrl,
    kiwifyMonthlyUrl,
    setKiwifyMonthlyUrl,
    kiwifyAnnualUrl,
    setKiwifyAnnualUrl,
  } = useSettings();

  const { isPro, openProModal } = useSubscription();

  const {
    transactions,
    bankAccounts,
    investments,
    savingGoals,
    metrics,
    exportAllData,
    importAllData,
    resetAllData,
  } = useFinance();

  const { user } = useAuth();

  // Active section tab inside settings
  const [activeSection, setActiveSection] = useState<'appearance' | 'financial' | 'data' | 'cloud' | 'monetization' | 'about'>('appearance');

  // Import / Export Feedback
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Danger Zone Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Themes list with visual identity preview
  const THEMES: {
    id: AppTheme;
    name: string;
    badge: string;
    description: string;
    previewBg: string;
    previewCard: string;
    previewBorder: string;
    previewAccent: string;
    previewTextColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'cyber_dark',
      name: 'Cyberpunk Futurista Dark',
      badge: 'PADRÃO QUÂNTICO',
      description: 'Interface de alta tecnologia com neon ciano, ouro quântico, scanlines e holograma.',
      previewBg: 'bg-[#030712]',
      previewCard: 'bg-slate-900/80',
      previewBorder: 'border-cyan-400',
      previewAccent: 'bg-gradient-to-r from-cyan-400 to-blue-500',
      previewTextColor: 'text-cyan-300',
      icon: Sparkles,
    },
    {
      id: 'pro_light',
      name: 'Profissional Claro / Executivo',
      badge: 'ALTA LEGIBILIDADE',
      description: 'Branco executivo, slate nítido, tipografia de alto contraste para escritórios e uso à luz do sol.',
      previewBg: 'bg-slate-100',
      previewCard: 'bg-white',
      previewBorder: 'border-slate-300',
      previewAccent: 'bg-gradient-to-r from-blue-600 to-cyan-600',
      previewTextColor: 'text-slate-900',
      icon: Sun,
    },
    {
      id: 'midnight',
      name: 'Midnight Obsidian / OLED',
      badge: 'BLACK ABSOLUTO',
      description: 'Preto puro (#000000), linhas finas de titânio, zero gasto de pixels pretos em telas OLED.',
      previewBg: 'bg-black',
      previewCard: 'bg-zinc-950',
      previewBorder: 'border-zinc-700',
      previewAccent: 'bg-gradient-to-r from-sky-400 to-indigo-500',
      previewTextColor: 'text-zinc-100',
      icon: Moon,
    },
    {
      id: 'emerald',
      name: 'Cyber Emerald / Fintech',
      badge: 'PROSPERIDADE VERDE',
      description: 'Verde esmeralda financeiro de alto crescimento, acentos menta neon e atmosfera fintech.',
      previewBg: 'bg-[#021a12]',
      previewCard: 'bg-[#052e1f]',
      previewBorder: 'border-emerald-400',
      previewAccent: 'bg-gradient-to-r from-emerald-400 to-teal-500',
      previewTextColor: 'text-emerald-300',
      icon: Coins,
    },
  ];

  // Handler: Export Backup JSON
  const handleExportJSON = () => {
    try {
      const data = exportAllData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute('download', `minhas-financas-backup-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  // Handler: Export CSV for Excel / Google Sheets
  const handleExportCSV = () => {
    try {
      if (transactions.length === 0) {
        alert('Não há transações cadastradas para exportar.');
        return;
      }

      const headers = ['ID', 'Data', 'Tipo', 'Categoria', 'Valor (R$)', 'Conta/Banco', 'Observações'];
      const rows = transactions.map((t) => [
        t.id,
        formatDateBR(t.date),
        t.type === 'income' ? 'Receita' : 'Despesa',
        `"${(t.category || '').replace(/"/g, '""')}"`,
        t.amount.toFixed(2).replace('.', ','),
        `"${(t.bankAccountId || 'Principal').replace(/"/g, '""')}"`,
        `"${(t.note || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `extrato-transacoes-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('CSV export error:', e);
    }
  };

  // Handler: File upload for JSON restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const success = importAllData(parsed);

        if (success) {
          setImportStatus({
            type: 'success',
            message: `Backup restaurado com sucesso! ${parsed.transactions?.length || 0} lançamentos e ${parsed.savingGoals?.length || 0} metas recuperados.`,
          });
        } else {
          setImportStatus({
            type: 'error',
            message: 'Arquivo inválido ou corrompido. Certifique-se de que é um backup do Minhas Finanças.',
          });
        }
      } catch (err) {
        setImportStatus({
          type: 'error',
          message: 'Falha ao processar o arquivo JSON. Verifique a formatação do arquivo.',
        });
      }
      setTimeout(() => setImportStatus(null), 5000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Handler: Factory Reset
  const handleConfirmReset = () => {
    if (resetConfirmationText.trim().toUpperCase() !== 'ZERAR') {
      alert('Digite a palavra ZERAR exatamente como indicado para confirmar.');
      return;
    }
    resetAllData();
    setShowResetModal(false);
    setResetConfirmationText('');
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 4000);
  };

  // Calculate local storage size approximation
  const estimatedStorageKB = Math.round(
    ((JSON.stringify(transactions).length +
      JSON.stringify(bankAccounts).length +
      JSON.stringify(investments).length +
      JSON.stringify(savingGoals).length) *
      2) /
      1024
  );

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-cyan-950/70 via-slate-900/90 to-blue-950/70 border border-cyan-400/40 p-5 sm:p-7 shadow-2xl backdrop-blur-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden hud-border-corners group">
        <div className="holo-scanline" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-teal-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-xl shadow-cyan-500/30 shrink-0 ring-2 ring-cyan-300/40">
            <Sliders className="w-7 h-7 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight flex items-center gap-2">
                Painel de Configurações
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-cyan-400/15 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono font-bold">
                SISTEMA v2.5.0
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Personalize a aparência futurista ou executiva, modo privacidade, preferências financeiras, backups e sincronização.
            </p>
          </div>
        </div>

        {/* Quick Actions in Header */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 relative z-10">
          <button
            onClick={toggleHideValues}
            className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              hideValues
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-lg shadow-amber-500/20'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Ocultar/Exibir valores na tela para discrição em público"
          >
            {hideValues ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-cyan-400" />}
            <span>{hideValues ? 'Valores Ocultos' : 'Modo Discreto'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-white/10">
        {[
          { id: 'appearance', label: 'Aparência & Temas', icon: Palette },
          { id: 'financial', label: 'Preferências Financeiras', icon: Coins },
          { id: 'data', label: 'Backup & Dados', icon: Database },
          { id: 'cloud', label: 'Sincronização & Conta', icon: ShieldCheck },
          { id: 'monetization', label: 'Monetização & Anúncios', icon: DollarSign },
          { id: 'about', label: 'Sobre o Sistema', icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-md shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: APARÊNCIA & TEMAS */}
      {activeSection === 'appearance' && (
        <div className="space-y-6">
          {/* Theme Selector */}
          <div className="rounded-3xl cyber-card p-5 sm:p-7 space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base sm:text-lg font-bold text-white">Tema Visual do Sistema</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Escolha o estilo de exibição que melhor combina com seu momento: alta tecnologia cyberpunk, profissional executivo ou economia de tela OLED.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {THEMES.map((th) => {
                const Icon = th.icon;
                const isSelected = theme === th.id;
                return (
                  <div
                    key={th.id}
                    onClick={() => setTheme(th.id)}
                    className={`relative rounded-2xl p-4 cursor-pointer transition-all border flex flex-col justify-between gap-4 group ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/30 shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-400/40'
                        : 'border-white/10 bg-slate-900/50 hover:border-white/30 hover:bg-slate-900/80'
                    }`}
                  >
                    {/* Visual Card Preview Mini-Box */}
                    <div className={`w-full h-24 rounded-xl ${th.previewBg} p-2.5 border ${th.previewBorder} shadow-inner flex flex-col justify-between overflow-hidden relative`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-3.5 h-3.5 rounded-full ${th.previewAccent}`} />
                          <div className={`text-[10px] font-mono font-bold ${th.previewTextColor}`}>
                            {th.id === 'pro_light' ? 'Executivo' : 'Quantum'}
                          </div>
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>

                      {/* Mock Chart / Metric */}
                      <div className={`rounded-lg ${th.previewCard} p-1.5 border ${th.previewBorder} shadow-sm flex items-center justify-between`}>
                        <div className="space-y-0.5">
                          <div className="w-8 h-1 bg-slate-400/40 rounded-full" />
                          <div className={`text-[9px] font-mono font-black ${th.previewTextColor}`}>
                            R$ 14.850
                          </div>
                        </div>
                        <div className={`text-[8px] font-bold px-1 py-0.5 rounded ${th.previewAccent} text-slate-950`}>
                          +18%
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          <Icon className="w-4 h-4 text-cyan-400" />
                          <span>{th.name.split('/')[0]}</span>
                        </h4>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center text-xs font-black">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono font-bold text-slate-300">
                        {th.badge}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                        {th.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Display & Privacy Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Privacy Mode Card */}
            <div className="rounded-3xl cyber-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hideValues ? 'bg-amber-400/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                    {hideValues ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-white">Modo Privacidade (Ocultar Valores)</h4>
                    <p className="text-xs text-slate-400">Protege seus saldos em locais públicos</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideValues}
                    onChange={toggleHideValues}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500" />
                </label>
              </div>

              <div className="rounded-2xl bg-black/30 border border-white/5 p-3 text-xs text-slate-300 flex items-center justify-between">
                <span className="text-slate-400">Exemplo de visualização:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {hideValues ? '••••••' : formatBRL(metrics.balance)}
                </span>
              </div>
            </div>

            {/* Visual FX & Scanlines */}
            <div className="rounded-3xl cyber-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-white">Efeitos Holográficos & Glow</h4>
                    <p className="text-xs text-slate-400">Scanlines quânticas e brilhos neon</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visualEffects}
                    onChange={(e) => setVisualEffects(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500" />
                </label>
              </div>

              <p className="text-[11px] text-slate-400">
                Desative caso prefira uma interface mais suave, minimalista ou para economizar bateria em dispositivos móveis.
              </p>
            </div>

            {/* Audio Effects */}
            <div className="rounded-3xl cyber-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    {soundEffects ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-white">Efeitos Sonoros (SFX)</h4>
                    <p className="text-xs text-slate-400">Sons de moedas, cliques e fanfarras</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soundEffects}
                    onChange={(e) => setSoundEffects(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                </label>
              </div>

              <p className="text-[11px] text-slate-400">
                Feedback auditivo sutil nas conquistas da escalada da montanha e lançamentos de aportes.
              </p>
            </div>

            {/* Compact Density */}
            <div className="rounded-3xl cyber-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-white">Densidade Visual Compacta</h4>
                    <p className="text-xs text-slate-400">Mais dados por tela em listas e tabelas</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compactDensity}
                    onChange={(e) => setCompactDensity(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500" />
                </label>
              </div>

              <p className="text-[11px] text-slate-400">
                Reduz o espaçamento entre linhas no extrato de transações para usuários com grande volume diário.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: PREFERÊNCIAS FINANCEIRAS */}
      {activeSection === 'financial' && (
        <div className="space-y-6">
          <div className="rounded-3xl cyber-card p-5 sm:p-7 space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="text-base sm:text-lg font-bold text-white">Moeda & Regras Orçamentárias</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Configure como suas finanças são calculadas e receba alertas automáticos de inteligência financeira.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Currency Selector */}
              <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-2.5">
                <label className="block text-xs font-mono font-bold text-slate-300">
                  MOEDA PRINCIPAL
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'BRL', label: 'R$ Real' },
                    { id: 'USD', label: '$ Dólar' },
                    { id: 'EUR', label: '€ Euro' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCurrency(c.id as AppCurrency)}
                      className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                        currency === c.id
                          ? 'bg-amber-400/20 border-amber-400/60 text-amber-300 shadow-sm'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500">
                  Formata todos os valores exibidos e relatórios do app.
                </p>
              </div>

              {/* Budget Closing Day */}
              <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-2.5">
                <label className="block text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                  <span>DIA DE FECHAMENTO</span>
                  <span className="text-cyan-400">Dia {budgetClosingDay}</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="28"
                    value={budgetClosingDay}
                    onChange={(e) => setBudgetClosingDay(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400"
                  />
                  <span className="font-mono font-bold text-sm text-white px-2 py-1 bg-white/5 rounded-lg border border-white/10">
                    {budgetClosingDay}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Dia do mês em que seu ciclo de salário ou faturas costuma reiniciar.
                </p>
              </div>

              {/* Savings Target Rate */}
              <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-2.5">
                <label className="block text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                  <span>META DE POUPANÇA</span>
                  <span className="text-emerald-400">{savingsTargetRate}% da renda</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[10, 15, 20, 30].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setSavingsTargetRate(rate)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                        savingsTargetRate === rate
                          ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500">
                  Recomendação padrão: 20% (Regra 50/30/20).
                </p>
              </div>
            </div>

            {/* High Expense Threshold Alert */}
            <div className="rounded-2xl bg-black/40 border border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-md">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Alerta de Despesa Elevada</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Destaque visual automático quando um lançamento único exceder este limite.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-mono text-slate-400">R$</span>
                <input
                  type="number"
                  step="100"
                  min="100"
                  value={highExpenseAlert}
                  onChange={(e) => setHighExpenseAlert(Math.max(100, parseFloat(e.target.value) || 100))}
                  className="w-36 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-mono font-bold text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: BACKUP & DADOS */}
      {activeSection === 'data' && (
        <div className="space-y-6">
          {/* Status Banners */}
          {exportSuccess && (
            <div className="rounded-2xl bg-emerald-500/20 border border-emerald-400/50 p-4 text-emerald-300 text-xs font-mono flex items-center gap-2.5 animate-pop-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Backup JSON gerado e baixado com sucesso! Guarde este arquivo em segurança.</span>
            </div>
          )}

          {importStatus && (
            <div className={`rounded-2xl p-4 text-xs font-mono flex items-center gap-2.5 animate-pop-in ${
              importStatus.type === 'success'
                ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300'
                : 'bg-rose-500/20 border border-rose-400/50 text-rose-300'
            }`}>
              {importStatus.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}

          {resetSuccess && (
            <div className="rounded-2xl bg-cyan-500/20 border border-cyan-400/50 p-4 text-cyan-300 text-xs font-mono flex items-center gap-2.5 animate-pop-in">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>Banco de dados redefinido com sucesso para o estado inicial!</span>
            </div>
          )}

          {/* Backup & Export Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export JSON */}
            <div className="rounded-3xl cyber-card p-5 sm:p-6 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-base">Exportar Backup Completo</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Baixa um arquivo JSON com todas as suas transações, contas bancárias, metas e investimentos.
                </p>
              </div>

              <button
                onClick={handleExportJSON}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-black text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>BAIXAR BACKUP (JSON)</span>
              </button>
            </div>

            {/* Import JSON */}
            <div className="rounded-3xl cyber-card p-5 sm:p-6 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-base">Restaurar de um Backup</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Envie seu arquivo de backup (.json) para restaurar todo o seu histórico e cadastros com 1 clique.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 text-purple-300 font-mono font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>SELECIONAR ARQUIVO JSON</span>
                </button>
              </div>
            </div>

            {/* Export CSV */}
            <div className="rounded-3xl cyber-card p-5 sm:p-6 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-base">Planilha Excel / CSV</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Exporta seu extrato de lançamentos em formato tabular para abrir no Excel ou Google Planilhas.
                </p>
              </div>

              <button
                onClick={handleExportCSV}
                className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-mono font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>BAIXAR EXTRATO (.CSV)</span>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-3xl border border-rose-500/30 bg-rose-950/20 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-rose-300">Zona de Perigo • Redefinir Tudo</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Apaga todas as transações, bancos e metas, retornando o app ao estado limpo de fábrica.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setResetConfirmationText('');
                  setShowResetModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/50 text-rose-300 font-mono font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 self-start sm:self-auto"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>LIMPAR BASE DE DADOS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: SINCRONIZAÇÃO & CONTA */}
      {activeSection === 'cloud' && (
        <div className="space-y-6">
          <div className="rounded-3xl cyber-card p-5 sm:p-7 space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base sm:text-lg font-bold text-white">Sincronização na Nuvem & Segurança</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Seus dados são salvos localmente no seu dispositivo e podem ser sincronizados com sua conta Google e banco Firestore.
              </p>
            </div>

            {/* Google Account Card */}
            <div className="rounded-2xl bg-black/40 border border-white/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="User"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-2xl border-2 border-cyan-400 object-cover shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-slate-300">
                    <Lock className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm sm:text-base">
                      {user ? user.displayName || 'Usuário Google' : 'Conta Não Vinculada'}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      user ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {user ? 'CONECTADO' : 'OFFLINE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {user ? user.email : 'Entre com sua conta Google para sincronizar entre múltiplos aparelhos.'}
                  </p>
                </div>
              </div>

              {onNavigateToGoogle && (
                <button
                  onClick={onNavigateToGoogle}
                  className="px-4 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs shadow-lg hover:bg-slate-100 transition-all flex items-center gap-2 active:scale-95"
                >
                  <span>{user ? 'Gerenciar Conta Google' : 'Conectar Conta Google'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Storage Diagnostic Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-black/30 border border-white/5 p-4 text-center">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Transações Salvas</span>
                <span className="text-lg font-black font-mono text-cyan-300 mt-1 block">{transactions.length}</span>
              </div>
              <div className="rounded-2xl bg-black/30 border border-white/5 p-4 text-center">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Contas Bancárias</span>
                <span className="text-lg font-black font-mono text-emerald-400 mt-1 block">{bankAccounts.length}</span>
              </div>
              <div className="rounded-2xl bg-black/30 border border-white/5 p-4 text-center">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Metas & Escalada</span>
                <span className="text-lg font-black font-mono text-amber-400 mt-1 block">{savingGoals.length}</span>
              </div>
              <div className="rounded-2xl bg-black/30 border border-white/5 p-4 text-center">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Armazenamento Local</span>
                <span className="text-lg font-black font-mono text-purple-300 mt-1 block">~{estimatedStorageKB} KB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: SOBRE O SISTEMA */}
      {activeSection === 'about' && (
        <div className="space-y-6">
          <div className="rounded-3xl cyber-card p-5 sm:p-7 space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-mono">Minhas Finanças + Jornada da Meta</h3>
                <p className="text-xs text-cyan-400 font-mono">Versão 2.5.0 Quantum Edition • Build 2026</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-black/30 p-4 rounded-2xl border border-white/5">
              <p>
                O <strong>Minhas Finanças</strong> é um sistema completo de gestão patrimonial e orçamentária integrado à mecânica gamificada da <strong>Jornada da Meta</strong>.
              </p>
              <p>
                <strong>Destaques de Engenharia:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 ml-1">
                <li>Privacidade em Primeiro Lugar: Dados salvos localmente no seu navegador com suporte a backup JSON e CSV.</li>
                <li>Múltiplos Temas: Cyberpunk Futurista Dark, Profissional Claro / Executivo, Midnight OLED e Cyber Emerald.</li>
                <li>Modo Discreto: Oculte todos os valores e saldos com um único toque para segurança em ambientes públicos.</li>
                <li>Inteligência Artificial Dante: Consultoria financeira com análise cirúrgica e telemetria de gastos.</li>
                <li>PWA Instalável: Funciona offline no seu smartphone Android, iOS ou computador desktop.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: MONETIZATION & ADS */}
      {activeSection === 'monetization' && (
        <div className="space-y-6">
          {/* Overview Hero Card */}
          <div className="rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-cyan-950/60 border border-emerald-500/30 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20 shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Central de Monetização e Anúncios Reais
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      ATIVO
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Receba pagamentos via PIX por assinaturas PRO e ganhe com anúncios/afiliados.
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Status do Banner</div>
                <div className="text-xs font-bold text-emerald-400 font-mono">
                  {googleAdSenseClientId ? 'Google AdSense Conectado' : 'Parceiros Financeiros Ativos'}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-start gap-3">
              <Megaphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-white block">Como você ganha dinheiro com este app:</strong>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong>1. Assinatura PRO Direta (PIX):</strong> Seus usuários pagam R$ 14,90/mês ou R$ 119,90/ano e o dinheiro vai 100% direto para a sua conta bancária sem taxas.<br />
                  <strong>2. Google AdSense / AdMob:</strong> O Google exibe anúncios no banner e remunera por visualização e clique.<br />
                  <strong>3. Afiliados Financeiros:</strong> Usuários que abrem conta na Nomad, B3 ou corretoras geram comissões imediatas.
                </p>
              </div>
            </div>
          </div>

          {/* PIX & PRO Subscription Owner Settings */}
          <div className="rounded-3xl bg-slate-900/80 border border-emerald-500/30 p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Sua Chave PIX para Receber Pagamentos PRO</h4>
                  <p className="text-xs text-slate-400">Quando seus clientes assinarem o VIP PRO, o PIX cai diretamente na sua conta</p>
                </div>
              </div>

              <button
                type="button"
                onClick={openProModal}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span>Ver Modal PRO</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 block">
                  Chave PIX de Recebimento (E-mail, CPF, Telefone ou Aleatória)
                </label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value.trim())}
                  placeholder="ex: seu-email@gmail.com ou 11999999999"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-white font-mono text-xs focus:border-emerald-400 focus:outline-none placeholder:text-slate-600"
                />
                <p className="text-[10px] text-slate-400">
                  Esta é a chave que os seus usuários verão ao clicar em assinar o PRO.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 block">
                  Nome do Titular do PIX
                </label>
                <input
                  type="text"
                  value={pixName}
                  onChange={(e) => setPixName(e.target.value)}
                  placeholder="Luiz Eduardo"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-white font-mono text-xs focus:border-emerald-400 focus:outline-none placeholder:text-slate-600"
                />
                <p className="text-[10px] text-slate-400">
                  Nome que aparecerá para o cliente conferir antes de transferir.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 block">
                  Link Kiwify Plano Mensal (R$ 9,99 / R$ 14,90)
                </label>
                <input
                  type="url"
                  value={kiwifyMonthlyUrl}
                  onChange={(e) => setKiwifyMonthlyUrl(e.target.value.trim())}
                  placeholder="https://pay.kiwify.com.br/DCGRpFb"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-white font-mono text-xs focus:border-emerald-400 focus:outline-none placeholder:text-slate-600"
                />
                <p className="text-[10px] text-slate-400">
                  Checkout oficial da Kiwify com cobrança mensal recorrente.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 block">
                  Link Kiwify Plano Anual (R$ 119,90)
                </label>
                <input
                  type="url"
                  value={kiwifyAnnualUrl}
                  onChange={(e) => setKiwifyAnnualUrl(e.target.value.trim())}
                  placeholder="https://pay.kiwify.com.br/09lfPE1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/30 text-white font-mono text-xs focus:border-amber-400 focus:outline-none placeholder:text-slate-600"
                />
                <p className="text-[10px] text-slate-400">
                  Checkout oficial da Kiwify com cobrança anual recorrente.
                </p>
              </div>
            </div>
          </div>

          {/* Google AdSense / AdMob Configuration */}
          <div className="rounded-3xl bg-slate-900/80 border border-cyan-500/20 p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Google AdSense / Google AdMob</h4>
                  <p className="text-xs text-slate-400">Insira seu ID de Editor para exibir anúncios oficiais do Google</p>
                </div>
              </div>

              <a
                href="https://adsense.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span>Criar Conta Google</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 block">
                  ID do Editor Google (Publisher Client ID)
                </label>
                <input
                  type="text"
                  value={googleAdSenseClientId}
                  onChange={(e) => setGoogleAdSenseClientId(e.target.value.trim())}
                  placeholder="ca-pub-1234567890123456"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none placeholder:text-slate-600"
                />
                <p className="text-[10px] text-slate-400">
                  Encontrado no painel do AdSense em <em>Conta &gt; Configurações &gt; Informações da conta</em>.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 block">
                  ID do Bloco de Anúncios (Slot ID - Opcional)
                </label>
                <input
                  type="text"
                  value={googleAdSenseSlotId}
                  onChange={(e) => setGoogleAdSenseSlotId(e.target.value.trim())}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none placeholder:text-slate-600"
                />
                <p className="text-[10px] text-slate-400">
                  Código numérico gerado ao criar um anúncio em formato Banner Horizontal.
                </p>
              </div>
            </div>

            {googleAdSenseClientId && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  ID do Google configurado! O script oficial do Google AdSense será carregado para monetizar os acessos.
                </span>
              </div>
            )}
          </div>

          {/* Financial Affiliate Links (Fastest Monetization) */}
          <div className="rounded-3xl bg-slate-900/80 border border-amber-500/20 p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <BadgePercent className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Links de Afiliados Financeiros</h4>
                  <p className="text-xs text-slate-400">Ganhe comissões imediatas por cada usuário que abrir conta</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 block">
                Seu Link Personalizado de Indicação / Parceria (Opcional)
              </label>
              <input
                type="url"
                value={affiliateCustomUrl}
                onChange={(e) => setAffiliateCustomUrl(e.target.value.trim())}
                placeholder="https://sua-corretora.com/indique?ref=seucodigo"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/30 text-white font-mono text-xs focus:border-amber-400 focus:outline-none placeholder:text-slate-600"
              />
              <p className="text-[10px] text-slate-400">
                Se preenchido, os cliques no banner superior direcionarão para o seu link de afiliado pessoal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <strong className="text-white block font-bold">Nomad Global</strong>
                <span className="text-emerald-400 font-mono text-[11px] font-bold block">Até US$ 20 / indicação</span>
                <p className="text-[10px] text-slate-400">Conta em dólar nos EUA e investimentos globais.</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <strong className="text-white block font-bold">Remessa Online</strong>
                <span className="text-cyan-400 font-mono text-[11px] font-bold block">Comissão por câmbio</span>
                <p className="text-[10px] text-slate-400">Transferências internacionais de dinheiro e Google.</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <strong className="text-white block font-bold">Toro / BTG Pactual</strong>
                <span className="text-amber-400 font-mono text-[11px] font-bold block">R$ 50 a R$ 150 / conta</span>
                <p className="text-[10px] text-slate-400">Investimentos na B3 em ações, fundos imobiliários e renda fixa.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowResetModal(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-slate-950 border border-rose-500/40 p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Tem certeza absoluta?</h3>
                <p className="text-xs text-slate-400">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Todos os seus registros de transações ({transactions.length}), metas e bancos serão apagados da memória local. Se desejar guardar seus dados, faça um <strong>Backup JSON</strong> antes.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-400 block">
                Para confirmar, digite <strong className="text-rose-400">ZERAR</strong> abaixo:
              </label>
              <input
                type="text"
                value={resetConfirmationText}
                onChange={(e) => setResetConfirmationText(e.target.value)}
                placeholder="ZERAR"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-rose-500/40 text-white font-mono font-bold text-sm focus:border-rose-400 focus:outline-none uppercase"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReset}
                disabled={resetConfirmationText.trim().toUpperCase() !== 'ZERAR'}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono font-bold text-xs transition-all shadow-lg shadow-rose-500/30"
              >
                Sim, Redefinir Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
