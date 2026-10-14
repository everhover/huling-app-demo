const fs=require('fs'),vm=require('vm'),assert=require('assert');
const path=require('path');const root=path.resolve(__dirname,'..')+path.sep;const mem={};
const location={pathname:'/FeedCompact.dc.html',search:'',href:'',reload(){},replace(url){this.href=url;}};
const ctx={window:{},location,URLSearchParams,localStorage:{getItem:k=>mem[k]||null,setItem:(k,v)=>mem[k]=v},document:{addEventListener(){},createElement(){return {}},head:{appendChild(){}}},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},React:{createRef:()=>({current:null})},CustomEvent:class{}};
vm.createContext(ctx);for(const f of ['demo-seed.js','demo.js'])vm.runInContext(fs.readFileSync(root+f,'utf8'),ctx);
const H=ctx.window.Huling;
class Base{constructor(props){this.props=props;this.state={}}setState(p){this.state={...this.state,...(typeof p==='function'?p(this.state):p)}}}
ctx.DCLogic=Base;
function component(name,props={}){const html=fs.readFileSync(root+name+'.dc.html','utf8'),s=html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];const C=vm.runInContext('(function(){'+s+';return Component;})()',ctx);return new C(props)}

const feed=component('FeedCompact',{variant:'b'});
for(const [id,label,status] of [['upload-failed','重新上传','uploading'],['transcription-failed','重新转写','processing']]){const row=feed.renderVals().items.find(n=>n.id===id);assert(row.failed);assert.equal(row.retryLabel,label);let stopped=false;row.retry({stopPropagation(){stopped=true}});assert(stopped);assert.equal(H.note(id).status,status);assert(!feed.renderVals().items.find(n=>n.id===id).failed);assert.equal(H.retryNote(id),false);}
assert.equal(H.note('transcription-failed').phase,'transcribing');H.complete('transcription-failed');assert.equal(H.note('transcription-failed').phase,'organizing');H.complete('transcription-failed');assert.equal(H.note('transcription-failed').status,'ready');assert.equal(H.sortNotes(H.state.notes)[0].status,'uploading');console.log('PASS: failure states, retry labels, isolated retry transitions, transcription lifecycle and upload priority');
