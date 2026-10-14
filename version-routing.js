(()=>{
const name=decodeURIComponent(location.pathname.split('/').pop());
const routes={'FeedHealth.dc.html':'TodayThoughts.dc.html','FeedCompact.dc.html':'TodayThoughts.dc.html','TodoList.dc.html':'TodayTodo.dc.html','ScheduleList.dc.html':'TodaySchedule.dc.html','HealthScreen.dc.html':'TodayHealth.dc.html'};
const reverse=Object.fromEntries(Object.entries(routes).map(([a,b])=>[b,a]));reverse['TodayThoughts.dc.html']='FeedHealth.dc.html';reverse['HomeTest.dc.html']='FeedHealth.dc.html';
const five=name==='HomeTest.dc.html'||name.startsWith('Today')||new URLSearchParams(location.search).get('homeTest')==='1';
function url(href){
 const u=new URL(href,location.href),file=decodeURIComponent(u.pathname.split('/').pop());
 if(u.origin!==location.origin||!file.endsWith('.html')||file==='Versions.html')return u.href;
 // The version chooser and explicit Test entry are the only version switches.
 if(name==='Versions.html')return u.href;
 u.searchParams.set('demoBuild','20260929-routing');
 let target=five?(routes[file]||file):(reverse[file]||file);
 if(five&&name==='RecordingTutorial.dc.html'&&file==='FeedHealth.dc.html')target='HomeTest.dc.html';
 u.pathname=u.pathname.replace(/[^/]+$/,target);if(five)u.searchParams.set('homeTest','1');else u.searchParams.delete('homeTest');
 const from=u.searchParams.get('from');if(from)u.searchParams.set('from',five?(routes[from]||from):(reverse[from]||from));
 return u.href;
}
window.DemoVersion={five,url,go:(href)=>location.assign(url(href)),replace:(href)=>location.replace(url(href))};
document.addEventListener('click',e=>{
 const a=e.target.closest('a[href],[data-href]');if(!a||a.hasAttribute('download')||a.dataset.versionSwitch!==undefined)return;
 const href=a.getAttribute('href')||a.getAttribute('data-href');if(!href||href.startsWith('#'))return;
 const u=new URL(href,location.href);if(u.origin!==location.origin||!u.pathname.endsWith('.html'))return;
 e.preventDefault();e.stopImmediatePropagation();window.DemoVersion.go(href);
},true);
})();
