import express from 'express';
import cors from 'cors';
import { generateInfographics } from './generator.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get available options endpoint
app.get('/api/options', (req, res) => {
  res.json({
    defaults: {
      aspect: 'landscape',
      layout: 'bento-grid',
      style: 'craft-handmade'
    },
    layouts: [
      { id: 'bento-grid', summary: 'Modular grid layout with varied cell sizes, like a bento box.', title: 'bento-grid' },
      { id: 'binary-comparison', summary: 'Side-by-side comparison of two items, states, or concepts.', title: 'binary-comparison' },
      { id: 'bridge', summary: 'Gap-crossing structure connecting problem to solution or current to future state.', title: 'bridge' },
      { id: 'circular-flow', summary: 'Cyclic process showing continuous or recurring steps.', title: 'circular-flow' },
      { id: 'comic-strip', summary: 'Sequential narrative panels telling a story or explaining a concept.', title: 'comic-strip' },
      { id: 'comparison-matrix', summary: 'Grid-based multi-factor comparison across multiple items.', title: 'comparison-matrix' },
      { id: 'dashboard', summary: 'Multi-metric display with charts, numbers, and KPI indicators.', title: 'dashboard' },
      { id: 'funnel', summary: 'Narrowing stages showing conversion, filtering, or refinement process.', title: 'funnel' },
      { id: 'hierarchical-layers', summary: 'Nested layers showing levels of importance, influence, or proximity.', title: 'hierarchical-layers' },
      { id: 'hub-spoke', summary: 'Central concept with radiating connections to related items.', title: 'hub-spoke' },
      { id: 'iceberg', summary: 'Surface vs hidden depths, visible vs underlying factors.', title: 'iceberg' },
      { id: 'isometric-map', summary: '3D-style spatial layout showing locations, relationships, or journey through space.', title: 'isometric-map' },
      { id: 'jigsaw', summary: 'Interlocking puzzle pieces showing how parts fit together.', title: 'jigsaw' },
      { id: 'linear-progression', summary: 'Sequential progression showing steps, timeline, or chronological events.', title: 'linear-progression' },
      { id: 'periodic-table', summary: 'Grid of categorized elements with consistent cell formatting.', title: 'periodic-table' },
      { id: 'story-mountain', summary: 'Plot structure visualization showing rising action, climax, and resolution.', title: 'story-mountain' },
      { id: 'structural-breakdown', summary: 'Internal structure visualization with labeled parts or layers.', title: 'structural-breakdown' },
      { id: 'tree-branching', summary: 'Hierarchical structure branching from root to leaves, showing categories and subcategories.', title: 'tree-branching' },
      { id: 'venn-diagram', summary: 'Overlapping circles showing relationships, commonalities, and differences.', title: 'venn-diagram' },
      { id: 'winding-roadmap', summary: 'Curved path showing journey with milestones and checkpoints.', title: 'winding-roadmap' }
    ],
    styles: [
      { id: 'aged-academia', summary: 'Historical scientific illustration with aged paper aesthetic.', title: 'aged-academia' },
      { id: 'bold-graphic', summary: 'High-contrast comic style with bold outlines and dramatic visuals.', title: 'bold-graphic' },
      { id: 'chalkboard', summary: 'Black chalkboard background with colorful chalk drawing style', title: 'chalkboard' },
      { id: 'claymation', summary: '3D clay figure aesthetic with stop-motion charm', title: 'claymation' },
      { id: 'corporate-memphis', summary: 'Flat vector people with vibrant geometric fills', title: 'corporate-memphis' },
      { id: 'craft-handmade', summary: 'Hand-drawn and paper craft aesthetic with warm, organic feel.', title: 'craft-handmade (DEFAULT)' },
      { id: 'cyberpunk-neon', summary: 'Neon glow on dark backgrounds, futuristic aesthetic', title: 'cyberpunk-neon' },
      { id: 'ikea-manual', summary: 'Minimal line art assembly instruction style', title: 'ikea-manual' },
      { id: 'kawaii', summary: 'Japanese cute style with big eyes and pastel colors', title: 'kawaii' },
      { id: 'knolling', summary: 'Organized flat-lay with top-down arrangement', title: 'knolling' },
      { id: 'lego-brick', summary: 'Toy brick construction with playful aesthetic', title: 'lego-brick' },
      { id: 'origami', summary: 'Folded paper forms with geometric precision', title: 'origami' },
      { id: 'pixel-art', summary: 'Retro 8-bit gaming aesthetic', title: 'pixel-art' },
      { id: 'storybook-watercolor', summary: 'Soft hand-painted illustration with whimsical charm', title: 'storybook-watercolor' },
      { id: 'subway-map', summary: 'Transit diagram style with colored lines and stations', title: 'subway-map' },
      { id: 'technical-schematic', summary: 'Technical diagrams with engineering precision and clean geometry.', title: 'technical-schematic' },
      { id: 'ui-wireframe', summary: 'Grayscale interface mockup style', title: 'ui-wireframe' }
    ]
  });
});

// Generate infographics with SSE progress updates
app.post('/api/generate-stream', async (req, res) => {
  try {
    const { text, style, layout, imageCount, language } = req.body;

    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    if (imageCount < 1 || imageCount > 10) {
      return res.status(400).json({
        success: false,
        error: 'Image count must be between 1 and 10'
      });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial event
    res.write(`data: ${JSON.stringify({ type: 'start', message: 'Starting generation...' })}\n\n`);

    // Progress callback that sends SSE events
    const onProgress = (progressData) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', data: progressData })}\n\n`);
    };

    // Generate infographics with progress updates
    const result = await generateInfographics({
      text,
      style,
      layout,
      imageCount,
      language,
      onProgress
    });

    // Send final result
    res.write(`data: ${JSON.stringify({ type: 'complete', data: result })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Error generating infographics:', error);
    const errorMsg = error.message || 'Internal server error';
    res.write(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`);
    res.end();
  }
});

// Generate infographics endpoint (non-streaming, for backwards compatibility)
app.post('/api/generate', async (req, res) => {
  try {
    const { text, style, layout, imageCount, language } = req.body;

    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    if (imageCount < 1 || imageCount > 10) {
      return res.status(400).json({
        success: false,
        error: 'Image count must be between 1 and 10'
      });
    }

    console.log('Generating infographics:', {
      textLength: text.length,
      style,
      layout,
      imageCount,
      language
    });

    // Call the baoyu-xhs-images skill
    // Note: This is where we would integrate with the actual skill
    // For now, we'll create a mock implementation
    const result = await generateInfographics({
      text,
      style,
      layout,
      imageCount,
      language
    });

    res.json(result);
  } catch (error) {
    console.error('Error generating infographics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Summagraph server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
