const fs=require('fs'),vm=require('vm'),assert=require('assert');
const path=require('path');const root=path.resolve(__dirname,'..')+path.sep;const mem={};
const location={pathname:'/FeedCompact.dc.html',search:'',href:'',reload(){},replace(url){this.href=url;}};
const ctx={window:{},location,URLSearchParams,localStorage:{getItem:k=>mem[k]||null,setItem:(k,v)=>mem[k]=v},document:{addEventListener(){},createElement(){return {}},head:{appendChild(){}}},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},React:{createRef:()=>({current:null})},CustomEvent:class{}};
vm.createContext(ctx);for(const f of ['demo-seed.js','demo.js'])vm.runInContext(fs.readFileSync(root+f,'utf8'),ctx);
const H=ctx.window.Huling;
class Base{constructor(props){this.props=props;this.state={}}setState(p){this.state={...this.state,...(typeof p==='function'?p(this.state):p)}}}
ctx.DCLogic=Base;
function component(name,props={}){const html=fs.readFileSync(root+name+'.dc.html','utf8'),s=html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];const C=vm.runInContext('(function(){'+s+';return Component;})()',ctx);return new C(props)}
for(const n of H.state.notes){location.search='?id='+n.id;const d=component('ThoughtDetail');const v=d.renderVals();assert.equal(v.d.title,n.title);assert.equal(v.total,Math.floor(n.duration/60)+':'+String(n.duration%60).padStart(2,'0'));assert.equal(v.isBusy,n.status!=='ready');for(const a of d.actionItems(d.data()))assert.equal(a.noteId,n.id);}
location.search='?id=pcb';let d=component('ThoughtDetail');assert.equal(d.renderVals().todoRows.filter(a=>a.isPending).length,1);assert(d.renderVals().scheduleShowBulkActions);
let before=H.pending().length;d.renderVals().todoRows.find(a=>a.isPending).confirm();assert.equal(H.pending().length,before-1);assert(!H.actionsFor('pcb').find(a=>a.title==='核对报价单中的 3 处差异').ignored);
location.search='';let t=component('TodoList');assert.equal(t.todos.find(a=>a.title==='核对报价单中的 3 处差异').status,'open');
let rv=t.renderVals();let row=rv.groups.flatMap(g=>g.items).find(a=>a.title==='核对报价单中的 3 处差异');row.tap();assert(location.href.startsWith('TodoDetail.dc.html?'));t.setState({editing:row.id});t.renderVals().onTitle({target:{value:'核对 PCB 报价差异'}});assert(H.actionsFor('pcb').some(a=>a.title==='核对 PCB 报价差异'));
let p=component('PendingReview');before=H.pending().length;const first=p.items[0];p.remove([first.id],'忽略');assert.equal(H.pending().length,before-1);p.renderVals().undo();assert.equal(H.pending().length,before);
p=component('PendingReview');const pendingBeforeAll=H.pending().length;p.renderVals().confirmAll();assert.equal(H.pending().length,0);assert(p.renderVals().empty);p.renderVals().undo();assert.equal(H.pending().length,pendingBeforeAll);
location.search='?id=pcb';d=component('ThoughtDetail');const s=d.renderVals().scheduleRows.find(a=>a.isPending);s.ignore();assert(H.actionsFor('pcb').find(a=>a.id===s.id).ignored);d.renderVals().scheduleRows.find(a=>a.id===s.id).tap();assert(!H.actionsFor('pcb').find(a=>a.id===s.id).ignored);
location.search='';let sch=component('ScheduleList');const ev=sch.events.find(a=>a.noteId==='pcb');const sr=sch.renderVals().groups.flatMap(g=>g.items).find(a=>a.id===ev.id);sr.tap();sch.renderVals().onPlace({target:{value:'测试会议室'}});assert.equal(H.actionsFor('pcb').find(a=>a.id===ev.id).place,'测试会议室');
let deleted=sch.events[0];sch.setState({events:sch.events.filter(a=>a.id!==deleted.id)});assert(!H.state.actions.some(a=>a.id===deleted.id));sch.setState({events:[...sch.events,deleted]});assert(H.state.actions.some(a=>a.id===deleted.id));
let search=component('Search');search.renderVals().onQuery({target:{value:'PCB'}});assert(search.renderVals().results.some(n=>n.id==='pcb'));
console.log('PASS: every note content/duration/state, linked actions, confirmation, todo editing, pending ignore/undo/bulk, detail restore, schedule editing and search.');

// Pending rows open editing directly, while actions and selection remain independent.
p=component('PendingReview');
let pendingRow=p.renderVals().groups.flatMap(g=>g.items)[0];
pendingRow.tap();assert.equal(p.state.editing,pendingRow.id);
p.renderVals().onTitle({target:{value:'直接点击编辑测试'}});
assert.equal(H.state.actions.find(a=>a.id===pendingRow.id).title,'直接点击编辑测试');
p.renderVals().cancelEdit();assert.equal(p.state.editing,null);
let stopped=false;const actionCount=H.pending().length;
p.renderVals().groups.flatMap(g=>g.items)[0].confirm({stopPropagation(){stopped=true;}});
assert(stopped);assert.equal(p.state.editing,null);assert.equal(H.pending().length,actionCount-1);
p.renderVals().undo();p.renderVals().enterSelect();
pendingRow=p.renderVals().groups.flatMap(g=>g.items)[0];pendingRow.tap();
assert(p.sel().has(pendingRow.id));assert.equal(p.state.editing,null);
console.log('PASS: pending row direct editing, action propagation, confirmation and batch selection.');

// Explicit feed reload resets only reading flags; navigation/history keeps them.
const script=fs.readFileSync(root+'demo.js','utf8');
const session={};let pageshow;
ctx.sessionStorage={getItem:k=>session[k]||null,setItem:(k,v)=>session[k]=v,removeItem:k=>delete session[k]};
ctx.window.addEventListener=(event,handler)=>{if(event==='pageshow')pageshow=handler;};
let navigationType='navigate';ctx.performance={getEntriesByType:()=>[{type:navigationType}]};
H.markRead('ces');
const actionsBefore=JSON.stringify(H.state.actions);
vm.runInContext(script,ctx);assert.equal(ctx.window.Huling.note('ces').unread,false);
navigationType='reload';location.pathname='/ThoughtDetail.dc.html';
vm.runInContext(script,ctx);assert.equal(ctx.window.Huling.note('ces').unread,true);
location.pathname='/FeedCompact.dc.html';
vm.runInContext(script,ctx);
for(const initial of ctx.window.HulingSeed.notes)assert.equal(ctx.window.Huling.note(initial.id).unread,!!initial.unread);
assert.equal(JSON.stringify(ctx.window.Huling.state.actions),JSON.stringify(ctx.window.HulingSeed.actions));
ctx.window.Huling.markRead('ces');pageshow({persisted:true});
vm.runInContext(script,ctx);assert.equal(ctx.window.Huling.note('ces').unread,false);
vm.runInContext(script,ctx);assert.equal(ctx.window.Huling.note('ces').unread,true);
console.log('PASS: manual refresh resets seed data on all pages; history return preserves current operations.');

for(const file of ['FeedCompact.dc.html','PendingReview.dc.html','TodoList.dc.html','ScheduleList.dc.html','ThoughtDetail.dc.html','TodoDetail.dc.html']){
 const api=ctx.window.Huling;api.updateNote('ces',{summary:'edited'});api.updateAction(api.state.actions[0].id,{status:'done',title:'edited'});api.archiveNote('run');api.mergeNotes(['ces','pcb']);
 location.pathname='/'+file;location.search='';navigationType='reload';vm.runInContext(script,ctx);
 assert.equal(JSON.stringify(ctx.window.Huling.state),JSON.stringify(ctx.window.HulingSeed));
}
ctx.window.Huling.complete('uploading');vm.runInContext(script,ctx);assert.equal(ctx.window.Huling.note('uploading').status,'processing');
location.pathname='/ThoughtDetail.dc.html';location.search='?id=merged-test';vm.runInContext(script,ctx);assert.equal(location.href,'FeedCompact.dc.html');
location.pathname='/FeedCompact.dc.html';location.search='';navigationType='navigate';
for(const name of ['TodoList','ScheduleList']){
  ctx.window.Huling.reset();const list=component(name);
  const rows=()=>list.renderVals().groups.flatMap(g=>g.items);
  let item=rows().find(i=>i.isPending);assert(item.showActions);assert.equal(item.actionSpace,'120px');
  let stopped=false;item.ignore({stopPropagation(){stopped=true;}});assert(stopped);
  assert(ctx.window.Huling.state.actions.find(a=>a.id===item.id).ignored);
  list.renderVals().undo();assert(!ctx.window.Huling.state.actions.find(a=>a.id===item.id).ignored);
  item=rows().find(i=>i.id===item.id);item.confirm({stopPropagation(){}});
  assert(!rows().find(i=>i.id===item.id).showActions);
  assert(rows().find(i=>i.id===item.id));
  item=rows().find(i=>i.isPending);item.tap();if(name==='TodoList')assert(location.href.startsWith('TodoDetail.dc.html?'));else assert(rows().find(i=>i.id===item.id).isEditing);
}
console.log('PASS: todo/schedule pending actions, ignore undo, confirmation retains row and direct editing.');
const feed=component('FeedCompact');const feedCount=feed.renderVals().items.length;
feed.renderVals().toggleSearch();assert(feed.renderVals().searchOpen);
feed.renderVals().onSearch({target:{value:'PCB'}});assert(feed.renderVals().items.some(n=>n.id==='pcb'));assert(feed.renderVals().items.length<feedCount);
feed.renderVals().onSearch({target:{value:'zzzz-no-match'}});assert(feed.renderVals().noSearchResults);assert.equal(feed.renderVals().groups.length,0);
feed.renderVals().searchKey({key:'Escape'});assert(!feed.renderVals().searchOpen);assert.equal(feed.renderVals().items.length,feedCount);
console.log('PASS: inline feed search, matching, empty state and close restores list.');

feed.renderVals().toggleSearch();feed.renderVals().onSearch({target:{value:'PCB'}});
const insideSearch={};feed.searchContainerRef.current={contains:target=>target===insideSearch};
feed.onOutsideSearch({target:insideSearch});assert(feed.renderVals().searchOpen);assert.equal(feed.renderVals().query,'PCB');
feed.onOutsideSearch({target:{}});assert(!feed.renderVals().searchOpen);assert.equal(feed.renderVals().query,'');assert.equal(feed.renderVals().items.length,feedCount);
console.log('PASS: outside pointer closes search; inside pointer preserves input.');

const batteryFeed=component('FeedCompact');const green=batteryFeed.renderVals().batteryColor;
assert(batteryFeed.renderVals().batteryLabel.includes('高于 60%'));
batteryFeed.renderVals().cycleBattery();assert(batteryFeed.renderVals().batteryLabel.includes('20% 到 60%'));assert.notEqual(batteryFeed.renderVals().batteryColor,green);
batteryFeed.renderVals().cycleBattery();assert(batteryFeed.renderVals().batteryLabel.includes('低于 20%'));
batteryFeed.renderVals().cycleBattery();assert.equal(batteryFeed.renderVals().batteryColor,green);
console.log('PASS: battery demo cycles green, yellow, red, then green.');
function drag(handlers,dx,dy=0,cancel=false){
 const row={style:{},parentElement:{dataset:{}},setPointerCapture(){},hasPointerCapture(){return false;}};
 const event={isPrimary:true,button:0,pointerId:1,clientX:150,clientY:0,target:{closest(){return null;}},currentTarget:row,preventDefault(){}};
 handlers.swipeStart(event);handlers.swipeMove({...event,clientX:150+dx,clientY:dy});
 if(cancel)handlers.swipeCancel();else handlers.swipeEnd({...event,clientX:150+dx,clientY:dy});
}
for(const name of ['PendingReview','TodoList','ScheduleList']){
 ctx.window.Huling.reset();const list=component(name);
 const rows=()=>list.renderVals().groups.flatMap(g=>g.items);
 const item=rows().find(i=>i.isPending || i.status==='pending');
 const status=()=>ctx.window.Huling.state.actions.find(a=>a.id===item.id).status;
 drag(item,40);assert.equal(status(),'pending');
 drag(item,-40);assert.equal(status(),'pending');
 drag(item,-100,130);assert.equal(status(),'pending');
 drag(item,-110,0,true);assert.equal(status(),'pending');
 drag(item,-110);assert.equal(status(),name==='ScheduleList'||item.type==='sched'?'ok':'open');
 if(name==='TodoList'){
  drag(rows().find(i=>i.id===item.id),-110);assert.equal(status(),'done');
  drag(rows().find(i=>i.id===item.id),-110);assert.equal(status(),'done');
 }
 list.renderVals().undo();assert.equal(status(),name==='TodoList'?'open':'pending');
}
console.log('PASS: left-swipe confirmation across all lists, todo completion, threshold, vertical scroll, cancellation and undo.');
let outsideListener, deferred;
const savedTimeout=ctx.setTimeout;
ctx.setTimeout=fn=>{deferred=fn;return 1;};
ctx.document.addEventListener=(name,fn)=>{if(name==='click')outsideListener=fn;};
ctx.document.removeEventListener=(name,fn)=>{if(outsideListener===fn)outsideListener=null;};
for(const name of ['PendingReview','ScheduleList','ThoughtDetail']){
 ctx.window.Huling.reset();location.search=name==='ThoughtDetail'?'?id=pcb':'';
 const editor=component(name);const vals=()=>editor.renderVals();
 const rows=()=>name==='ThoughtDetail'?vals().todoRows:vals().groups.flatMap(g=>g.items);
 const row=rows()[0];row.tap();assert.equal(editor.state.editing,row.id);
 const inside={};editor.editRegionRef.current={contains:target=>target===inside};
 const cleanup=ctx.window.Huling.bindOutsideEditor(editor);
 deferred=null;outsideListener({target:inside});assert.equal(deferred,null);
 vals().onTitle({target:{value:'保留外部收起前的修改'}});
 outsideListener({target:{}});deferred();assert.equal(editor.state.editing,null);
 assert(ctx.window.Huling.state.actions.some(a=>a.id===row.id&&a.title==='保留外部收起前的修改'));
 row.tap();outsideListener({target:{}});editor.setState({editing:'another-item'});deferred();assert.equal(editor.state.editing,'another-item');
 cleanup();assert.equal(outsideListener,null);
}
ctx.setTimeout=savedTimeout;
console.log('PASS: outside editor collapse on all four pages, inside controls, saved edits, switching rows and listener cleanup.');
for(const name of ['PendingReview','TodoList','ScheduleList']){
 ctx.window.Huling.reset();location.search='';const page=component(name);
 const values=()=>page.renderVals();const initial=values().groups.flatMap(g=>g.items).length;
 const green=values().batteryColor;values().cycleBattery();assert.notEqual(values().batteryColor,green);values().cycleBattery();values().cycleBattery();assert.equal(values().batteryColor,green);
 values().toggleSearch();assert(values().searchOpen);assert.equal(values().tabsVisibility,'hidden');
 values().onSearch({target:{value:'PCB'}});assert(values().groups.flatMap(g=>g.items).length>0);
 values().onSearch({target:{value:'zzzz-no-match'}});assert(values().noSearchResults);
 values().searchKey({key:'Escape'});assert(!values().searchOpen);assert.equal(values().groups.flatMap(g=>g.items).length,initial);
 let outside;ctx.document.addEventListener=(type,fn)=>{if(type==='pointerdown')outside=fn;};
 const cleanup=ctx.window.Huling.bindHeader(page);const inside={};page.headerContainerRef.current={contains:t=>t===inside};
 values().toggleSearch();outside({target:inside});assert(values().searchOpen);outside({target:{}});assert(!values().searchOpen);cleanup();
}
console.log('PASS: shared headers on pending, todo and schedule: battery cycle, inline search, no results, Escape and outside dismissal.');

for(const name of ['PendingReview','TodoList','ScheduleList']){
 ctx.window.Huling.reset();location.search='';const list=component(name);
 const rows=()=>list.renderVals().groups.flatMap(g=>g.items);
 let item=rows().find(i=>i.isPending||i.status==='pending');
 drag(item,110,0,true);assert(!ctx.window.Huling.state.actions.find(a=>a.id===item.id).ignored);
 drag(item,110);assert(ctx.window.Huling.state.actions.find(a=>a.id===item.id).ignored);assert(!rows().some(i=>i.id===item.id));
 list.renderVals().undo();assert(!ctx.window.Huling.state.actions.find(a=>a.id===item.id).ignored);assert(rows().some(i=>i.id===item.id));
 if(name==='TodoList'){
  item=rows().find(i=>i.isOpen);const position=rows().findIndex(i=>i.id===item.id);drag(item,110);assert.equal(rows().findIndex(i=>i.id===item.id),position);assert.equal(rows().find(i=>i.id===item.id).deco,'line-through');list.commitDeletion();assert(!ctx.window.Huling.state.actions.some(a=>a.id===item.id));assert(ctx.window.Huling.state.deletedActions.some(a=>a.id===item.id));
  list.renderVals().undo();assert(ctx.window.Huling.state.actions.some(a=>a.id===item.id));
 }
}
console.log('PASS: right swipe ignores pending items, deletes confirmed todos, supports cancellation and undo.');
for(const name of ['TodoList','ScheduleList']){
 ctx.window.Huling.reset();const list=component(name), rows=()=>list.renderVals().groups.flatMap(g=>g.items);
 const item=rows().find(i=>!i.isPending);const index=rows().findIndex(i=>i.id===item.id);
 let next,queued;ctx.document.addEventListener=(type,fn)=>{if(type==='pointerup')next=fn;};
 ctx.setTimeout=fn=>{queued=fn;return 1;};
 const cleanup=ctx.window.Huling.bindPendingDeletion(list);
 list.stageDeletion(item.id);assert.equal(rows().findIndex(i=>i.id===item.id),index);assert.equal(rows()[index].deco,'line-through');
 next({target:{closest:()=>true}});list.renderVals().undo();assert(!list.state.pendingDelete);assert.equal(rows()[index].deco,'none');
 list.stageDeletion(item.id);next({target:{closest:()=>false}});queued();
 assert(!rows().some(i=>i.id===item.id));assert(ctx.window.Huling.state.deletedActions.some(i=>i.id===item.id));
 list.renderVals().undo();assert(rows().some(i=>i.id===item.id));assert(!ctx.window.Huling.state.deletedActions.some(i=>i.id===item.id));cleanup();
}
ctx.setTimeout=savedTimeout;
console.log('PASS: deletion remains struck through in place, next interaction archives it, and undo restores before/after archival.');

ctx.window.Huling.reset();location.pathname='/TodoDetail.dc.html';
for(const todo of ctx.window.Huling.state.actions.filter(a=>a.type==='todo')){
 location.search='?'+new URLSearchParams({id:todo.id});const detail=component('TodoDetail');let v=detail.renderVals();
 assert(v.found);assert.equal(v.title,todo.title);assert(v.relatedNotes.some(n=>n.id===todo.noteId));
 assert(v.relatedTodos.every(t=>t.id!==todo.id&&t.type==='todo'));
 for(const n of v.relatedNotes)assert(ctx.window.Huling.note(n.id));
}
const todo=ctx.window.Huling.state.actions.find(a=>a.type==='todo'&&a.status==='pending');
location.search='?'+new URLSearchParams({id:todo.id});const detail=component('TodoDetail');
detail.renderVals().onTitle({target:{value:'详情编辑后的待办'}});detail.renderVals().onNote({target:{value:'备注测试'}});
detail.renderVals().onDate({target:{value:'2026-10-02'}});detail.renderVals().onTime({target:{value:'15:30'}});
assert.equal(todo.title,'详情编辑后的待办');assert.equal(todo.note,'备注测试');assert.equal(todo.date.m,9);assert.equal(todo.time,'15:30');
detail.renderVals().primary();assert.equal(todo.status,'open');detail.renderVals().primary();assert.equal(todo.status,'done');detail.renderVals().undo();assert.equal(todo.status,'open');
const source=detail.renderVals().relatedNotes.find(n=>n.id===todo.noteId);location.search=source.href.split('?')[1];ctx.window.Huling.back();assert.equal(new URLSearchParams(location.href.split('?')[1]).get('id'),todo.id);
location.search='?id=missing';assert(component('TodoDetail').renderVals().missing);
console.log('PASS: todo detail routing, all todo content, linked notes/tasks, persisted edits, confirmation/completion/undo, return link and missing item.');
ctx.window.Huling.reset();location.pathname='/TodoDetail.dc.html';
const main=ctx.window.Huling.state.actions.find(a=>a.type==='todo'&&a.noteId==='pcb'&&a.status!=='pending');
location.search='?'+new URLSearchParams({id:main.id});const updatedDetail=component('TodoDetail');
const related=component('RelatedTodos',{ids:updatedDetail.renderVals().relatedIdsString});
const pendingRelated=related.renderVals().todoRows.find(a=>a.isPending);assert(pendingRelated);
pendingRelated.confirm();assert.equal(ctx.window.Huling.state.actions.find(a=>a.id===pendingRelated.id).status,'open');assert(related.renderVals().todoRows.some(a=>a.id===pendingRelated.id));
related.renderVals().undo();related.renderVals().todoRows.find(a=>a.id===pendingRelated.id).ignore();assert(related.renderVals().todoRows.find(a=>a.id===pendingRelated.id).isIgnored);
related.renderVals().todoRows.find(a=>a.id===pendingRelated.id).tap();assert(!ctx.window.Huling.state.actions.find(a=>a.id===pendingRelated.id).ignored);
related.renderVals().todoRows.find(a=>a.id===pendingRelated.id).tap();assert.equal(related.state.editing,pendingRelated.id);
related.renderVals().onTitle({target:{value:'关联待办原位编辑'}});related.renderVals().dateOpts[1].pick();assert.equal(ctx.window.Huling.state.actions.find(a=>a.id===pendingRelated.id).title,'关联待办原位编辑');
assert.equal(ctx.window.Huling.state.actions.find(a=>a.id===main.id).title,main.title);
updatedDetail.renderVals().deleteMain();assert.equal(updatedDetail.renderVals().deco,'line-through');updatedDetail.renderVals().undo();assert(updatedDetail.renderVals().found);
updatedDetail.renderVals().deleteMain();updatedDetail.commitDeletion();assert(updatedDetail.renderVals().missing);updatedDetail.renderVals().undo();assert(updatedDetail.renderVals().found);
const detailHTML=fs.readFileSync(root+'TodoDetail.dc.html','utf8');assert(detailHTML.indexOf('相关待办 ·')<detailHTML.indexOf('相关笔记 ·'));assert(detailHTML.indexOf('onClick="{{ deleteMain }}"')>detailHTML.indexOf('相关笔记 ·'));
console.log('PASS: detail bottom actions and staged deletion, related todo ordering, inline edit, date selection, confirm, ignore/restore and undo.');
ctx.window.Huling.reset();location.pathname='/FeedCompact.dc.html';location.search='';
const swipeFeed=component('FeedCompact'),feedRows=()=>swipeFeed.renderVals().items;
const feedItem=feedRows().find(n=>n.id==='pcb'),feedPosition=feedRows().findIndex(n=>n.id===feedItem.id);
const actionsBeforeNoteDeletion=JSON.stringify(ctx.window.Huling.state.actions);
drag(feedItem,-110);assert(swipeFeed.state.selecting);swipeFeed.renderVals().exitSelection();assert(!swipeFeed.state.pendingDelete);drag(feedItem,40);assert(!swipeFeed.state.pendingDelete);drag(feedItem,110,0,true);assert(!swipeFeed.state.pendingDelete);
drag(feedItem,110);assert.equal(feedRows()[feedPosition].id,feedItem.id);assert.equal(feedRows()[feedPosition].deco,'line-through');
location.href='';feedRows()[feedPosition].open();assert.equal(location.href,'');
swipeFeed.renderVals().undoDeletion();assert.equal(feedRows()[feedPosition].deco,'none');
drag(feedRows()[feedPosition],110);let nextFeedOp,queuedFeedOp;
ctx.document.addEventListener=(type,fn)=>{if(type==='pointerup')nextFeedOp=fn;};ctx.setTimeout=fn=>{queuedFeedOp=fn;return 1;};
const disposeFeedDelete=ctx.window.Huling.bindPendingDeletion(swipeFeed);nextFeedOp({target:{closest:()=>false}});queuedFeedOp();
assert(!feedRows().some(n=>n.id===feedItem.id));assert(ctx.window.Huling.state.deletedNotes.some(n=>n.id===feedItem.id));assert(!component('Search').renderVals().results.some(n=>n.id===feedItem.id));assert.equal(JSON.stringify(ctx.window.Huling.state.actions),actionsBeforeNoteDeletion);
swipeFeed.renderVals().undoDeletion();assert.equal(feedRows()[feedPosition].id,feedItem.id);disposeFeedDelete();ctx.setTimeout=savedTimeout;
console.log('PASS: feed right swipe, threshold/cancel, strike in place, next-operation archival, search exclusion and undo without changing linked actions.');

ctx.window.Huling.reset();location.search='';const busyFeed=component('FeedCompact');
for(const status of ['uploading','processing']){
 const busy=busyFeed.renderVals().items.find(n=>n.status===status);assert(busy);
 drag(busy,110);assert(!busyFeed.state.pendingDelete);
 busyFeed.stageDeletion(busy.id);assert(!busyFeed.state.pendingDelete);
 assert(busyFeed.renderVals().items.some(n=>n.id===busy.id));
}
const readyFeedItem=busyFeed.renderVals().items.find(n=>n.status==='ready');drag(readyFeedItem,110);assert.equal(busyFeed.state.pendingDelete,readyFeedItem.id);
console.log('PASS: uploading/processing notes cannot be deleted; ready notes remain swipe-deletable.');

ctx.window.Huling.reset();location.pathname='/FeedCompact.dc.html';location.search='';
const multifeed=component('FeedCompact');const firstMerge=multifeed.renderVals().items.find(n=>n.id==='ces');
drag(firstMerge,-110);assert(multifeed.renderVals().selecting);assert.equal(multifeed.renderVals().selectionCount,1);assert(multifeed.renderVals().mergeDisabled);
multifeed.renderVals().items.find(n=>n.status==='uploading').open();assert.equal(multifeed.renderVals().selectionCount,1);
multifeed.renderVals().items.find(n=>n.id==='pcb').open();assert.equal(multifeed.renderVals().selectionCount,2);assert(!multifeed.renderVals().mergeDisabled);
const mergeDuration=ctx.window.Huling.note('ces').duration+ctx.window.Huling.note('pcb').duration;
multifeed.renderVals().mergeSelected();const mergedId=new URLSearchParams(location.href.split('?')[1]).get('id');const mergedNote=ctx.window.Huling.note(mergedId);
assert.equal(mergedNote.duration,mergeDuration);assert.equal(mergedNote.recordings.length,2);assert(mergedNote.summary.includes(ctx.window.Huling.note('ces').segs[0][1]));
assert(!component('FeedCompact').renderVals().items.some(n=>n.id==='ces'||n.id==='pcb'));
assert(ctx.window.Huling.state.actions.filter(a=>a.originalNoteId==='pcb').every(a=>a.noteId===mergedId));
location.pathname='/ThoughtDetail.dc.html';location.search='?'+new URLSearchParams({id:mergedId});const mergedDetail=component('ThoughtDetail');
assert.equal(mergedDetail.renderVals().playerCards.length,2);assert.equal(mergedDetail.renderVals().playerCards[0].title,mergedNote.recordings[0].title);assert.equal(mergedDetail.renderVals().playerCards[1].total,mergedDetail.fmt(mergedNote.recordings[1].duration));assert(mergedDetail.renderVals().isMerged);assert.equal(mergedDetail.renderVals().recordingCount,2);
mergedDetail.setState({playing:true,t:5});mergedDetail.renderVals().onRecordingScroll({currentTarget:{clientWidth:300,scrollLeft:300}});assert.equal(mergedDetail.state.recordingIndex,1);assert.equal(mergedDetail.state.t,0);assert(!mergedDetail.state.playing);assert.equal(mergedDetail.data().dur,mergedNote.recordings[1].duration);
assert.equal(mergedDetail.data().segs[0][1],mergedNote.recordings[1].segs[0][1]);mergedDetail.renderVals().playerCards[1].bars[28].seek();assert.equal(mergedDetail.state.t,mergedNote.recordings[1].duration/2);mergedDetail.renderVals().playerCards[1].cycleRate();assert.equal(mergedDetail.state.rate,1.5);
assert.equal(ctx.window.Huling.mergeNotes(['processing','uploading']),null);assert.equal(ctx.window.Huling.mergeNotes([mergedId,mergedId]),null);
location.pathname='/FeedCompact.dc.html';location.search='';ctx.window.Huling.reset();const batchDeleteFeed=component('FeedCompact');
drag(batchDeleteFeed.renderVals().items.find(n=>n.id==='ces'),-110);batchDeleteFeed.renderVals().items.find(n=>n.id==='pcb').open();batchDeleteFeed.renderVals().deleteSelected();assert.equal(batchDeleteFeed.renderVals().items.filter(n=>n.deco==='line-through').length,2);batchDeleteFeed.commitDeletion();assert(!batchDeleteFeed.renderVals().items.some(n=>n.id==='ces'||n.id==='pcb'));batchDeleteFeed.undoDeletion();assert(batchDeleteFeed.renderVals().items.some(n=>n.id==='ces'));assert(batchDeleteFeed.renderVals().items.some(n=>n.id==='pcb'));
console.log('PASS: left-swipe selection, eligibility, multi-delete undo, merge persistence/durations/transcripts/linked actions and horizontal recording switch.');


for(const name of ['ThoughtDetail','RelatedTodos']){
 ctx.window.Huling.reset();location.pathname='/ThoughtDetail.dc.html';location.search='?id=pcb';
 const ids=ctx.window.Huling.state.actions.filter(a=>a.noteId==='pcb'&&a.type==='todo').map(a=>a.id).join(',');
 const view=component(name,{ids}),rows=()=>[...view.renderVals().todoRows,...view.renderVals().scheduleRows];
 const pending=rows().find(a=>a.isPending);drag(pending,-110);assert.equal(ctx.window.Huling.state.actions.find(a=>a.id===pending.id).status,'open');view.renderVals().undo();
 drag(rows().find(a=>a.id===pending.id),110);assert(rows().find(a=>a.id===pending.id).isIgnored);rows().find(a=>a.id===pending.id).tap();assert(!ctx.window.Huling.state.actions.find(a=>a.id===pending.id).ignored);
 const open=rows().find(a=>a.type==='todo'&&a.status==='open');drag(open,-110);assert.equal(ctx.window.Huling.state.actions.find(a=>a.id===open.id).status,'done');view.renderVals().undo();
 drag(rows().find(a=>a.id===open.id),110);assert.equal(view.state.pendingDelete,open.id);assert.equal(rows().find(a=>a.id===open.id).deco,'line-through');view.commitDeletion();assert(!rows().some(a=>a.id===open.id));assert(ctx.window.Huling.state.deletedActions.some(a=>a.id===open.id));view.renderVals().undo();assert(rows().some(a=>a.id===open.id));assert(!ctx.window.Huling.state.deletedActions.some(a=>a.id===open.id));
 if(name==='ThoughtDetail'){
  const event=rows().find(a=>a.type==='schedule'&&a.isPending);drag(event,-110);assert.equal(ctx.window.Huling.state.actions.find(a=>a.id===event.id).status,'ok');drag(rows().find(a=>a.id===event.id),110);assert.equal(view.state.pendingDelete,event.id);view.renderVals().undo();
 }
 const editable=rows().find(a=>a.type==='todo');editable.tap();drag(rows().find(a=>a.id===editable.id),110);assert(!view.state.pendingDelete);
}
console.log('PASS: detail/related row swipes, confirm/ignore/restore, completion, staged delete/archive/undo and edit gesture exclusion.');


ctx.window.Huling.reset();location.pathname='/FeedCompact.dc.html';location.search='';
const sortApi=ctx.window.Huling;
sortApi.state.notes.push({...sortApi.note('uploading'),id:'upload-old',group:2,uploadStartedAt:100},{...sortApi.note('uploading'),id:'upload-new',group:1,uploadStartedAt:200});
sortApi.updateNote('context',{summary:'最近编辑的旧笔记'});
const mergedSort=sortApi.mergeNotes(['ces','home']);mergedSort.updatedAt=sortApi.note('context').updatedAt+1;
const sortedFeed=component('FeedCompact').renderVals();const sortedItems=sortedFeed.items,renderedItems=sortedFeed.groups.flatMap(g=>g.items);
assert.equal(sortedItems.find(n=>n.id==='context').createdDate,'2026-09-24');assert(/^\d{4}-\d{2}-\d{2}$/.test(sortedItems.find(n=>n.id===mergedSort.id).createdDate));assert.equal(sortedItems[0].id,'upload-old');assert.equal(sortedItems[1].id,'upload-new');
for(const ordered of [sortedItems,renderedItems]){
 for(let i=1;i<ordered.length;i++)assert(sortApi.notePriority(ordered[i-1])<=sortApi.notePriority(ordered[i]));
 assert(ordered.findIndex(n=>n.id==='processing')<ordered.findIndex(n=>n.id===mergedSort.id));
 assert(ordered.findIndex(n=>n.id===mergedSort.id)<ordered.findIndex(n=>n.id==='context'));
}
const previousUpdate=sortApi.note('context').updatedAt;sortApi.updateNote('context',{summary:sortApi.note('context').summary});assert.equal(sortApi.note('context').updatedAt,previousUpdate);
console.log('PASS: upload-start ordering, processing priority, recent edit/merge priority across date groups and unchanged edits.');

(async()=>{
 ctx.window.Huling.reset();location.pathname='/ThoughtDetail.dc.html';location.search='?id=ces';
 const editable=component('ThoughtDetail');const originalSegments=JSON.stringify(ctx.window.Huling.note('ces').segs);
 const revised='新的整理内容\n第二段保留换行。';editable.renderVals().onContent({target:{value:revised}});
 assert.equal(ctx.window.Huling.note('ces').summary,revised);assert.equal(component('ThoughtDetail').renderVals().organizedContent,revised);
 assert.equal(JSON.parse(mem['huling-interactive-demo-v1']).notes.find(n=>n.id==='ces').summary,revised);
 assert.equal(JSON.stringify(ctx.window.Huling.note('ces').segs),originalSegments);
 let clipboardText;ctx.navigator={clipboard:{writeText:async text=>{clipboardText=text;}}};
 await editable.renderVals().copyNote();assert.equal(clipboardText,ctx.window.Huling.note('ces').title+'\n\n'+revised);assert.equal(editable.renderVals().copyMessage,'已复制');
 editable.renderVals().onContent({target:{value:''}});assert.equal(component('ThoughtDetail').renderVals().organizedContent,'');
 const copy=ctx.window.Huling.copyText;ctx.window.Huling.copyText=async()=>{throw new Error('denied');};await editable.renderVals().copyNote();assert.equal(editable.renderVals().copyMessage,'复制失败，请重试');ctx.window.Huling.copyText=copy;
 console.log('PASS: organized content live persistence, multiline/empty text, complete title/body copy, failure feedback and original transcript preservation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
