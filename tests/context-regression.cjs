// Run with: node tests/context-regression.cjs
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const window={};
vm.runInNewContext(fs.readFileSync("js/suo-conversation-context.js","utf8"),{window});
const ctx=window.SUOConversationContext;
const run=q=>{const result=ctx.resolve(q);ctx.commit(result);return result.query.toLowerCase();};
const tests=[
  ()=>{
    ctx.reset();
    run("pecahkan sekolah sabak bernam");
    const q=run("sekolah rendah tu pecahkan lagi");
    assert.match(q,/sabak bernam/);assert.match(q,/rendah/);
  },
  ()=>{
    ctx.reset();
    run("jumlah penduduk Klang 2024");
    const q=run("Petaling pula");
    assert.match(q,/petaling/);assert.match(q,/penduduk/);assert.match(q,/2024/);
    assert.doesNotMatch(q,/daerah klang/);
  },
  ()=>{
    ctx.reset();
    run("jumlah penduduk Klang 2024");
    const q=run("tahun sebelumnya");
    assert.match(q,/2023/);assert.match(q,/klang/);
  },
  ()=>{
    ctx.reset();
    run("sekolah Sabak Bernam");
    const q=run("luas daerah Sepang");
    assert.doesNotMatch(q,/sabak bernam/);
    assert.match(q,/sepang/);
  },
  ()=>{
    ctx.reset();
    run("penduduk Klang 2024");
    const clear=ctx.resolve("mula semula");
    assert.equal(clear.reset,true);
    assert.equal(ctx.snapshot().location,null);
  }
];
tests.forEach((test,i)=>{test();console.log("PASS context regression "+(i+1));});
