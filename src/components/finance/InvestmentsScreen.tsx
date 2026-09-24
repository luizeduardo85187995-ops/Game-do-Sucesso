import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  PieChart,
  Lightbulb,
  DollarSign,
  ShieldCheck,
  Building,
  Building2,
  Coins,
  X,
  Sparkles,
  RefreshCw,
  Search,
  Calendar,
  Layers,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Percent,
  Link2,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Investment, InvestmentFocus, InvestmentType, B3AssetQuote } from '../../types/finance';
import {
  ESTIMATED_MONTHLY_YIELD,
  INVESTMENT_FOCUS,
  INVESTMENT_IDEAS,
  INVESTMENT_TYPES,
} from '../../data/categories';
import { formatBRL, todayISO } from '../../utils/format';
import { B3_CATALOG, fetchB3Quote } from '../../services/b3MarketService';
import B3SearchModal from './B3SearchModal';
import DividendRadarScreen from './DividendRadarScreen';
import B3ConnectionModal from './B3ConnectionModal';
import { useSubscription } from '../../context/SubscriptionContext';
import ProFeatureLock from '../subscription/ProFeatureLock';

type SubTab = 'portfolio' | 'radar' | 'explore';

export default function InvestmentsScreen() {
  const { isPro } = useSubscription();
  const {
    investments,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    investmentFocus,
    setInvestmentFocus,
    marketIndicators,
    metrics,
    isSyncingB3,
    lastB3SyncAt,
    syncB3Quotes,
    dividendEvents,
    b3Integration,
    clearAllInvestments,
  } = useFinance();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('portfolio');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showB3Search, setShowB3Search] = useState(false);
  const [showB3ConnectModal, setShowB3ConnectModal] = useState(false);

  const hasCorruptedAssets = useMemo(() => {
    return investments.some(
      (inv) =>
        !inv ||
        !inv.code ||
        inv.code.includes('ABELHA') ||
        (inv.quantity ?? 0) > 1000000 ||
        (inv.currentPrice ?? 0) > 50000 ||
        (inv.amount ?? 0) > 50000000 ||
        (inv.totalCurrentValue ?? 0) > 50000000 ||
        !Number.isFinite(inv.totalCurrentValue ?? 0)
    );
  }, [investments]);

  // Form state
  const [code, setCode] = useState('MXRF11');
  const [type, setType] = useState<InvestmentType>('fii');
  const [name, setName] = useState('Maxi Renda FII');
  const [amount, setAmount] = useState('1012.00');
  const [quantity, setQuantity] = useState('100');
  const [unitPrice, setUnitPrice] = useState('10.12');
  const [yieldPercent, setYieldPercent] = useState('0.98');
  const [dividendYieldYearly, setDividendYieldYearly] = useState('12.35');
  const [isSearchingTicker, setIsSearchingTicker] = useState(false);

  // Auto-sync on initial mount if user has investments but no current price
  useEffect(() => {
    if (investments.length > 0 && !lastB3SyncAt) {
      syncB3Quotes();
    }
  }, [investments.length]);

  // Handle ticker lookup while typing in the add modal
  const handleTickerChange = async (val: string) => {
    const clean = val.toUpperCase();
    setCode(clean);

    if (clean.length >= 4) {
      const match = B3_CATALOG.find((c) => c.ticker === clean);
      if (match) {
        setName(match.name);
        setType(match.type);
        setUnitPrice(String(match.price));
        setDividendYieldYearly(String(match.dividendYield));
        const monthly = (match.dividendYield / 12).toFixed(2);
        setYieldPercent(monthly);

        const qty = parseInt(quantity, 10) || 10;
        setAmount((match.price * qty).toFixed(2));
      }
    }
  };

  // When an asset is picked from the B3 search catalog modal
  const handleSelectB3Asset = (asset: B3AssetQuote) => {
    setCode(asset.ticker);
    setName(asset.name);
    setType(asset.type);
    setUnitPrice(String(asset.price));
    setDividendYieldYearly(String(asset.dividendYield));
    const monthly = (asset.dividendYield / 12).toFixed(2);
    setYieldPercent(monthly);

    const qty = parseInt(quantity, 10) || 10;
    setAmount((asset.price * qty).toFixed(2));
    setShowAddModal(true);
  };

  const openNewModalWithIdea = (idea: { code: string; type: InvestmentType; name: string }) => {
    const catalogItem = B3_CATALOG.find((c) => c.ticker === idea.code);
    setCode(idea.code);
    setType(idea.type);
    setName(catalogItem?.name || idea.name);
    const price = catalogItem?.price || 100;
    setUnitPrice(String(price));
    setDividendYieldYearly(String(catalogItem?.dividendYield || 10.0));
    setYieldPercent(String(catalogItem ? (catalogItem.dividendYield / 12).toFixed(2) : ESTIMATED_MONTHLY_YIELD[idea.type] || 0.85));
    setQuantity('10');
    setAmount((price * 10).toFixed(2));
    setShowAddModal(true);
  };

  // Recalculates total amount when quantity or unit price changes
  const handleQuantityChange = (qVal: string) => {
    setQuantity(qVal);
    const q = parseInt(qVal, 10);
    const p = parseFloat(unitPrice.replace(',', '.'));
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      setAmount((q * p).toFixed(2));
    }
  };

  const handleUnitPriceChange = (pVal: string) => {
    setUnitPrice(pVal);
    const p = parseFloat(pVal.replace(',', '.'));
    const q = parseInt(quantity, 10);
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      setAmount((q * p).toFixed(2));
    }
  };

  const handleSaveInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    const qty = parseInt(quantity, 10) || 1;
    const price = parseFloat(unitPrice.replace(',', '.')) || (val / qty);
    const yld = parseFloat(yieldPercent.replace(',', '.')) || ESTIMATED_MONTHLY_YIELD[type];
    const dy = parseFloat(dividendYieldYearly.replace(',', '.')) || (yld * 12);

    addInvestment({
      code: code.trim().toUpperCase(),
      name: name.trim() || undefined,
      type,
      amount: val,
      quantity: qty,
      averagePrice: price,
      currentPrice: price,
      lastPrice: price,
      monthlyYield: yld,
      dividendYield: dy,
      date: todayISO(),
    });

    setShowAddModal(false);
  };

  // Count upcoming dividend payments this month
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const upcomingCount = dividendEvents.filter(
    (e) => e.paymentDate.startsWith(currentMonthKey) && e.status !== 'paid'
  ).length;

  if (!isPro) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <ProFeatureLock
          title="Módulo de Investimentos & Carteira B3"
          subtitle="Monitore sua carteira completa de Ações, Fundos Imobiliários (FIIs), Renda Fixa e receba projeções de dividendos futuros da B3."
          icon={<TrendingUp className="w-10 h-10 text-slate-950" />}
          benefits={[
            {
              title: 'Radar de Dividendos B3',
              desc: 'Previsão automática de proventos futuros e datas com de pagamentos.',
            },
            {
              title: 'Importação de Extratos B3',
              desc: 'Carregue notas de corretagem e relatórios da Área do Investidor em segundos.',
            },
            {
              title: 'Cotações em Tempo Real',
              desc: 'Acompanhe oscilações diárias de ações, FIIs e taxas CDI/Selic.',
            },
            {
              title: 'Projeção de Renda Passiva',
              desc: 'Simulador quântico de patrimônio e cálculo para viver de renda.',
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top B3 Connection Status Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hud-border-corners">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white">Mercado B3 & Carteira</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                CONEXÃO BOLSA B3 ATIVA
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cotações ao vivo, rentabilidade e agenda de proventos inspirada no Investidor10
            </p>
          </div>
        </div>

        {/* Action Buttons: Connect B3, Sync & Add */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setShowB3ConnectModal(true)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              b3Integration.isConnected
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300'
                : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/50 text-cyan-200 shadow-sm shadow-cyan-500/10'
            }`}
            title="Conectar com a Área do Investidor B3"
          >
            <Link2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{b3Integration.isConnected ? 'B3 Conectada' : 'Conectar com a B3'}</span>
          </button>

          <button
            onClick={() => syncB3Quotes()}
            disabled={isSyncingB3}
            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            title="Atualizar cotações da B3 agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncingB3 ? 'animate-spin' : ''}`} />
            <span>{isSyncingB3 ? 'Sincronizando...' : 'Atualizar Cotações'}</span>
          </button>

          <button
            onClick={() => {
              setCode('');
              setName('');
              setAmount('');
              setQuantity('10');
              setUnitPrice('');
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/25 hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Ativo B3</span>
          </button>

          {investments.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Deseja limpar todos os ativos da carteira para começar com seus dados reais?')) {
                  clearAllInvestments();
                }
              }}
              className="px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              title="Remover ativos de teste para inserir seus dados reais"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Carteira</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubTab('portfolio')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'portfolio'
              ? 'bg-purple-500/25 text-purple-300 border border-purple-400/50 shadow-md shadow-purple-500/10'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Minha Carteira B3</span>
          <span className="px-1.5 py-0.2 rounded-md bg-white/10 text-[10px] font-mono">
            {investments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('radar')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 relative ${
            activeSubTab === 'radar'
              ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-400/50 shadow-md shadow-emerald-500/15'
              : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20'
          }`}
        >
          <Coins className="w-4 h-4 text-emerald-400" />
          <span>Quando Vai Cair? (Radar de Proventos)</span>
          {upcomingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[10px] font-mono animate-pulse">
              {upcomingCount} este mês
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('explore')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'explore'
              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Sugestões & Indicadores B3</span>
        </button>
      </div>

      {/* TAB CONTENT: QUANDO VAI CAIR? (RADAR DE PROVENTOS INVESTIDOR10) */}
      {activeSubTab === 'radar' && (
        <DividendRadarScreen onOpenNewAssetModal={() => setShowAddModal(true)} />
      )}

      {/* TAB CONTENT: EXPLORAR B3 & SUGESTÕES */}
      {activeSubTab === 'explore' && (
        <div className="space-y-6">
          {/* Market Indicators Bar (Selic, CDI, IPCA, Ibov) */}
          <div className="cyber-card rounded-2xl p-4 hud-border-corners">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                // Indicadores Oficiais do Mercado
              </h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {marketIndicators.map((ind) => (
                <div key={ind.id} className="p-3 rounded-xl bg-white/[0.03] border border-cyan-500/20">
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">{ind.label}</span>
                  <div className="text-base font-black text-white font-mono mt-0.5">
                    {ind.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {ind.suffix}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 block mt-0.5">{ind.source}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Investment Strategy & Ideas */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Lightbulb className="w-4 h-4" />
                <h3 className="font-bold text-white text-sm">Ideias e Sugestões por Estratégia</h3>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {INVESTMENT_FOCUS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setInvestmentFocus(f.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      investmentFocus === f.value
                        ? 'bg-purple-500/30 border-purple-400 text-purple-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {INVESTMENT_IDEAS[investmentFocus].map((idea) => {
                const catalogItem = B3_CATALOG.find((c) => c.ticker === idea.code);

                return (
                  <div
                    key={idea.code}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between hover:border-purple-400/40 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-black text-white text-sm">{idea.code}</span>
                        <div className="flex items-center gap-1.5">
                          {catalogItem?.dividendYield && catalogItem.dividendYield > 8 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                              DY {catalogItem.dividendYield.toFixed(1)}%
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold uppercase">
                            {idea.type}
                          </span>
                        </div>
                      </div>
                      <h5 className="text-xs font-semibold text-slate-300 mb-1">{idea.name}</h5>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{idea.reason}</p>
                      {catalogItem?.price && (
                        <div className="mt-2 text-xs font-mono font-bold text-cyan-300">
                          Cotação atual: {formatBRL(catalogItem.price)}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => openNewModalWithIdea(idea)}
                      className="mt-3 w-full py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-1 hover:scale-105"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar à Carteira
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MINHA CARTEIRA B3 */}
      {activeSubTab === 'portfolio' && (
        <div className="space-y-6">
          {/* B3 Integration Status Banner */}
          {!b3Integration.isConnected ? (
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hud-border-corners">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-white">Conexão Oficial com a B3 (Área do Investidor)</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      OPEN FINANCE B3
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Sincronize automaticamente seus fundos imobiliários, ações e proventos da Área do Investidor B3 ou faça upload da sua planilha de negociação (.xlsx / .csv).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => setShowB3ConnectModal(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  <span>Conectar com a B3</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-2">
                    <span>Área do Investidor B3 Conectada</span>
                    <span className="font-mono text-emerald-400 text-[11px] font-normal">({b3Integration.connectedCpf})</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Custódia sincronizada • Próximos dividendos calculados automaticamente
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowB3ConnectModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Importar Extrato Real</span>
                </button>

                {investments.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Deseja limpar todos os ativos da carteira para começar com seus dados reais?')) {
                        clearAllInvestments();
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5"
                    title="Remover ativos de teste da carteira"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Ativos</span>
                  </button>
                )}

                <button
                  onClick={() => setShowB3ConnectModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white text-xs font-bold transition-all"
                >
                  Gerenciar
                </button>
              </div>
            </div>
          )}

          {/* Anomaly Detection Alert Banner */}
          {hasCorruptedAssets && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-red-900/50 to-rose-950/90 border-2 border-rose-500/70 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    Valores Anômalos Detectados na Carteira B3
                  </h4>
                  <p className="text-xs text-rose-200 mt-0.5">
                    A versão anterior importou números de conta ou CNPJ como cotação. Clique para zerar a carteira e reimportar sua planilha/extrato corrigido.
                  </p>
                </div>
              </div>
              <button
                onClick={() => clearAllInvestments()}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all shadow-lg shadow-rose-500/30 shrink-0 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpar Carteira Agora</span>
              </button>
            </div>
          )}

          {/* Top 4 Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Patrimônio Atualizado */}
            <div className="cyber-card rounded-2xl p-5 border-purple-500/40 bg-purple-950/20 hud-border-corners">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-widest">
                  // Patrimônio Atual B3
                </span>
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {formatBRL(metrics.investedTotal)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono flex items-center justify-between">
                <span>Custo: {formatBRL(metrics.investedCostTotal)}</span>
                <span className="text-purple-400">{investments.length} ativos</span>
              </div>
            </div>

            {/* Lucro / Prejuízo da Carteira */}
            <div className={`cyber-card rounded-2xl p-5 hud-border-corners ${
              metrics.investedProfitLoss >= 0
                ? 'border-emerald-500/40 bg-emerald-950/20'
                : 'border-rose-500/40 bg-rose-950/20'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-widest">
                  // Rentabilidade Total
                </span>
                {metrics.investedProfitLoss >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                )}
              </div>
              <div className={`text-2xl font-black font-mono ${
                metrics.investedProfitLoss >= 0 ? 'text-emerald-400 neon-text-emerald' : 'text-rose-400'
              }`}>
                {metrics.investedProfitLoss >= 0 ? '+' : ''}
                {formatBRL(metrics.investedProfitLoss)}
              </div>
              <p className={`text-[11px] mt-1 font-mono font-bold ${
                metrics.investedProfitLoss >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'
              }`}>
                {metrics.investedProfitLoss >= 0 ? '+' : ''}
                {metrics.investedProfitLossPercent.toFixed(2)}% sobre o custo
              </p>
            </div>

            {/* Renda Passiva Mensal */}
            <div className="cyber-card rounded-2xl p-5 border-emerald-500/40 bg-emerald-950/20 hud-border-corners">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-widest">
                  // Renda Passiva Mensal
                </span>
                <Coins className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono neon-text-emerald">
                {formatBRL(metrics.estimatedPassiveIncome)}
              </div>
              <p className="text-[11px] text-emerald-400/80 mt-1 font-mono">
                Estimativa mensal recorrente
              </p>
            </div>

            {/* Vai Cair Este Mês (CTA to Radar) */}
            <div
              onClick={() => setActiveSubTab('radar')}
              className="cyber-card rounded-2xl p-5 border-cyan-500/40 bg-cyan-950/20 hud-border-corners cursor-pointer hover:border-cyan-400 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-widest">
                  // Proventos a Cair
                </span>
                <Calendar className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-black text-cyan-400 font-mono neon-text-cyan">
                {formatBRL(metrics.upcomingDividendsThisMonth)}
              </div>
              <p className="text-[11px] text-cyan-400/90 mt-1 font-mono flex items-center justify-between">
                <span>Ver radar de dividendos</span>
                <span className="text-xs group-hover:translate-x-1 transition-transform">→</span>
              </p>
            </div>
          </div>

          {/* Current Investments List with B3 Live Details */}
          <div className="cyber-card rounded-3xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 flex-wrap">
                <PieChart className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">Ativos em Carteira</h3>
                <span className="text-xs text-slate-400 font-mono">({investments.length} posições)</span>
                {investments.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Deseja limpar todos os ativos da carteira para começar com seus dados reais?')) {
                        clearAllInvestments();
                      }
                    }}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-bold underline flex items-center gap-1 ml-1"
                  >
                    <Trash2 className="w-3 h-3" /> Limpar ativos de teste
                  </button>
                )}
              </div>

              {lastB3SyncAt && (
                <span className="text-[11px] font-mono text-slate-400">
                  Cotações B3 atualizadas em: {new Date(lastB3SyncAt).toLocaleTimeString('pt-BR')}
                </span>
              )}
            </div>

            {investments.length === 0 ? (
              <div className="text-center py-12 space-y-3 bg-white/[0.02] rounded-2xl border border-white/5">
                <Building className="w-12 h-12 text-slate-600 mx-auto" />
                <div className="text-sm font-bold text-white">Sua carteira de investimentos está vazia</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Importe seu extrato oficial da B3 (.xlsx/.csv), cole seus ativos ou cadastre manualmente para acompanhar cotações e proventos reais!
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <button
                    onClick={() => setShowB3ConnectModal(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Importar Extrato Oficial B3 (.xlsx)
                  </button>
                  <button
                    onClick={() => setShowB3Search(true)}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-all flex items-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5" /> Buscar Ativo na B3
                  </button>
                  <button
                    onClick={() => {
                      setCode('');
                      setName('');
                      setQuantity('10');
                      setUnitPrice('');
                      setAmount('');
                      setShowAddModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-black transition-all shadow-md shadow-purple-500/20"
                  >
                    + Novo Ativo
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {investments.map((inv) => {
                  const qty = inv.quantity || 1;
                  const currentPrice = inv.currentPrice || inv.lastPrice || (inv.amount / qty);
                  const currentTotal = inv.totalCurrentValue || (currentPrice * qty);
                  const profitLoss = inv.totalProfitLoss ?? (currentTotal - inv.amount);
                  const profitLossPct = inv.totalProfitLossPercent ?? (inv.amount > 0 ? (profitLoss / inv.amount) * 100 : 0);
                  const isPositive = profitLoss >= 0;
                  const expectedMonthYield = (currentTotal * (inv.monthlyYield || 0.85)) / 100;

                  return (
                    <div
                      key={inv.id}
                      className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-white/[0.02] px-2 rounded-2xl transition-all"
                    >
                      {/* Left: Ticker, Type, Name */}
                      <div className="flex items-center gap-3.5">
                        <div
                          translate="no"
                          className={`notranslate w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                            inv.type === 'fii'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : inv.type === 'stock'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {inv.code.slice(0, 4)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span translate="no" className="notranslate text-sm sm:text-base font-black text-white font-mono">
                              {inv.code}
                            </span>
                            <span translate="no" className="notranslate text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                              {inv.type === 'stock' ? 'AÇÃO' : inv.type === 'fii' ? 'FII' : inv.type === 'treasury' ? 'TESOURO' : inv.type.toUpperCase()}
                            </span>
                            {inv.dividendYield && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                DY {inv.dividendYield.toFixed(1)}%
                              </span>
                            )}
                            {inv.priceChange24h !== undefined && (
                              <span className={`text-[10px] font-mono font-semibold flex items-center gap-0.5 ${
                                inv.priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {inv.priceChange24h >= 0 ? '▲' : '▼'} {Math.abs(inv.priceChange24h).toFixed(2)}% dia
                              </span>
                            )}
                          </div>

                          <div translate="no" className="notranslate text-xs text-slate-400 mt-0.5">
                            {inv.name || 'Ativo Financeiro'} • <strong className="text-slate-300">{qty} cotas</strong>
                            {inv.averagePrice && <span> a PM {formatBRL(inv.averagePrice)}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Cotação Atual B3 & Preço Médio */}
                      <div className="grid grid-cols-2 gap-4 bg-white/[0.03] p-2.5 rounded-xl border border-white/5 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Cotação Atual B3</span>
                          <strong className="text-white text-sm">{formatBRL(currentPrice)}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Provento Estimado</span>
                          <strong className="text-emerald-400">+{formatBRL(expectedMonthYield)}/mês</strong>
                        </div>
                      </div>

                      {/* Right: Total Value, Profit/Loss & Delete */}
                      <div className="flex items-center justify-between md:justify-end gap-5">
                        <div className="text-left md:text-right">
                          <div className="text-sm sm:text-base font-black text-white font-mono">
                            {formatBRL(currentTotal)}
                          </div>
                          <div className={`text-xs font-mono font-semibold ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isPositive ? '+' : ''}{formatBRL(profitLoss)} ({isPositive ? '+' : ''}{profitLossPct.toFixed(2)}%)
                          </div>
                        </div>

                        <button
                          onClick={() => deleteInvestment(inv.id)}
                          className="p-2 rounded-xl hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs transition-colors"
                          title="Excluir Ativo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Busca Inteligente B3 */}
      <B3SearchModal
        isOpen={showB3Search}
        onClose={() => setShowB3Search(false)}
        onSelectAsset={handleSelectB3Asset}
      />

      {/* Modal de Cadastro de Investimento */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-purple-500/40 p-5 sm:p-6 space-y-4 shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base sm:text-lg">Novo Ativo na Carteira</h3>
                  <p className="text-[11px] text-slate-400">Conectado com cotações e dividendos da B3</p>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Search Shortcut Banner */}
            <div
              onClick={() => {
                setShowAddModal(false);
                setShowB3Search(true);
              }}
              className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500/15 to-purple-500/15 border border-cyan-500/30 hover:border-cyan-400 cursor-pointer flex items-center justify-between gap-2 transition-all group"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <Search className="w-4 h-4 text-cyan-400" />
                <span>Pesquisar no catálogo oficial da B3 (preenchimento automático)</span>
              </div>
              <span className="text-xs text-cyan-400 group-hover:translate-x-1 transition-transform">→</span>
            </div>

            <form onSubmit={handleSaveInvestment} className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Ativo</label>
                <select
                  value={type}
                  onChange={(e) => {
                    const t = e.target.value as InvestmentType;
                    setType(t);
                    setYieldPercent(String(ESTIMATED_MONTHLY_YIELD[t] || 0.8));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400"
                >
                  {INVESTMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Código / Ticker na B3
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => handleTickerChange(e.target.value)}
                  placeholder="Ex: MXRF11, PETR4, HGLG11, BBAS3, VALE3"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs font-bold text-white focus:outline-none focus:border-purple-400 font-mono uppercase"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome / Descrição do Ativo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Maxi Renda FII, Petrobras PN..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Quantity and Unit Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quantidade de Cotas</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    placeholder="Ex: 100"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm font-bold text-white focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Preço Pago por Cota (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={unitPrice}
                    onChange={(e) => handleUnitPriceChange(e.target.value)}
                    placeholder="10,00"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm font-bold text-white focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>
              </div>

              {/* Total Amount Calculated */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Valor Total Investido (Custo Total R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm font-black text-emerald-400 focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>

              {/* Dividend Yield % */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rendimento Estimado (% ao mês)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={yieldPercent}
                    onChange={(e) => {
                      setYieldPercent(e.target.value);
                      const y = parseFloat(e.target.value);
                      if (!isNaN(y)) setDividendYieldYearly((y * 12).toFixed(2));
                    }}
                    placeholder="0.85"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Dividend Yield Anual (DY %)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dividendYieldYearly}
                    onChange={(e) => setDividendYieldYearly(e.target.value)}
                    placeholder="10.20"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Cálculo automático de proventos:
                </span>
                <p className="text-slate-400">
                  Ao salvar, este ativo será adicionado à sua carteira e incluído automaticamente no radar "Quando Vai Cair?" com os pagamentos previstos!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-black shadow-lg shadow-purple-500/25 transition-all"
                >
                  Salvar Ativo na Carteira
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Conexão Oficial com a B3 & Importação de Extrato */}
      <B3ConnectionModal
        isOpen={showB3ConnectModal}
        onClose={() => setShowB3ConnectModal(false)}
      />
    </div>
  );
}
