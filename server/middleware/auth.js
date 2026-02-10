import { createClient } from '@supabase/supabase-js';

// Lazy-initialized Supabase admin client (waits for dotenv to load)
let _supabaseAdmin = null;

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Supabase credentials not configured on backend. Auth features will not work.');
      // Return a dummy client that won't crash but won't work
      _supabaseAdmin = createClient('https://placeholder.supabase.co', 'placeholder');
    } else {
      _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    }
  }
  return _supabaseAdmin;
}

/**
 * Auth middleware — extracts and verifies JWT from Authorization header.
 * Attaches `req.user` if valid, otherwise continues without user (non-blocking).
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.replace('Bearer ', '');

  getSupabaseAdmin().auth.getUser(token)
    .then(({ data: { user }, error }) => {
      if (error || !user) {
        req.user = null;
      } else {
        req.user = user;
      }
      next();
    })
    .catch(() => {
      req.user = null;
      next();
    });
}

/**
 * Require auth middleware — returns 401 if user is not authenticated.
 * Must be used after authMiddleware.
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required / 需要登录',
    });
  }
  next();
}

// Export as getter so it's always lazy-initialized
export const supabaseAdmin = new Proxy({}, {
  get(_, prop) {
    return getSupabaseAdmin()[prop];
  }
});
