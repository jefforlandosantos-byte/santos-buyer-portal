const crypto = require('crypto');

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

module.exports = async function handler(req, res) {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  if (!clientId || !clientSecret) return res.status(500).send('Google OAuth is not configured');

  const redirectUri = 'https://santos-buyer-portal.vercel.app/api/google/callback';
  const nonce = crypto.randomBytes(24).toString('hex');
  const sig = b64url(crypto.createHmac('sha256', clientSecret).update(nonce).digest());
  const state = `${nonce}.${sig}`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
};
