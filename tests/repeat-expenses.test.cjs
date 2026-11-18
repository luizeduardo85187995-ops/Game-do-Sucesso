const {test}=require('node:test');
const assert=require('node:assert/strict');
const {build}=require('esbuild');
const Module=require('module');
async function load(entry){
  const result=await build({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false});
  const mod=new Module(process.cwd()+'/repeat-test.cjs',module);mod.filename=process.cwd()+'/repeat-test.cjs';mod.paths=module.paths;mod._compile(result.outputFiles[0].text,mod.filename);return mod.exports;
}
test('repetição de despesas e intervalos inclusivos',async t=>{
  const {prepareExpenseRepeats,dateInMonth}=await load('src/utils/repeatExpenses.ts');
  const {transactionsForRange,transactionTotals}=await load('src/utils/transactionPeriod.ts');
  const expense={id:'rent',type:'expense',amount:1400,category:'Moradia',date:'2026-01-31',status:'settled',paymentDate:'2026-01-31',note:'Aluguel',bankAccountId:'bank'};
  await t.test('cópia pendente mantém original e não duplica mês',()=>{
    const originals=[expense];const result=prepareExpenseRepeats(originals,['rent'],'2026-02');
    assert.equal(result.additions.length,1);const copy=result.additions[0];
    assert.equal(copy.date,'2026-02-28');assert.equal(copy.status,'pending');assert.equal(copy.paymentDate,'');
    assert.equal(expense.status,'settled');assert.equal(originals.length,1);assert.equal(copy.bankAccountId,'bank');
    const next=prepareExpenseRepeats([...originals,copy],['rent'],'2026-02');assert.equal(next.additions.length,0);
    assert.equal(prepareExpenseRepeats(originals,['rent'],'2026-01').additions.length,0);
    const march=prepareExpenseRepeats([expense,copy],[copy.id],'2026-03').additions[0];
    assert.equal(march.date,'2026-03-31');assert.equal(march.repeatSourceId,'rent');
  });
  await t.test('ano bissexto, mudança de ano e receitas não repetidas',()=>{
    assert.equal(dateInMonth('2028-02',31),'2028-02-29');assert.equal(dateInMonth('2027-01',31),'2027-01-31');
    assert.equal(prepareExpenseRepeats([{...expense,type:'income'}],['rent'],'2026-02').additions.length,0);
    assert.throws(()=>dateInMonth('2026-13',31));
    const result=prepareExpenseRepeats([expense,{...expense,id:'copy',repeatSourceId:'rent',date:'2026-02-28'}],['rent','copy'],'2026-03');
    assert.equal(result.additions.length,1);
  });
  await t.test('período inclui as duas extremidades e rejeita datas inválidas',()=>{
    const rows=[{...expense,id:'before',date:'2026-10-31'}, {...expense,id:'start',date:'2026-11-01'}, {...expense,id:'end',date:'2026-12-10'}, {...expense,id:'after',date:'2026-12-11'}];
    const selected=transactionsForRange(rows,'2026-11-01','2026-12-10');assert.deepEqual(selected.map(tx=>tx.id),['start','end']);
    assert.equal(transactionTotals(selected).expense,2800);
    assert.deepEqual(transactionsForRange(rows,'2026-12-10','2026-11-01'),[]);
    assert.deepEqual(transactionsForRange(rows,'','2026-12-10'),[]);
    assert.deepEqual(transactionsForRange(rows,'2026-02-30','2026-12-10'),[]);
  });
});
