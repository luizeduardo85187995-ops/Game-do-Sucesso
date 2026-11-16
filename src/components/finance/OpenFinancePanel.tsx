import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Landmark, RefreshCw, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { BankSnapshot, OpenFinanceResponse } from '../../types/openFinance';
import { formatDateBR, todayISO } from '../../utils/format';

function money(value: number, currency: string): string {
  try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value); }
  catch { return `${value.toFixed(2)} ${currency}`; }
}

export default function OpenFinancePanel() {
  const { user } = useAuth();
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [storedSnapshot, setStoredSnapshot] = useState<{ uid: string; data: BankSnapshot } | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [accountId, setAccountId] = useState('all');
  const [page, setPage] = useState(1);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const uid = user?.uid;
  const snapshot = storedSnapshot?.uid === uid && storedSnapshot?.data.month === month ? storedSnapshot.data : null;

  const load = useCallback(async (refresh: boolean): Promise<void> => {
    controller.current?.abort();
    const currentGeneration = ++generation.current;
    if (!user) return;
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const token = await user.getIdToken();
      if (abort.signal.aborted) return;
      const response = await fetch(`/api/open-finance?month=${encodeURIComponent(month)}`, {
        method: refresh ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}` }, signal: abort.signal,
      });
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('A consulta bancária precisa da API do servidor. Abra a versão publicada com a integração configurada.');
      }
      const data: OpenFinanceResponse & { message?: string } = await response.json();
      if (!response.ok) throw new Error(data.message || 'Não foi possível consultar seus bancos.');
      if (currentGeneration !== generation.current) return;
      setConfigured(data.configured);
      setStoredSnapshot(data.snapshot ? { uid: user.uid, data: data.snapshot } : null);
      setAccountId('all');
      setPage(1);
      if (refresh && data.configured) setNotice(data.cached ? 'Mostrando a consulta recente. Uma nova leitura fica disponível após 15 minutos.' : 'Consulta concluída. Seus lançamentos manuais não foram alterados.');
    } catch (caught: unknown) {
      if (!abort.signal.aborted && currentGeneration === generation.current) {
        setError(caught instanceof Error ? caught.message : 'Não foi possível consultar seus bancos.');
      }
    } finally {
      if (currentGeneration === generation.current) setBusy(false);
    }
  }, [user, month]);

  useEffect(() => {
    setStoredSnapshot(null);
    setConfigured(null);
    setError('');
    setNotice('');
    setAccountId('all');
    setPage(1);
    void load(false);
    return () => { ++generation.current; controller.current?.abort(); };
  }, [uid, month, load]);

  // Never display a prior account's bank data while authentication changes.
  if (!user) return (
    <section className="rounded-2xl border border-cyan-500/30 bg-slate-900 p-5 text-slate-200">
      <h3 className="font-bold">Meu Pluggy · consulta pessoal</h3>
      <p className="mt-2 text-sm">Entre com sua conta Google para consultar seus bancos conectados.</p>
    </section>
  );
  const rows = snapshot?.transactions.filter(tx => accountId === 'all' || tx.accountId === accountId) || [];
  const visibleRows = rows.slice((page - 1) * 50, page * 50);
  const pages = Math.max(1, Math.ceil(rows.length / 50));

  return (
    <section className="rounded-2xl border border-cyan-500/30 bg-slate-900 p-4 sm:p-6 text-slate-200 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-white"><Landmark className="h-5 w-5 text-cyan-400" />Meus bancos conectados</h3>
          <p className="mt-1 text-xs text-slate-400">Meu Pluggy pessoal · saldos e extrato para consulta</p>
        </div>
        <a href="https://meu.pluggy.ai/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-cyan-300 underline">Autorizar meus bancos <ExternalLink className="w-4 h-4" /></a>
      </div>
      <p className="text-sm text-slate-300">Os valores abaixo vêm do banco e não são somados ao seu controle manual. O Meu Pluggy atualiza as conexões aproximadamente a cada 24 horas; consultar aqui não força uma atualização no banco.</p>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-xs text-slate-300">Mês do extrato
          <input aria-label="Mês do extrato bancário" type="month" value={month} onChange={event => setMonth(event.target.value)} className="block rounded-lg border border-slate-600 bg-slate-800 p-2 mt-1 text-white" />
        </label>
        <button disabled={busy || !month} onClick={() => void load(true)} className="flex items-center gap-2 rounded-xl bg-cyan-400 text-slate-950 px-4 py-2 font-bold text-sm disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />{busy ? 'Consultando…' : 'Consultar dados disponíveis'}
        </button>
      </div>
      {error && <p role="alert" className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-200">{error}{snapshot ? ' A consulta anterior continua abaixo; ela não foi atualizada.' : ''}</p>}
      {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
      {configured === false && <div className="rounded-xl bg-slate-800 p-4 text-sm space-y-2">
        <p className="font-bold">Falta concluir a configuração pessoal</p>
        <p>Conecte os bancos no Meu Pluggy. Depois, no painel Pluggy, abra sua aplicação → Demo → Conectar Conta e escolha <strong>MeuPluggy</strong>. A configuração do servidor usa os IDs dessas conexões.</p>
        <a href="https://docs.pluggy.ai/pt/docs/guides/meu-pluggy-personal-use" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">Abrir o passo a passo gratuito</a>
      </div>}
      {configured && !snapshot && !busy && <p className="text-sm text-slate-400">Ainda não há uma consulta salva para este mês. Clique em Consultar dados disponíveis.</p>}
      {snapshot && <>
        <p className="text-xs text-slate-400">Consulta salva em {new Date(snapshot.fetchedAt).toLocaleString('pt-BR')}. Saldos correspondem à última coleta do banco, não ao fechamento do mês selecionado.</p>
        {snapshot.warnings.map(warning => <p key={warning} className="text-sm text-amber-200">{warning}</p>)}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {snapshot.accounts.map(account => <div key={account.id} className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
            <p className="font-semibold">{account.institution} · {account.name}</p>
            <p className="text-xs text-slate-400 mt-1">{account.type === 'CREDIT' ? 'Saldo informado do cartão' : 'Saldo informado da conta'}</p>
            <p className="font-mono text-xl text-white mt-2">{money(account.balance, account.currency)}</p>
            <p className="text-xs text-slate-400 mt-2">Última coleta: {account.updatedAt ? new Date(account.updatedAt).toLocaleString('pt-BR') : 'não informada'}</p>
          </div>)}
        </div>
        <label className="block text-xs">Filtrar conta
          <select aria-label="Conta do extrato bancário" value={accountId} onChange={event => { setAccountId(event.target.value); setPage(1); }} className="mt-1 block rounded-lg bg-slate-800 border border-slate-600 p-2 max-w-full">
            <option value="all">Todas as contas</option>
            {snapshot.accounts.map(account => <option key={account.id} value={account.id}>{account.institution} · {account.name}</option>)}
          </select>
        </label>
        <p className="text-xs text-slate-400">Datas e valores do extrato bancário. Transferências e pagamentos de fatura podem aparecer em mais de uma conta; este extrato não é um total de despesas.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400"><tr><th className="p-2">Data</th><th className="p-2">Descrição / conta</th><th className="p-2">Situação</th><th className="p-2 text-right">Valor</th></tr></thead>
            <tbody>{visibleRows.map(tx => <tr key={`${tx.accountId}:${tx.id}`} className="border-t border-slate-700">
              <td className="p-2 whitespace-nowrap">{formatDateBR(tx.date)}</td>
              <td className="p-2">{tx.description}<span className="block text-xs text-slate-400">{snapshot.accounts.find(account => account.id === tx.accountId)?.name}</span></td>
              <td className="p-2 text-xs">{tx.status === 'POSTED' ? 'Confirmado' : tx.status === 'PENDING' ? 'Pendente' : tx.status}</td>
              <td className="p-2 text-right whitespace-nowrap font-mono">{money(tx.amount, tx.currency)}</td>
            </tr>)}</tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="text-sm text-slate-400">Nenhuma movimentação disponibilizada para este mês e conta. Isso não significa saldo zero.</p>}
        {pages > 1 && <div className="flex items-center gap-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(value => value - 1)} className="disabled:opacity-40 underline">Anterior</button>
          <span>Página {page} de {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(value => value + 1)} className="disabled:opacity-40 underline">Próxima</button>
        </div>}
      </>}
    </section>
  );
}
