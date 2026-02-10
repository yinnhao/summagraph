import { useState, useCallback, useEffect, useRef } from 'react';
import HeroInputForm from './components/HeroInputForm';
import AlchemicalLoading from './components/AlchemicalLoading';
import ResultsGallery from './components/ResultsGallery';
import LoginModal from './components/LoginModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GenerationOptions, GeneratedImage } from './types';

type Step = 'hero' | 'loading' | 'results';

const SESSION_RESULTS_KEY = 'summagraph_results';
const SESSION_PENDING_KEY = 'summagraph_pending_generate';

function AppContent() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [step, setStep] = useState<Step>(() => {
    // Restore step from sessionStorage if returning from OAuth redirect
    try {
      const saved = sessionStorage.getItem(SESSION_RESULTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.step === 'results' && parsed.images?.length > 0) {
          return 'results';
        }
      }
    } catch { /* ignore */ }
    return 'hero';
  });
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(() => {
    // Restore generated images from sessionStorage
    try {
      const saved = sessionStorage.getItem(SESSION_RESULTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.images?.length > 0) {
          // Clean up after restoring — one-time use
          sessionStorage.removeItem(SESSION_RESULTS_KEY);
          return parsed.images;
        }
      }
    } catch { /* ignore */ }
    return [];
  });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState<{zh: string, en: string} | null>(null);
  const [loadingStep, setLoadingStep] = useState<{current: number, total: number} | null>(null);
  const [loadingLogs, setLoadingLogs] = useState<Array<{step: number, total: number, message: {zh: string, en: string}, timestamp: string}>>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Persist results to sessionStorage whenever we have them,
  // so they survive OAuth redirects
  useEffect(() => {
    if (step === 'results' && generatedImages.length > 0) {
      try {
        sessionStorage.setItem(SESSION_RESULTS_KEY, JSON.stringify({
          step: 'results',
          images: generatedImages,
        }));
      } catch { /* storage full, ignore */ }
    }
  }, [step, generatedImages]);

  // After OAuth redirect: if user is now logged in and there are pending
  // generation options saved before the redirect, auto-trigger generation
  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish loading
    if (!user) return; // Not logged in

    try {
      const pendingRaw = sessionStorage.getItem(SESSION_PENDING_KEY);
      if (pendingRaw) {
        sessionStorage.removeItem(SESSION_PENDING_KEY);
        const options = JSON.parse(pendingRaw) as GenerationOptions;
        // Small delay to let the UI settle after auth
        setTimeout(() => doGenerate(options), 500);
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  /**
   * Gate check — if user is not logged in, show login modal.
   * After successful login, the pending action will be executed.
   */
  const requireLogin = useCallback((action: () => void): boolean => {
    if (user) {
      return true; // User is logged in, proceed
    }
    setPendingAction(() => action);
    setShowLoginModal(true);
    return false;
  }, [user]);

  const handleLoginSuccess = useCallback(() => {
    if (pendingAction) {
      // Execute the pending action after a brief delay to let auth state update
      setTimeout(() => {
        pendingAction();
        setPendingAction(null);
      }, 300);
    }
  }, [pendingAction]);

  const handleGenerate = (options: GenerationOptions) => {
    // Require login before generating
    if (!user) {
      // Save options to sessionStorage so they survive OAuth redirects
      try {
        sessionStorage.setItem(SESSION_PENDING_KEY, JSON.stringify(options));
      } catch { /* ignore */ }
      setPendingAction(() => () => doGenerate(options));
      setShowLoginModal(true);
      return;
    }
    doGenerate(options);
  };

  const doGenerate = async (options: GenerationOptions) => {
    setStep('loading');
    setLoadingProgress(0);
    setLoadingMessage(null);
    setLoadingStep(null);
    setLoadingLogs([]);

    try {
      const response = await fetch('/api/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error('Generation failed / 生成失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Unable to read response / 无法读取响应');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'start') {
                console.log('Generation started:', data.message);
              } else if (data.type === 'progress') {
                const progressData = data.data;
                setLoadingProgress(progressData.progress);
                setLoadingMessage(progressData.message);
                setLoadingStep({ current: progressData.step, total: progressData.total });

                // Add to logs
                setLoadingLogs(prev => [
                  ...prev,
                  {
                    step: progressData.step,
                    total: progressData.total,
                    message: progressData.message,
                    timestamp: progressData.timestamp
                  }
                ]);
              } else if (data.type === 'complete') {
                const result = data.data;

                // Handle the API response format
                const images: GeneratedImage[] = [];

                if (result.data && result.data.images && Array.isArray(result.data.images)) {
                  result.data.images.forEach((img: any, idx: number) => {
                    images.push({
                      url: img.url || img.image_url || img,
                      index: idx,
                      title: img.title || result.data.title || '',
                      layout: result.data.layout,
                      aspect: result.data.aspect,
                    });
                  });
                }

                setGeneratedImages(images);
                setLoadingProgress(100);

                // Small delay before showing results
                setTimeout(() => {
                  setStep('results');
                }, 500);
              } else if (data.type === 'error') {
                throw new Error(data.error || '生成失败 / Generation failed');
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Generation error:', err);
      setStep('hero');
      alert(`Error / 错误: ${err instanceof Error ? err.message : 'Unknown error / 未知错误'}`);
    }
  };

  const handleDownload = async (imageUrl: string, index: number): Promise<void> => {
    try {
      // Fetch the image as blob
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `summagraph-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      }, 100);
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback: open in new tab
      window.open(imageUrl, '_blank');
      throw err;
    }
  };

  const handleReset = () => {
    setStep('hero');
    setGeneratedImages([]);
    setLoadingProgress(0);
    sessionStorage.removeItem(SESSION_RESULTS_KEY);
    sessionStorage.removeItem(SESSION_PENDING_KEY);
  };

  return (
    <div className="min-h-screen relative">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-holo-purple/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-holo-cyan/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-holo-pink/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/5 backdrop-blur-sm bg-midnight-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-holo-purple via-holo-cyan to-holo-pink rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                <div className="relative w-10 h-10 bg-midnight-900 rounded-xl flex items-center justify-center border border-white/10">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Brand */}
              <div>
                <h1 className="text-xl font-display font-bold text-white tracking-tight">
                  SummaGraph
                </h1>
                <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">
                  AI Infographic Generator
                </p>
              </div>
            </div>

            {/* User Auth Area */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-midnight-800/50 border border-white/10 hover:border-holo-cyan/30 transition-all duration-200"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="Avatar"
                        className="w-7 h-7 rounded-full border border-white/20"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-holo-purple to-holo-cyan flex items-center justify-center text-white text-xs font-bold">
                        {(user.email?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-gray-300 hidden sm:inline max-w-[120px] truncate">
                      {user.user_metadata?.full_name || user.email}
                    </span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 z-50 rounded-2xl p-2 shadow-2xl animate-fade-in bg-midnight-900 border border-white/10"
                      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                    >
                      <div className="px-3 py-2 border-b border-white/10 mb-1">
                        <p className="text-sm text-white font-medium truncate">
                          {user.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      {step !== 'hero' && (
                        <button
                          onClick={() => {
                            handleReset();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>New / 重新生成</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          signOut();
                          handleReset();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out / 退出登录</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-holo-purple/20 to-holo-cyan/20 border border-white/10 hover:border-holo-purple/50 text-sm text-gray-300 hover:text-white transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Sign In / 登录</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {step === 'hero' && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Hero Section - Compact */}
            <div className="text-center space-y-3 animate-fade-in">
              <h2 className="text-4xl sm:text-5xl font-display font-bold leading-tight whitespace-nowrap">
                <span className="text-white">Transform Text into </span>
                <span className="text-gradient-alchemy">Visual Stories</span>
              </h2>

              <p className="text-sm text-gray-400 max-w-xl mx-auto">
                Enter your text, choose a style, and let AI create stunning infographics
              </p>
              <p className="text-xs text-gray-500 max-w-xl mx-auto">
                输入文本，选择风格，让AI为您创作精美的信息图
              </p>
            </div>

            {/* Input Form Card */}
            <div className="glass-alchemy p-6 md:p-8">
              <HeroInputForm onSubmit={handleGenerate} isLoading={false} />
            </div>
          </div>
        )}

        {step === 'loading' && (
          <AlchemicalLoading
            progress={loadingProgress}
            message={loadingMessage}
            stepInfo={loadingStep}
            logs={loadingLogs}
          />
        )}

        {step === 'results' && (
          <div className="max-w-6xl mx-auto animate-fade-in">
            <ResultsGallery
              images={generatedImages}
              onReset={handleReset}
              onDownload={handleDownload}
              requireLogin={requireLogin}
            />
          </div>
        )}
      </main>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setPendingAction(null);
          sessionStorage.removeItem(SESSION_PENDING_KEY);
        }}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
