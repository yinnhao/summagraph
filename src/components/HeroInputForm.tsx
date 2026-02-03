import React, { useState, useEffect } from 'react';
import { GenerationOptions } from '../types';

interface HeroInputFormProps {
  onSubmit: (options: GenerationOptions) => void;
  isLoading: boolean;
}

// Helper function to split Chinese and English text
function splitChineseAndEnglish(text: string) {
  // Try to match pattern like "中文 English" or "中文English"
  const match = text.match(/^([\u4e00-\u9fa5\s]+)\s*([a-zA-Z\s\-&]+)$/);
  if (match) {
    return { chinese: match[1].trim(), english: match[2].trim() };
  }
  // If no pattern match, try to find first English word
  const firstEnglishIndex = text.search(/[a-zA-Z]/);
  if (firstEnglishIndex > 0) {
    return {
      chinese: text.substring(0, firstEnglishIndex).trim(),
      english: text.substring(firstEnglishIndex).trim()
    };
  }
  // All Chinese or all English
  return { chinese: text, english: '' };
}

// Dynamic style and layout options that will be fetched from API
const INITIAL_STYLES = [
  { id: 'aged-academia', title: '学院复古 Aged Academia', summary: 'Historical scientific illustration' },
  { id: 'bold-graphic', title: '粗线漫画 Bold Graphic', summary: 'High-contrast comic style' },
  { id: 'chalkboard', title: '黑板粉笔 Chalkboard', summary: 'Black chalkboard background' },
  { id: 'claymation', title: '粘土动画 Claymation', summary: '3D clay figure aesthetic' },
  { id: 'corporate-memphis', title: '企业孟菲斯 Corporate Memphis', summary: 'Flat vector people' },
  { id: 'craft-handmade', title: '手作温度 Craft Handmade', summary: 'Hand-drawn paper craft' },
  { id: 'cyberpunk-neon', title: '赛博霓虹 Cyberpunk Neon', summary: 'Neon glow futuristic' },
  { id: 'ikea-manual', title: '宜家手册 IKEA Manual', summary: 'Minimal line art instructions' },
  { id: 'kawaii', title: '可爱风 Kawaii', summary: 'Japanese cute style' },
  { id: 'knolling', title: '平铺整理 Knolling', summary: 'Organized flat-lay' },
  { id: 'lego-brick', title: '乐高积木 Lego Brick', summary: 'Toy brick construction' },
  { id: 'origami', title: '折纸艺术 Origami', summary: 'Folded paper forms' },
  { id: 'pixel-art', title: '像素艺术 Pixel Art', summary: 'Retro 8-bit gaming' },
  { id: 'storybook-watercolor', title: '绘本水彩 Storybook Watercolor', summary: 'Soft hand-painted illustration' },
  { id: 'subway-map', title: '地铁线路 Subway Map', summary: 'Transit diagram style' },
  { id: 'technical-schematic', title: '技术图纸 Technical Schematic', summary: 'Technical diagrams' },
  { id: 'ui-wireframe', title: '界面线框 UI Wireframe', summary: 'Grayscale interface mockup' },
];

const INITIAL_LAYOUTS = [
  { id: 'bento-grid', title: '便当盒 Bento Grid', summary: 'Modular grid layout' },
  { id: 'binary-comparison', title: '二分对比 Binary Comparison', summary: 'Side-by-side comparison' },
  { id: 'bridge', title: '桥接 Bridge', summary: 'Gap-crossing structure' },
  { id: 'circular-flow', title: '循环流 Circular Flow', summary: 'Cyclic process' },
  { id: 'comic-strip', title: '漫画条 Comic Strip', summary: 'Sequential narrative panels' },
  { id: 'comparison-matrix', title: '对比矩阵 Comparison Matrix', summary: 'Grid-based comparison' },
  { id: 'dashboard', title: '仪表盘 Dashboard', summary: 'Multi-metric display' },
  { id: 'funnel', title: '漏斗 Funnel', summary: 'Narrowing stages' },
  { id: 'hierarchical-layers', title: '层级层 Hierarchical Layers', summary: 'Nested layers' },
  { id: 'hub-spoke', title: '轮毂辐射 Hub Spoke', summary: 'Central concept with radiating connections' },
  { id: 'iceberg', title: '冰山模型 Iceberg', summary: 'Surface vs hidden depths' },
  { id: 'isometric-map', title: '等距地图 Isometric Map', summary: '3D-style spatial layout' },
  { id: 'jigsaw', title: '拼图 Jigsaw', summary: 'Interlocking puzzle pieces' },
  { id: 'linear-progression', title: '线性递进 Linear Progression', summary: 'Sequential progression' },
  { id: 'periodic-table', title: '元素周期表 Periodic Table', summary: 'Grid of categorized elements' },
  { id: 'story-mountain', title: '故事山 Story Mountain', summary: 'Plot structure visualization' },
  { id: 'structural-breakdown', title: '结构分解 Structural Breakdown', summary: 'Internal structure visualization' },
  { id: 'tree-branching', title: '树状分支 Tree Branching', summary: 'Hierarchical branching' },
  { id: 'venn-diagram', title: '韦恩图 Venn Diagram', summary: 'Overlapping circles' },
  { id: 'winding-roadmap', title: '蜿蜒路线 Winding Roadmap', summary: 'Curved path journey' },
];

const ASPECT_RATIOS = [
  { id: 'landscape', name: '横屏', ratio: '16:9', icon: '↔' },
  { id: 'portrait', name: '竖屏', ratio: '9:16', icon: '↕' },
  { id: 'square', name: '方形', ratio: '1:1', icon: '□' },
];

const LANGUAGES = [
  { id: 'zh', name: '中文', flag: '🇨🇳' },
  { id: 'en', name: 'English', flag: '🇬🇧' },
];

export default function HeroInputForm({ onSubmit, isLoading }: HeroInputFormProps) {
  const [text, setText] = useState('');
  const [style, setStyle] = useState('craft-handmade'); // API default
  const [layout, setLayout] = useState('bento-grid'); // API default
  const [aspect, setAspect] = useState('landscape'); // API default
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [availableStyles, setAvailableStyles] = useState(INITIAL_STYLES);
  const [availableLayouts, setAvailableLayouts] = useState(INITIAL_LAYOUTS);

  // Show more options state
  const [showAllStyles, setShowAllStyles] = useState(false);
  const [showAllLayouts, setShowAllLayouts] = useState(false);

  // Display options (limit to 4 initially)
  const displayedStyles = showAllStyles ? availableStyles : availableStyles.slice(0, 4);
  const displayedLayouts = showAllLayouts ? availableLayouts : availableLayouts.slice(0, 3);

  // Fetch available options from API on mount
  useEffect(() => {
    fetch('/api/options')
      .then(res => res.json())
      .then(data => {
        if (data.styles && data.styles.length > 0) {
          // Map API style IDs to Chinese/English titles
          const styleTitles: { [key: string]: string } = {
            'aged-academia': '学院复古 Aged Academia',
            'bold-graphic': '粗线漫画 Bold Graphic',
            'chalkboard': '黑板粉笔 Chalkboard',
            'claymation': '粘土动画 Claymation',
            'corporate-memphis': '企业孟菲斯 Corporate Memphis',
            'craft-handmade': '手作温度 Craft Handmade',
            'cyberpunk-neon': '赛博霓虹 Cyberpunk Neon',
            'ikea-manual': '宜家手册 IKEA Manual',
            'kawaii': '可爱风 Kawaii',
            'knolling': '平铺整理 Knolling',
            'lego-brick': '乐高积木 Lego Brick',
            'origami': '折纸艺术 Origami',
            'pixel-art': '像素艺术 Pixel Art',
            'storybook-watercolor': '绘本水彩 Storybook Watercolor',
            'subway-map': '地铁线路 Subway Map',
            'technical-schematic': '技术图纸 Technical Schematic',
            'ui-wireframe': '界面线框 UI Wireframe',
          };
          const transformedStyles = data.styles.map((s: any) => ({
            ...s,
            title: styleTitles[s.id] || s.title || s.id
          }));
          setAvailableStyles(transformedStyles);
        }
        if (data.layouts && data.layouts.length > 0) {
          // Map API layout IDs to Chinese/English titles
          const layoutTitles: { [key: string]: string } = {
            'bento-grid': '便当盒 Bento Grid',
            'binary-comparison': '二分对比 Binary Comparison',
            'bridge': '桥接 Bridge',
            'circular-flow': '循环流 Circular Flow',
            'comic-strip': '漫画条 Comic Strip',
            'comparison-matrix': '对比矩阵 Comparison Matrix',
            'dashboard': '仪表盘 Dashboard',
            'funnel': '漏斗 Funnel',
            'hierarchical-layers': '层级层 Hierarchical Layers',
            'hub-spoke': '轮毂辐射 Hub Spoke',
            'iceberg': '冰山模型 Iceberg',
            'isometric-map': '等距地图 Isometric Map',
            'jigsaw': '拼图 Jigsaw',
            'linear-progression': '线性递进 Linear Progression',
            'periodic-table': '元素周期表 Periodic Table',
            'story-mountain': '故事山 Story Mountain',
            'structural-breakdown': '结构分解 Structural Breakdown',
            'tree-branching': '树状分支 Tree Branching',
            'venn-diagram': '韦恩图 Venn Diagram',
            'winding-roadmap': '蜿蜒路线 Winding Roadmap',
          };
          const transformedLayouts = data.layouts.map((l: any) => ({
            ...l,
            title: layoutTitles[l.id] || l.title || l.id
          }));
          setAvailableLayouts(transformedLayouts);
        }
      })
      .catch(err => {
        console.log('Using default options:', err);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;

    onSubmit({
      text: text.trim(),
      style,
      layout,
      imageCount: 1, // Will be determined by backend
      language,
      aspect,
    });
  };

  const charCount = text.length;
  const charCountColor = charCount > 2000 ? 'text-luminous-coral' : 'text-gray-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Text Input Section */}
      <div className="space-y-2 reveal-stagger">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-200 uppercase tracking-wide flex items-center gap-2">
            <svg className="w-4 h-4 text-holo-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            输入文本
          </label>
          <span className={`text-xs font-medium ${charCountColor}`}>
            {charCount.toLocaleString()} 字符
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="在此输入或粘贴您想要转换为信息图的文本内容...&#10;&#10;Enter or paste your text here..."
          rows={5}
          className="input-alchemy resize-none scrollbar-alchemy font-mono text-sm leading-relaxed"
          disabled={isLoading}
        />
      </div>

      {/* Options Grid - Two columns with better separation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Language Selection */}
          <div className="space-y-2 reveal-stagger">
            <label className="text-sm font-semibold text-gray-200 uppercase tracking-wide flex items-center gap-2">
              <svg className="w-4 h-4 text-holo-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              语言 / Language
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setLanguage(lang.id as 'zh' | 'en')}
                  disabled={isLoading}
                  className={`chip-alchemy flex items-center justify-center gap-2 py-2.5 group ${
                    language === lang.id ? 'selected' : ''
                  }`}
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">
                    {lang.flag}
                  </span>
                  <span className="font-semibold text-base">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-2 reveal-stagger">
            <label className="text-sm font-semibold text-gray-200 uppercase tracking-wide flex items-center gap-2">
              <svg className="w-4 h-4 text-holo-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              视觉风格 / Visual Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {displayedStyles.map((s) => {
                const { chinese, english } = splitChineseAndEnglish(s.title || s.name);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    disabled={isLoading}
                    className={`chip-alchemy py-2 group ${style === s.id ? 'selected' : ''}`}
                  >
                    <div className="font-semibold text-sm leading-tight">{chinese}</div>
                    {english && <div className="text-xs text-gray-500 leading-tight mt-0.5">{english}</div>}
                  </button>
                );
              })}
            </div>
            {availableStyles.length > 4 && (
              <button
                type="button"
                onClick={() => setShowAllStyles(!showAllStyles)}
                className="text-xs text-holo-cyan hover:text-holo-cyan/80 transition-colors flex items-center gap-1 mt-2"
              >
                {showAllStyles ? (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    收起选项
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    更多风格 ({availableStyles.length - 4} 个)
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Layout Selection */}
          <div className="space-y-2 reveal-stagger">
            <label className="text-sm font-semibold text-gray-200 uppercase tracking-wide flex items-center gap-2">
              <svg className="w-4 h-4 text-holo-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              布局构图 / Layout
            </label>
            <div className="grid grid-cols-3 gap-2">
              {displayedLayouts.map((lay) => {
                const { chinese, english } = splitChineseAndEnglish(lay.title || lay.name);
                return (
                  <button
                    key={lay.id}
                    type="button"
                    onClick={() => setLayout(lay.id)}
                    disabled={isLoading}
                    className={`chip-alchemy py-2 group ${layout === lay.id ? 'selected' : ''}`}
                  >
                    <div className="font-semibold text-xs leading-tight">{chinese}</div>
                    {english && <div className="text-xs text-gray-500 leading-tight mt-0.5">{english}</div>}
                  </button>
                );
              })}
            </div>
            {availableLayouts.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllLayouts(!showAllLayouts)}
                className="text-xs text-holo-cyan hover:text-holo-cyan/80 transition-colors flex items-center gap-1 mt-2"
              >
                {showAllLayouts ? (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    收起选项
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    更多布局 ({availableLayouts.length - 3} 个)
                  </>
                )}
              </button>
            )}
          </div>

          {/* Aspect Ratio Selection */}
          <div className="space-y-2 reveal-stagger">
            <label className="text-sm font-semibold text-gray-200 uppercase tracking-wide flex items-center gap-2">
              <svg className="w-4 h-4 text-luminous-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              画布比例 / Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  type="button"
                  onClick={() => setAspect(ratio.id)}
                  disabled={isLoading}
                  className={`chip-alchemy flex flex-col items-center gap-1.5 py-2 group ${
                    aspect === ratio.id ? 'selected' : ''
                  }`}
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">
                    {ratio.icon}
                  </span>
                  <div className="text-center">
                    <div className="font-semibold text-xs">{ratio.name}</div>
                    <div className="text-xs text-gray-500">{ratio.ratio}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="reveal-stagger pt-2">
        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="btn-alchemy w-full text-base font-display font-semibold py-3.5"
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
              <span>正在生成 / Generating...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>生成信息图 / Generate Infographic</span>
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
