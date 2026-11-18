const { test } = require('node:test');
const assert = require('node:assert/strict');
const { build } = require('esbuild');
const Module = require('module');

async function compile(entry, plugins = []) {
  const built = await build({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false,plugins});
  const compiled = new Module(process.cwd()+'/open-finance-test.cjs',module);
  compiled.filename=process.cwd()+'/open-finance-test.cjs'; compiled.paths=module.paths;
  compiled._compile(built.outputFiles[0].text,compiled.filename);
  return compiled.exports;
}
const itemId='11111111-1111-1111-1111-111111111111';
const accountId='22222222-2222-2222-2222-222222222222';
const config={ownerUid:'owner',clientId:'33333333-3333-3333-3333-333333333333',clientSecret:'fake-test-secret',itemIds:[itemId]};
const now=new Date('2026-11-16T12:00:00Z');
function apiFixture(options={}) {
  const calls=[];
  const account={id:accountId,itemId,type:'BANK',name:'Conta Teste',balance:123.45,currencyCode:'BRL',updatedAt:'2026-11-16T00:00:00Z'};
  const tx={id:'tx1',accountId,date:'2026-11-01T00:00:00Z',description:'Compra teste',amount:-12.34,currencyCode:'BRL',type:'DEBIT',status:'POSTED'};
  const fetcher=async (url,init) => {
    calls.push({url,init});
    const u=new URL(url);
    assert.equal(u.origin,'https://api.pluggy.ai');
    if(u.pathname==='/auth') return Response.json({apiKey:'fake-api-key'});
    assert.equal(init.method,'GET','bank data calls must be read-only');
    if(u.pathname.startsWith('/items/')) return Response.json({status:'UPDATED',connector:{name:'Banco teste'},consentExpiresAt:options.expired?'2026-11-01T00:00:00Z':'2027-01-01T00:00:00Z'});
    if(u.pathname==='/accounts') return Response.json({results:[account],totalPages:1});
    assert.equal(u.pathname,'/v2/transactions');
    assert.equal(u.searchParams.get('accountId'),accountId);
    assert.equal(u.searchParams.get('dateFrom'),'2026-11-01');
    assert.equal(u.searchParams.get('dateTo'),'2026-11-30');
    if(options.fail) return new Response('secret internal provider diagnostic',{status:500});
    const after=u.searchParams.get('after');
    return Response.json({results:options.foreign?[{...tx,accountId:'foreign'}]:after?[tx,{...tx,id:'tx2',amount:45,type:'CREDIT'}]:[tx],next:options.loop||!after?`?accountId=${accountId}&after=cursor%2B%3D`:null});
  };
  return {fetcher,calls};
}

test('Meu Pluggy pessoal: leitura segura, paginação e isolamento',async t=>{
  const lib=await compile('api/_lib/pluggyPersonal.ts');
  await t.test('restrição ao UID proprietário e configuração incompleta',()=>{
    assert.throws(()=>lib.assertOwner('other','owner'),e=>e.status===403);
    assert.throws(()=>lib.assertOwner('owner',undefined),e=>e.status===403);
    assert.equal(lib.readPersonalConfig({}),null);
    assert.doesNotThrow(()=>lib.assertOwner('owner','owner'));
  });
  await t.test('mês e virada de ano sem conversão de fuso',()=>{
    assert.deepEqual(lib.monthRange('2026-11',now),{from:'2026-11-01',to:'2026-11-30'});
    assert.deepEqual(lib.monthRange('2026-12',now),{from:'2026-12-01',to:'2026-12-31'});
    assert.throws(()=>lib.monthRange('2026-13',now));
    assert.throws(()=>lib.monthRange('2020-01',now));
  });
  await t.test('todas as páginas, duplicata eliminada, saldo inalterado e dia 1 preservado',async()=>{
    const fixture=apiFixture();
    const result=await lib.fetchPersonalSnapshot(config,'2026-11',fixture.fetcher,now);
    assert.equal(result.accounts[0].balance,123.45);
    assert.equal(result.transactions.length,2);
    assert.equal(result.transactions[0].date,'2026-11-01');
    assert.equal(result.transactions[0].amount,-12.34);
    assert.equal(fixture.calls.length,5);
    assert(!JSON.stringify(result).includes('fake-api-key'));
    assert(!JSON.stringify(result).includes('fake-test-secret'));
  });
  await t.test('falha parcial não devolve snapshot nem diagnóstico secreto',async()=>{
    const fixture=apiFixture({fail:true});
    await assert.rejects(lib.fetchPersonalSnapshot(config,'2026-11',fixture.fetcher,now),e=>e.status===502&&!e.message.includes('secret'));
  });
  await t.test('paginação circular, conta inesperada e consentimento expirado bloqueados',async()=>{
    for(const options of [{loop:true},{foreign:true},{expired:true}]) {
      const fixture=apiFixture(options);
      await assert.rejects(lib.fetchPersonalSnapshot(config,'2026-11',fixture.fetcher,now));
    }
  });
  await t.test('API exige token válido e não deixa outro usuário acessar cache',async()=>{
    const previous={...process.env};
    const store=new Map();
    let reads=0;
    const document=(path)=>({
      collection:name=>({doc:id=>document(`${path}/${name}/${id}`)}),
      get:async()=>{reads++;return {data:()=>store.get(path)};},
      set:async value=>store.set(path,value),
    });
    global.__personalAdmin={
      adminAuth:{verifyIdToken:async token=>{if(token==='bad')throw new Error('bad');return {uid:token};}},
      adminDb:{collection:name=>({doc:id=>document(`${name}/${id}`)})},
    };
    const api=await compile('api/open-finance.ts',[{name:'mock-admin',setup(b){
      b.onResolve({filter:/firebaseAdmin\.js$/},()=>({path:'admin',namespace:'fake'}));
      b.onLoad({filter:/.*/,namespace:'fake'},()=>({contents:'export const {adminAuth,adminDb}=globalThis.__personalAdmin;',loader:'js'}));
    }}]);
    try {
      process.env.OPEN_FINANCE_OWNER_UID='owner';
      process.env.PLUGGY_CLIENT_ID=config.clientId;
      process.env.PLUGGY_CLIENT_SECRET=config.clientSecret;
      process.env.PLUGGY_PERSONAL_ITEM_IDS=itemId;
      const request=token=>new Request('https://example.test/api/open-finance',{headers:token?{Authorization:`Bearer ${token}`}:{}});
      assert.equal((await api.GET(request())).status,401);
      assert.equal((await api.GET(request('bad'))).status,401);
      assert.equal((await api.GET(request('other'))).status,403);
      assert.equal(reads,0);
      const response=await api.GET(request('owner'));
      assert.equal(response.status,200);
      assert.equal(response.headers.get('cache-control'),'private, no-store');
      assert.deepEqual(await response.json(),{configured:true,snapshot:null});
    } finally {
      for(const key of ['OPEN_FINANCE_OWNER_UID','PLUGGY_CLIENT_ID','PLUGGY_CLIENT_SECRET','PLUGGY_PERSONAL_ITEM_IDS']) {
        if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];
      }
      delete global.__personalAdmin;
    }
  });
});
