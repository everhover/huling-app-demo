const fs=require('fs'),vm=require('vm'),assert=require('assert');
const path=require('path');const root=path.resolve(__dirname,'..')+path.sep;const mem={};
const location={pathname:'/FeedCompact.dc.html',search:'',href:'',reload(){},replace(url){this.href=url;}};
const ctx={window:{},location,URLSearchParams,localStorage:{getItem:k=>mem[k]||null,setItem:(k,v)=>mem[k]=v},document:{addEventListener(){},createElement(){return {}},head:{appendChild(){}}},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},React:{createRef:()=>({current:null})},CustomEvent:class{}};
vm.createContext(ctx);for(const f of ['demo-seed.js','demo.js'])vm.runInContext(fs.readFileSync(root+f,'utf8'),ctx);
const H=ctx.window.Huling;
class Base{constructor(props){this.props=props;this.state={}}setState(p){this.state={...this.state,...(typeof p==='function'?p(this.state):p)}}}
ctx.DCLogic=Base;
function component(name,props={}){const html=fs.readFileSync(root+name+'.dc.html','utf8'),s=html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];const C=vm.runInContext('(function(){'+s+';return Component;})()',ctx);return new C(props)}

const b=component('Bookkeeping');let r=b.periodRange('week','2026-09-26','2026-09-26');assert.equal(r.start,'2026-09-21');assert.equal(r.cutoff,'2026-09-26');assert.equal(r.previousStart,'2026-09-14');assert.equal(r.previousEnd,'2026-09-19');
r=b.periodRange('month','2026-03-31','2026-03-31');assert.equal(r.previousEnd,'2026-02-28');
r=b.periodRange('year','2024-02-29','2024-02-29');assert.equal(r.previousEnd,'2023-02-28');
r=b.periodRange('week','2026-01-01','2026-01-01');assert.equal(r.start,'2025-12-29');assert.equal(r.previousEnd,'2025-12-25');
r=b.periodRange('month','2026-08-01','2026-09-26');assert.equal(r.cutoff,'2026-08-31');assert.equal(r.previousEnd,'2026-07-31');
const today=new Date(),year=today.getFullYear(),month=String(today.getMonth()+1).padStart(2,'0');b.setState({month:year+'-'+month,anchor:null,period:'month'});const ranges=b.periodRange('month',year+'-'+month+'-01',year+'-'+month+'-'+String(today.getDate()).padStart(2,'0'));H.state.ledger=[{id:'a',title:'当前',tags:[],date:ranges.start,amount:12000,status:'confirmed'},{id:'b',title:'此前',tags:[],date:ranges.previousStart,amount:10000,status:'confirmed'},{id:'c',title:'待确认',tags:[],date:ranges.start,amount:999999,status:'pending'}];assert.equal(b.renderVals().total,'120.00');assert.equal(b.renderVals().comparison,'↑ +20.0%');H.updateLedger('a',{amount:5000});assert.equal(b.renderVals().comparison,'↓ −50.0%');H.updateLedger('b',{amount:0});assert.equal(b.renderVals().comparison,'暂无可比数据');H.updateLedger('a',{amount:0});assert.equal(b.renderVals().comparison,'持平');
console.log('PASS: WTD/MTD/YTD matching ranges, month/year boundaries, leap dates, completed periods, confirmed-only changes and zero denominator.');
