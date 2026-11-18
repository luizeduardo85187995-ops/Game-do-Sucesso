const {test}=require('node:test');
const assert=require('node:assert/strict');
const {build}=require('esbuild');
const {JSDOM}=require('jsdom');
const React=require('react');
const {createRoot}=require('react-dom/client');
const Module=require('module');

test('aba Banco: valor travado, categoria e nota salvas, filtro de Pix',async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test/app'});
  global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
  const originalFetch=global.fetch;
  const calls=[];
  global.__finance={expenseCategories:['Mercado','Moradia'],incomeCategories:['Salário'],bankTxAnnotations:{},annotateBankTransaction:(k,c)=>calls.push([k,c]),addCategory:()=>{}};
  global.__user={uid:'owner',getIdToken:async()=>'t'};
  const snapshot={month:'2026-11',fetchedAt:new Date().toISOString(),warnings:[],
    accounts:[{id:'acc',itemId:'i',name:'Conta',institution:'Nubank',type:'BANK',balance:10,currency:'BRL',updatedAt:null}],
    transactions:[
      {id:'pix1',accountId:'acc',date:'2026-11-06',description:'Transferência enviada pelo Pix',amount:-350,currency:'BRL',status:'POSTED',direction:'DEBIT',operation:'PIX',counterparty:'João Locador'},
      {id:'sal',accountId:'acc',date:'2026-11-05',description:'Salário',amount:3000,currency:'BRL',status:'POSTED',direction:'CREDIT'},
      {id:'fat',accountId:'acc',date:'2026-11-10',description:'Pagamento de fatura',amount:-186.38,currency:'BRL',status:'POSTED',direction:'DEBIT'},
    ]};
  global.fetch=async()=>Response.json({configured:true,snapshot});
  const compiled=await build({entryPoints:['src/components/finance/BankTransactionsTab.tsx'],bundle:true,platform:'node',format:'cjs',write:false,external:['react'],plugins:[{name:'ctx',setup(b){
    b.onResolve({filter:/(AuthContext|FinanceContext)$/},a=>({path:a.path.includes('Auth')?'auth':'finance',namespace:'fake'}));
    b.onLoad({filter:/^auth$/,namespace:'fake'},()=>({contents:'export const useAuth=()=>({user:globalThis.__user});',loader:'js'}));
    b.onLoad({filter:/^finance$/,namespace:'fake'},()=>({contents:'export const useFinance=()=>globalThis.__finance;',loader:'js'}));
  }}]});
  const mod=new Module(process.cwd()+'/bank-tab-test.cjs',module);mod.paths=module.paths;mod.filename=process.cwd()+'/bank-tab-test.cjs';mod._compile(compiled.outputFiles[0].text,mod.filename);
  const root=createRoot(document.getElementById('root'));
  try{
    await React.act(async()=>root.render(React.createElement(mod.exports.default,{month:'2026-11'})));
    const text=document.body.textContent;
    assert.match(text,/João Locador/);
    assert.match(text,/Saídas reais.*350,00/s,'fatura não entra como saída');
    assert.match(text,/não conta\)R\$\s?186,38/);
    assert.equal(document.querySelectorAll('input[type=number]').length,0,'valor do banco não é editável');
    const select=document.querySelector('select[aria-label^="Categoria de João"]');
    const setValue=Object.getOwnPropertyDescriptor(dom.window.HTMLSelectElement.prototype,'value').set;
    await React.act(async()=>{setValue.call(select,'Moradia');select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
    assert.deepEqual(calls.at(-1),['acc:pix1',{category:'Moradia'}]);
    const pixButton=[...document.querySelectorAll('button')].find(b=>b.textContent==='Pix');
    await React.act(async()=>pixButton.click());
    assert.equal(document.querySelectorAll('li').length,1);
  }finally{
    await React.act(async()=>root.unmount());dom.window.close();global.fetch=originalFetch;delete global.__finance;delete global.__user;
  }
});
