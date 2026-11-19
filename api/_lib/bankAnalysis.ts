import type { BankSnapshot, BankStatementEntry, BankTxAnnotation, ConnectedAccount } from '../../src/types/openFinance.js';

/** Must match INTERNAL_TRANSFER_CATEGORY in src/types/openFinance.ts (value import avoided across api/src at runtime). */
export const INTERNAL_TRANSFER = 'Transferência entre minhas contas';

export type FlowKind = 'income' | 'expense' | 'internal' | 'refund';

export interface ClassifiedTx extends BankStatementEntry {
  key: string;
  value: number;
  kind: FlowKind;
  category: string;
  categorySource: 'usuario' | 'banco' | 'nenhuma';
  note: string | null;
  accountLabel: string;
  accountType: 'BANK' | 'CREDIT';
}

// Pluggy categories arrive in English. Only the common ones are translated; unknown values pass through.
const PROVIDER_CATEGORY_PT: Record<string, string> = {
  groceries: 'Mercado', supermarkets: 'Mercado', 'eating out': 'Alimentação fora', restaurants: 'Alimentação fora',
  'food delivery': 'Delivery', 'transportation': 'Transporte', 'taxi and ride-hailing': 'Transporte (apps)',
  'gas stations': 'Combustível', parking: 'Estacionamento', 'public transportation': 'Transporte público',
  rent: 'Moradia', housing: 'Moradia', 'utilities': 'Contas da casa', electricity: 'Energia', water: 'Água',
  'internet': 'Internet', 'telecommunications': 'Telefone/Internet', 'mobile': 'Celular',
  'health': 'Saúde', pharmacy: 'Farmácia', 'healthcare': 'Saúde', 'education': 'Educação',
  'entertainment': 'Lazer', 'leisure': 'Lazer', 'video streaming': 'Streaming', 'music streaming': 'Streaming',
  'online shopping': 'Compras online', shopping: 'Compras', clothing: 'Roupas', 'digital services': 'Serviços digitais',
  'loans': 'Empréstimos/Financiamento', 'loan payment': 'Empréstimos/Financiamento', 'interests charged': 'Juros',
  'bank fees': 'Tarifas bancárias', 'taxes': 'Impostos', 'insurance': 'Seguros', 'gyms and fitness centers': 'Academia',
  'betting': 'Apostas', 'lottery': 'Apostas', 'gambling': 'Apostas', 'salary': 'Salário', 'income': 'Receita',
  'transfers': 'Transferência', 'transfer - pix': 'Pix', 'transfer - ted': 'TED', 'credit card payment': 'Pagamento de fatura',
  'investments': 'Investimentos', 'automatic investment': 'Investimentos', 'same person transfer': INTERNAL_TRANSFER,
  'same person transfer - pix': INTERNAL_TRANSFER, 'same person transfer - ted': INTERNAL_TRANSFER,
};

const INTERNAL_PATTERN = /(same person|mesma titularidade|entre contas|pagamento de fatura|credit card payment|pagamento da fatura|aplica[cç][aã]o|resgate|\brdb\b|\bcdb\b|caixinha|automatic investment|investment)/i;

export function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Text from the bank is untrusted: strip characters that could break the prompt's data block. */
export function promptSafe(text: string | null | undefined, max = 70): string {
  return (text ?? '').replace(/[\u0000-\u001f<>|`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function translateProvider(category: string | null | undefined): string | null {
  if (!category) return null;
  return PROVIDER_CATEGORY_PT[category.toLowerCase().trim()] ?? category;
}

/** MeuPluggy is a proxy connector: the real bank is the account's own name (e.g. "Nu Pagamentos S.A."). */
export function institutionOf(account: Pick<ConnectedAccount, 'institution' | 'name'>): string {
  return /meu\s*pluggy/i.test(account.institution) && account.name ? account.name : account.institution;
}

export function classify(
  tx: BankStatementEntry,
  account: Pick<ConnectedAccount, 'type' | 'name' | 'institution'> | undefined,
  annotation: BankTxAnnotation | undefined,
): ClassifiedTx {
  const accountType = account?.type ?? 'BANK';
  const userCategory = annotation?.category?.trim() || null;
  const provider = translateProvider(tx.providerCategory);
  const category = userCategory ?? provider ?? 'Sem categoria';
  const haystack = `${tx.providerCategory ?? ''} ${tx.description}`;
  let kind: FlowKind;
  if (userCategory === INTERNAL_TRANSFER || (!userCategory && INTERNAL_PATTERN.test(haystack))) kind = 'internal';
  else if (accountType === 'CREDIT') {
    // On a card, credits are bill payments (internal) or refunds; debits are purchases.
    kind = tx.direction === 'DEBIT' ? 'expense' : /estorno|reembolso|refund|cancel/i.test(haystack) ? 'refund' : 'internal';
  } else kind = tx.direction === 'CREDIT' ? 'income' : 'expense';
  return {
    ...tx,
    key: `${tx.accountId}:${tx.id}`,
    value: Math.abs(tx.amount),
    kind,
    category,
    categorySource: userCategory ? 'usuario' : provider ? 'banco' : 'nenhuma',
    note: annotation?.note?.trim() || null,
    accountLabel: account ? `${promptSafe(institutionOf(account), 30)} ${account.type === 'CREDIT' ? 'cartão' : 'conta'}` : 'Conta',
    accountType,
  };
}

/** Merges monthly snapshots, deduplicating by account+id (the newest snapshot wins). */
export function mergeSnapshots(snapshots: BankSnapshot[], annotations: Record<string, BankTxAnnotation>): { txs: ClassifiedTx[]; accounts: ConnectedAccount[] } {
  const ordered = [...snapshots].sort((a, b) => a.fetchedAt.localeCompare(b.fetchedAt));
  const accounts = new Map<string, ConnectedAccount>();
  const txs = new Map<string, ClassifiedTx>();
  for (const snap of ordered) {
    for (const acc of snap.accounts) accounts.set(acc.id, acc);
    for (const tx of snap.transactions) {
      const c = classify(tx, accounts.get(tx.accountId) ?? snap.accounts.find(a => a.id === tx.accountId), annotations[`${tx.accountId}:${tx.id}`]);
      txs.set(c.key, c);
    }
  }
  return { txs: [...txs.values()].sort((a, b) => b.date.localeCompare(a.date)), accounts: [...accounts.values()] };
}

const brl = (v: number): string => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

function sumBy<K>(rows: ClassifiedTx[], keyOf: (t: ClassifiedTx) => K | null): Map<K, { total: number; count: number }> {
  const map = new Map<K, { total: number; count: number }>();
  for (const t of rows) {
    const k = keyOf(t);
    if (k === null) continue;
    const cur = map.get(k) ?? { total: 0, count: 0 };
    cur.total += t.value; cur.count += 1;
    map.set(k, cur);
  }
  return map;
}

const top = <K>(map: Map<K, { total: number; count: number }>, n: number) => [...map.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, n);
const isPix = (t: ClassifiedTx) => t.operation === 'PIX' || /\bpix\b/i.test(t.description);
/** Nubank often embeds the counterparty after a pipe: "Transferência Recebida|Fulano de Tal". */
export function counterpartyOf(t: Pick<BankStatementEntry, 'counterparty' | 'description'>): string {
  if (t.counterparty) return t.counterparty;
  const piped = t.description.split('|').slice(1).join(' ').trim();
  return piped || t.description;
}
const who = (t: ClassifiedTx) => promptSafe(counterpartyOf(t), 50);
const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/**
 * Deterministic financial X-ray. All arithmetic happens here so the language model only interprets numbers.
 * Returns plain text meant to live inside a delimited data block of the system prompt.
 */
export type AnalysisDetail = 'full' | 'summary';

/** ~1.700 tokens (pt-BR tokenizes at ~2.5 chars/token): keeps Dante's prompt well under the provider's 7k input-tokens/min. */
export const MAX_ANALYSIS_CHARS = 4200;

export function buildBankAnalysis(
  snapshots: BankSnapshot[],
  annotations: Record<string, BankTxAnnotation>,
  missingMonths: string[] = [],
  detail: AnalysisDetail = 'full',
  maxChars = MAX_ANALYSIS_CHARS,
): string {
  if (snapshots.length === 0) return 'Nenhum extrato bancário consultado ainda.';
  const full = detail === 'full';
  const n = (fullCount: number, summaryCount: number) => (full ? fullCount : summaryCount);
  const { txs, accounts } = mergeSnapshots(snapshots, annotations);
  const months = [...new Set(txs.map(t => t.date.slice(0, 7)))].sort();
  const expenses = txs.filter(t => t.kind === 'expense');
  const pixOut = expenses.filter(isPix);
  // Sections are listed by priority and only ever included whole, so the budget never cuts one in half.
  const sections: string[][] = [];

  const accountsSection = ['CONTAS CONECTADAS (saldo da última coleta do banco)'];
  for (const a of accounts) accountsSection.push(`- ${promptSafe(institutionOf(a), 40)} ${a.type === 'CREDIT' ? 'cartão (fatura/uso)' : 'conta'}: ${brl(a.balance)}${a.updatedAt ? ` | coleta ${a.updatedAt.slice(0, 10)}` : ''}`);
  if (missingMonths.length) accountsSection.push(`- Meses sem extrato consultado: ${missingMonths.join(', ')} (não conclua nada sobre eles).`);
  sections.push(accountsSection);

  const monthly = ['RESUMO MENSAL (aplicações, resgates, fatura e transferências entre contas próprias NÃO são entrada nem saída; aparecem à parte)'];
  for (const m of months) {
    const rows = txs.filter(t => t.date.startsWith(m));
    const sumKind = (k: FlowKind) => rows.filter(t => t.kind === k).reduce((s, t) => s + t.value, 0);
    const inc = sumKind('income');
    const exp = sumKind('expense') - sumKind('refund');
    const card = rows.filter(t => t.kind === 'expense' && t.accountType === 'CREDIT').reduce((s, t) => s + t.value, 0);
    const internal = rows.filter(t => t.kind === 'internal');
    const parked = internal.filter(t => t.accountType === 'BANK' && t.direction === 'DEBIT').reduce((s, t) => s + t.value, 0);
    const back = internal.filter(t => t.accountType === 'BANK' && t.direction === 'CREDIT').reduce((s, t) => s + t.value, 0);
    monthly.push(`- ${m}: entradas ${brl(inc)} | saídas ${brl(exp)} (cartão ${brl(card)}) | resultado ${brl(inc - exp)} | guardado/enviado a investimentos, fatura ou contas próprias ${brl(parked)} | voltou de investimentos/contas próprias ${brl(back)} | ${rows.length} movimentações`);
  }
  sections.push(monthly);

  const unexplained = pixOut.filter(t => t.categorySource !== 'usuario' && !t.note).sort((a, b) => b.value - a.value).slice(0, n(8, 5));
  const unexplainedSection = ['PIX ENVIADOS SEM EXPLICAÇÃO DO USUÁRIO (candidatos a perguntar)'];
  for (const t of unexplained) unexplainedSection.push(`- ${t.date} | ${brl(t.value)} | para ${who(t)}`);
  if (!unexplained.length) unexplainedSection.push('- Todos os Pix enviados já têm categoria ou nota do usuário.');
  sections.push(unexplainedSection);

  const categorySection = ['DESPESAS POR CATEGORIA (categoria do usuário tem prioridade sobre a do banco)'];
  for (const [cat, v] of top(sumBy(expenses, t => t.category), n(10, 6))) categorySection.push(`- ${promptSafe(cat, 40)}: ${brl(v.total)} em ${v.count}x`);
  const uncategorized = expenses.filter(t => t.categorySource === 'nenhuma');
  if (uncategorized.length) categorySection.push(`- Sem categoria: ${uncategorized.length} saídas, ${brl(uncategorized.reduce((s, t) => s + t.value, 0))}`);
  sections.push(categorySection);

  const pixSection = [`PIX ENVIADOS POR DESTINATÁRIO (total ${brl(pixOut.reduce((s, t) => s + t.value, 0))} em ${pixOut.length} Pix)`];
  for (const [name, v] of top(sumBy(pixOut, who), n(10, 5))) pixSection.push(`- ${name}: ${brl(v.total)} em ${v.count}x`);
  sections.push(pixSection);

  if (full) {
    // Recurring: same counterparty/description in 2+ distinct months, or 3+ times overall.
    const groups = new Map<string, ClassifiedTx[]>();
    for (const t of expenses) {
      const k = normalize(counterpartyOf(t)).slice(0, 40);
      if (k.length >= 3) groups.set(k, [...(groups.get(k) ?? []), t]);
    }
    const recurring = [...groups.values()]
      .filter(g => new Set(g.map(t => t.date.slice(0, 7))).size >= 2 || g.length >= 3)
      .map(g => ({ name: who(g[0]), count: g.length, total: g.reduce((s, t) => s + t.value, 0), months: new Set(g.map(t => t.date.slice(0, 7))).size }))
      .sort((a, b) => b.total - a.total).slice(0, 8);
    const recurringSection = ['GASTOS RECORRENTES (contas fixas, assinaturas ou hábitos)'];
    for (const r of recurring) recurringSection.push(`- ${r.name}: ${r.count}x em ${r.months} mês(es), média ${brl(r.total / r.count)}, total ${brl(r.total)}`);
    if (!recurring.length) recurringSection.push('- Nenhuma recorrência clara no período.');
    sections.push(recurringSection);

    const installments = new Map<string, ClassifiedTx>();
    for (const t of expenses.filter(t => t.installment)) {
      const k = `${normalize(t.description).replace(/\d+\s*\/\s*\d+/g, '').slice(0, 30)}:${t.installment!.total}`;
      const prev = installments.get(k);
      if (!prev || prev.installment!.number < t.installment!.number) installments.set(k, t);
    }
    if (installments.size) {
      const instSection = ['PARCELAMENTOS NO CARTÃO (parcela mais recente vista)'];
      for (const t of [...installments.values()].sort((a, b) => b.value - a.value).slice(0, 6)) {
        const left = t.installment!.total - t.installment!.number;
        instSection.push(`- ${who(t)}: parcela ${t.installment!.number}/${t.installment!.total} de ${brl(t.value)} | restam ${left} (${brl(left * t.value)})`);
      }
      sections.push(instSection);
    }

    const small = expenses.filter(t => t.value < 30);
    const byWeekday = sumBy(expenses, t => WEEKDAYS[new Date(`${t.date}T12:00:00Z`).getUTCDay()]);
    const weekend = (byWeekday.get('sáb')?.total ?? 0) + (byWeekday.get('dom')?.total ?? 0);
    const totalExp = expenses.reduce((s, t) => s + t.value, 0);
    sections.push(['EFEITO FORMIGA', `- Saídas abaixo de R$ 30: ${small.length}x somando ${brl(small.reduce((s, t) => s + t.value, 0))}${totalExp > 0 ? ` | fim de semana: ${Math.round((weekend / totalExp) * 100)}% das saídas` : ''}`]);

    const pixIn = txs.filter(t => t.kind === 'income' && isPix(t));
    if (pixIn.length) {
      const inSection = ['PIX RECEBIDOS POR PAGADOR'];
      for (const [name, v] of top(sumBy(pixIn, who), 6)) inSection.push(`- ${name}: ${brl(v.total)} em ${v.count}x`);
      sections.push(inSection);
    }

    const biggest = ['MAIORES SAÍDAS'];
    for (const t of [...expenses].sort((a, b) => b.value - a.value).slice(0, 6)) biggest.push(`- ${t.date} | ${brl(t.value)} | ${who(t)} | ${promptSafe(t.category, 30)}${t.note ? ` | nota: ${promptSafe(t.note, 60)}` : ''}`);
    sections.push(biggest);
  }

  const out: string[] = [];
  let size = 0;
  for (const section of sections) {
    const text = section.join('\n');
    if (size + text.length + 2 > maxChars) continue;
    out.push(text);
    size += text.length + 2;
  }
  if (!full) return out.join('\n\n');

  // Recent non-internal movements fill whatever budget remains; totals above already cover everything.
  const recent = txs.filter(t => t.kind !== 'internal');
  const header = 'MOVIMENTAÇÕES RECENTES (data | valor | operação | contraparte | categoria | nota)';
  const recentLines: string[] = [];
  size += header.length + 2;
  for (const t of recent) {
    const sign = t.kind === 'income' || t.kind === 'refund' ? '+' : '-';
    const line = `${t.date.slice(5)} | ${sign}${brl(t.value)} | ${t.operation ?? '-'} | ${who(t)} | ${promptSafe(t.category, 24)}${t.installment ? ` | ${t.installment.number}/${t.installment.total}` : ''}${t.note ? ` | nota: ${promptSafe(t.note, 60)}` : ''}`;
    if (size + line.length + 1 > maxChars - 70 || recentLines.length >= 40) break;
    recentLines.push(line);
    size += line.length + 1;
  }
  if (recentLines.length) {
    if (recent.length > recentLines.length) recentLines.push(`(+${recent.length - recentLines.length} movimentações não listadas, já incluídas nos totais)`);
    out.push([header, ...recentLines].join('\n'));
  }
  return out.join('\n\n');
}
