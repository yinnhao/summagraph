import { GeneratedImage } from '../types';

interface ResultsDisplayProps {
  images: GeneratedImage[];
  onReset: () => void;
  onDownload: (imageUrl: string, index: number) => void;
}

export default function ResultsDisplay({ images, onReset, onDownload }: ResultsDisplayProps) {
  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Your Infographics Are Ready!</h2>
        <p className="text-gray-400">Here are your {images.length} beautifully designed images</p>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {images.map((image, index) => (
          <div
            key={image.index}
            className="glass-card overflow-hidden animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="relative group">
              <img
                src={image.url}
                alt={`Infographic ${index + 1}`}
                className="w-full h-auto"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                <button
                  onClick={() => onDownload(image.url, index)}
                  className="btn-secondary"
                  title="Download image"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                <button
                  onClick={() => window.open(image.url, '_blank')}
                  className="btn-secondary"
                  title="Open in new tab"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-300">Image {index + 1} of {images.length}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onReset}
          className="btn-primary max-w-xs"
        >
          Create More Infographics
        </button>
        <button
          onClick={() => {
            images.forEach((img, idx) => onDownload(img.url, idx));
          }}
          className="btn-secondary max-w-xs"
        >
          Download All
        </button>
      </div>

      {/* Share Section */}
      <div className="text-center pt-6 border-t border-white/10">
        <p className="text-sm text-gray-400 mb-3">Love your infographics? Share Summagraph with others!</p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => {
              const url = `https://www.summagraph.com`;
              navigator.clipboard.writeText(url);
              alert('Link copied to clipboard!');
            }}
            className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
          >
            Copy Link
          </button>
          <span className="text-gray-600">•</span>
          <button
            onClick={() => {
              const text = `Check out Summagraph - I just created amazing infographics from text! www.summagraph.com`;
              const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
              window.open(url, '_blank');
            }}
            className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
          >
            Share on X
          </button>
        </div>
      </div>
    </div>
  );
}
