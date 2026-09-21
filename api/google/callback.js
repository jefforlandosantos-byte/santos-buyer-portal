function cookies(header='') { return Object.fromEntries(header.split(';').map(v=>v.trim()).filter(Boolean).map(v=>{const i=v.indexOf('=');return [v.slice(0,i),decodeURIComponent(v.slice(i+1))]})); }

module.exports = async function handler(req, res) {
  const { code, state, error } = req.query || {};
  if (error) return res.redirect('/?calendar=error');
  const savedState = cookies(req.headers.cookie || '').google_oauth_state;
  if (!code || !state || !savedState || state !== savedState) return res.status(400).send('Invalid OAuth state');

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = 'https://santos-buyer-portal.vercel.app/api/google/callback';
  if (!clientId || !clientSecret) return res.status(500).send('Google OAuth is not configured');

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method:'POST', headers:{'content-type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({code,client_id:clientId,client_secret:clientSecret,redirect_uri:redirectUri,grant_type:'authorization_code'})
  });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok) return res.status(500).send('Could not connect Google Calendar');

  res.setHeader('Set-Cookie', [
    'google_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
    `google_access_token=${encodeURIComponent(token.access_token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${token.expires_in || 3600}`,
    token.refresh_token ? `google_refresh_token=${encodeURIComponent(token.refresh_token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000` : ''
  ].filter(Boolean));
  return res.redirect('/?calendar=connected');
};