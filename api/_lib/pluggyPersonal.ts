import type { BankSnapshot, BankStatementEntry, ConnectedAccount } from '../../src/types/openFinance.js';

const API_ORIGIN = 'https://api.pluggy.ai';
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export class OpenFinanceError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'OpenFinanceError';
  }
}

export interface PersonalConfig {
  ownerUid: string;
  clientId: string;
  clientSecret: string;
  itemIds: string[];
}

export function readPersonalConfig(env: NodeJS.ProcessEnv): PersonalConfig | null {
  const ownerUid = env.OPEN_FINANCE_OWNER_UID?.trim();
  const clientId = env.PLUGGY_CLIENT_ID?.trim();
  const clientSecret = env.PLUGGY_CLIENT_SECRET?.trim();
  const itemIds = [...new Set((env.PLUGGY_PERSONAL_ITEM_IDS || '').split(',').map(value => value.trim()).filter(Boolean))];
  if (!ownerUid || !clientId || !clientSecret || itemIds.length === 0) return null;
  if (itemIds.length > 5 || !itemIds.every(id => UUID.test(id)) || !UUID.test(clientId)) {
    throw new OpenFinanceError(503, 'Revise a configuração pessoal do Meu Pluggy no servidor.');
  }
  return { ownerUid, clientId, clientSecret, itemIds };
}

export function assertOwner(uid: string, ownerUid: string | undefined): void {
  if (!ownerUid?.trim() || uid !== ownerUid.trim()) {
    throw new OpenFinanceError(403, 'Consulta bancária disponível somente para o titular configurado.');
  }
}

export function monthRange(month: string, now = new Date()): { from: string; to: string } {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new OpenFinanceError(400, 'Selecione um mês válido.');
  const [year, number] = month.split('-').map(Number);
  const distance = (year - now.getUTCFullYear()) * 12 + number - (now.getUTCMonth() + 1);
  if (distance < -24 || distance > 1) throw new OpenFinanceError(400, 'Consulte os últimos 24 meses ou o próximo mês.');
  const lastDay = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${lastDay}` };
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new OpenFinanceError(502, 'O provedor retornou dados inválidos.');
  return value as Record<string, unknown>;
}
function string(value: unknown): string {
  if (typeof value !== 'string' || !value) throw new OpenFinanceError(502, 'O provedor retornou um campo inválido.');
  return value;
}
function number(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new OpenFinanceError(502, 'O provedor retornou um valor inválido.');
  return value;
}
function results(value: Record<string, unknown>): unknown[] {
  if (!Array.isArray(value.results)) throw new OpenFinanceError(502, 'O provedor retornou uma lista inválida.');
  return value.results;
}

// Only read existing personal items. Never create paid connectors or trigger bank refreshes.
export async function fetchPersonalSnapshot(
  config: PersonalConfig,
  month: string,
  fetcher: typeof fetch = fetch,
  now = new Date(),
): Promise<BankSnapshot> {
  const range = monthRange(month, now);
  const signal = AbortSignal.timeout(25_000);
  let apiKey = '';
  async function request(path: string, body?: object): Promise<Record<string, unknown>> {
    let response: Response;
    try {
      response = await fetcher(`${API_ORIGIN}${path}`, {
        method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'X-API-KEY': apiKey } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal,
        redirect: 'error',
      });
    } catch (error: unknown) {
      if (error instanceof OpenFinanceError) throw error;
      throw new OpenFinanceError(503, 'Não foi possível consultar o Meu Pluggy agora. Tente novamente mais tarde.');
    }
    if (!response.ok) {
      if (response.status === 429) throw new OpenFinanceError(429, 'Limite de consultas do provedor atingido. Aguarde antes de tentar novamente.');
      if (response.status === 401 || response.status === 403) throw new OpenFinanceError(503, 'Acesso ao Meu Pluggy recusado. Revise as credenciais e a autorização pessoal.');
      throw new OpenFinanceError(502, 'O Meu Pluggy não concluiu a consulta. Seus lançamentos foram preservados.');
    }
    try { return object(await response.json()); }
    catch (error: unknown) {
      if (error instanceof OpenFinanceError) throw error;
      throw new OpenFinanceError(502, 'Resposta inválida do Meu Pluggy.');
    }
  }
  apiKey = string((await request('/auth', { clientId: config.clientId, clientSecret: config.clientSecret })).apiKey);
  const accounts: ConnectedAccount[] = [];
  const transactions = new Map<string, BankStatementEntry>();
  const warnings: string[] = [];
  for (const itemId of config.itemIds) {
    const item = await request(`/items/${encodeURIComponent(itemId)}`);
    if (item.consentExpiresAt && Date.parse(string(item.consentExpiresAt)) <= now.getTime()) {
      throw new OpenFinanceError(409, 'Autorização expirada. Reconecte o MeuPluggy no painel e revise os IDs das conexões.');
    }
    if (['LOGIN_ERROR', 'WAITING_USER_INPUT', 'OUTDATED'].includes(String(item.status))) {
      throw new OpenFinanceError(409, 'Uma conexão precisa de atenção. Abra o Meu Pluggy e revise sua autorização.');
    }
    if (item.status !== 'UPDATED') warnings.push('Uma conexão ainda está em processamento; os dados refletem a última coleta disponível.');
    const connector = item.connector ? object(item.connector) : {};
    const institution = typeof connector.name === 'string' ? connector.name : 'Meu Pluggy';
    const page = await request(`/accounts?itemId=${encodeURIComponent(itemId)}`);
    if (typeof page.totalPages === 'number' && page.totalPages > 1) throw new OpenFinanceError(502, 'A lista de contas veio incompleta. Nenhum resultado parcial foi aplicado.');
    for (const raw of results(page)) {
      const account = object(raw);
      if (account.type !== 'BANK' && account.type !== 'CREDIT') continue;
      const id = string(account.id);
      if (account.itemId !== itemId) throw new OpenFinanceError(502, 'Conta retornada fora da conexão autorizada.');
      accounts.push({ id, itemId, institution, name: string(account.name), type: account.type,
        balance: number(account.balance), currency: string(account.currencyCode),
        updatedAt: typeof account.updatedAt === 'string' ? account.updatedAt : null });
      let after: string | null = null;
      const cursors = new Set<string>();
      for (let pageNumber = 0; ; pageNumber += 1) {
        if (pageNumber >= 20) throw new OpenFinanceError(413, 'Extrato muito extenso. Nenhum resultado parcial foi aplicado.');
        const query = new URLSearchParams({ accountId: id, dateFrom: range.from, dateTo: range.to });
        if (after) query.set('after', after);
        const data = await request(`/v2/transactions?${query}`);
        for (const entry of results(data)) {
          const tx = object(entry);
          if (tx.accountId !== id) throw new OpenFinanceError(502, 'Movimentação retornada fora da conta autorizada.');
          const date = string(tx.date).slice(0, 10);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new OpenFinanceError(502, 'Data inválida no extrato.');
          if (date < range.from || date > range.to) continue;
          if (tx.type !== 'CREDIT' && tx.type !== 'DEBIT') throw new OpenFinanceError(502, 'Tipo de movimentação desconhecido.');
          const entryId = string(tx.id);
          transactions.set(`${id}:${entryId}`, { id: entryId, accountId: id, date,
            description: string(tx.description), amount: number(tx.amount), currency: string(tx.currencyCode),
            status: string(tx.status), direction: tx.type });
          if (transactions.size > 5000) throw new OpenFinanceError(413, 'Extrato muito extenso para esta consulta mensal.');
        }
        if (data.next === null) break;
        const next = string(data.next);
        if (!next.startsWith('?')) throw new OpenFinanceError(502, 'Paginação inválida do provedor.');
        const parsed = new URLSearchParams(next.slice(1));
        after = parsed.get('after');
        if (!after || cursors.has(after) || (parsed.has('accountId') && parsed.get('accountId') !== id)) {
          throw new OpenFinanceError(502, 'Paginação inconsistente do provedor.');
        }
        cursors.add(after);
      }
    }
  }
  const snapshot: BankSnapshot = { month, fetchedAt: now.toISOString(), accounts,
    transactions: [...transactions.values()].sort((a, b) => b.date.localeCompare(a.date)), warnings: [...new Set(warnings)] };
  if (Buffer.byteLength(JSON.stringify(snapshot), 'utf8') > 750_000) throw new OpenFinanceError(413, 'Extrato muito extenso para salvar com segurança.');
  return snapshot;
}
