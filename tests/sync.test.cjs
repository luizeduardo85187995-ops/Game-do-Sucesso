const { test } = require('node:test');
const assert = require('node:assert/strict');
const { build } = require('esbuild');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = React;

test('isolamento de contas e proteção contra gravação após falha de leitura', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://example.test/app' });
  for (const key of ['window', 'document', 'localStorage']) global[key] = dom.window[key];
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const mock = global.__syncMock = {
    auth: { user: { uid: 'a' }, loading: false }, writes: [],
    data: { bankAccounts: [], transactions: [], savingGoals: [], base: { startingBalance: 123, fixedIncome: 0 } },
    fail: false,
  };
  const result = await build({
    stdin: { contents: "export {FinanceProvider,useFinance} from './src/context/FinanceContext';", resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react'],
    plugins: [{ name: 'firebase-test-double', setup(b) {
      b.onResolve({ filter: /(^firebase\/firestore$|\/lib\/firebase$|\/AuthContext$)/ }, args => ({ path: args.path, namespace: 'mock' }));
      b.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: `
        export const db = {};
        export const logOut = async () => ({success:true});
        export const useAuth = () => globalThis.__syncMock.auth;
        export const doc = (...args) => args.slice(1).join('/');
        export const getDocFromServer = async () => {
          const m = globalThis.__syncMock;
          if(m.fail) throw Object.assign(new Error('offline'),{code:'unavailable'});
          return {exists:()=>m.data !== null,data:()=>m.data};
        };
        export const setDoc = async (...args) => {globalThis.__syncMock.writes.push(args)};
      `, loader: 'js' }));
    }}],
  });
  const Module = require('module');
  const compiled = new Module(process.cwd() + '/sync-test.cjs', module);
  compiled.filename = process.cwd() + '/sync-test.cjs'; compiled.paths = module.paths;
  compiled._compile(result.outputFiles[0].text, compiled.filename);
  const { FinanceProvider, useFinance } = compiled.exports;
  let context;
  function Probe() { context = useFinance(); return React.createElement('p', null, context.base.startingBalance); }
  const root = createRoot(document.getElementById('root'));
  const render = () => act(async () => { root.render(React.createElement(React.StrictMode, null, React.createElement(FinanceProvider, null, React.createElement(Probe)))); });
  await render();
  assert.equal(context.base.startingBalance, 123);
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 850)); });
  assert.equal(mock.writes.length, 0, 'loading must never write');
  await act(async () => { context.setBase({ startingBalance: 456, fixedIncome: 0 }); });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 850)); });
  assert.equal(mock.writes.length, 1, 'an actual edit must save');
  assert.equal(mock.writes[0][1].base.startingBalance, 456);
  mock.auth = { user: { uid: 'b' }, loading: false }; mock.fail = true;
  await render();
  assert.match(document.body.textContent, /Seus dados não foram carregados/);
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 850)); });
  assert.equal(mock.writes.length, 1, 'failed read must not overwrite cloud');
  mock.auth = { user: { uid: 'c' }, loading: false }; mock.fail = false; mock.data = { bankAccounts: [], savingGoals: [] };
  await render();
  assert.equal(context.base.startingBalance, 0, 'missing fields must not inherit previous account');
  assert.deepEqual(context.bankAccounts, []);
  let account;
  await act(async () => { account = context.addBankAccount({bankName:'Teste',accountType:'checking',balance:1000}); });
  const now = new Date();
  const current = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-15`;
  const next = new Date(now.getFullYear(), now.getMonth()+1, 1);
  const future = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-01`;
  const previous = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const past = `${previous.getFullYear()}-${String(previous.getMonth()+1).padStart(2,'0')}-01`;
  let pending;
  await act(async () => { pending = context.addTransaction({type:'expense',amount:200,category:'Teste',date:future,bankAccountId:account.id}); });
  assert.equal(context.metrics.balance, 1000, 'future pending expense must not reduce actual balance');
  assert.equal(context.metrics.monthExpense, 0);
  assert.equal(context.metrics.nextMonthExpenses, 200);
  assert.equal(context.metrics.projectedBalance, 800);
  await act(async () => { context.addTransaction({type:'expense',amount:50,category:'Teste',date:past,status:'settled',bankAccountId:account.id}); });
  assert.equal(context.metrics.monthExpense, 0, 'past expense entered now stays in past month');
  assert.equal(context.metrics.balance, 950);
  await act(async () => { context.addTransaction({type:'expense',amount:30,category:'Teste',date:current,status:'pending',bankAccountId:account.id}); });
  assert.equal(context.metrics.monthExpense, 30);
  assert.equal(context.metrics.balance, 950);
  await act(async () => { context.updateTransaction(pending.id, {status:'settled',paymentDate:current}); });
  assert.equal(context.metrics.balance, 750, 'settlement debits exactly once');
  await act(async () => { context.updateTransaction(pending.id, {note:'Apenas descrição'}); });
  assert.equal(context.metrics.balance, 750);
  await act(async () => { context.deleteTransaction(pending.id); });
  assert.equal(context.metrics.balance, 950, 'deletion reverses settled movement');
  let sourceExpense;
  await act(async () => { sourceExpense = context.addTransaction({type:'expense',amount:75,category:'Repetição',date:past,status:'settled',bankAccountId:account.id}); });
  const beforeRepeatBalance = context.metrics.balance;
  await act(async () => { context.repeatExpenses([sourceExpense.id],future.slice(0,7)); context.repeatExpenses([sourceExpense.id],future.slice(0,7)); });
  const repeated = context.transactions.filter(tx => tx.repeatSourceId === sourceExpense.id);
  assert.equal(repeated.length,1,'repeated clicks in same render cannot create duplicates');
  assert.equal(repeated[0].status,'pending');
  assert.equal(context.metrics.balance,beforeRepeatBalance,'repeat must not change account balances');
  mock.auth = { user: { uid: 'new-account' }, loading: false }; mock.data = null;
  localStorage.setItem('@financas/state_guest', JSON.stringify({base:{startingBalance:9999,fixedIncome:0}}));
  await render();
  assert.equal(context.base.startingBalance, 0, 'guest data must not be imported into a new account');
  assert.equal(mock.writes.length, 1);
  await act(async () => root.unmount());
  dom.window.close();
});
