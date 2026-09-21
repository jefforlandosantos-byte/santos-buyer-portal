// Santos Buyer Portal — bilingual weekly date labels + Google Calendar
(function () {
  'use strict';
  const DAY_NAMES={0:['Sunday','Domingo'],1:['Monday','Lunes'],2:['Tuesday','Martes'],3:['Wednesday','Miércoles'],4:['Thursday','Jueves'],5:['Friday','Viernes'],6:['Saturday','Sábado']};
  function currentSunday(){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-d.getDay());return d}
  function dateForDay(n){const d=currentSunday();d.setDate(d.getDate()+Number(n));return d}
  function label(n){const names=DAY_NAMES[Number(n)]||['',''];return names[0]+' / '+names[1]+' · '+dateForDay(n).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
  function updateDays(){document.querySelectorAll('#availability .day[data-day]').forEach(c=>{const h=c.querySelector('b');if(h)h.textContent=label(c.dataset.day)});const root=document.getElementById('agentAvail');if(root)root.querySelectorAll('b,strong').forEach(el=>{const map={Dom:0,Lun:1,Mar:2,'Mié':3,Jue:4,Vie:5,'Sáb':6};const t=el.textContent.trim();if(map[t]!==undefined)el.textContent=label(map[t])})}

  const BUFFER_MS=30*60*1000; let busy=[]; const q=id=>document.getElementById(id);
  function parseLocal(date,time){if(!date||!time)return null;const d=new Date(date+'T'+time+':00');return isNaN(d)?null:d}
  function overlapsBusy(start,minutes=60){if(!start)return false;const end=new Date(start.getTime()+minutes*60000);return busy.some(x=>{const a=new Date(new Date(x.start).getTime()-BUFFER_MS),b=new Date(new Date(x.end).getTime()+BUFFER_MS);return start<b&&end>a})}
  function status(connected){const e=q('calendarStatus');if(e)e.textContent=connected?'Google Calendar conectado · Busy bloqueado + 30 min':'Google Calendar no conectado';const b=q('connectCalendar');if(b)b.textContent=connected?'Reconectar Calendar':'Conectar Google Calendar'}
  async function loadBusy(){try{const r=await fetch('/api/google-calendar-busy',{credentials:'same-origin'}),d=await r.json();busy=Array.isArray(d.busy)?d.busy:[];status(!!d.connected);return !!d.connected}catch(e){status(false);return false}}
  function installCalendar(){const agent=q('agentView');if(agent&&!q('calendarCard')){const h=agent.querySelector('h2'),c=document.createElement('div');c.id='calendarCard';c.className='card';c.innerHTML='<b>Google Calendar</b><div id="calendarStatus" class="muted" style="margin:6px 0 10px">Comprobando conexión…</div><button id="connectCalendar" class="btn outline">Conectar Google Calendar</button>';h.insertAdjacentElement('afterend',c);q('connectCalendar').onclick=()=>location.href='/api/google-calendar-connect';loadBusy()}
    const btn=q('createTour');if(btn&&!btn.dataset.calendarGuard){btn.dataset.calendarGuard='1';btn.addEventListener('click',async e=>{await loadBusy();const start=parseLocal(q('tourDate')?.value,q('tourStart')?.value);if(overlapsBusy(start,60)){e.preventDefault();e.stopImmediatePropagation();const m=q('tourMsg');if(m)m.innerHTML='<div class="notice err">Ese horario choca con tu Google Calendar (incluyendo 30 minutos antes/después). Escoge otra hora.</div>'}},true)}}
  function updateAll(){updateDays();installCalendar()}
  const observer=new MutationObserver(updateAll);
  function start(){updateAll();observer.observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();