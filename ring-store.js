/* Product concept and a simulated checkout. No payment or address collection. */
(() => {
  const H=window.Huling,$=id=>document.getElementById(id);
  const finishes={silver:'钛银',graphite:'石墨'};
  const modal=$('shop-shade'),dialog=$('shop-dialog'),background=[...document.querySelector('main').children].filter(el=>el!==modal);
  let finish='silver',size=9,stage='select',busy=false,paymentTimer,returnFocus;
  function renderSelection(){
    document.querySelectorAll('button[data-finish]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.finish===finish)));
    document.querySelectorAll('[data-size]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.size)===size)));
    document.querySelectorAll('.selected-ring').forEach(img=>{img.dataset.finish=finish;img.alt=finishes[finish]+'色乎零p 戒指';});
    document.querySelectorAll('.selection-description').forEach(el=>el.textContent=finishes[finish]+' · '+size+' 号');
    document.querySelector('.receipt-product').textContent='乎零p · '+finishes[finish]+' · '+size+' 号';
  }
  function setStage(value){
    stage=value;document.querySelectorAll('.shop-step').forEach(el=>el.hidden=el.dataset.step!==stage);
    $('shop-title').textContent={select:'选择你的乎零p',checkout:'确认演示订单',success:'购买体验完成'}[stage];
    dialog.scrollTop=0;dialog.focus();
  }
  function open(){
    returnFocus=document.activeElement;modal.hidden=false;background.forEach(el=>el.inert=true);
    renderSelection();setStage('select');
  }
  function close(){
    clearTimeout(paymentTimer);busy=false;$('back-to-options').disabled=false;$('pay-order').disabled=false;$('pay-order').textContent='模拟支付 ¥ 1,299';
    $('payment-note').textContent='模拟支付，无需绑定银行卡，不会实际扣款。';
    modal.hidden=true;background.forEach(el=>el.inert=false);returnFocus?.focus();
  }
  $('buy-ring').onclick=open;$('close-shop').onclick=close;$('back-to-product').onclick=close;
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  document.querySelectorAll('button[data-finish]').forEach(button=>button.onclick=()=>{finish=button.dataset.finish;renderSelection();});
  document.querySelectorAll('button[data-size]').forEach(button=>button.onclick=()=>{size=Number(button.dataset.size);renderSelection();});
  $('review-order').onclick=()=>setStage('checkout');$('back-to-options').onclick=()=>setStage('select');
  $('pay-order').onclick=()=>{
    if(busy||stage!=='checkout')return;
    busy=true;$('back-to-options').disabled=true;$('pay-order').disabled=true;$('pay-order').textContent='模拟支付中…';$('payment-note').textContent='正在生成演示订单…';
    paymentTimer=setTimeout(()=>{
      const order={id:'DEMO-'+Date.now().toString(36).toUpperCase(),product:'乎零p',finish:finishes[finish],size,quantity:1,amount:1299,simulated:true,createdAt:Date.now()};
      H.setting('ring-demo-order',order);$('order-number').textContent=order.id;
      busy=false;$('back-to-options').disabled=false;$('pay-order').disabled=false;$('pay-order').textContent='模拟支付 ¥ 1,299';$('payment-note').textContent='模拟支付，无需绑定银行卡，不会实际扣款。';
      setStage('success');
    },1200);
  };
  document.addEventListener('keydown',e=>{
    if(modal.hidden)return;
    if(e.key==='Escape'){e.preventDefault();close();return;}
    if(e.key==='Tab'){
      const items=[...dialog.querySelectorAll('button,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length);
      const first=items[0],last=items[items.length-1];
      if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===dialog)){e.preventDefault();first?.focus();}
    }
  });
  window.addEventListener('pagehide',()=>clearTimeout(paymentTimer));
})();
