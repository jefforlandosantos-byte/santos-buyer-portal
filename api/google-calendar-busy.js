function cookies(header='') { return Object.fromEntries(header.split(';').map(v=>v.trim()).filter(Boolean).map(v=>{const i=v.indexOf('=');return [v.slice(0,i),decodeURIComponent(v.slice(i+1))]})); }

module.exports = async function handler(req, res) {
  let { google_access_token: access, google_refresh_token: refresh } = cookies(req.headers.cookie || '');
  const clientId=process.env.GOOGLE_CLIENT_ID, clientSecret=process.env.GOOGLE_CLIENT_SECRET;
  if (!access && refresh && clientId && clientSecret) {
    const rr=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,refresh_token:refresh,grant_type:'refresh_token'})});
    const rt=await rr.json(); if(rr.ok) access=rt.access_token;
  }
  if (!access) return res.status(401).json({connected:false,busy:[]});
  const now=new Date(), end=new Date(now); end.setDate(end.getDate()+30);
  const r=await fetch('https://www.googleapis.com/calendar/v3/freeBusy',{method:'POST',headers:{authorization:`Bearer ${access}`,'content-type':'application/json'},body:JSON.stringify({timeMin:now.toISOString(),timeMax:end.toISOString(),items:[{id:'primary'}]})});
  const data=await r.json();
  if(!r.ok) return res.status(401).json({connected:false,busy:[]});
  res.json({connected:true,busy:(data.calendars?.primary?.busy)||[]});
};