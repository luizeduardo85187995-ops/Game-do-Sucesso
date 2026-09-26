import { InvestmentFocus, InvestmentType, MarketIndicator } from '../types/finance';

export const DEFAULT_INCOME_CATEGORIES = [
  'Salário',
  'Freelance',
  'Bônus',
  'Investimentos',
  'Outros',
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Mercado',
  'Moradia',
  'Transporte',
  'Lazer',
  'Saúde',
  'Educação',
  'Assinaturas',
  'Investimentos',
  'Outros',
];

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; emoji: string }> = {
  Salário: { bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-400', emoji: '💼' },
  Freelance: { bg: 'bg-teal-500/20 border-teal-500/40', text: 'text-teal-400', emoji: '💻' },
  Bônus: { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-400', emoji: '🎁' },
  Investimentos: { bg: 'bg-purple-500/20 border-purple-500/40', text: 'text-purple-400', emoji: '📈' },
  Mercado: { bg: 'bg-orange-500/20 border-orange-500/40', text: 'text-orange-400', emoji: '🛒' },
  Moradia: { bg: 'bg-blue-500/20 border-blue-500/40', text: 'text-blue-400', emoji: '🏠' },
  Transporte: { bg: 'bg-cyan-500/20 border-cyan-500/40', text: 'text-cyan-400', emoji: '🚗' },
  Lazer: { bg: 'bg-pink-500/20 border-pink-500/40', text: 'text-pink-400', emoji: '🎉' },
  Saúde: { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-400', emoji: '🏥' },
  Educação: { bg: 'bg-indigo-500/20 border-indigo-500/40', text: 'text-indigo-400', emoji: '📚' },
  Assinaturas: { bg: 'bg-violet-500/20 border-violet-500/40', text: 'text-violet-400', emoji: '📱' },
  Outros: { bg: 'bg-slate-500/20 border-slate-500/40', text: 'text-slate-400', emoji: '🏷️' },
};

export const EXPENSE_CATEGORY_ICONS = [
  '🛒', '🏠', '🚗', '🍔', '💊', '🎓', '🎬', '✈️', '⚡', '💧',
  '📱', '💻', '🏋️', '🐶', '👔', '💈', '☕', '👶', '🔧', '⛽',
  '🍕', '🏥', '🏖️', '🚌', '🛍️', '📦', '🧹', '🛡️', '🎮', '🏷️',
  '🍽️', '🚴', '🐾', '💄', '📚', '🎂', '🍻', '🍿', '🚕', '🩺'
];

export const INCOME_CATEGORY_ICONS = [
  '💼', '💻', '🎁', '📈', '💰', '🏦', '🪙', '💵', '💳', '🏆',
  '🏢', '🏪', '🤝', '💎', '🎯', '🚀', '⭐', '📦', '🏷️', '✨',
  '🛍️', '🏡', '🔑', '📊', '🥇', '💸', '🤑', '💶', '💷', '💡'
];

export function getCategoryMeta(
  categoryName: string,
  customIcons?: Record<string, string>
): { bg: string; text: string; emoji: string } {
  const customEmoji = customIcons?.[categoryName];
  const base = CATEGORY_COLORS[categoryName];

  if (base) {
    if (customEmoji) {
      return { ...base, emoji: customEmoji };
    }
    return base;
  }

  return {
    bg: 'bg-cyan-500/20 border-cyan-500/40',
    text: 'text-cyan-400',
    emoji: customEmoji || '🏷️',
  };
}

export const INVESTMENT_TYPES: { value: InvestmentType; label: string }[] = [
  { value: 'fii', label: 'FII (Fundo Imobiliário)' },
  { value: 'etf', label: 'ETF' },
  { value: 'stock', label: 'Ação' },
  { value: 'cdb', label: 'CDB' },
  { value: 'treasury', label: 'Tesouro Direto' },
];

export const ESTIMATED_MONTHLY_YIELD: Record<InvestmentType, number> = {
  fii: 0.85,     // ~0.85% ao mês em dividendos isentos
  etf: 0.60,     // ~0.60% ao mês
  stock: 0.50,   // ~0.50% ao mês em dividendos
  cdb: 0.90,     // ~0.90% ao mês (100% CDI)
  treasury: 0.85,// ~0.85% ao mês (Selic)
};

export const INVESTMENT_FOCUS: { value: InvestmentFocus; label: string }[] = [
  { value: 'income', label: 'Gerar renda mensal' },
  { value: 'reserve', label: 'Reserva com segurança' },
  { value: 'growth', label: 'Crescimento longo prazo' },
  { value: 'diversification', label: 'Diversificar carteira' },
];

export const INVESTMENT_IDEAS: Record<
  InvestmentFocus,
  { code: string; type: InvestmentType; name: string; reason: string }[]
> = {
  income: [
    { code: 'XPML11', type: 'fii', name: 'FII de Shopping Centers', reason: 'Distribui rendimentos mensais isentos de IR com shoppings de alta qualidade.' },
    { code: 'KNCR11', type: 'fii', name: 'Kinea Rendimentos (CRI)', reason: 'Renda mensal atrelada à taxa Selic/CDI, grande estabilidade.' },
    { code: 'BBAS3', type: 'stock', name: 'Banco do Brasil', reason: 'Histórico consistente de dividendos robustos e payout atrativo.' },
  ],
  reserve: [
    { code: 'TESOURO SELIC 2029', type: 'treasury', name: 'Tesouro Selic', reason: 'Risco soberano com liquidez diária, ideal para reserva de emergência.' },
    { code: 'CDB 100% CDI', type: 'cdb', name: 'CDB Liquidez Diária', reason: 'Garantido pelo FGC até R$ 250 mil com rendimento diário.' },
  ],
  growth: [
    { code: 'BOVA11', type: 'etf', name: 'ETF do Ibovespa', reason: 'Exposição ampla às maiores empresas da bolsa brasileira.' },
    { code: 'IVVB11', type: 'etf', name: 'ETF do S&P 500 em R$', reason: 'Acesso às 500 maiores companhias dos EUA dolarizadas.' },
  ],
  diversification: [
    { code: 'HGLG11', type: 'fii', name: 'CSHG Logística', reason: 'Galpões logísticos premium em regiões estratégicas.' },
    { code: 'TESOURO IPCA+ 2035', type: 'treasury', name: 'Tesouro IPCA+', reason: 'Garante rendimento real acima da inflação no longo prazo.' },
  ],
};

export const DEFAULT_MARKET_INDICATORS: MarketIndicator[] = [
  { id: 'selic', label: 'Taxa Selic', value: 10.75, suffix: '% a.a.', source: 'Banco Central do Brasil', note: 'Meta Copom' },
  { id: 'cdi', label: 'Taxa CDI', value: 10.65, suffix: '% a.a.', source: 'B3', note: 'Benchmark Renda Fixa' },
  { id: 'ipca', label: 'IPCA 12m', value: 4.42, suffix: '% a.a.', source: 'IBGE', note: 'Inflação oficial' },
  { id: 'ibov', label: 'Ibovespa', value: 132450, suffix: 'pts', source: 'B3', note: 'Principal índice acionário' },
];
