import { useState } from 'react';
import InputForm from './components/InputForm';
import LoadingState from './components/LoadingState';
import ResultsDisplay from './components/ResultsDisplay';
import { GenerationOptions, GeneratedImage } from './types';

function App() {
  const [step, setStep] = useState<'input' | 'loading' | 'results'>('input');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const handleGenerate = async (options: GenerationOptions) => {
    setStep('loading');

    try {
      // Call the baoyu-xhs-images skill
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error('Failed to generate infographics');
      }

      const data = await response.json();

      if (data.success && data.images) {
        setGeneratedImages(data.images);
        setStep('results');
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setStep('input');
      alert(`Error: ${err instanceof Error ? err.message : 'An error occurred'}`);
    }
  };

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `summagraph-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback: open in new tab
      window.open(imageUrl, '_blank');
    }
  };

  const handleReset = () => {
    setStep('input');
    setGeneratedImages([]);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Summagraph</h1>
                <p className="text-xs text-gray-400">Transform Text into Visual Stories</p>
              </div>
            </div>
            <nav className="hidden sm:flex items-center gap-6">
              <a href="#features" className="text-sm text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#about" className="text-sm text-gray-300 hover:text-white transition-colors">About</a>
              <a href="https://github.com" className="text-sm text-gray-300 hover:text-white transition-colors">GitHub</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {step === 'input' && (
          <div className="max-w-3xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12 animate-fade-in">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                Transform Your Text Into
                <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                  {' '}Beautiful Infographics
                </span>
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Simply paste your text, choose your style, and let AI create stunning visual stories for you in seconds.
              </p>
            </div>

            {/* Input Form Card */}
            <div className="glass-card p-8 animate-slide-up">
              <InputForm
                onSubmit={handleGenerate}
                isLoading={false}
              />
            </div>

            {/* Features Section */}
            <div id="features" className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
                <p className="text-sm text-gray-400">Generate beautiful infographics in seconds, not hours</p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Multiple Styles</h3>
                <p className="text-sm text-gray-400">Choose from various visual styles to match your brand</p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Multi-Language</h3>
                <p className="text-sm text-gray-400">Support for English and Chinese content</p>
              </div>
            </div>
          </div>
        )}

        {step === 'loading' && <LoadingState />}

        {step === 'results' && (
          <div className="max-w-5xl mx-auto">
            <ResultsDisplay
              images={generatedImages}
              onReset={handleReset}
              onDownload={handleDownload}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              © 2024 Summagraph. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
