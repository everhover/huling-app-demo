/* In-list phone recording tutorial. All recording and permissions are simulated. */
(() => {
  const H=window.Huling;
  const notificationKeys=['transcription-success-notify','todo-reminder-notify','schedule-reminder-notify'];
  const format=seconds=>Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
  class Recorder {
    constructor(component) {
      this.component=component;this.alive=true;
      this.keyHandler=e=>{
        if(e.key==='Escape'){
          if(this.component.state.aoPermissionOpen)this.closePermissions();
          else if(this.recording)this.cancel();
        }
        if(e.key==='Tab'&&this.component.state.aoPermissionOpen){
          const dialog=this.component.aoDialogRef.current;
          const items=[...(dialog?.querySelectorAll('button')||[])];
          const first=items[0],last=items[items.length-1];
          if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){e.preventDefault();last?.focus();}
          else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===dialog)){e.preventDefault();first?.focus();}
        }
      };
      document.addEventListener('keydown',this.keyHandler);
      this.blurHandler=()=>this.cancel();window.addEventListener('blur',this.blurHandler);
      const pending=H.state.notes.find(n=>n.appOnlyRecording&&n.status!=='ready'&&!n.deleted);
      if(pending)this.process(pending);
      else if(H.setting('app-only-permissions-ready')&&!H.setting('app-only-permissions-dismissed'))this.showPermissions();
    }
    update(patch={}) {if(this.alive)this.component.setState(patch);}
    pointerDown(e) {
      if(!e.isPrimary||e.button!==0||this.busy||this.recording)return;
      e.preventDefault();this.pointer=e.pointerId;this.button=e.currentTarget;
      this.button.setPointerCapture?.(e.pointerId);
      this.pressTimer=setTimeout(()=>this.start(false),450);
    }
    pointerUp(e) {
      if(this.pointer!==e.pointerId)return;
      clearTimeout(this.pressTimer);this.pointer=null;
      if(this.recording)this.finishRecording();
      else this.update({aoHint:'按住加号开始录音，松开后自动转写'});
      if(this.button?.hasPointerCapture?.(e.pointerId))this.button.releasePointerCapture(e.pointerId);
    }
    keyDown(e) {
      if(![' ','Enter'].includes(e.key)||e.repeat||this.busy)return;
      e.preventDefault();
      if(this.recording)this.finishRecording();else this.start(true);
    }
    start(keyboard) {
      if(this.busy||this.recording||!this.alive)return;
      this.recording=true;this.keyboard=keyboard;this.started=Date.now();
      this.update({aoRecording:true,aoSeconds:0,aoKeyboard:keyboard,aoHint:''});
      this.recordTimer=setInterval(()=>this.update({aoSeconds:Math.floor((Date.now()-this.started)/1000)}),250);
    }
    cancel() {
      clearTimeout(this.pressTimer);clearInterval(this.recordTimer);this.pointer=null;
      if(!this.recording)return;
      this.recording=false;this.update({aoRecording:false,aoHint:'本次录音已取消，长按加号可重新录音'});
    }
    finishRecording() {
      if(!this.recording)return;
      clearInterval(this.recordTimer);this.recording=false;
      const now=new Date(),id='app-recording-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
      const n={id,title:'我的第一个想法',group:0,time:now.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}),createdAt:now.getTime(),updatedAt:now.getTime(),duration:Math.max(1,Math.round((now-this.started)/1000)),status:'uploading',uploadProgress:0,uploadStartedAt:now.getTime(),appOnlyRecording:true,preview:'',summary:'',segs:[],unread:true};
      H.state.notes.unshift(n);H.updateNote(id,{});
      this.update({aoRecording:false,aoHint:''});this.process(n);
    }
    process(n) {
      this.busy=true;this.update({aoBusy:true});
      if(n.status==='uploading'){
        this.uploadTimer=setInterval(()=>{
          n.uploadProgress=Math.min(100,(n.uploadProgress||0)+5);H.updateNote(n.id,{uploadProgress:n.uploadProgress});this.update();
          if(n.uploadProgress===100){clearInterval(this.uploadTimer);H.updateNote(n.id,{status:'processing',phase:'transcribing',processingStartedAt:Date.now()});this.update();this.process(n);}
        },100);
      }else if(n.phase==='transcribing'){
        this.phaseTimer=setTimeout(()=>{
          H.updateNote(n.id,{phase:'organizing',preview:'明天下午三点和设计师聊首页方案，提前整理好要讨论的三个问题。'});this.update();this.process(n);
        },1500);
      }else this.phaseTimer=setTimeout(()=>this.finish(n),1200);
    }
    finish(n) {
      const text='明天下午三点和设计师聊首页方案，提前整理好要讨论的三个问题。';
      const summary='明天下午 3 点，与设计师讨论首页方案。\n会前整理好要讨论的三个问题，让沟通更有重点。';
      H.updateNote(n.id,{title:'和设计师讨论首页方案',status:'ready',phase:null,preview:summary.split('\n')[0],summary,segs:[[0,text]],updatedAt:Date.now()});
      const date=new Date();date.setDate(date.getDate()+1);const day={y:date.getFullYear(),m:date.getMonth(),d:date.getDate()};
      const actions=[
        {id:'todo:'+n.id,noteId:n.id,type:'todo',title:'整理要讨论的三个问题',status:'pending',date:day,time:'14:00',remind:'提前 30 分钟',source:n.title},
        {id:'schedule:'+n.id,noteId:n.id,type:'schedule',title:'和设计师讨论首页方案',status:'pending',date:day,start:'15:00',end:'15:30',time:'15:00',remind:'提前 15 分钟',place:'',source:n.title}
      ];
      actions.forEach(action=>{if(!H.state.actions.some(a=>a.id===action.id))H.state.actions.push(action);});
      this.busy=false;H.updateNote(n.id,{});this.update({aoBusy:false});
      if(!H.setting('app-only-permissions-dismissed')){H.setting('app-only-permissions-ready',true);this.showPermissions();}
    }
    showPermissions() {
      this.update({aoPermissionOpen:true});
      this.focusTimer=setTimeout(()=>this.component.aoDialogRef.current?.focus(),30);
    }
    toggle(type) {
      if(type==='calendar')H.setting('calendar-access',H.setting('calendar-access')!==true);
      else{const on=!notificationKeys.some(key=>H.setting(key)===true);notificationKeys.forEach(key=>H.setting(key,on));}
      this.update();
    }
    closePermissions() {
      H.setting('app-only-permissions-dismissed',true);this.update({aoPermissionOpen:false});
      this.focusTimer=setTimeout(()=>this.component.aoAddRef.current?.focus(),30);
    }
    destroy() {
      this.alive=false;[this.pressTimer,this.phaseTimer,this.focusTimer].forEach(clearTimeout);[this.recordTimer,this.uploadTimer].forEach(clearInterval);
      document.removeEventListener('keydown',this.keyHandler);window.removeEventListener('blur',this.blurHandler);
    }
  }
  window.HulingAppOnlyFeed={
    mount(component){if(H.setting('app-only-onboarding'))component.aoRecorder=new Recorder(component);return()=>component.aoRecorder?.destroy();},
    vals(component){
      const active=H.setting('app-only-onboarding')===true,s=component.state;
      const notifications=notificationKeys.some(key=>H.setting(key)===true),calendar=H.setting('calendar-access')===true;
      return {appOnly:active,appOnlyEmpty:active&&!H.state.notes.some(n=>!n.deleted&&!n.mergedInto),showAppOnlyRecorder:active&&!s.selecting,
        aoRecording:!!s.aoRecording,aoIdle:!s.aoRecording,aoTime:format(s.aoSeconds||0),aoRecordHint:s.aoKeyboard?'再按一次空格或回车，结束录音':'松开即可保存并转写',aoHint:s.aoHint||'',aoHasHint:!!s.aoHint,aoBusy:!!s.aoBusy,
        aoButtonLabel:s.aoRecording?'结束录音':'长按加号录音',aoAddRef:component.aoAddRef,aoDialogRef:component.aoDialogRef,
        aoPointerDown:e=>component.aoRecorder?.pointerDown(e),aoPointerUp:e=>component.aoRecorder?.pointerUp(e),aoPointerCancel:()=>component.aoRecorder?.cancel(),aoKeyDown:e=>component.aoRecorder?.keyDown(e),aoPreventClick:e=>e.preventDefault(),
        aoPermissionOpen:!!s.aoPermissionOpen,aoNotificationEnabled:notifications,aoCalendarEnabled:calendar,aoNotificationLabel:notifications?'已开启':'开启通知权限',aoCalendarLabel:calendar?'已开启':'开启日历权限',
        aoToggleNotification:()=>component.aoRecorder?.toggle('notification'),aoToggleCalendar:()=>component.aoRecorder?.toggle('calendar'),aoClosePermissions:()=>component.aoRecorder?.closePermissions()};
    }
  };
})();
