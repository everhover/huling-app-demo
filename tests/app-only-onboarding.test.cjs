const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function fixture(){
  let now=Date.UTC(2026,9,14,8),seq=0;const timers=new Map(),storage={};
  class ClockDate extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
  const schedule=(fn,ms,interval=0)=>{const id=++seq;timers.set(id,{fn,at:now+ms,interval});return id;};
  const ctx={window:{addEventListener(){},removeEventListener(){}},document:{addEventListener(){},removeEventListener(){},createElement(){return{};},head:{appendChild(){}}},location:{pathname:'/FeedHealth.dc.html',search:'',reload(){}},URLSearchParams,Date:ClockDate,
    localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},setTimeout:(fn,ms)=>schedule(fn,ms),setInterval:(fn,ms)=>schedule(fn,ms,ms),clearTimeout:id=>timers.delete(id),clearInterval:id=>timers.delete(id)};
  vm.createContext(ctx);for(const name of ['demo-seed.js','demo.js','app-only-feed.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx);
  function advance(ms){const end=now+ms;while(true){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;const[id,t]=next;now=t.at;if(t.interval)t.at+=t.interval;else timers.delete(id);t.fn();}now=end;}
  const component=()=>({state:{},aoAddRef:{current:null},aoDialogRef:{current:null},setState(patch){Object.assign(this.state,patch);}});
  const button={setPointerCapture(){},hasPointerCapture(){return true;},releasePointerCapture(){}};
  const pointer={isPrimary:true,button:0,pointerId:1,currentTarget:button,preventDefault(){}};
  return{H:ctx.window.Huling,flow:ctx.window.HulingAppOnlyFeed,advance,component,pointer};
}
test('long press creates one recording; cancel and short taps leave an empty account',()=>{
  const{H,flow,component,pointer,advance}=fixture();H.beginAppOnly();
  assert.equal(H.state.notes.length,0);assert.equal(H.state.actions.length,0);assert.equal(H.ledger().length,0);assert.equal(H.storageUsed(),0);
  const c=component(),cleanup=flow.mount(c);let vals=()=>flow.vals(c);
  vals().aoPointerDown(pointer);advance(449);assert.equal(c.state.aoRecording,undefined);vals().aoPointerUp(pointer);advance(1000);assert.equal(H.state.notes.length,0);
  vals().aoPointerDown(pointer);advance(450);assert.equal(c.state.aoRecording,true);vals().aoPointerCancel();assert.equal(c.state.aoRecording,false);assert.equal(H.state.notes.length,0);
  vals().aoPointerDown(pointer);advance(450);advance(1600);vals().aoPointerUp(pointer);assert.equal(H.state.notes.length,1);assert.equal(H.state.notes[0].duration,2);assert.equal(H.state.notes[0].status,'uploading');cleanup();
});
test('upload, transcription and organizing complete before the optional permissions appear',()=>{
  const{H,flow,component,pointer,advance}=fixture();H.beginAppOnly();const c=component(),cleanup=flow.mount(c),vals=()=>flow.vals(c);
  vals().aoPointerDown(pointer);advance(500);vals().aoPointerUp(pointer);advance(1000);
  const note=H.state.notes[0];assert.equal(note.uploadProgress,50);assert.equal(note.status,'uploading');assert.equal(!!c.state.aoPermissionOpen,false);
  advance(1000);assert.equal(note.phase,'transcribing');assert.equal(!!c.state.aoPermissionOpen,false);
  advance(1500);assert.equal(note.phase,'organizing');assert.equal(!!c.state.aoPermissionOpen,false);
  advance(1200);assert.equal(note.status,'ready');assert.ok(note.summary.length);assert.ok(note.segs.length);assert.equal(H.actionsFor(note.id).length,2);assert.equal(c.state.aoPermissionOpen,true);
  vals().aoToggleNotification();assert.equal(H.setting('transcription-success-notify'),true);assert.equal(H.setting('calendar-access'),false);
  vals().aoClosePermissions();assert.equal(H.setting('app-only-permissions-dismissed'),true);assert.equal(c.state.aoPermissionOpen,false);
  vals().aoPointerDown(pointer);advance(500);vals().aoPointerUp(pointer);advance(4700);assert.equal(H.state.notes.length,2);assert.equal(c.state.aoPermissionOpen,false);cleanup();
});
test('leaving during upload resumes without duplicating the note; hardware demos restore fixtures',()=>{
  const{H,flow,component,pointer,advance}=fixture();H.beginAppOnly();const first=component(),cleanup=flow.mount(first);
  flow.vals(first).aoPointerDown(pointer);advance(500);flow.vals(first).aoPointerUp(pointer);advance(700);cleanup();
  const c=component(),stop=flow.mount(c);advance(5000);assert.equal(H.state.notes.length,1);assert.equal(H.state.notes[0].status,'ready');assert.equal(H.state.actions.length,2);stop();
  H.endAppOnly();assert.ok(H.state.notes.length>2);assert.ok(H.state.actions.length>2);assert.notEqual(H.setting('app-only-onboarding'),true);
});
