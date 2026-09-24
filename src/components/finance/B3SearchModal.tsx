import React, { useState, useMemo } from 'react';
import { Search, X, TrendingUp, TrendingDown, Check, Building2, Coins, Sparkles, Filter } from 'lucide-react';
import { B3AssetQuote, InvestmentType } from '../../types/finance';
import { B3_CATALOG, searchB3Catalog } from '../../services/b3MarketService';
import { formatBRL } from '../../utils/format';

interface B3SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset: (asset: B3AssetQuote) => void;
}

export default function B3SearchModal({ isOpen, onClose, onSelectAsset }: B3SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<InvestmentType | 'all'>('all');

  const filteredAssets = useMemo(() => {
    let results = searchB3Catalog(searchTerm);
    if (selectedType !== 'all') {
      results = results.filter((a) => a.type === selectedType);
    }
    return results;
  }, [searchTerm, selectedType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Buscar Ativo na Bolsa B3</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  B3 AO VIVO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ações, FIIs com dividendos, ETFs e Renda Fixa com cotações e proventos atualizados
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

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite o código (ex: MXRF11, PETR4, HGLG11, BBAS3, VALE3)..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 border border-white/15 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pb-1">
          {[
            { id: 'all', label: 'Todos os Ativos' },
            { id: 'fii', label: 'FIIs (Fundos Imobiliários)' },
            { id: 'stock', label: 'Ações B3' },
            { id: 'etf', label: 'ETFs' },
            { id: 'treasury', label: 'Tesouro Direto' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedType === tab.id
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 shadow-sm shadow-cyan-500/20'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Assets List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-300">Nenhum ativo encontrado para "{searchTerm}"</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Você pode digitar qualquer código B3 válido (ex: {searchTerm.toUpperCase() || 'ITUB4'}) e cadastrá-lo mesmo assim!
              </p>
              {searchTerm && (
                <button
                  onClick={() => {
                    const clean = searchTerm.trim().toUpperCase();
                    const isFii = clean.endsWith('11');
                    onSelectAsset({
                      ticker: clean,
                      name: clean,
                      type: isFii ? 'fii' : 'stock',
                      price: 25.00,
                      changePercent: 0,
                      dividendYield: isFii ? 10.5 : 7.0,
                      pvp: 1.0,
                      sector: 'Mercado de Capitais B3',
                      lastUpdate: new Date().toISOString(),
                    });
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30"
                >
                  Usar "{searchTerm.toUpperCase()}" como ativo personalizado
                </button>
              )}
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const isPositive = asset.changePercent >= 0;

              return (
                <div
                  key={asset.ticker}
                  onClick={() => {
                    onSelectAsset(asset);
                    onClose();
                  }}
                  className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                      asset.type === 'fii'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : asset.type === 'stock'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {asset.ticker.slice(0, 4)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm group-hover:text-cyan-300 transition-colors">
                          {asset.ticker}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                          {asset.type.toUpperCase()}
                        </span>
                        {asset.dividendYield > 8 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                            <Coins className="w-2.5 h-2.5" />
                            DY {asset.dividendYield.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        {asset.name} • <span className="text-slate-500">{asset.sector}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-white font-mono">
                      {formatBRL(asset.price)}
                    </div>
                    <div className={`text-xs font-mono font-semibold flex items-center justify-end gap-1 ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Dados alinhados com cotações B3 e histórico de proventos
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
