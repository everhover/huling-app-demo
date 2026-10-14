/* Shared local demo data and navigation. No real calendar, health or device APIs. */
(() => {
  const KEY = 'huling-interactive-demo-v1';
  const clone = x => JSON.parse(JSON.stringify(x));
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch (_) {}
  if (!state || !Array.isArray(state.notes) || !Array.isArray(state.actions)) state = clone(window.HulingSeed);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };
  const params = () => new URLSearchParams(location.search);
  const page = () => decodeURIComponent(location.pathname.split('/').pop());
  function beginAppOnly() {
    state.notes=[];state.actions=[];state.ledger=[];state.deletedNotes=[];state.deletedActions=[];state.deletedRecordings={};
    Object.assign(state.settings,{'app-only-onboarding':true,'device-bound':false,connected:false,'calendar-access':false,'transcription-success-notify':false,'todo-reminder-notify':false,'schedule-reminder-notify':false,'app-only-permissions-ready':false,'app-only-permissions-dismissed':false});
    save();
  }
  function endAppOnly() {
    if(!state.settings['app-only-onboarding'])return;
    const phone=state.settings['login-phone'];state=clone(window.HulingSeed);
    if(phone)state.settings['login-phone']=phone;
    save();
  }
  // A history-cache refresh updates shared data without resetting reading progress.
  const historyRefreshKey = KEY + ':history-refresh';
  let historyRefresh = false;
  try {
    historyRefresh = sessionStorage.getItem(historyRefreshKey) === location.pathname;
    sessionStorage.removeItem(historyRefreshKey);
  } catch (_) {}
  const navigation = typeof performance !== 'undefined' ? performance.getEntriesByType('navigation')[0] : null;
  const manualReload = navigation?.type === 'reload' && !historyRefresh;
  if (manualReload) {
    const appOnly=state.settings['app-only-onboarding']&&!/^Onboarding|^Launch|^Login/.test(page());
    state = clone(window.HulingSeed);
    if(appOnly||params().get('appOnly')==='1')beginAppOnly();else save();
    if(appOnly&&page()==='ThoughtDetail.dc.html')window.DemoVersion.replace('FeedHealth.dc.html?appOnly=1');
    // A merged thought disappears when the demo resets; return to the initial feed.
    if (page() === 'ThoughtDetail.dc.html' && params().get('id')?.startsWith('merged-')) {
      window.DemoVersion.replace('FeedCompact.dc.html');
    }
  }
  if(params().get('appOnly')==='1'&&!state.settings['app-only-onboarding'])beginAppOnly();
  // Anchor the five-tab demo to today once per day, without undoing user actions on navigation.
  if(page()==='HomeTest.dc.html'||params().has('homeTest')) {
    const today=new Date();today.setHours(0,0,0,0);
    const key=today.toLocaleDateString('en-CA');
    if(state.homeFixtureDate!==key){
      const overdue=['todo:a1','todo:a2'], current=['todo:b1','todo:b2','todo:b5','todo:c1'];
      let future=1;
      state.actions.forEach(a=>{
        if(a.type!=='todo'||!a.date)return;
        const offset=overdue.includes(a.id)?-1:current.includes(a.id)?0:future++;
        const date=new Date(today);date.setDate(date.getDate()+offset);
        a.date={y:date.getFullYear(),m:date.getMonth(),d:date.getDate()};
      });
      state.homeFixtureDate=key;save();
    }
  }
  const go = (file, args = {}) => { window.DemoVersion.go(file + (Object.keys(args).length ? '?' + new URLSearchParams(args) : '')); };
  const note = id => state.notes.find(n => n.id === id || n.title === id);
  const pending = () => state.actions.filter(a => a.status === 'pending' && !a.ignored);
  const dateLabel = d => !d ? '' : d.m === 8 && d.d === 25 ? '今天' : d.m === 8 && d.d === 26 ? '明天' : `${d.m + 1}月${d.d}日 周${'日一二三四五六'[new Date(2026,d.m,d.d).getDay()]}`;
  const parseDate = d => typeof d !== 'string' ? d : d === '今天' ? {m:8,d:25} : d === '明天' ? {m:8,d:26} : /([0-9]+)月([0-9]+)日/.test(d) ? {m:+RegExp.$1-1,d:+RegExp.$2} : null;
  let suppressSwipeClickUntil = 0;
  document.addEventListener('click', e => {
    if (Date.now() < suppressSwipeClickUntil) { e.preventDefault(); e.stopImmediatePropagation(); suppressSwipeClickUntil = 0; }
  }, true);
  const swipe = (commit, enabled = true, direction = 1, reverse = null) => {
    let gesture;
    const reset = () => {
      if (!gesture) return;
      const {row, pointerId} = gesture;
      row.style.transition = 'transform 180ms ease';
      row.style.transform = '';
      row.parentElement.dataset.swipeActive = 'false';
      row.parentElement.dataset.swipeReady = 'false';
      Object.assign(row.parentElement.dataset, gesture.original);
      if (row.hasPointerCapture?.(pointerId)) row.releasePointerCapture(pointerId);
      gesture = null;
    };
    return {
      swipeStart: e => {
        if (!enabled || !e.isPrimary || e.button !== 0 || e.target.closest('button,input,select,textarea,a,[data-href],[data-swipe-control]')) return;
        gesture = {row:e.currentTarget,pointerId:e.pointerId,x:e.clientX,y:e.clientY,dx:0,locked:false, direction, original:{swipeLabel:e.currentTarget.parentElement.dataset.swipeLabel,swipeRelease:e.currentTarget.parentElement.dataset.swipeRelease,swipeDirection:e.currentTarget.parentElement.dataset.swipeDirection,swipeReverse:e.currentTarget.parentElement.dataset.swipeReverse||'false'}};
      },
      swipeMove: e => {
        if (!gesture || gesture.pointerId !== e.pointerId) return;
        const rawDx=e.clientX-gesture.x, dy=e.clientY-gesture.y;
        let dx=rawDx*gesture.direction;
        if (!gesture.locked) {
          if (Math.max(Math.abs(dx),Math.abs(dy)) < 10) return;
          if (Math.abs(dy) >= Math.abs(dx) || (dx <= 0 && !reverse)) { reset(); return; }
          if (dx < 0) {
            gesture.direction=-direction;gesture.reversed=true;dx=-dx;
            Object.assign(gesture.row.parentElement.dataset,{swipeLabel:reverse.label,swipeRelease:reverse.release,swipeDirection:gesture.direction<0?'left':'right',swipeReverse:'true'});
          }
          gesture.locked=true; gesture.row.setPointerCapture?.(e.pointerId);
        }
        e.preventDefault();
        gesture.dx=Math.max(0,Math.min(dx,132));
        gesture.row.style.transition='none';
        gesture.row.style.transform=`translateX(${gesture.dx*gesture.direction}px)`;
        gesture.row.parentElement.dataset.swipeActive='true';
        gesture.row.parentElement.dataset.swipeReady=String(gesture.dx>=88);
      },
      swipeEnd: e => {
        if (!gesture || gesture.pointerId !== e.pointerId) return;
        const execute=gesture.locked && gesture.dx>=88;
        const action=gesture.reversed?reverse.commit:commit;
        if(gesture.locked) {e.preventDefault();suppressSwipeClickUntil=Date.now()+400;}
        reset();
        if(execute) action();
      },
      swipeCancel: () => { if(gesture?.locked)suppressSwipeClickUntil=Date.now()+400;reset(); }
    };
  };
  const api = window.Huling = {
    get state() { return state; }, swipe, page, params, go, note, pending, dateLabel, beginAppOnly, endAppOnly,
    recordingDeleted(id) { return !!state.deletedRecordings?.[id]; },
    recordingFiles(n) { return (n.recordings?.length?n.recordings:[{id:n.id,title:n.title,duration:n.duration}]).map(r=>({...r,bytes:r.storageBytes||Math.round((r.duration||0)*32000),deleted:api.recordingDeleted(r.id)})); },
    storageRows() { return state.notes.filter(n=>!n.mergedInto).map(n=>{const files=api.recordingFiles(n),remaining=files.filter(f=>!f.deleted),bytes=['uploading','upload_failed'].includes(n.status)?0:remaining.reduce((v,f)=>v+f.bytes,0);return {...n,files,bytes,canDelete:n.status==='ready'&&remaining.length>0,recordingDeleted:remaining.length===0};}); },
    storageUsed() { const files=new Map();state.notes.filter(n=>!['uploading','upload_failed'].includes(n.status)).forEach(n=>api.recordingFiles(n).forEach(f=>{if(!f.deleted)files.set(f.id,f.bytes);}));return [...files.values()].reduce((v,b)=>v+b,0); },
    storageQuota() {const capacity=api.setting('subscription-plan')==='pro'?50:5,used=api.storageUsed(),percent=used/(capacity*1024**3)*100;return {storageText:api.formatStorage(used)+' / '+capacity+' GB',storagePercent:percent,storageWidth:percent+'%',remainingStorage:((capacity*1024**3-used)/1024**3).toFixed(2),usedStorage:api.formatStorage(used)};},
    formatStorage(bytes) {return bytes>=1024**3?(bytes/1024**3).toFixed(2)+' GB':(bytes/1024**2).toFixed(2)+' MB';},
    deleteRecordings(noteIds) {const ids=[...new Set(api.storageRows().filter(n=>noteIds.includes(n.id)&&n.canDelete).flatMap(n=>n.files.filter(f=>!f.deleted).map(f=>f.id)))];state.deletedRecordings??={};ids.forEach(id=>state.deletedRecordings[id]=true);save();return ids;},
    restoreRecordings(ids) {ids.forEach(id=>{if(state.deletedRecordings)delete state.deletedRecordings[id];});save();},
    ledger() {return state.ledger||(state.ledger=clone(window.HulingSeed.ledger||[]));},
    updateLedger(id,patch) {const item=api.ledger().find(i=>i.id===id);if(item){Object.assign(item,patch);save();}},
    counts: () => ({pending:pending().length+api.ledger().filter(a=>a.status==='pending').length,todo:state.actions.filter(a=>a.type==='todo'&&!a.ignored&&a.status!=='done').length}),
    sourceLink: title => 'ThoughtDetail.dc.html?' + new URLSearchParams({id:note(title)?.id||'home',from:page()}),
    openNote(title) { const n=note(title); if(n){n.unread=false;save();go('ThoughtDetail.dc.html',{id:n.id,from:page()});} },
    currentNote(props={}) { return note(props.noteId || props.titleOverride || params().get('id')); },
    updateNote(id, patch) {const n=note(id);if(n){const edited=Object.keys(patch).some(k=>(k==='summary'||k==='title')&&patch[k]!==n[k]);Object.assign(n,patch);if(edited)n.updatedAt=Date.now();save();}},
    updateAction(id, patch) {const a=state.actions.find(a=>a.id===id);if(a){Object.assign(a,patch);save();}},
    markRead(id) {const n=note(id);if(n){n.unread=false;save();}},
    actionsFor(id) { return clone(state.actions.filter(a=>a.noteId===id)); },
    list(type) { return clone(state.actions.filter(a=>a.type===type&&!a.ignored)); },
    pendingRows() { return [...clone(pending()).map(a=>({...a,type:a.type==='todo'?'todo':'sched',date:dateLabel(a.date)})),...clone(api.ledger().filter(a=>a.status==='pending')).map(a=>({...a,type:'ledger',source:note(a.noteId)?.title||'录音记账'}))]; },
    replaceType(type, rows) {
      const incoming = new Set(rows.map(a=>a.id));
      state.deletedActions = (state.deletedActions || []).filter(a=>!incoming.has(a.id));
      state.actions = state.actions.filter(a=>a.type!==type || a.ignored || incoming.has(a.id));
      for(const row of rows){ const idx=state.actions.findIndex(a=>a.id===row.id); if(idx>=0) state.actions[idx]={...state.actions[idx],...row,type}; else state.actions.push({...row,type}); }
      save();
    },
    replaceNote(id, rows) { state.deletedActions=(state.deletedActions||[]).filter(a=>!rows.some(r=>r.id===a.id));state.actions = [...state.actions.filter(a=>a.noteId!==id),...rows.map(a=>({...a,noteId:id}))];save(); },
    syncPending(rows) {
      for(const row of rows){const a=state.actions.find(a=>a.id===row.id);if(a) Object.assign(a,row,{type:row.type==='todo'?'todo':'schedule',date:parseDate(row.date)});}
      save();
    },
    resolve(ids, ignore=false) {const before=clone(state.actions);before.ledger=clone(api.ledger());api.ledger().forEach(a=>{if(ids.includes(a.id))a.status=ignore?'ignored':'confirmed';});state.actions=state.actions.map(a=>ids.includes(a.id)?{...a,...(ignore?{ignored:true}:{status:a.type==='todo'?'open':'ok'})}:a);save();return before;},
    restore(actions) {state.actions=clone(actions);if(actions.ledger)state.ledger=clone(actions.ledger);save();},
    retryNote(id) {const n=note(id);if(!n||!['upload_failed','transcription_failed'].includes(n.status))return false;const upload=n.status==='upload_failed';n.status=upload?'uploading':'processing';n.phase=upload?'uploading':'transcribing';n[upload?'uploadStartedAt':'processingStartedAt']=Date.now();save();return true;},
    complete(id) {const n=note(id);if(n){if(n.status==='uploading'){n.status='processing';n.phase='transcribing';}else if(n.phase==='transcribing'){n.phase='organizing';}else{n.status='ready';delete n.phase;}if(n.status==='processing')n.processingStartedAt=Date.now();n.unread=true;save();try{sessionStorage.setItem(historyRefreshKey,location.pathname);}catch(_){}location.reload();}},
    back() {const from=params().get('from');if(from==='TodoDetail.dc.html'&&params().get('todoId')){go(from,{id:params().get('todoId')});return;}const allowed=['HomeTest.dc.html','TodayTodo.dc.html','TodaySchedule.dc.html','TodayThoughts.dc.html','TodayHealth.dc.html','MeScreen.dc.html','UsageStats.dc.html','SubscriptionDetail.dc.html','Bookkeeping.dc.html','RecordingStorage.dc.html','FeedCompact.dc.html','FeedHealth.dc.html','TodoList.dc.html','ScheduleList.dc.html','PendingReview.dc.html','Search.dc.html','TodoSchedule.dc.html']; if(from&&allowed.includes(from)) go(from);else go('FeedCompact.dc.html');},
    setting(key, value) {if(arguments.length>1){state.settings[key]=value;save();}return state.settings[key];},
    reset() {state=clone(window.HulingSeed);save();go('FeedCompact.dc.html');},
    headerVals(component) {
      let homePage='FeedHealth.dc.html';try{const from=params().get('from')||sessionStorage.getItem('huling-home-page');if(['FeedHealth.dc.html','FeedCompact.dc.html'].includes(from))homePage=from;}catch(_){}
      const searchOpen=!!component.state.searchOpen,query=component.state.query||'',index=component.state.batteryIndex||0;
      const colors=['#528565','#AF891E','#C45249'],labels=['高于 60%','20% 到 60%','低于 20%'];
      const close=()=>component.setState({searchOpen:false,query:''});
      return {homeHref:'./'+homePage,searchOpen,searchClosed:!searchOpen,query,searchRef:component.headerInputRef,searchContainerRef:component.headerContainerRef,
        connected:api.setting('connected')!==false,disconnected:api.setting('connected')===false,
        batteryFill:['85%','45%','12%'][index],batteryColor:colors[index],batteryLabel:'戒指：电量'+labels[index]+'，点击切换电量状态',cycleBattery:()=>component.setState({batteryIndex:(index+1)%3}),
        tabsVisibility:searchOpen?'hidden':'visible',searchWidth:searchOpen?'100%':'30px',searchBackground:searchOpen?'#F2F0EC':'transparent',searchLabel:searchOpen?'关闭搜索':'搜索事项',
        toggleSearch:()=>{if(searchOpen)close();else{component.setState({searchOpen:true});setTimeout(()=>component.headerInputRef.current?.focus(),0);}},
        onSearch:e=>component.setState({query:e.target.value}),searchKey:e=>{if(e.key==='Escape')close();},
        matches:item=>[item.title,item.source,item.place,item.note].filter(Boolean).join(' ').toLowerCase().includes(query.trim().toLowerCase())};
    },
    bindHeader(component) {
      const outside=e=>{if(component.state.searchOpen&&!component.headerContainerRef.current?.contains(e.target))component.setState({searchOpen:false,query:''});};
      document.addEventListener('pointerdown',outside,true);
      return ()=>document.removeEventListener('pointerdown',outside,true);
    },
    async copyText(text) {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        try { await navigator.clipboard.writeText(text); return; } catch (_) {}
      }
      const previous=document.activeElement,field=document.createElement('textarea');
      field.value=text;field.style.cssText='position:fixed;left:-9999px;top:0;';document.body.appendChild(field);
      try {field.select();if(!document.execCommand('copy'))throw new Error('copy failed');}
      finally {field.remove();previous?.focus?.();}
    },
    noteUpdateTime(n) {return Number(n.updatedAt)||Number(/^merged-(\d+)-/.exec(n.id)?.[1])||0;},
    notePriority(n) {return n.status==='uploading'?0:n.status==='processing'?1:api.noteUpdateTime(n)?2:3;},
    sortNotes(notes) {
      const recorded=n=>{const match=/^(\d{1,2}):(\d{2})$/.exec(n.time||'');return Date.UTC(2026,8,25-(n.group||0),match?+match[1]:23,match?+match[2]:59);};
      return [...notes].sort((a,b)=>{
        const pa=api.notePriority(a),pb=api.notePriority(b);if(pa!==pb)return pa-pb;
        if(pa===0)return (Number(a.uploadStartedAt)||recorded(a))-(Number(b.uploadStartedAt)||recorded(b));
        if(pa===1)return (Number(a.processingStartedAt)||Number(a.uploadStartedAt)||recorded(a))-(Number(b.processingStartedAt)||Number(b.uploadStartedAt)||recorded(b));
        if(pa===2)return api.noteUpdateTime(b)-api.noteUpdateTime(a);
        return recorded(b)-recorded(a);
      });
    },
    mergeNotes(ids) {
      const selected=[...new Set(ids)].map(id=>note(id)).filter(n=>n&&!n.deleted&&!n.mergedInto&&n.status==='ready');
      if(selected.length<2)return null;
      const recordings=selected.flatMap(n=>n.recordings?.length?clone(n.recordings):[{id:n.id,title:n.title,duration:n.duration,segs:clone(n.segs||[])}]);
      let offset=0;const segs=[];
      recordings.forEach(r=>{r.segs.forEach(s=>segs.push([offset+s[0],s[1]]));offset+=r.duration;});
      const paragraphs=recordings.map((r,i)=>`${i+1}. ${r.title}\n${r.segs.map(s=>s[1]).join(' ').replace(/^(嗯[，。…\s]*|刚)/,'')}`);
      const id='merged-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
      const merged={id,createdAt:Date.now(),updatedAt:Date.now(),title:selected.map(n=>n.title).join(' · '),group:0,time:selected[0].time,duration:offset,segs,recordings,mergedFrom:selected.map(n=>n.id),summary:paragraphs.join('\n\n'),preview:`合并 ${recordings.length} 段录音 · `+paragraphs[0].split('\n')[1],status:'ready',unread:true};
      selected.forEach(n=>n.mergedInto=id);
      state.actions.forEach(a=>{if(ids.includes(a.noteId)){a.originalNoteId=a.originalNoteId||a.noteId;a.noteId=id;a.source=merged.title;}});
      state.notes.unshift(merged);save();return merged;
    },
    archiveNote(id) {
      const n=note(id);if(!n)return;
      state.deletedNotes=[...(state.deletedNotes||[]).filter(a=>a.id!==id),{...clone(n),deletedAt:Date.now()}];
      n.deleted=true;save();
    },
    restoreNote(id) {
      const n=note(id);if(n)n.deleted=false;
      state.deletedNotes=(state.deletedNotes||[]).filter(a=>a.id!==id);save();
    },
    archiveAction(id) {
      const item=state.actions.find(a=>a.id===id);
      if(item){state.deletedActions=[...(state.deletedActions||[]).filter(a=>a.id!==id),{...item,deletedAt:Date.now()}];state.actions=state.actions.filter(a=>a.id!==id);save();}
    },
    bindPendingDeletion(component) {
      let timer;
      const next=e=>{
        const id=component.state.pendingDelete;
        if(!id || e.target.closest?.('[data-delete-undo]'))return;
        clearTimeout(timer);
        timer=setTimeout(()=>{if(component.state.pendingDelete===id)component.commitDeletion();},0);
      };
      const leave=()=>component.commitDeletion();
      document.addEventListener('pointerup',next,true);
      document.addEventListener('click',next,true);
      window.addEventListener?.('pagehide',leave);
      return ()=>{clearTimeout(timer);document.removeEventListener('pointerup',next,true);document.removeEventListener('click',next,true);window.removeEventListener?.('pagehide',leave);};
    },
    bindOutsideEditor(component) {
      let timer;
      const outside = e => {
        const region = component.editRegionRef.current;
        if (!region || region.contains(e.target)) return;
        const editing = component.state.editing !== undefined ? component.state.editing : component.props.editing;
        clearTimeout(timer);
        // Let the clicked control finish first, including opening a different item.
        timer = setTimeout(() => {
          const current = component.state.editing !== undefined ? component.state.editing : component.props.editing;
          if (current === editing) component.setState({editing:null,editGroup:undefined,calOpen:false,calM:undefined,draft:{}});
        }, 0);
      };
      document.addEventListener('click', outside, true);
      return () => { clearTimeout(timer); document.removeEventListener('click', outside, true); };
    },
    logic(Base, kind) {return class extends Base {
      stageDeletion(id) {
        this.commitDeletion();
        const field=kind==='detail'||kind==='related'?'actionItems':kind==='todo'?'todos':'events';
        clearTimeout(this.tt);clearTimeout(this.toastTimer);
        const rows=field==='actionItems'?this.actionItems(this.data?.()||{}):this[field];
        this.setState({pendingDelete:id,editing:null,calOpen:false,prev:rows,previousActions:rows,toast:'已标记删除'});
      }
      commitDeletion() {
        const id=this.state.pendingDelete;if(!id)return;
        const field=kind==='detail'||kind==='related'?'actionItems':kind==='todo'?'todos':'events';
        api.archiveAction(id);
        const rows=field==='actionItems'?this.actionItems(this.data?.()||{}):this[field];
        this.setState({[field]:rows.filter(a=>a.id!==id),pendingDelete:null,toast:'已删除 1 项'});
      }
      editRegionRef = {current:null};
      headerInputRef = {current:null};
      headerContainerRef = {current:null};
      setState(update, cb) {
        super.setState(prev => {
          const patch = typeof update === 'function' ? update(prev) : update;
          if (kind==='todo' && patch.todos) api.replaceType('todo',patch.todos);
          if (kind==='schedule' && patch.events) api.replaceType('schedule',patch.events);
          if (kind==='pending' && patch.items) api.syncPending(patch.items);
          if (kind==='detail' && patch.actionItems) {const n=api.currentNote(this.props);if(n)api.replaceNote(n.id,patch.actionItems);}
          return patch;
        },cb);
      }
    };}
  };
  if (window.addEventListener) window.addEventListener('pageshow', e => { if (e.persisted) { try { sessionStorage.setItem(historyRefreshKey, location.pathname); } catch (_) {} location.reload(); } });
  document.addEventListener('click',e=>{
    const target=e.target.closest('[data-href]');
    if(target){e.preventDefault();e.stopPropagation(); const href=target.getAttribute('data-href');if(href)window.DemoVersion.go(href);}
  });
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-href], [role=link]')){e.preventDefault();e.target.click();}});
  if (page() === 'TodoSchedule.dc.html') window.DemoVersion.replace((params().get('tab') === 'sched' ? 'ScheduleList' : 'TodoList') + '.dc.html');
  if(['FeedHealth.dc.html','FeedCompact.dc.html'].includes(page()))try{sessionStorage.setItem('huling-home-page',page());}catch(_){}
  const titles = {'FeedHealth.dc.html':'想法 · 昨日健康','FeedCompact.dc.html':'想法','ThoughtDetail.dc.html':'想法详情','TodoDetail.dc.html':'待办详情','TodoList.dc.html':'待办','ScheduleList.dc.html':'日程','PendingReview.dc.html':'需要确认','HealthScreen.dc.html':'健康','MeScreen.dc.html':'我的','Search.dc.html':'搜索','DemoPage.dc.html':'演示设置'};
  if (titles[page()]) document.title = titles[page()] + ' · 乎零';
  // Restore list position after visiting a source note.
  if (typeof MutationObserver !== 'undefined') {
    const restored = new WeakSet();
    const key = el => page() + ':' + el.getAttribute('data-scroll-key');
    const restore = () => document.querySelectorAll('[data-scroll-key]').forEach(el => {
      if (restored.has(el)) return;
      restored.add(el);
      try { el.scrollTop = Number(sessionStorage.getItem(key(el))) || 0; } catch (_) {}
    });
    new MutationObserver(restore).observe(document.documentElement,{childList:true,subtree:true});
    document.addEventListener('scroll', e => {const el=e.target;if(el.matches?.('[data-scroll-key]'))try{sessionStorage.setItem(key(el),String(el.scrollTop));}catch(_){}},true);
  }
  const style=document.createElement('style');
  style.textContent='[data-href]{cursor:pointer}[data-href]:focus-visible,button:focus-visible,a:focus-visible{outline:2px solid #326566;outline-offset:3px} body{margin:0;padding:24px;background:#F2F0EC} body>div#dc-root{margin:0 auto} @media(max-width:430px){body{padding:0;background:white}}';
  style.textContent += '[data-swipe-label]{position:relative;overflow:hidden;background:#E8F1EC;touch-action:pan-y}[data-swipe-label]::before{content:attr(data-swipe-label);position:absolute;left:18px;top:0;bottom:0;display:flex;align-items:center;font-size:13px;font-weight:600;color:#48735C;opacity:0;transition:opacity 120ms}[data-swipe-active=true]::before{opacity:1}[data-swipe-ready=true]{background:#527D63}[data-swipe-direction=left]::before{left:auto;right:18px}[data-swipe-ready=true]::before{content:attr(data-swipe-release);color:white}';
  style.textContent += '[data-swipe-reverse=true]{background:#F8EDE9}[data-swipe-reverse=true]::before{color:#AD5C48}[data-swipe-reverse=true][data-swipe-ready=true]{background:#B35D4D}[data-swipe-reverse=true][data-swipe-ready=true]::before{color:white}';
  style.textContent += '[data-swipe-label="左滑多选"][data-swipe-reverse=true]{background:oklch(0.42 0.08 195)}[data-swipe-label="左滑多选"][data-swipe-reverse=true]::before{color:#FFFFFF}';
  style.textContent += '[data-swipe-label$="忽略"],[data-swipe-label$="忽略"][data-swipe-reverse=true],[data-swipe-label$="忽略"][data-swipe-ready=true]{background:#EEEBE6}[data-swipe-label$="忽略"]::before,[data-swipe-label$="忽略"][data-swipe-reverse=true]::before,[data-swipe-label$="忽略"][data-swipe-ready=true]::before{color:#8C877F}';
  document.head.appendChild(style);
})();
