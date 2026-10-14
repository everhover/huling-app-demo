(()=>{
const H=window.Huling,buttons=[...document.querySelectorAll('[data-permission]')],feedback=document.getElementById('permission-feedback');
const notifications=['transcription-success-notify','todo-reminder-notify','schedule-reminder-notify'];
if(!H.setting('onboarding-v2-permissions-started')){
 ['calendar-access',...notifications].forEach(key=>H.setting(key,false));
 H.setting('onboarding-v2-notification-granted',false);
 H.setting('onboarding-v2-permissions-started',true);
}
function enabled(type){return type==='calendar'?H.setting('calendar-access')===true:notifications.some(key=>H.setting(key)===true);}
function render(){buttons.forEach(button=>button.setAttribute('aria-checked',String(enabled(button.dataset.permission))));}
buttons.forEach(button=>button.addEventListener('click',()=>{
 const type=button.dataset.permission,on=!enabled(type);
 if(type==='calendar')H.setting('calendar-access',on);
 else{notifications.forEach(key=>H.setting(key,on));H.setting('onboarding-v2-notification-granted',on);}
 render();feedback.textContent=(type==='calendar'?'日历权限':'通知权限')+(on?'已开启':'已关闭');
}));
render();
function enter(){window.location.assign('./FeedHealth.dc.html');}
document.getElementById('permissions-start').onclick=enter;
document.getElementById('permissions-later').onclick=enter;
})();
