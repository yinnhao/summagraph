import React, { useState } from 'react';
import { GenerationOptions } from '../types';

interface InputFormProps {
  onSubmit: (options: GenerationOptions) => void;
  isLoading: boolean;
}

const STYLES = [
  { id: 'minimalist', name: 'Minimalist', description: 'Clean and simple design' },
  { id: 'modern', name: 'Modern', description: 'Contemporary aesthetic' },
  { id: 'playful', name: 'Playful', description: 'Fun and colorful' },
  { id: 'professional', name: 'Professional', description: 'Business-oriented' },
];

const LAYOUTS = [
  { id: 'vertical', name: 'Vertical Scroll', icon: '↕' },
  { id: 'grid', name: 'Grid Layout', icon: '▦' },
  { id: 'story', name: 'Story Format', icon: '▹' },
];

const IMAGE_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const LANGUAGES = [
  { id: 'en', name: 'English', flag: '🇬🇧' },
  { id: 'zh', name: '中文', flag: '🇨🇳' },
];

export default function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [text, setText] = useState('');
  const [style, setStyle] = useState('minimalist');
  const [layout, setLayout] = useState('vertical');
  const [imageCount, setImageCount] = useState(4);
  const [language, setLanguage] = useState<'en' | 'zh'>('en');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSubmit({
      text: text.trim(),
      style,
      layout,
      imageCount,
      language,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Text Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">
          Your Text
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter the text you want to transform into infographics..."
          rows={6}
          className="input-field resize-none"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-400 text-right">
          {text.length} characters
        </p>
      </div>

      {/* Language Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">
          Language
        </label>
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => setLanguage(lang.id as 'en' | 'zh')}
              disabled={isLoading}
              className={`option-card flex items-center justify-center gap-2 ${
                language === lang.id ? 'selected' : ''
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Style Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">
          Visual Style
        </label>
        <div className="grid grid-cols-2 gap-3">
          {STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyle(s.id)}
              disabled={isLoading}
              className={`option-card ${style === s.id ? 'selected' : ''}`}
            >
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-gray-400 mt-1">{s.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Layout Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">
          Layout
        </label>
        <div className="grid grid-cols-3 gap-3">
          {LAYOUTS.map((lay) => (
            <button
              key={lay.id}
              type="button"
              onClick={() => setLayout(lay.id)}
              disabled={isLoading}
              className={`option-card flex flex-col items-center gap-2 ${
                layout === lay.id ? 'selected' : ''
              }`}
            >
              <span className="text-2xl">{lay.icon}</span>
              <span className="text-sm font-medium">{lay.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Image Count Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">
          Number of Images
        </label>
        <div className="grid grid-cols-5 gap-2">
          {IMAGE_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setImageCount(count)}
              disabled={isLoading}
              className={`option-card flex items-center justify-center py-3 ${
                imageCount === count ? 'selected' : ''
              }`}
            >
              <span className="font-semibold text-lg">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !text.trim()}
        className="btn-primary text-lg"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating...
          </span>
        ) : (
          'Generate Infographics'
        )}
      </button>
    </form>
  );
}
