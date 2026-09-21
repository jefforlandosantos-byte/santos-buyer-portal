const crypto = require('crypto');

module.exports = async function handler(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(500).send('GOOGLE_CLIENT_ID is not configured');

  const origin = `https://${req.headers.host}`;
  const state = crypto.randomBytes(24).toString('hex');
  res.setHeader('Set-Cookie', `google_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/google-calendar-callback`,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
};