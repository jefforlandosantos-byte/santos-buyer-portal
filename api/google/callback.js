const crypto = require('crypto');

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function validState(state, secret) {
  if (!state || !secret) return false;
  const i = state.lastIndexOf('.');
  if (i < 1) return false;
  const nonce = state.slice(0, i);
  const supplied = state.slice(i + 1);
  const expected = b64url(crypto.createHmac('sha256', secret).update(nonce).digest());
  try {
    return supplied.length === expected.length && crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
  } catch (_) {
    return false;
  }
}

module.exports = async function handler(req, res) {
  const { code, state, error } = req.query || {};
  if (error) return res.redirect('/?calendar=error');

  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const redirectUri = 'https://santos-buyer-portal.vercel.app/api/google/callback';
  if (!clientId || !clientSecret) return res.status(500).send('Google OAuth is not configured');
  if (!code || !validState(state, clientSecret)) return res.status(400).send('Invalid OAuth state');

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {'content-type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok) {
    console.error('Google token exchange failed', token?.error, token?.error_description);
    return res.status(500).send('Could not connect Google Calendar');
  }

  res.setHeader('Set-Cookie', [
    `google_access_token=${encodeURIComponent(token.access_token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${token.expires_in || 3600}`,
    token.refresh_token ? `google_refresh_token=${encodeURIComponent(token.refresh_token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000` : ''
  ].filter(Boolean));
  return res.redirect('/?calendar=connected');
};
