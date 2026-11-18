const {test}=require('node:test');
const assert=require('node:assert/strict');
const {build}=require('esbuild');
const {JSDOM}=require('jsdom');
const React=require('react');
const {createRoot}=require('react-dom/client');
const Module=require('module');

test('lançamentos: mês anterior, atual, futuro e acumulado têm lista e totais consistentes',async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test/app'});
  global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
  const now=new Date();
  const month=offset=>{const d=new Date(now.getFullYear(),now.getMonth()+offset,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;};
  const tx=(id,offset,amount,type='expense')=>({id,type,amount,date:`${month(offset)}-01`,note:id,category:'Teste',status:'settled'});
  global.__periodFinance={transactions:[tx('Despesa passada',-1,250),tx('Receita atual',0,4500,'income'),tx('Despesa atual',0,300),tx('Despesa futura',1,1790)],bankAccounts:[],incomeCategories:[],expenseCategories:[],categoryIcons:{},addTransaction:()=>{},updateTransaction:()=>{},deleteTransaction:()=>{},addCategory:()=>{},setCategoryIcon:()=>{}};
  const result=await build({entryPoints:['src/components/finance/TransactionsScreen.tsx'],bundle:true,platform:'node',format:'cjs',write:false,external:['react'],plugins:[{name:'finance',setup(b){
    b.onResolve({filter:/FinanceContext$/},()=>({path:'finance',namespace:'fake'}));
    b.onLoad({filter:/.*/,namespace:'fake'},()=>({contents:'export const useFinance=()=>globalThis.__periodFinance;',loader:'js'}));
  }}]});
  const mod=new Module(process.cwd()+'/period-test.cjs',module);mod.paths=module.paths;mod.filename=process.cwd()+'/period-test.cjs';mod._compile(result.outputFiles[0].text,mod.filename);
  const root=createRoot(document.getElementById('root'));
  const text=()=>document.body.textContent;
  const total=key=>document.querySelector(`[data-testid="period-${key}"]`).textContent.replace(/\s/g,'');
  const click=async name=>{const button=[...document.querySelectorAll('button')].find(el=>el.textContent.includes(name));assert(button,name);await React.act(async()=>button.click());};
  try {
    await React.act(async()=>root.render(React.createElement(mod.exports.default)));
    assert(text().includes('Receita atual'));assert(text().includes('Despesa atual'));
    assert(!text().includes('Despesa passada'));assert(!text().includes('Despesa futura'));
    assert.equal(total('income'),'R$4.500,00');assert.equal(total('expense'),'R$300,00');assert.equal(total('net'),'R$4.200,00');
    assert(text().includes('Todas (2)'));
    await click('Mês anterior');
    assert(text().includes('Despesa passada'));assert(!text().includes('Receita atual'));assert(!text().includes('Despesa futura'));
    assert.equal(total('expense'),'R$250,00');assert.equal(total('income'),'R$0,00');
    await click('Mês atual');await click('Próximo mês');
    assert(text().includes('Despesa futura'));assert(!text().includes('Despesa passada'));assert(!text().includes('Despesa atual'));
    assert.equal(total('expense'),'R$1.790,00');
    await click('Todos os meses');
    assert(text().includes('Visão acumulada'));assert.equal(total('expense'),'R$2.340,00');assert.equal(total('income'),'R$4.500,00');
    await click('Mês atual');await click('Despesas');
    assert(!text().includes('Receita atual'));assert(text().includes('Despesa atual'));assert.equal(total('income'),'R$0,00');assert.equal(total('expense'),'R$300,00');
  } finally {await React.act(async()=>root.unmount());dom.window.close();delete global.__periodFinance;}
});
