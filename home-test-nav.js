(()=>{
const page=location.pathname.split('/').pop();
const newPages=['TodayTodo.dc.html','TodaySchedule.dc.html','TodayThoughts.dc.html','TodayHealth.dc.html'];
if(page!=='HomeTest.dc.html'&&!newPages.includes(page)&&new URLSearchParams(location.search).get('homeTest')!=='1')return;
const routes={'TodoList.dc.html':'TodayTodo.dc.html','ScheduleList.dc.html':'TodaySchedule.dc.html','FeedHealth.dc.html':'TodayThoughts.dc.html','FeedCompact.dc.html':'TodayThoughts.dc.html','HealthScreen.dc.html':'TodayHealth.dc.html'};
document.documentElement.classList.add('home-test-layout');
const H=window.Huling;
const tabs=[['HomeTest.dc.html','Today'],['TodayTodo.dc.html','待办'],['TodaySchedule.dc.html','日程'],['TodayThoughts.dc.html','想法'],['TodayHealth.dc.html','健康']];
const style=document.createElement('style');style.textContent=`html.home-test-layout body{margin:0!important;padding:24px!important;display:flex!important;justify-content:center!important;align-items:flex-start!important;background:#F2F0ED!important;min-width:390px;box-sizing:content-box!important}.home-test-layout .sc-host{width:390px!important;flex:0 0 390px!important;margin:0!important;padding:0!important}.home-test-layout .auth-phone,.home-test-layout .sc-host>div:first-child{width:390px!important;height:844px!important;min-height:844px!important;border-radius:46px!important;flex-shrink:0!important;box-shadow:0 0 0 1px rgba(29,28,26,.1),0 30px 60px -20px rgba(29,28,26,.25)!important}.test-nav-host{display:block!important;position:absolute!important;bottom:0!important;left:0;right:0;height:86px!important;padding:0!important;background:white!important;z-index:8;box-sizing:border-box!important}.test-nav-host>*:not(.test-five-nav){display:none!important}.test-five-nav{width:100%;display:grid;grid-template-columns:repeat(5,1fr);height:86px;border-top:1px solid #eeede9;box-sizing:border-box;padding:12px 6px 25px;background:#fff}.test-five-nav a{display:flex;flex-direction:column;align-items:center;gap:5px;font:15px 'PingFang SC',sans-serif;line-height:22px;white-space:nowrap;min-width:0;text-decoration:none;color:#A8A39B}.test-five-nav a[aria-current=page]{color:#1D1C1A;font-weight:600}.test-five-nav a[aria-current=page]:after{content:'';width:4px;height:4px;border-radius:50%;background:#1D1C1A}.test-five-nav:after{content:'';position:absolute;bottom:8px;left:calc(50% - 67px);width:134px;height:5px;border-radius:9px;background:#1D1C1A}`;document.head.append(style);
function mountInlineSearch(){
 document.querySelectorAll('.today-search-button').forEach(button=>{
  if(button.closest('.today-inline-search'))return;
  button.removeAttribute('data-href');
  const header=button.closest('.today-page-head'),box=document.createElement('div');
  box.className='today-inline-search';button.before(box);box.append(button);
  button.classList.remove('today-search-button');
  const icon=button.innerHTML,panel=document.createElement('div');
  panel.className='today-search-results';panel.hidden=true;header.append(panel);
  let input;
  const close=()=>{input?.remove();input=null;panel.hidden=true;panel.replaceChildren();button.innerHTML=icon;button.setAttribute('aria-label','搜索');button.setAttribute('aria-expanded','false');};
  button.setAttribute('aria-expanded','false');
  button.addEventListener('click',()=>{
   if(input){close();return;}
   input=document.createElement('input');input.placeholder='搜索想法、待办、日程';input.setAttribute('aria-label',input.placeholder);box.prepend(input);
   button.innerHTML='<span aria-hidden="true">×</span>';button.setAttribute('aria-label','关闭搜索');button.setAttribute('aria-expanded','true');input.focus();
   input.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
   input.addEventListener('input',()=>{
    const q=input.value.trim().toLowerCase();panel.replaceChildren();panel.hidden=!q;if(!q)return;
    const notes=H.state.notes.filter(n=>!n.deleted&&!n.mergedInto&&[n.title,n.preview,n.summary,...H.state.actions.filter(a=>a.noteId===n.id).map(a=>a.title)].join(' ').toLowerCase().includes(q));
    const count=document.createElement('p');count.textContent=notes.length+' 条结果';panel.append(count);
    notes.forEach(n=>{const link=document.createElement('a');link.href='./ThoughtDetail.dc.html?'+new URLSearchParams({id:n.id,from:page,homeTest:1});link.textContent=n.title;panel.append(link);});
    if(!notes.length){const empty=document.createElement('p');empty.textContent='没有找到相关内容，试试其他关键词';panel.append(empty);}
   });
  });
  document.addEventListener('pointerdown',e=>{if(input&&!box.contains(e.target)&&!panel.contains(e.target))close();},true);
 });
}
function mount(){
 mountInlineSearch();
 document.querySelectorAll(".today-page-date").forEach(el=>{const date=new Date().toLocaleDateString("zh-CN",{month:"long",day:"numeric",weekday:"long"});if(el.textContent!==date)el.textContent=date;});
 const host=document.querySelector('[data-test-nav],.demo-nav')||Array.from(document.querySelectorAll('div[style]')).find(el=>el.style.height==='86px'&&el.style.gridTemplateColumns==='repeat(3, 1fr)');
 if(!host||host.querySelector('.test-five-nav'))return;
 host.classList.add('test-nav-host');const nav=document.createElement('nav');nav.className='test-five-nav';nav.setAttribute('aria-label','主导航');
 tabs.forEach(([file,label])=>{const a=document.createElement('a');a.href='./'+file+'?homeTest=1';a.textContent=label;if(file===page)a.setAttribute('aria-current','page');nav.append(a);});host.append(nav);
}
new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true});mount();
})();
