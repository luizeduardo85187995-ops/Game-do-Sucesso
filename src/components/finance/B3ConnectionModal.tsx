import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UploadCloud,
  FileCheck,
  Check,
  ExternalLink,
  Lock,
  ClipboardPaste,
  Trash2,
  Info,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { parseB3File, parseB3Text } from '../../services/b3MarketService';
import { formatBRL } from '../../utils/format';
import { Investment } from '../../types/finance';

interface B3ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function B3ConnectionModal({ isOpen, onClose }: B3ConnectionModalProps) {
  const {
    b3Integration,
    connectB3Account,
    disconnectB3Account,
    importB3PortfolioAssets,
    syncB3InvestorAccount,
    investments,
    clearAllInvestments,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'connect'>('upload');

  // Form states for B3 Account Connection
  const [cpf, setCpf] = useState('');
  const [investorName, setInvestorName] = useState('');
  const [selectedBrokers, setSelectedBrokers] = useState<string[]>(['broker-xp', 'broker-nu']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // File upload state
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<Omit<Investment, 'id'>[] | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Text paste state
  const [pastedText, setPastedText] = useState('');

  if (!isOpen) return null;

  // Format CPF as 000.000.000-00
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (raw.length > 9) {
      raw = raw.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    } else if (raw.length > 6) {
      raw = raw.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
    } else if (raw.length > 3) {
      raw = raw.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
    }
    setCpf(raw);
  };

  const toggleBroker = (brokerId: string) => {
    setSelectedBrokers((prev) =>
      prev.includes(brokerId) ? prev.filter((id) => id !== brokerId) : [...prev, brokerId]
    );
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpf || cpf.length < 11) {
      setUploadError('Por favor informe um CPF válido com 11 dígitos.');
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);

    try {
      await connectB3Account(cpf, investorName, selectedBrokers);
      setSuccessMessage('Perfil de investidor salvo. Para carregar seus ativos reais, faça upload do extrato ou cole seu texto na aba ao lado.');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      setUploadError('Erro ao registrar CPF. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setUploadError(null);
    setParsedPreview(null);

    const result = await parseB3File(file);
    setIsParsingFile(false);

    if (result.success && result.assets.length > 0) {
      setParsedPreview(result.assets);
      setSuccessMessage(result.message);
    } else {
      setUploadError(result.message);
    }
  };

  const handleProcessText = () => {
    if (!pastedText.trim()) {
      setUploadError('Por favor cole o texto com os ativos da B3 ou da sua corretora.');
      return;
    }

    setUploadError(null);
    const result = parseB3Text(pastedText);

    if (result.success && result.assets.length > 0) {
      setParsedPreview(result.assets);
      setSuccessMessage(result.message);
    } else {
      setUploadError(result.message);
    }
  };

  const handleUpdatePreviewQty = (index: number, newQtyStr: string) => {
    if (!parsedPreview) return;
    const copy = [...parsedPreview];
    const item = copy[index];
    if (!item) return;

    const qty = parseInt(newQtyStr, 10);
    if (isNaN(qty) || qty <= 0) return;

    const price = item.averagePrice || item.currentPrice || 10;
    const amount = Number((qty * price).toFixed(2));
    const curVal = Number(((item.currentPrice || price) * qty).toFixed(2));

    copy[index] = {
      ...item,
      quantity: qty,
      amount,
      totalCurrentValue: curVal,
      totalProfitLoss: Number((curVal - amount).toFixed(2)),
    };
    setParsedPreview(copy);
  };

  const handleUpdatePreviewPrice = (index: number, newPriceStr: string) => {
    if (!parsedPreview) return;
    const copy = [...parsedPreview];
    const item = copy[index];
    if (!item) return;

    const price = parseFloat(newPriceStr.replace(',', '.'));
    if (isNaN(price) || price <= 0 || price > 25000) return;

    const qty = item.quantity || 1;
    const amount = Number((qty * price).toFixed(2));
    const curPrice = item.currentPrice || price;
    const curVal = Number((curPrice * qty).toFixed(2));

    copy[index] = {
      ...item,
      averagePrice: price,
      amount,
      totalCurrentValue: curVal,
      totalProfitLoss: Number((curVal - amount).toFixed(2)),
    };
    setParsedPreview(copy);
  };

  const handleRemovePreviewItem = (index: number) => {
    if (!parsedPreview) return;
    setParsedPreview(parsedPreview.filter((_, i) => i !== index));
  };

  const handleConfirmImport = () => {
    if (!parsedPreview || parsedPreview.length === 0) return;
    importB3PortfolioAssets(parsedPreview, replaceExisting);
    setSuccessMessage(`${parsedPreview.length} ativos reais importados para sua carteira com sucesso!`);
    setParsedPreview(null);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleClearFakeData = () => {
    if (confirm('Deseja limpar todos os ativos da carteira para começar com seus dados reais?')) {
      clearAllInvestments();
      setParsedPreview(null);
      setSuccessMessage('Todos os ativos foram removidos da carteira com sucesso. Agora você pode importar seus dados reais!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Importar Dados Reais da B3</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ÁREA DO INVESTIDOR
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Obtenha suas ações, fundos imobiliários e proventos reais direto da Bolsa de Valores
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clear Fake Data Quick Banner if user has items */}
        {investments.length > 0 && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300">
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Sua carteira possui {investments.length} ativos cadastrados.</span>
            </div>
            <button
              onClick={handleClearFakeData}
              className="px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold transition-all flex items-center gap-1.5 shrink-0"
              title="Apagar ativos de teste para começar do zero com seus dados reais"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Ativos de Teste</span>
            </button>
          </div>
        )}

        {/* Feedback Toasts */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {uploadError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Tabs: Upload de Arquivo Real vs Colar Texto vs CPF */}
        <div className="flex gap-2 border-b border-white/10 pb-1 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('upload'); setUploadError(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'upload'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>1. Extrato B3 (Excel ou PDF)</span>
          </button>

          <button
            onClick={() => { setActiveTab('text'); setUploadError(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'text'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>2. Colar Texto / Extrato</span>
          </button>

          <button
            onClick={() => { setActiveTab('connect'); setUploadError(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'connect'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>3. CPF & Corretoras</span>
          </button>
        </div>

        {/* TAB 1: IMPORTAR EXTRATO OFICIAL B3 (RECOMENDADO) */}
        {activeTab === 'upload' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {/* Como baixar na B3 */}
            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  Como baixar o extrato com seus dados 100% reais:
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://www.b3.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1 text-[11px]"
                  >
                    Portal B3 (www.b3.com.br) <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-slate-500">•</span>
                  <a
                    href="https://www.investidor.b3.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1 text-[11px]"
                  >
                    Área do Investidor (com www) <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 pl-1">
                <li>Acesse o portal da Bolsa: <strong>www.b3.com.br</strong> (ou <strong>www.investidor.b3.com.br</strong>) ou o app da sua corretora e entre com sua conta Gov.br.</li>
                <li>No menu superior, vá em <strong>Extratos &gt; Posição</strong> ou <strong>Negociação</strong>.</li>
                <li>Clique em <strong>Exportar em Excel (.xlsx)</strong> ou baixe o extrato/nota em <strong>PDF</strong>.</li>
                <li>Envie o arquivo baixado (.xlsx, .csv ou .pdf) no campo abaixo para carregar exatamente suas ações, FIIs e valores reais.</li>
              </ol>
            </div>

            {/* Upload Zone */}
            <div className="p-6 rounded-2xl border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 bg-white/[0.02] hover:bg-white/[0.04] transition-all text-center relative group">
              <input
                type="file"
                accept=".xlsx,.csv,.pdf"
                onChange={handleFileUpload}
                disabled={isParsingFile}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-10 h-10 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-white mb-0.5">
                {isParsingFile ? 'Lendo e identificando ativos reais no arquivo...' : 'Arraste ou clique para selecionar seu arquivo da B3 (.xlsx, .csv ou .pdf)'}
              </div>
              <p className="text-[11px] text-slate-400">
                Suporta planilhas B3 com múltiplas abas (Ações, FIIs, Tesouro) e extratos/notas de corretagem em PDF
              </p>
            </div>

            {/* Preview of Parsed Assets */}
            {parsedPreview && parsedPreview.length > 0 && (
              <div className="p-4 rounded-2xl bg-white/5 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      {parsedPreview.length} ativos reais reconhecidos
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Total Carteira: {formatBRL(parsedPreview.reduce((sum, a) => sum + a.amount, 0))}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  Confira as quantidades e preços médios abaixo. Você pode ajustar qualquer valor diretamente antes de salvar:
                </p>

                {/* Table Preview with editing */}
                <div className="max-h-56 overflow-y-auto divide-y divide-white/5 pr-1 custom-scrollbar text-xs">
                  {parsedPreview.map((item, idx) => (
                    <div
                      key={item.code + '-' + idx}
                      className="py-2.5 flex flex-wrap items-center justify-between gap-2 font-mono"
                    >
                      <div className="flex items-center gap-2.5 min-w-[140px]">
                        <span
                          translate="no"
                          className="notranslate px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs"
                        >
                          {item.code}
                        </span>
                        <div className="truncate max-w-[160px] text-left">
                          <span translate="no" className="notranslate text-xs text-white block truncate">
                            {item.name || item.code}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase">
                            {item.type === 'stock' ? 'AÇÃO' : item.type === 'fii' ? 'FII' : item.type.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Inputs for Qty & Price */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                          <span className="text-[10px] text-slate-400">Qtd:</span>
                          <input
                            type="number"
                            min="1"
                            max="500000"
                            value={item.quantity || 1}
                            onChange={(e) => handleUpdatePreviewQty(idx, e.target.value)}
                            className="w-14 bg-transparent text-white font-mono text-xs focus:outline-none text-right"
                          />
                        </div>

                        <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                          <span className="text-[10px] text-slate-400">PM R$:</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="25000"
                            value={item.averagePrice || 0}
                            onChange={(e) => handleUpdatePreviewPrice(idx, e.target.value)}
                            className="w-16 bg-transparent text-cyan-300 font-mono text-xs focus:outline-none text-right font-bold"
                          />
                        </div>

                        <div className="w-24 text-right">
                          <span className="text-white text-xs font-bold block">
                            {formatBRL(item.amount)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePreviewItem(idx)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Remover este ativo da importação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Options and Confirm */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="rounded bg-slate-800 border-white/20 text-cyan-400"
                    />
                    <span>Substituir carteira atual (limpar anteriores)</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setParsedPreview(null)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Gravar Ativos na Carteira</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COLAR TEXTO / TABELA DA CORRETORA OU DA B3 */}
        {activeTab === 'text' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">Colar Lista de Ativos</h4>
              <p className="text-xs text-slate-400">
                Copie a tabela da sua corretora (XP, Nubank, Inter, BTG, Clear) ou da B3 e cole aqui.
                Você também pode digitar linha por linha no formato: <strong>TICKER QUANTIDADE PREÇO</strong>
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                rows={6}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`Exemplo de linhas que você pode colar:\nMXRF11 150 10.12\nPETR4 100 37.80\nHGLG11 10 161.40\nBBAS3 50 28.40`}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
              />

              <button
                type="button"
                onClick={handleProcessText}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>Processar e Identificar Ativos</span>
              </button>
            </div>

            {/* Preview of Parsed Assets from Text */}
            {parsedPreview && parsedPreview.length > 0 && (
              <div className="p-4 rounded-2xl bg-white/5 border border-cyan-500/30 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      {parsedPreview.length} ativos reconhecidos
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Total: {formatBRL(parsedPreview.reduce((sum, a) => sum + a.amount, 0))}
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-white/5 pr-1 custom-scrollbar text-xs">
                  {parsedPreview.map((item, idx) => (
                    <div
                      key={item.code + '-txt-' + idx}
                      className="py-2.5 flex flex-wrap items-center justify-between gap-2 font-mono"
                    >
                      <div className="flex items-center gap-2.5 min-w-[140px]">
                        <span
                          translate="no"
                          className="notranslate px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs"
                        >
                          {item.code}
                        </span>
                        <div className="truncate max-w-[160px] text-left">
                          <span translate="no" className="notranslate text-xs text-white block truncate">
                            {item.name || item.code}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                          <span className="text-[10px] text-slate-400">Qtd:</span>
                          <input
                            type="number"
                            min="1"
                            max="500000"
                            value={item.quantity || 1}
                            onChange={(e) => handleUpdatePreviewQty(idx, e.target.value)}
                            className="w-14 bg-transparent text-white font-mono text-xs focus:outline-none text-right"
                          />
                        </div>

                        <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                          <span className="text-[10px] text-slate-400">PM R$:</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="25000"
                            value={item.averagePrice || 0}
                            onChange={(e) => handleUpdatePreviewPrice(idx, e.target.value)}
                            className="w-16 bg-transparent text-cyan-300 font-mono text-xs focus:outline-none text-right font-bold"
                          />
                        </div>

                        <div className="w-24 text-right">
                          <span className="text-white text-xs font-bold block">
                            {formatBRL(item.amount)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePreviewItem(idx)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Remover este ativo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="rounded bg-slate-800 border-white/20 text-cyan-400"
                    />
                    <span>Substituir carteira atual</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setParsedPreview(null)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Gravar Ativos na Carteira</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CPF & CORRETORAS */}
        {activeTab === 'connect' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {b3Integration.isConnected ? (
              <div className="space-y-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white">
                          Perfil de investidor cadastrado
                        </div>
                        <div className="text-xs text-emerald-400 font-mono">
                          CPF: {b3Integration.connectedCpf} • {b3Integration.investorName}
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                      CONFIGURADO
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sua conta está configurada para atualização contínua de cotações e cálculo do radar de dividendos.
                  </p>

                  <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <button
                      onClick={() => syncB3InvestorAccount()}
                      disabled={b3Integration.syncStatus === 'syncing'}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${b3Integration.syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                      <span>Atualizar Cotações</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleClearFakeData}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all"
                      >
                        Limpar Carteira
                      </button>

                      <button
                        onClick={() => disconnectB3Account()}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all"
                      >
                        Desconectar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Corretoras Cadastradas */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    // Suas Corretoras Cadastradas
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {b3Integration.linkedBrokers.map((broker) => (
                      <div
                        key={broker.id}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          broker.connected
                            ? 'bg-white/5 border-emerald-500/30'
                            : 'bg-white/[0.02] border-white/5 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Building2 className={`w-4 h-4 ${broker.connected ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <span className="text-xs font-bold text-white">{broker.name}</span>
                        </div>
                        {broker.connected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="space-y-4">
                <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-slate-300 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-cyan-300">
                    <Lock className="w-4 h-4 text-cyan-400" />
                    <span>Registro do CPF do Investidor</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    A B3 protege seus dados de custódia com certificado digital e Gov.br. Ao registrar seu CPF aqui, você vincula suas corretoras e habilita o radar de dividendos automático.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      CPF do Titular da Conta B3
                    </label>
                    <input
                      type="text"
                      required
                      value={cpf}
                      onChange={handleCpfChange}
                      placeholder="000.000.000-00"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nome do Titular
                    </label>
                    <input
                      type="text"
                      value={investorName}
                      onChange={(e) => setInvestorName(e.target.value)}
                      placeholder="Ex: Luiz Eduardo"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Corretoras onde você investe
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {b3Integration.linkedBrokers.map((broker) => {
                      const isSelected = selectedBrokers.includes(broker.id);
                      return (
                        <div
                          key={broker.id}
                          onClick={() => toggleBroker(broker.id)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs font-bold ${
                            isSelected
                              ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{broker.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Dados de Conexão B3</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Dados processados com segurança local no seu navegador
          </span>

          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-lg hover:bg-white/5"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
