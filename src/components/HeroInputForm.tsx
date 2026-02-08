import React, { useState, useEffect } from 'react';
import { GenerationOptions } from '../types';

interface HeroInputFormProps {
  onSubmit: (options: GenerationOptions) => void;
  isLoading: boolean;
}

// Helper function to split English and Chinese text
function splitChineseAndEnglish(text: string) {
  // Try to match pattern like "English 中文" or "中文 English"
  // First try: English followed by Chinese
  const matchEnFirst = text.match(/^([a-zA-Z\s\-&]+)\s*([\u4e00-\u9fa5\s]+)$/);
  if (matchEnFirst) {
    return { english: matchEnFirst[1].trim(), chinese: matchEnFirst[2].trim() };
  }
  // Second try: Chinese followed by English
  const matchZhFirst = text.match(/^([\u4e00-\u9fa5\s]+)\s*([a-zA-Z\s\-&]+)$/);
  if (matchZhFirst) {
    return { english: matchZhFirst[2].trim(), chinese: matchZhFirst[1].trim() };
  }
  // If no pattern match, try to find first Chinese char
  const firstChineseIndex = text.search(/[\u4e00-\u9fa5]/);
  if (firstChineseIndex > 0) {
    return {
      english: text.substring(0, firstChineseIndex).trim(),
      chinese: text.substring(firstChineseIndex).trim()
    };
  }
  // All English or all Chinese
  return { english: text, chinese: '' };
}

// Dynamic style and layout options that will be fetched from API
const INITIAL_STYLES = [
  { id: 'aged-academia', title: 'Aged Academia 学院复古', summary: 'Historical scientific illustration' },
  { id: 'bold-graphic', title: 'Bold Graphic 粗线漫画', summary: 'High-contrast comic style' },
  { id: 'chalkboard', title: 'Chalkboard 黑板粉笔', summary: 'Black chalkboard background' },
  { id: 'claymation', title: 'Claymation 粘土动画', summary: '3D clay figure aesthetic' },
  { id: 'corporate-memphis', title: 'Corporate Memphis 企业孟菲斯', summary: 'Flat vector people' },
  { id: 'craft-handmade', title: 'Craft Handmade 手作温度', summary: 'Hand-drawn paper craft' },
  { id: 'cyberpunk-neon', title: 'Cyberpunk Neon 赛博霓虹', summary: 'Neon glow futuristic' },
  { id: 'ikea-manual', title: 'IKEA Manual 宜家手册', summary: 'Minimal line art instructions' },
  { id: 'kawaii', title: 'Kawaii 可爱风', summary: 'Japanese cute style' },
  { id: 'knolling', title: 'Knolling 平铺整理', summary: 'Organized flat-lay' },
  { id: 'lego-brick', title: 'Lego Brick 乐高积木', summary: 'Toy brick construction' },
  { id: 'origami', title: 'Origami 折纸艺术', summary: 'Folded paper forms' },
  { id: 'pixel-art', title: 'Pixel Art 像素艺术', summary: 'Retro 8-bit gaming' },
  { id: 'storybook-watercolor', title: 'Storybook Watercolor 绘本水彩', summary: 'Soft hand-painted illustration' },
  { id: 'subway-map', title: 'Subway Map 地铁线路', summary: 'Transit diagram style' },
  { id: 'technical-schematic', title: 'Technical Schematic 技术图纸', summary: 'Technical diagrams' },
  { id: 'ui-wireframe', title: 'UI Wireframe 界面线框', summary: 'Grayscale interface mockup' },
];

const INITIAL_LAYOUTS = [
  { id: 'bento-grid', title: 'Bento Grid 便当盒', summary: 'Modular grid layout' },
  { id: 'binary-comparison', title: 'Binary Comparison 二分对比', summary: 'Side-by-side comparison' },
  { id: 'bridge', title: 'Bridge 桥接', summary: 'Gap-crossing structure' },
  { id: 'circular-flow', title: 'Circular Flow 循环流', summary: 'Cyclic process' },
  { id: 'comic-strip', title: 'Comic Strip 漫画条', summary: 'Sequential narrative panels' },
  { id: 'comparison-matrix', title: 'Comparison Matrix 对比矩阵', summary: 'Grid-based comparison' },
  { id: 'dashboard', title: 'Dashboard 仪表盘', summary: 'Multi-metric display' },
  { id: 'funnel', title: 'Funnel 漏斗', summary: 'Narrowing stages' },
  { id: 'hierarchical-layers', title: 'Hierarchical Layers 层级', summary: 'Nested layers' },
  { id: 'hub-spoke', title: 'Hub Spoke 轮毂辐射', summary: 'Central concept with radiating connections' },
  { id: 'iceberg', title: 'Iceberg 冰山模型', summary: 'Surface vs hidden depths' },
  { id: 'isometric-map', title: 'Isometric Map 等距地图', summary: '3D-style spatial layout' },
  { id: 'jigsaw', title: 'Jigsaw 拼图', summary: 'Interlocking puzzle pieces' },
  { id: 'linear-progression', title: 'Linear Progression 线性递进', summary: 'Sequential progression' },
  { id: 'periodic-table', title: 'Periodic Table 元素周期表', summary: 'Grid of categorized elements' },
  { id: 'story-mountain', title: 'Story Mountain 故事山', summary: 'Plot structure visualization' },
  { id: 'structural-breakdown', title: 'Structural Breakdown 结构分解', summary: 'Internal structure visualization' },
  { id: 'tree-branching', title: 'Tree Branching 树状分支', summary: 'Hierarchical branching' },
  { id: 'venn-diagram', title: 'Venn Diagram 韦恩图', summary: 'Overlapping circles' },
  { id: 'winding-roadmap', title: 'Winding Roadmap 蜿蜒路线', summary: 'Curved path journey' },
];

const ASPECT_RATIOS = [
  { id: 'landscape', name: 'Landscape', ratio: '16:9', icon: '↔' },
  { id: 'portrait', name: 'Portrait', ratio: '9:16', icon: '↕' },
  { id: 'square', name: 'Square', ratio: '1:1', icon: '□' },
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
            'aged-academia': 'Aged Academia 学院复古',
            'bold-graphic': 'Bold Graphic 粗线漫画',
            'chalkboard': 'Chalkboard 黑板粉笔',
            'claymation': 'Claymation 粘土动画',
            'corporate-memphis': 'Corporate Memphis 企业孟菲斯',
            'craft-handmade': 'Craft Handmade 手作温度',
            'cyberpunk-neon': 'Cyberpunk Neon 赛博霓虹',
            'ikea-manual': 'IKEA Manual 宜家手册',
            'kawaii': 'Kawaii 可爱风',
            'knolling': 'Knolling 平铺整理',
            'lego-brick': 'Lego Brick 乐高积木',
            'origami': 'Origami 折纸艺术',
            'pixel-art': 'Pixel Art 像素艺术',
            'storybook-watercolor': 'Storybook Watercolor 绘本水彩',
            'subway-map': 'Subway Map 地铁线路',
            'technical-schematic': 'Technical Schematic 技术图纸',
            'ui-wireframe': 'UI Wireframe 界面线框',
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
            'bento-grid': 'Bento Grid 便当盒',
            'binary-comparison': 'Binary Comparison 二分对比',
            'bridge': 'Bridge 桥接',
            'circular-flow': 'Circular Flow 循环流',
            'comic-strip': 'Comic Strip 漫画条',
            'comparison-matrix': 'Comparison Matrix 对比矩阵',
            'dashboard': 'Dashboard 仪表盘',
            'funnel': 'Funnel 漏斗',
            'hierarchical-layers': 'Hierarchical Layers 层级',
            'hub-spoke': 'Hub Spoke 轮毂辐射',
            'iceberg': 'Iceberg 冰山模型',
            'isometric-map': 'Isometric Map 等距地图',
            'jigsaw': 'Jigsaw 拼图',
            'linear-progression': 'Linear Progression 线性递进',
            'periodic-table': 'Periodic Table 元素周期表',
            'story-mountain': 'Story Mountain 故事山',
            'structural-breakdown': 'Structural Breakdown 结构分解',
            'tree-branching': 'Tree Branching 树状分支',
            'venn-diagram': 'Venn Diagram 韦恩图',
            'winding-roadmap': 'Winding Roadmap 蜿蜒路线',
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
            Input Text
          </label>
          <span className={`text-xs font-medium ${charCountColor}`}>
            {charCount.toLocaleString()} chars
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter or paste your text here to transform into an infographic...&#10;&#10;在此输入或粘贴您想要转换为信息图的文本内容..."
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
              Language / 语言
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
              Visual Style / 视觉风格
            </label>
            <div className="grid grid-cols-2 gap-2">
              {displayedStyles.map((s) => {
                const { english, chinese } = splitChineseAndEnglish(s.title);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    disabled={isLoading}
                    className={`chip-alchemy py-2 group ${style === s.id ? 'selected' : ''}`}
                  >
                    <div className="font-semibold text-sm leading-tight">{english}</div>
                    {chinese && <div className="text-xs text-gray-500 leading-tight mt-0.5">{chinese}</div>}
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
                    Collapse
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    More styles ({availableStyles.length - 4})
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
              Layout / 布局构图
            </label>
            <div className="grid grid-cols-3 gap-2">
              {displayedLayouts.map((lay) => {
                const { english, chinese } = splitChineseAndEnglish(lay.title);
                return (
                  <button
                    key={lay.id}
                    type="button"
                    onClick={() => setLayout(lay.id)}
                    disabled={isLoading}
                    className={`chip-alchemy py-2 group ${layout === lay.id ? 'selected' : ''}`}
                  >
                    <div className="font-semibold text-xs leading-tight">{english}</div>
                    {chinese && <div className="text-xs text-gray-500 leading-tight mt-0.5">{chinese}</div>}
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
                    Collapse
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    More layouts ({availableLayouts.length - 3})
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
              Aspect Ratio / 画布比例
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
              <span>Generating... / 正在生成</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Generate Infographic / 生成信息图</span>
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
