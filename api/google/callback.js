export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send(`Google authorization failed: ${error}`);
  }

  if (!code) {
    return res.status(400).send('Missing Google authorization code.');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = 'https://santos-buyer-portal.vercel.app/api/google/callback';

  if (!clientId || !clientSecret) {
    return res.status(500).send('Google OAuth environment variables are not configured yet.');
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Google token exchange failed', tokens);
      return res.status(500).send('Could not complete Google Calendar authorization.');
    }

    // The refresh token will be stored securely in a later setup step.
    // Never expose OAuth tokens to the browser.
    console.log('Google Calendar OAuth completed. Refresh token received:', Boolean(tokens.refresh_token));

    return res.status(200).send('Google Calendar connected successfully. You can close this window.');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Google Calendar connection failed.');
  }
}
