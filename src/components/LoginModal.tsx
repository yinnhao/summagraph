import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      // Validate password match
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致 / Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('密码至少6位 / Password must be at least 6 characters');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          // Friendly error messages
          const msg = error.message;
          if (msg.includes('Invalid login credentials')) {
            setError('邮箱或密码错误 / Invalid email or password');
          } else {
            setError(msg);
          }
        } else {
          onSuccess?.();
          onClose();
        }
      } else {
        const { error } = await signUpWithEmail(email, password);
        if (error) {
          const msg = error.message;
          if (msg.includes('already registered') || msg.includes('already exists')) {
            setError('该邮箱已注册，请直接登录 / Email already registered, please sign in');
          } else {
            setError(msg);
          }
        } else {
          // Registration successful — auto-login completed by signUpWithEmail
          onSuccess?.();
          onClose();
        }
      }
    } catch {
      setError('发生未知错误 / An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // signInWithGoogle will redirect — page will leave
    } catch (err) {
      setGoogleLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    resetForm();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-midnight-950/90 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md glass-alchemy p-8 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-midnight-800/50 border border-white/10 text-gray-400 hover:text-white hover:bg-midnight-700 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-holo-purple/20 to-holo-cyan/20 border border-white/10 mb-4">
            <svg className="w-8 h-8 text-holo-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-2xl font-display font-bold text-white">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {mode === 'login'
              ? 'Sign in to generate and download infographics'
              : 'Sign up to start creating infographics'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {mode === 'login'
              ? '登录以生成和下载信息图'
              : '注册开始创建信息图'}
          </p>
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white rounded-2xl text-gray-800 font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-wait"
        >
          {googleLoading ? (
            <>
              <svg className="w-5 h-5 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Redirecting... / 跳转中...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <span className="text-xs text-gray-500 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address / 邮箱地址"
              required
              className="input-alchemy text-sm"
              autoComplete="email"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password / 密码"
              required
              minLength={6}
              className="input-alchemy text-sm"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {/* Confirm password — only for signup */}
          {mode === 'signup' && (
            <div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password / 确认密码"
                required
                minLength={6}
                className="input-alchemy text-sm"
                autoComplete="new-password"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1.5 ml-1">
                  密码不一致 / Passwords do not match
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'signup' && password !== confirmPassword)}
            className="w-full btn-alchemy text-sm py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{mode === 'login' ? 'Signing in... / 登录中...' : 'Creating... / 注册中...'}</span>
              </>
            ) : (
              <span>{mode === 'login' ? 'Sign In / 登录' : 'Create Account / 注册'}</span>
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="text-center mt-6">
          <button
            onClick={switchMode}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <span className="text-holo-purple font-medium">Sign Up / 注册</span>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <span className="text-holo-purple font-medium">Sign In / 登录</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
