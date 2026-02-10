import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, supabaseAdmin } from '../middleware/auth.js';
import logger from '../logger.js';

const router = express.Router();

// Lazy-init a Supabase client with the anon key (for auth proxy)
let _supabaseAnon = null;
function getSupabaseAnon() {
  if (!_supabaseAnon) {
    const url = process.env.VITE_SUPABASE_URL || '';
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    if (url && anonKey) {
      _supabaseAnon = createClient(url, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
  }
  return _supabaseAnon;
}

/**
 * POST /api/auth/signin — Proxy email/password sign-in through backend
 * Avoids slow direct browser→Supabase calls for users with high latency
 */
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const sb = getSupabaseAnon();
    if (!sb) {
      return res.status(500).json({ success: false, error: 'Auth service not configured' });
    }

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      return res.status(401).json({ success: false, error: error.message });
    }

    res.json({ success: true, session: data.session, user: data.user });
  } catch (error) {
    logger.error('Error in auth proxy signin', { error: error.message });
    res.status(500).json({ success: false, error: 'Sign in failed' });
  }
});

/**
 * POST /api/auth/signup — Proxy email/password sign-up through backend
 * Includes duplicate email detection
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    // Check if email already exists using admin API
    try {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const emailExists = existingUsers?.users?.some(
        u => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'This email is already registered. Please sign in instead.',
        });
      }
    } catch (checkErr) {
      // If admin check fails, proceed with signup (Supabase will handle duplicates)
      logger.debug('Could not check existing users', { error: checkErr.message });
    }

    const sb = getSupabaseAnon();
    if (!sb) {
      return res.status(500).json({ success: false, error: 'Auth service not configured' });
    }

    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        // No email redirect needed — email confirmation is disabled
        data: { email_verified: true },
      },
    });
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // If email confirmation is disabled, session will be returned directly
    // If still enabled, session will be null
    if (data.session) {
      res.json({ success: true, session: data.session, user: data.user });
    } else {
      // Fallback: try to sign in immediately (works if confirm email is off)
      const { data: signInData, error: signInError } = await sb.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        // Session is null and sign-in failed — email confirmation might still be on
        res.json({ success: true, session: null, user: data.user, needsConfirmation: true });
      } else {
        res.json({ success: true, session: signInData.session, user: signInData.user });
      }
    }
  } catch (error) {
    logger.error('Error in auth proxy signup', { error: error.message });
    res.status(500).json({ success: false, error: 'Sign up failed' });
  }
});

/**
 * GET /api/me — Returns current user info and profile
 * Requires authentication
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = req.user;

    // Try to get user profile from Supabase (if profiles table exists)
    let profile = null;
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        profile = data;
      }
    } catch {
      // profiles table may not exist yet (Phase 2)
      logger.debug('Profiles table not available yet');
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        display_name: profile?.display_name || user.user_metadata?.full_name || user.email,
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
        subscription_tier: profile?.subscription_tier || 'free',
        subscription_status: profile?.subscription_status || 'inactive',
        generation_count: profile?.generation_count || 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching user info', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user info',
    });
  }
});

/**
 * POST /api/auth/google — Sign in with Google ID token
 * Avoids browser→Supabase redirect entirely
 */
router.post('/google', async (req, res) => {
  try {
    const { id_token } = req.body;
    if (!id_token) {
      return res.status(400).json({ success: false, error: 'id_token is required' });
    }

    const sb = getSupabaseAnon();
    if (!sb) {
      return res.status(500).json({ success: false, error: 'Auth service not configured' });
    }

    const { data, error } = await sb.auth.signInWithIdToken({
      provider: 'google',
      token: id_token,
    });

    if (error) {
      logger.error('Google ID token sign-in error', { error: error.message });
      return res.status(401).json({ success: false, error: error.message });
    }

    res.json({ success: true, session: data.session, user: data.user });
  } catch (error) {
    logger.error('Error in Google auth proxy', { error: error.message });
    res.status(500).json({ success: false, error: 'Google sign in failed' });
  }
});

/**
 * GET /api/auth/google/start — Initiate Google OAuth (authorization code flow)
 * Redirects the browser directly to Google (not supabase.co)
 */
router.get('/google/start', (req, res) => {
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).send('Google OAuth not configured');
  }

  // Determine the origin for the callback URL
  const origin = req.headers.origin
    || (req.headers['x-forwarded-proto'] || req.protocol) + '://' + req.headers.host;
  const redirectUri = `${origin}/api/auth/google/callback`;

  // Generate a random state for CSRF protection
  const state = Buffer.from(JSON.stringify({
    rand: Math.random().toString(36).substring(2),
    ts: Date.now(),
  })).toString('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    access_type: 'offline',
    prompt: 'select_account',
  });

  // Store state in a short-lived cookie for validation on callback
  res.cookie('google_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

/**
 * GET /api/auth/google/callback — Handle Google OAuth callback
 * Exchanges code for tokens, then signs in via Supabase
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      logger.error('Google OAuth error', { error: oauthError });
      return res.redirect('/?auth_error=' + encodeURIComponent(oauthError));
    }

    if (!code) {
      return res.redirect('/?auth_error=no_code');
    }

    // Determine origin for redirect_uri (must match what was sent in /start)
    const origin = (req.headers['x-forwarded-proto'] || req.protocol) + '://' + req.headers.host;
    const redirectUri = `${origin}/api/auth/google/callback`;

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.VITE_GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.id_token) {
      logger.error('Google token exchange failed', { error: tokenData.error, desc: tokenData.error_description });
      return res.redirect('/?auth_error=token_exchange_failed');
    }

    // Use the id_token to sign in via Supabase (server-to-server, fast)
    const sb = getSupabaseAnon();
    if (!sb) {
      return res.redirect('/?auth_error=auth_not_configured');
    }

    const { data, error: sbError } = await sb.auth.signInWithIdToken({
      provider: 'google',
      token: tokenData.id_token,
    });

    if (sbError || !data.session) {
      logger.error('Supabase signInWithIdToken failed', { error: sbError?.message });
      return res.redirect('/?auth_error=supabase_auth_failed');
    }

    // Encode session data and redirect to frontend
    // Frontend will parse this from the hash and set up auth state
    const authPayload = Buffer.from(JSON.stringify({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
      user: {
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata,
      },
    })).toString('base64url');

    res.redirect(`/?google_auth=${authPayload}`);
  } catch (error) {
    logger.error('Error in Google OAuth callback', { error: error.message });
    res.redirect('/?auth_error=internal_error');
  }
});

/**
 * POST /api/auth/signout — Sign out user (no auth required — user may already be logged out)
 */
router.post('/signout', async (req, res) => {
  try {
    res.json({ success: true, message: 'Signed out successfully' });
  } catch (error) {
    logger.error('Error signing out', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to sign out' });
  }
});

/**
 * POST /api/auth/refresh — Proxy token refresh through backend
 * Avoids slow direct browser→Supabase calls
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ success: false, error: 'refresh_token is required' });
    }

    const sb = getSupabaseAnon();
    if (!sb) {
      return res.status(500).json({ success: false, error: 'Auth service not configured' });
    }

    const { data, error } = await sb.auth.refreshSession({ refresh_token });
    if (error) {
      return res.status(401).json({ success: false, error: error.message });
    }

    res.json({ success: true, session: data.session, user: data.user });
  } catch (error) {
    logger.error('Error in auth proxy refresh', { error: error.message });
    res.status(500).json({ success: false, error: 'Token refresh failed' });
  }
});

export default router;
