// Santos Buyer Portal — Google Calendar integration
(function(){
  'use strict';
  const BUFFER_MS = 30 * 60 * 1000;
  let busy = [];
  const q = id => document.getElementById(id);

  function parseLocal(date, time){
    if(!date || !time) return null;
    const d = new Date(date + 'T' + time + ':00');
    return isNaN(d) ? null : d;
  }

  function overlapsBusy(start, minutes=60){
    if(!start) return false;
    const end = new Date(start.getTime() + minutes*60000);
    return busy.some(x => {
      const bStart = new Date(new Date(x.start).getTime() - BUFFER_MS);
      const bEnd = new Date(new Date(x.end).getTime() + BUFFER_MS);
      return start < bEnd && end > bStart;
    });
  }

  async function loadBusy(){
    try{
      const r = await fetch('/api/google-calendar-busy', {credentials:'same-origin'});
      const data = await r.json();
      busy = Array.isArray(data.busy) ? data.busy : [];
      updateStatus(Boolean(data.connected));
      return Boolean(data.connected);
    }catch(e){ updateStatus(false); return false; }
  }

  function updateStatus(connected){
    const el=q('calendarStatus');
    if(el) el.textContent = connected ? 'Google Calendar conectado · eventos Busy bloqueados + 30 min' : 'Google Calendar no conectado';
    const btn=q('connectCalendar');
    if(btn) btn.textContent = connected ? 'Reconectar Calendar' : 'Conectar Google Calendar';
  }

  function installUI(){
    const agent=q('agentView');
    if(!agent || q('calendarCard')) return;
    const h2=agent.querySelector('h2');
    const card=document.createElement('div');
    card.id='calendarCard'; card.className='card';
    card.innerHTML='<b>Google Calendar</b><div id="calendarStatus" class="muted" style="margin:6px 0 10px">Comprobando conexión…</div><button id="connectCalendar" class="btn outline">Conectar Google Calendar</button>';
    h2.insertAdjacentElement('afterend',card);
    q('connectCalendar').addEventListener('click',()=>{location.href='/api/google-calendar-connect'});
    loadBusy();
  }

  function installTourGuard(){
    const btn=q('createTour');
    if(!btn || btn.dataset.calendarGuard) return;
    btn.dataset.calendarGuard='1';
    btn.addEventListener('click', async function(e){
      await loadBusy();
      const start=parseLocal(q('tourDate')?.value,q('tourStart')?.value);
      if(overlapsBusy(start,60)){
        e.preventDefault(); e.stopImmediatePropagation();
        const msg=q('tourMsg');
        if(msg) msg.innerHTML='<div class="notice err">Ese horario choca con tu Google Calendar (incluyendo 30 minutos antes/después). Escoge otra hora.</div>';
      }
    }, true);
  }

  function start(){ installUI(); installTourGuard(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
  const obs=new MutationObserver(start); obs.observe(document.documentElement,{childList:true,subtree:true});
})();