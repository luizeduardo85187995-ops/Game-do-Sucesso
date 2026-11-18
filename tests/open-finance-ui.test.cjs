const {test}=require('node:test');
const assert=require('node:assert/strict');
const {build}=require('esbuild');
const {JSDOM}=require('jsdom');
const React=require('react');
const {createRoot}=require('react-dom/client');
const Module=require('module');

test('painel bancário: consulta, paginação e limpeza após troca de usuário',async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test/app'});
  global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
  const originalFetch=global.fetch;
  const user={uid:'owner',getIdToken:async()=> 'owner-token'};
  global.__personalUser=user;
  const now=new Date();const month=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const snapshot={month,fetchedAt:now.toISOString(),warnings:[],accounts:[{id:'account',itemId:'item',name:'Conta pessoal',institution:'Banco teste',type:'BANK',balance:100,currency:'BRL',updatedAt:null}],transactions:Array.from({length:51},(_,i)=>({id:`tx-${i}`,accountId:'account',date:`${month}-01`,description:`Despesa privada ${i}`,amount:-10,currency:'BRL',status:'POSTED',direction:'DEBIT'}))};
  global.fetch=async(_url,init)=>Response.json({configured:true,snapshot:init.method==='POST'?snapshot:null});
  const compiled=await build({entryPoints:['src/components/finance/OpenFinancePanel.tsx'],bundle:true,platform:'node',format:'cjs',write:false,external:['react'],plugins:[{name:'auth',setup(b){
    b.onResolve({filter:/AuthContext$/},()=>({path:'auth',namespace:'fake'}));
    b.onLoad({filter:/.*/,namespace:'fake'},()=>({contents:'export const useAuth=()=>({user:globalThis.__personalUser});',loader:'js'}));
  }}]});
  const mod=new Module(process.cwd()+'/panel-test.cjs',module);mod.paths=module.paths;mod.filename=process.cwd()+'/panel-test.cjs';mod._compile(compiled.outputFiles[0].text,mod.filename);
  const Component=mod.exports.default;
  const root=createRoot(document.getElementById('root'));
  try {
    await React.act(async()=>root.render(React.createElement(Component)));
    assert.match(document.body.textContent,/Ainda não há uma consulta salva/);
    const button=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Consultar dados'));
    await React.act(async()=>button.click());
    assert.match(document.body.textContent,/Conta pessoal/);
    assert.equal(document.querySelectorAll('tbody tr').length,50);
    const next=[...document.querySelectorAll('button')].find(b=>b.textContent==='Próxima');
    await React.act(async()=>next.click());
    assert.equal(document.querySelectorAll('tbody tr').length,1);
    assert.match(document.body.textContent,/Despesa privada 50/);
    global.__personalUser={uid:'other',getIdToken:async()=> 'other-token'};
    global.fetch=async()=>Response.json({message:'Somente titular'},{status:403});
    await React.act(async()=>root.render(React.createElement(Component)));
    assert(!document.body.textContent.includes('Despesa privada'));
    assert.match(document.body.textContent,/Somente titular/);
    global.__personalUser=null;
    await React.act(async()=>root.render(React.createElement(Component)));
    assert.match(document.body.textContent,/Entre com sua conta Google/);
  } finally {
    await React.act(async()=>root.unmount());dom.window.close();global.fetch=originalFetch;delete global.__personalUser;
  }
});
