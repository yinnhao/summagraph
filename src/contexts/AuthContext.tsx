import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { logEvent } from '../utils/analytics';

// ---- Types ----
interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

// ---- Local storage ----
const AUTH_STORAGE_KEY = 'summagraph_auth_session';

function saveAuthToStorage(session: AuthSession, user: AuthUser) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ session, user }));
  } catch { /* ignore */ }
}

function loadAuthFromStorage(): { session: AuthSession; user: AuthUser } | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.session?.access_token && parsed?.user?.id) {
      return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

function clearAuthStorage() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        localStorage.removeItem(key);
      }
    }
  } catch { /* ignore */ }
}

// ---- JWT decode (no verification — just read payload) ----
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ---- Parse Supabase OAuth hash (legacy fallback) ----
function parseSupabaseOAuthHash(): { session: AuthSession; user: AuthUser } | null {
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token') || hash.includes('id_token')) return null;

  const params = new URLSearchParams(hash.substring(1));
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  const expires_at = params.get('expires_at');

  if (!access_token || !refresh_token) return null;

  const payload = decodeJwtPayload(access_token);
  if (!payload) return null;

  return {
    user: {
      id: payload.sub,
      email: payload.email,
      user_metadata: payload.user_metadata || {},
    },
    session: {
      access_token,
      refresh_token,
      expires_at: expires_at ? parseInt(expires_at, 10) : undefined,
    },
  };
}

// ---- Parse Google OAuth callback from query string ----
// Backend redirects to /?google_auth=base64url_encoded_payload after successful OAuth
function parseGoogleAuthCallback(): { session: AuthSession; user: AuthUser } | null {
  const params = new URLSearchParams(window.location.search);
  const payload = params.get('google_auth');
  if (!payload) return null;

  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(json);
    if (data?.session?.access_token && data?.user?.id) {
      return {
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
      };
    }
  } catch { /* ignore */ }
  return null;
}

// ---- Context ----
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Schedule token refresh via backend proxy (5 minutes before expiry)
  const scheduleRefresh = useCallback((currentSession: AuthSession) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (!currentSession.expires_at || !currentSession.refresh_token) return;

    const now = Math.floor(Date.now() / 1000);
    const refreshIn = Math.max((currentSession.expires_at - now - 300) * 1000, 10000);

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: currentSession.refresh_token }),
        });
        const data = await res.json();
        if (data.success && data.session && data.user) {
          const newSession: AuthSession = {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
          };
          const newUser: AuthUser = {
            id: data.user.id,
            email: data.user.email,
            user_metadata: data.user.user_metadata,
          };
          setSession(newSession);
          setUser(newUser);
          saveAuthToStorage(newSession, newUser);
          scheduleRefresh(newSession);
        } else {
          setSession(null);
          setUser(null);
          clearAuthStorage();
        }
      } catch {
        // Network error — will retry on next page load
      }
    }, refreshIn);
  }, []);

  // Helper to apply auth result
  const applyAuth = useCallback((result: { session: AuthSession; user: AuthUser }) => {
    setSession(result.session);
    setUser(result.user);
    saveAuthToStorage(result.session, result.user);
    scheduleRefresh(result.session);
  }, [scheduleRefresh]);

  // On mount: restore session
  useEffect(() => {
    const init = async () => {
      // 1. Check for Google OAuth callback (backend redirects to /?google_auth=...)
      const googleResult = parseGoogleAuthCallback();
      if (googleResult) {
        applyAuth(googleResult);
        // Clean up URL
        window.history.replaceState(null, '', window.location.pathname);
        setLoading(false);
        return;
      }

      // 2. Check Supabase OAuth hash (legacy fallback)
      const supabaseResult = parseSupabaseOAuthHash();
      if (supabaseResult) {
        applyAuth(supabaseResult);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        setLoading(false);
        return;
      }

      // 3. Check localStorage
      const stored = loadAuthFromStorage();
      if (stored) {
        const now = Math.floor(Date.now() / 1000);
        if (stored.session.expires_at && stored.session.expires_at > now + 60) {
          applyAuth(stored);
          setLoading(false);
          return;
        } else if (stored.session.refresh_token) {
          try {
            const res = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: stored.session.refresh_token }),
            });
            const data = await res.json();
            if (data.success && data.session && data.user) {
              applyAuth({
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
              });
            } else {
              clearAuthStorage();
            }
          } catch {
            clearAuthStorage();
          }
          setLoading(false);
          return;
        } else {
          clearAuthStorage();
        }
      }

      // 4. No session — not logged in
      setLoading(false);
    };

    init();
  }, [applyAuth, scheduleRefresh]);

  // Cleanup refresh timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  // Google OAuth — redirect-based authorization code flow
  // Browser → our backend /start → Google → our backend /callback → Supabase (server-side) → frontend
  // Browser NEVER touches supabase.co
  const signInWithGoogle = useCallback(async () => {
    logEvent('Auth', 'Login', 'Google');
    // Navigate to our backend which handles the entire OAuth flow
    window.location.href = '/api/auth/google/start';
  }, []);

  // Email sign-in — fully proxied through backend (fast)
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success || !data.session) {
        return { error: new Error(data.error || 'Sign in failed') };
      }

      applyAuth({
        user: {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
      });

      logEvent('Auth', 'Login', 'Email');

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign in failed') };
    }
  }, [applyAuth]);

  // Email sign-up — fully proxied through backend
  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        return { error: new Error(data.error || 'Sign up failed') };
      }

      if (data.session && data.user) {
        applyAuth({
          user: {
            id: data.user.id,
            email: data.user.email,
            user_metadata: data.user.user_metadata,
          },
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
          },
        });
      }

      logEvent('Auth', 'Signup', 'Email');

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign up failed') };
    }
  }, [applyAuth]);

  // Sign out — local only (instant)
  const signOut = useCallback(async () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    setSession(null);
    setUser(null);
    clearAuthStorage();
    fetch('/api/auth/signout', { method: 'POST' }).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
