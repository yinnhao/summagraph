import React from 'react';

export default function LoadingState() {
  const loadingSteps = [
    'Analyzing your text...',
    'Designing layout structure...',
    'Generating visual elements...',
    'Applying style preferences...',
    'Creating infographic images...',
    'Finalizing details...',
  ];

  const [currentStep, setCurrentStep] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % loadingSteps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      {/* Animated Circles */}
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-primary-500/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin"></div>
        <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-primary-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-12 h-12 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {/* Progress Text */}
      <div className="text-center space-y-3">
        <h3 className="text-xl font-semibold text-white">Generating Your Infographics</h3>
        <p className="text-gray-400 text-sm">{loadingSteps[currentStep]}</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mt-8">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full animate-pulse-slow" style={{ width: '70%' }}></div>
        </div>
      </div>

      {/* Info Text */}
      <p className="mt-8 text-xs text-gray-500 text-center max-w-md">
        This may take a moment. We're creating beautiful, customized infographics just for you.
      </p>
    </div>
  );
}
