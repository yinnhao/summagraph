import React, { useState } from 'react';

interface AlchemicalLoadingProps {
  progress?: number;
  message?: { zh: string; en: string } | null;
  stepInfo?: { current: number; total: number } | null;
  logs?: Array<{ step: number; total: number; message: { zh: string; en: string }; timestamp: string }>;
}

export default function AlchemicalLoading({
  progress = 0,
  message,
  stepInfo,
  logs = []
}: AlchemicalLoadingProps) {
  const [language] = useState<'zh' | 'en'>('zh');

  // Use real-time message from backend, or fallback to default
  const currentMessage = message?.[language] || (language === 'zh' ? '正在处理...' : 'Processing...');

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center py-20">
      {/* Morphing gradient blob background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="morph-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-30" />
      </div>

      {/* Floating particles */}
      <div className="particles-bg">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center space-y-12">
        {/* Central icon */}
        <div className="relative">
          {/* Glowing ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-holo-purple via-holo-cyan to-holo-pink opacity-20 blur-2xl animate-pulse-slow" />

          {/* Rotating outer ring */}
          <div className="relative w-32 h-32">
            <svg className="absolute inset-0 w-full h-full animate-spin" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="2"
                strokeDasharray="10 5"
                strokeLinecap="round"
                opacity="0.6"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A855F7" />
                  <stop offset="50%" stopColor="#22D3EE" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner pulsing circle */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-holo-purple/20 to-holo-cyan/20 backdrop-blur-xl border border-white/10 flex items-center justify-center">
              {/* Alchemy symbol */}
              <svg
                className="w-12 h-12 text-white animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Message text */}
        <div className="text-center space-y-3">
          <h3 className="text-2xl font-display font-semibold text-gradient-alchemy animate-pulse-slow">
            {currentMessage}
          </h3>
          {stepInfo && (
            <p className="text-sm text-holo-cyan font-mono">
              Step {stepInfo.current} of {stepInfo.total}
            </p>
          )}
          <p className="text-xs text-gray-500 font-mono">
            AI is transforming your text into visual stories
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-80 space-y-2">
          <div className="h-1.5 bg-midnight-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-holo-purple via-holo-cyan to-holo-pink rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect on progress bar */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-600 font-mono">
            <span>{stepInfo ? `Step ${stepInfo.current}/${stepInfo.total}` : 'Processing...'}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Progress Logs */}
        {logs.length > 0 && (
          <div className="w-80 max-h-40 overflow-y-auto space-y-2">
            <div className="text-xs text-gray-500 font-mono mb-2">Progress Log / 进度日志:</div>
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`text-xs font-mono p-2 rounded border border-white/5 ${
                    index === logs.length - 1 ? 'bg-holo-purple/10 border-holo-purple/30' : 'bg-midnight-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-400">[{log.step}/{log.total}]</span>
                    <span className="text-gray-600">{formatTime(log.timestamp)}</span>
                  </div>
                  <div className="text-gray-300 mt-1">{log.message[language]}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status indicators */}
        <div className="flex items-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-holo-purple animate-pulse" />
            <span>Analyzing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-holo-cyan animate-pulse" style={{ animationDelay: '0.5s' }} />
            <span>Creating</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-holo-pink animate-pulse" style={{ animationDelay: '1s' }} />
            <span>Refining</span>
          </div>
        </div>
      </div>

      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-holo-purple/20 rounded-tl-3xl" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-holo-cyan/20 rounded-tr-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-holo-pink/20 rounded-bl-3xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-holo-mint/20 rounded-br-3xl" />
    </div>
  );
}
