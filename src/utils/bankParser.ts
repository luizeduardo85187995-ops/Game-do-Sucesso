import { ParsedTransaction } from '../types/finance';

function extractAmount(text: string): number | null {
  const patterns = [
    /R\$\s*([\d.,]+)/i,
    /valor[:\s]+R?\$?\s*([\d.,]+)/i,
    /de\s+R?\$?\s*([\d.,]+)/i,
    /([\d]{1,3}(?:\.[\d]{3})*,\d{2})/,
  ];

  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      const raw = m[1].trim();
      const normalized = raw.replace(/\./g, '').replace(',', '.');
      const n = parseFloat(normalized);
      if (!isNaN(n) && n > 0 && n < 1_000_000) return n;
    }
  }
  return null;
}

function detectBank(text: string): string | undefined {
  const lower = text.toLowerCase();
  const banks: [string, string][] = [
    ['nubank', 'Nubank'],
    ['nu ', 'Nubank'],
    ['itaú', 'Itaú'],
    ['itau', 'Itaú'],
    ['bradesco', 'Bradesco'],
    ['santander', 'Santander'],
    ['banco do brasil', 'Banco do Brasil'],
    ['bb ', 'Banco do Brasil'],
    ['caixa', 'Caixa'],
    ['c6', 'C6 Bank'],
    ['inter', 'Banco Inter'],
    ['picpay', 'PicPay'],
    ['mercado pago', 'Mercado Pago'],
    ['xp', 'XP Investimentos'],
    ['btg', 'BTG Pactual'],
    ['neon', 'Neon'],
  ];

  for (const [key, name] of banks) {
    if (lower.includes(key)) return name;
  }
  return undefined;
}

function detectCategory(text: string, type: 'income' | 'expense'): string {
  const lower = text.toLowerCase();

  if (type === 'income') {
    if (lower.includes('salário') || lower.includes('folha') || lower.includes('pagamento')) return 'Salário';
    if (lower.includes('rendimento') || lower.includes('dividendo') || lower.includes('juros')) return 'Investimentos';
    if (lower.includes('freelance') || lower.includes('serviço')) return 'Freelance';
    return 'Outros';
  }

  // Expenses
  if (lower.includes('ifood') || lower.includes('mercado') || lower.includes('supermercado') || lower.includes('padaria') || lower.includes('açougue') || lower.includes('restaurante')) return 'Mercado';
  if (lower.includes('uber') || lower.includes('99') || lower.includes('combustível') || lower.includes('posto') || lower.includes('gasolina') || lower.includes('estacionamento')) return 'Transporte';
  if (lower.includes('aluguel') || lower.includes('condomínio') || lower.includes('luz') || lower.includes('energia') || lower.includes('água') || lower.includes('internet') || lower.includes('enel')) return 'Moradia';
  if (lower.includes('farmácia') || lower.includes('drogaria') || lower.includes('consulta') || lower.includes('médico') || lower.includes('dentista') || lower.includes('hospital')) return 'Saúde';
  if (lower.includes('netflix') || lower.includes('spotify') || lower.includes('prime') || lower.includes('assinatura') || lower.includes('youtube')) return 'Assinaturas';
  if (lower.includes('cinema') || lower.includes('show') || lower.includes('bar') || lower.includes('festa') || lower.includes('viagem')) return 'Lazer';
  if (lower.includes('curso') || lower.includes('faculdade') || lower.includes('livro') || lower.includes('escola')) return 'Educação';
  if (lower.includes('investimento') || lower.includes('cdb') || lower.includes('fii') || lower.includes('tesouro')) return 'Investimentos';

  return 'Outros';
}

export function parseBankNotification(text: string): ParsedTransaction | null {
  if (!text || text.trim().length < 5) return null;

  const amount = extractAmount(text);
  if (!amount) return null;

  const lower = text.toLowerCase();
  const bank = detectBank(text);

  let type: 'income' | 'expense' = 'expense';
  let note = 'Notificação bancária';

  // Income keywords
  const isIncome =
    lower.includes('recebeu') ||
    lower.includes('recebido') ||
    lower.includes('transferência recebida') ||
    lower.includes('pix recebido') ||
    lower.includes('você recebeu') ||
    lower.includes('depósito recebido') ||
    lower.includes('salário depositado');

  if (isIncome) {
    type = 'income';
    note = bank ? `Recebido via ${bank}` : 'Pix / Transferência Recebida';
  } else {
    type = 'expense';
    // Look for merchant name
    const compraMatch = text.match(/compra(?: no| aprovada no| no cartão)?\s+([A-Za-z0-9\s.]+?)(?:\s+de\s+R|\s+valor|\.|$)/i);
    if (compraMatch && compraMatch[1]) {
      note = compraMatch[1].trim();
    } else if (lower.includes('pix enviado') || lower.includes('transferência enviada')) {
      note = bank ? `Pix enviado via ${bank}` : 'Pix enviado';
    } else {
      note = bank ? `Despesa via ${bank}` : 'Compra / Pagamento';
    }
  }

  const category = detectCategory(text, type);

  return {
    type,
    amount,
    note,
    category,
    bank,
    confidence: bank && amount ? 'high' : 'medium',
  };
}
