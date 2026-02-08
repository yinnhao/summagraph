import { useState, useEffect } from 'react';
import { GeneratedImage } from '../types';

interface ResultsGalleryProps {
  images: GeneratedImage[];
  onReset: () => void;
  onDownload: (imageUrl: string, index: number) => Promise<void>;
}

export default function ResultsGallery({ images, onReset, onDownload }: ResultsGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [downloadingImages, setDownloadingImages] = useState<Set<number>>(new Set());

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [selectedImage]);

  const handleDownload = async (image: GeneratedImage) => {
    setDownloadingImages((prev) => new Set(prev).add(image.index));
    try {
      await onDownload(image.url, image.index);
      // Show downloading state for 1 second, then reset
      setTimeout(() => {
        setDownloadingImages((prev) => {
          const newSet = new Set(prev);
          newSet.delete(image.index);
          return newSet;
        });
      }, 1000);
    } catch (err) {
      // Reset on error
      setDownloadingImages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(image.index);
        return newSet;
      });
    }
  };

  const handleDownloadAll = async () => {
    for (const image of images) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Stagger downloads
      handleDownload(image);
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between reveal-stagger">
          <div className="space-y-2">
            <h2 className="text-4xl font-display font-bold text-gradient-alchemy">
              Complete
            </h2>
            <p className="text-gray-400">
              {images.length} beautiful infographic{images.length > 1 ? 's' : ''} ready / {images.length} 张信息图已就绪
            </p>
          </div>
          <button
            onClick={onReset}
            className="px-6 py-3 bg-midnight-800/50 border border-white/10 rounded-2xl text-gray-300 font-medium hover:bg-midnight-800 hover:border-holo-cyan/50 hover:text-white transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
            <span>New / 重新生成</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 reveal-stagger">
          <button
            onClick={handleDownloadAll}
            className="px-6 py-3 bg-gradient-to-r from-holo-purple to-holo-cyan rounded-2xl text-white font-semibold hover:shadow-lg hover:shadow-holo-purple/25 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download All / 下载全部</span>
          </button>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {images.map((image, idx) => (
          <div
            key={image.index}
            className="reveal-stagger group"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            {/* Image Card */}
            <div className="glass-alchemy overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-holo-cyan/10">
              {/* Image Preview */}
              <div
                className="relative aspect-video overflow-hidden cursor-pointer bg-midnight-900"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.url}
                  alt={`Infographic ${image.index + 1}`}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-midnight-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                  <div className="flex items-center gap-2 text-white text-sm font-medium">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                    <span>Click to view / 点击查看</span>
                  </div>
                </div>
                {/* Image number badge */}
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-midnight-950/80 backdrop-blur-md rounded-full border border-white/10">
                  <span className="text-sm font-semibold text-holo-cyan">
                    #{image.index + 1}
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Infographic</span>
                </div>
                <button
                  onClick={() => handleDownload(image)}
                  disabled={downloadingImages.has(image.index)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    downloadingImages.has(image.index)
                      ? 'bg-holo-cyan/10 text-holo-cyan border border-holo-cyan/30 cursor-wait'
                      : 'bg-holo-purple/10 text-holo-purple border border-holo-purple/30 hover:bg-holo-purple/20'
                  }`}
                >
                  {downloadingImages.has(image.index) ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Download</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 md:p-8 bg-midnight-950/95 backdrop-blur-xl animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close button - floating at top right */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 z-[110] w-12 h-12 flex items-center justify-center bg-midnight-800/90 backdrop-blur-md rounded-full border-2 border-white/20 text-gray-300 hover:text-white hover:bg-red-500/90 hover:border-red-400 hover:scale-110 transition-all duration-300 shadow-lg group"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* ESC hint - fixed position */}
          <div className="absolute top-6 left-6 z-[110] text-xs text-gray-400 bg-midnight-800/50 px-3 py-1.5 rounded-full border border-white/10 hidden md:block">
            Press ESC to close / 按 ESC 关闭
          </div>

          {/* Image container -自适应显示 */}
          <div
            className="flex-1 flex items-center justify-center w-full max-w-6xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.url}
              alt={`Infographic ${selectedImage.index + 1}`}
              className="max-w-full max-h-[calc(100vh-180px)] object-contain rounded-2xl shadow-2xl"
            />
          </div>

          {/* Modal actions - fixed at bottom */}
          <div className="flex justify-center gap-4 py-6" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleDownload(selectedImage)}
              disabled={downloadingImages.has(selectedImage.index)}
              className="px-6 py-3 bg-gradient-to-r from-holo-purple to-holo-cyan rounded-2xl text-white font-semibold hover:shadow-lg hover:shadow-holo-purple/25 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadingImages.has(selectedImage.index) ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download / 下载图片</span>
                </>
              )}
            </button>
            <a
              href={selectedImage.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-midnight-800/50 border border-white/10 rounded-2xl text-gray-300 font-medium hover:bg-midnight-800 hover:border-holo-cyan/50 hover:text-white transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Open in new tab / 新窗口打开</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}
