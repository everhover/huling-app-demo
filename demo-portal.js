(()=>{
'use strict';
const $=id=>document.getElementById(id),frame=$('demo-frame'),nav=$('catalog-nav');
const shared=[
 ['需确认','PendingReview.dc.html'],['记账','Bookkeeping.dc.html'],['想法详情 · CES','ThoughtDetail.dc.html?id=ces&from=FeedHealth.dc.html'],['想法详情 · 供应商','ThoughtDetail.dc.html?id=pcb&from=FeedHealth.dc.html'],['待办详情','TodoDetail.dc.html?id=todo%3Ab1'],['我的','MeScreen.dc.html'],['个人资料','DemoPage.dc.html?view=profile'],['设备管理','DemoPage.dc.html?view=device'],['固件更新','FirmwareUpdate.dc.html'],['用量统计','UsageStats.dc.html'],['订阅详情','SubscriptionDetail.dc.html'],['录音管理','RecordingStorage.dc.html?from=MeScreen.dc.html'],['关于乎零','DemoPage.dc.html?view=about'],['隐私协议','DemoPage.dc.html?view=privacy'],['AI 服务使用协议','DemoPage.dc.html?view=ai-agreement']
];
const withFive=page=>{const url=new URL(page,location.href);url.searchParams.set('homeTest','1');return url.pathname.split('/').pop()+url.search;};
const groups=[
 {id:'onboarding',title:'首次使用 · 三个方案',open:true,pages:[
 ['方案一 · 欢迎','OnboardingV1-Launch.dc.html','完整体验'],['方案一 · 登录','OnboardingV1-Login.dc.html'],['方案一 · 配对戒指','OnboardingV1-RingPairing.dc.html'],['方案一 · 录音教学','OnboardingV1-RecordingTutorial.dc.html'],
 ['方案二 · 欢迎','OnboardingV2-Launch.dc.html','完整体验'],['方案二 · 登录','OnboardingV2-Login.dc.html'],['方案二 · 配对戒指','OnboardingV2-RingPairing.dc.html'],['方案二 · 录音教学','OnboardingV2-RecordingTutorial.dc.html'],['方案二 · 权限开启','OnboardingV2-Settings.dc.html'],
 ['方案三 · 欢迎','OnboardingV3-Launch.dc.html','先配对'],['方案三 · 配对戒指','OnboardingV3-RingPairing.dc.html'],['方案三 · 登录','OnboardingV3-Login.dc.html'],['方案三 · 录音教学','OnboardingV3-RecordingTutorial.dc.html']
 ]},
 {id:'three',title:'三个底栏 · 想法优先',pages:[['想法首页','FeedHealth.dc.html'],['想法首页 · 无健康简报','FeedCompact.dc.html'],['待办','TodoList.dc.html'],['日程','ScheduleList.dc.html'],['健康','HealthScreen.dc.html'],...shared]},
 {id:'five',title:'五个底栏 · Today',pages:[['Today 首页','HomeTest.dc.html?homeTest=1'],['待办','TodayTodo.dc.html?homeTest=1'],['日程','TodaySchedule.dc.html?homeTest=1'],['想法','TodayThoughts.dc.html?homeTest=1'],['健康','TodayHealth.dc.html?homeTest=1'],...shared.map(([title,page])=>[title,withFive(page)])]}
];
const onboarding=groups[0],steps=onboarding.pages.filter(page=>!page[2]);
onboarding.pages=onboarding.pages.filter(page=>page[2]);
groups.splice(1,0,{id:'onboarding-steps',title:'Onboarding · 分步预览',pages:steps});
const entries=groups.flatMap(group=>group.pages.map(([title,page,badge])=>({title,page,badge,group})));
const allowed=new Set(entries.map(entry=>entry.page.split('?')[0]).concat(['Launch.dc.html','Login.dc.html','RingPairing.dc.html','RecordingTutorial.dc.html','TodoSchedule.dc.html','ThoughtDetailPreview.html','Search.dc.html','RelatedTodos.dc.html','Versions.html','OnboardingVersions.html']));
const base=new URL('./',location.href);
let current='';
function safePage(value){
 try{const url=new URL(value,base),file=url.pathname.split('/').pop();if(url.origin!==base.origin||url.pathname!==base.pathname+file||!allowed.has(file))return '';url.searchParams.delete('demoBuild');return file+url.search;}catch(_){return '';}
}
function isFive(page){const url=new URL(page,base);return url.pathname.endsWith('/HomeTest.dc.html')||url.pathname.split('/').pop().startsWith('Today')||url.searchParams.get('homeTest')==='1';}
function match(page){
 const exact=entries.find(entry=>entry.page===page);if(exact)return exact;
 const url=new URL(page,base),file=url.pathname.split('/').pop(),five=isFive(page);
 return entries.find(entry=>{const other=new URL(entry.page,base);return other.pathname.split('/').pop()===file&&other.searchParams.get('view')===url.searchParams.get('view')&&(entry.group.id.startsWith('onboarding')||(entry.group.id==='five')===five);});
}
function metadata(page){
 const entry=match(page);$('current-group').textContent=entry?.group.title||(isFive(page)?'五个底栏 · Today':'三个底栏 · 想法优先');$('current-title').textContent=entry?.title||'页面详情';
 document.title=(entry?.title||'页面详情')+' · 乎零交互演示';
 const url=new URL(page,base);$('open-page').href=url.href;
 document.querySelectorAll('.page-link').forEach(button=>{const active=button.dataset.page===entry?.page;button.toggleAttribute('aria-current',active);if(active){button.setAttribute('aria-current','page');button.closest('details').open=true;}});
}
function hashFor(page){return page?'#'+new URLSearchParams({page}).toString():'';}
function setMenu(open){document.body.classList.toggle('menu-open',open);$('catalog-backdrop').hidden=!open;$('menu-button').setAttribute('aria-expanded',String(open));$('menu-button').setAttribute('aria-label',open?'关闭页面目录':'打开页面目录');$('catalog').inert=innerWidth<=900&&!open;}
function fit(){
 const scale=innerWidth<=500?1:Math.max(.25,Math.min(1,(innerHeight-(innerWidth<=900?62:82)-72)/844,($('preview').clientWidth-56)/390));document.documentElement.style.setProperty('--preview-scale',String(scale));
 if(innerWidth>900)setMenu(false);else $('catalog').inert=!document.body.classList.contains('menu-open');
}
function welcome(){
 current='';frame.removeAttribute('src');frame.hidden=true;$('preview').hidden=true;$('welcome').hidden=false;
 ['home-button','reload-button','open-page','preview-error'].forEach(id=>$(id).hidden=true);
 $('current-group').textContent='欢迎体验乎零';$('current-title').textContent='选择首次使用方案';document.title='乎零 · 交互演示';
 document.querySelectorAll('.page-link').forEach(button=>button.removeAttribute('aria-current'));
 history.replaceState(null,'',location.pathname+location.search);setMenu(false);
}
function openPage(value){
 const page=safePage(value);if(!page)return;
 current=page;$('welcome').hidden=true;$('preview').hidden=false;frame.hidden=false;
 ['home-button','reload-button','open-page'].forEach(id=>$(id).hidden=false);$('preview-error').hidden=true;
 metadata(page);history.replaceState(null,'',location.pathname+location.search+hashFor(page));
 frame.src=new URL(page,base).href;fit();setMenu(false);
}
groups.forEach(group=>{
 const details=document.createElement('details');details.className='catalog-group';details.open=!!group.open;details.dataset.group=group.id;
 const summary=document.createElement('summary');summary.textContent=group.title;details.append(summary);
 group.pages.forEach(([title,page,badge])=>{const button=document.createElement('button');button.className='page-link';button.dataset.page=page;button.textContent=title;
 if(badge){const small=document.createElement('span');small.className='page-badge';small.textContent=badge;button.append(small);}button.onclick=()=>openPage(page);details.append(button);});nav.append(details);
});
document.querySelectorAll('[data-page]:not(.page-link)').forEach(button=>button.addEventListener('click',()=>openPage(button.dataset.page)));
$('catalog-search').addEventListener('input',e=>{
 const query=e.target.value.trim().toLowerCase();let count=0;
 nav.querySelectorAll('details').forEach(details=>{let found=0;details.querySelectorAll('.page-link').forEach(button=>{const show=!query||(button.textContent+' '+details.querySelector('summary').textContent).toLowerCase().includes(query);button.hidden=!show;if(show)found++;});details.hidden=!found;if(query&&found)details.open=true;count+=found;});$('catalog-empty').hidden=count>0;
});
frame.addEventListener('load',()=>{
 if(!frame.getAttribute('src'))return;
 try{
  const doc=frame.contentDocument,page=safePage(frame.contentWindow.location.href);if(!page){$('preview-error').hidden=false;return;}
  doc.documentElement.classList.add('demo-embedded');
  if(!doc.getElementById('demo-embedded-style')){const style=doc.createElement('link');style.id='demo-embedded-style';style.rel='stylesheet';style.href=new URL('demo-preview.css?v=1',base).href;doc.head.append(style);}
  current=page;metadata(page);history.replaceState(null,'',location.pathname+location.search+hashFor(page));fit();
 }catch(_){$('preview-error').hidden=false;}
});
$('home-button').onclick=welcome;
$('reload-button').onclick=()=>{if(current){try{frame.contentWindow.location.reload();}catch(_){openPage(current);}}};
$('menu-button').onclick=()=>setMenu(!document.body.classList.contains('menu-open'));
$('catalog-backdrop').onclick=()=>setMenu(false);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('menu-open')){setMenu(false);$('menu-button').focus();}});
window.addEventListener('resize',fit);
window.addEventListener('hashchange',()=>{const page=safePage(new URLSearchParams(location.hash.slice(1)).get('page')||'');if(page&&page!==current)openPage(page);else if(!page)welcome();});
const initial=safePage(new URLSearchParams(location.hash.slice(1)).get('page')||'');
if(initial)openPage(initial);else welcome();fit();
})();
