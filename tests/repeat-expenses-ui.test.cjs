const {test}=require('node:test');
const assert=require('node:assert/strict');
const {build}=require('esbuild');
const {JSDOM}=require('jsdom');
const React=require('react');
const {createRoot}=require('react-dom/client');
const Module=require('module');
test('repetição: seleção, prévia, confirmação única e bloqueio de cópia existente',async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test/app'});
  global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
  const result=await build({entryPoints:['src/components/finance/RepeatExpensesModal.tsx'],bundle:true,platform:'node',format:'cjs',write:false,external:['react']});
  const mod=new Module(process.cwd()+'/repeat-ui.cjs',module);mod.paths=module.paths;mod.filename=process.cwd()+'/repeat-ui.cjs';mod._compile(result.outputFiles[0].text,mod.filename);
  const now=new Date();const prev=new Date(now.getFullYear(),now.getMonth()-1,1);
  const month=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const previous=`${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,'0')}`;
  const transactions=[{id:'rent',type:'expense',amount:500,category:'Moradia',note:'Aluguel teste',date:`${previous}-15`,status:'settled'}];
  const calls=[];const onRepeat=(ids,destination)=>calls.push({ids,destination});
  const root=createRoot(document.getElementById('root'));
  const render=rows=>React.act(async()=>root.render(React.createElement(mod.exports.default,{transactions:rows,onRepeat,onClose:()=>{}})));
  try {
    await render(transactions);
    const find=label=>[...document.querySelectorAll('button')].find(button=>button.textContent.includes(label));
    assert.equal(find('Criar').disabled,true);
    await React.act(async()=>find('Selecionar disponíveis').click());
    assert.equal(find('Criar').disabled,false);assert(document.body.textContent.includes('500,00'));
    await React.act(async()=>{find('Criar').click();find('Criar').click();});
    assert.deepEqual(calls,[{ids:['rent'],destination:month}]);
    await render([...transactions,{...transactions[0],id:'copy',repeatSourceId:'rent',date:`${month}-15`,status:'pending'}]);
    assert.equal(find('Criar').disabled,true);
    assert.match(document.body.textContent,/Já existe neste mês/);
  } finally {await React.act(async()=>root.unmount());dom.window.close();}
});
