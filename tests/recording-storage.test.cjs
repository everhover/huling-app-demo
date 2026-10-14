const fs=require('fs'),vm=require('vm'),assert=require('assert');
const path=require('path');const root=path.resolve(__dirname,'..')+path.sep;const mem={};
const location={pathname:'/FeedCompact.dc.html',search:'',href:'',reload(){},replace(url){this.href=url;}};
const ctx={window:{},location,URLSearchParams,localStorage:{getItem:k=>mem[k]||null,setItem:(k,v)=>mem[k]=v},document:{addEventListener(){},createElement(){return {}},head:{appendChild(){}}},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},React:{createRef:()=>({current:null})},CustomEvent:class{}};
vm.createContext(ctx);for(const f of ['demo-seed.js','demo.js'])vm.runInContext(fs.readFileSync(root+f,'utf8'),ctx);
const H=ctx.window.Huling;
class Base{constructor(props){this.props=props;this.state={}}setState(p){this.state={...this.state,...(typeof p==='function'?p(this.state):p)}}}
ctx.DCLogic=Base;
function component(name,props={}){const html=fs.readFileSync(root+name+'.dc.html','utf8'),s=html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];const C=vm.runInContext('(function(){'+s+';return Component;})()',ctx);return new C(props)}

// Swipe uses the same confirmation path; disabled rows and batch mode cannot swipe.
function swipeStorageRow(row,dx,dy=0){const el={style:{},parentElement:{dataset:{}},setPointerCapture(){},hasPointerCapture(){return false;}};const e={isPrimary:true,button:0,pointerId:1,clientX:0,clientY:0,currentTarget:el,target:{closest(){return null;}},preventDefault(){}};row.swipeStart(e);row.swipeMove({...e,clientX:dx,clientY:dy});row.swipeEnd(e);}
const swipePage=component('RecordingStorage');
swipeStorageRow(swipePage.renderVals().rows.find(n=>n.id==='pcb'),60);assert(!swipePage.renderVals().confirming);
swipeStorageRow(swipePage.renderVals().rows.find(n=>n.id==='pcb'),110,150);assert(!swipePage.renderVals().confirming);
swipeStorageRow(swipePage.renderVals().rows.find(n=>n.id==='pcb'),110);assert(swipePage.renderVals().confirming);assert(!H.recordingDeleted('pcb'));swipePage.renderVals().cancelDelete();
swipeStorageRow(swipePage.renderVals().rows.find(n=>n.id==='processing'),110);assert(!swipePage.renderVals().confirming);
swipePage.renderVals().toggleBatch();swipeStorageRow(swipePage.renderVals().rows.find(n=>n.id==='pcb'),110);assert(!swipePage.renderVals().confirming);
console.log('PASS: right swipe opens recording-only confirmation, threshold/vertical cancellation, busy and batch exclusions.');
const originalNotes=JSON.stringify(H.state.notes),originalActions=JSON.stringify(H.state.actions),used=H.storageUsed();
const storage=component('RecordingStorage');storage.renderVals().changeSort({target:{value:'largest'}});
let rows=storage.renderVals().rows;assert(rows.every((n,i)=>!i||rows[i-1].bytes>=n.bytes));
const pcb=rows.find(n=>n.id==='pcb');pcb.remove();assert(storage.renderVals().confirming);storage.renderVals().confirmDelete();
assert(H.recordingDeleted('pcb'));assert(H.storageUsed()<used);assert.equal(JSON.stringify(H.state.notes),originalNotes);assert.equal(JSON.stringify(H.state.actions),originalActions);
location.search='?id=pcb';let detail=component('ThoughtDetail');assert(detail.renderVals().playerCards[0].deleted);detail.play();assert(!detail.state.playing);assert.equal(detail.renderVals().organizedContent,H.note('pcb').summary);
storage.renderVals().undo();assert.equal(H.storageUsed(),used);assert(!H.recordingDeleted('pcb'));
assert.equal(H.deleteRecordings(['uploading','processing']).length,0);
storage.renderVals().toggleBatch();storage.renderVals().selectAll();const count=storage.renderVals().selectedCount;assert(count>1);storage.renderVals().deleteSelected();storage.renderVals().confirmDelete();assert.equal(storage.renderVals().selectedCount,0);assert.equal(JSON.stringify(H.state.notes),originalNotes);assert.equal(JSON.stringify(H.state.actions),originalActions);storage.renderVals().undo();assert.equal(H.storageUsed(),used);
const merged=H.mergeNotes(['ces','home']);assert.equal(H.storageUsed(),used);const snapshot=JSON.stringify(H.state.notes),actions=JSON.stringify(H.state.actions);H.deleteRecordings([merged.id]);assert(H.recordingDeleted('ces')&&H.recordingDeleted('home'));assert.equal(JSON.stringify(H.state.notes),snapshot);assert.equal(JSON.stringify(H.state.actions),actions);location.search='?id='+merged.id;detail=component('ThoughtDetail');assert(detail.renderVals().playerCards.every(c=>c.deleted));
for(const page of ['MeScreen','UsageStats','SubscriptionDetail'])assert.equal(component(page).renderVals().storageText,H.storageQuota().storageText);
console.log('PASS: storage sort, single/bulk delete and undo, processing protection, merged-file deduplication, playback blocked, all text/actions preserved, quotas synchronized.');
