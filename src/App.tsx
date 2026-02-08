import { useState } from 'react';
import HeroInputForm from './components/HeroInputForm';
import AlchemicalLoading from './components/AlchemicalLoading';
import ResultsGallery from './components/ResultsGallery';
import { GenerationOptions, GeneratedImage } from './types';

type Step = 'hero' | 'loading' | 'results';

function App() {
  const [step, setStep] = useState<Step>('hero');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState<{zh: string, en: string} | null>(null);
  const [loadingStep, setLoadingStep] = useState<{current: number, total: number} | null>(null);
  const [loadingLogs, setLoadingLogs] = useState<Array<{step: number, total: number, message: {zh: string, en: string}, timestamp: string}>>([]);

  const handleGenerate = async (options: GenerationOptions) => {
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
      <header className="relative z-10 border-b border-white/5 backdrop-blur-sm bg-midnight-950/30">
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

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
            </nav>
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
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
