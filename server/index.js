import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './logger.js';
import { generateInfographics } from './generator.js';
import { authMiddleware, requireAuth } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import paypalRoutes from './routes/paypal.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from 'outputs' directory
app.use('/outputs', express.static(path.join(rootDir, 'outputs')));

// In production, serve the built frontend
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(rootDir, 'dist');
  app.use(express.static(distPath));
}

// Auth middleware — parses JWT from Authorization header (non-blocking)
app.use(authMiddleware);

// Auth routes
app.use('/api/auth', authRoutes);

// PayPal routes (subscription management + webhook)
app.use('/api/paypal', paypalRoutes);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    logger[logLevel]('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// User info endpoint (proxied from auth routes for convenience)
app.get('/api/me', requireAuth, (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.full_name || user.email,
      avatar_url: user.user_metadata?.avatar_url || null,
      subscription_tier: 'free',
      subscription_status: 'inactive',
      generation_count: 0,
    },
  });
});

// Protected download endpoint — requires authentication
app.get('/api/download/:filename(*)', requireAuth, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(rootDir, 'outputs', filename);

  // Security: prevent directory traversal
  const resolvedPath = path.resolve(filePath);
  const outputsDir = path.resolve(path.join(rootDir, 'outputs'));

  if (!resolvedPath.startsWith(outputsDir)) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  res.download(resolvedPath, path.basename(filename), (err) => {
    if (err) {
      logger.error('Download error', { error: err.message, filename });
      if (!res.headersSent) {
        res.status(404).json({ success: false, error: 'File not found' });
      }
    }
  });
});

// User generation history
app.get('/api/history', requireAuth, async (req, res) => {
  try {
    const { supabaseAdmin } = await import('./middleware/auth.js');
    const { data, error } = await supabaseAdmin
      .from('generations')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('Error fetching history', { error: error.message });
      return res.status(500).json({ success: false, error: 'Failed to fetch history' });
    }

    res.json({ success: true, generations: data || [] });
  } catch (error) {
    logger.error('Error in history endpoint', { error: error.message });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// User usage statistics
app.get('/api/usage', requireAuth, async (req, res) => {
  try {
    const { supabaseAdmin } = await import('./middleware/auth.js');

    // Get user profile with generation count
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('generation_count, subscription_tier, subscription_status')
      .eq('id', req.user.id)
      .single();

    // Get this month's generation count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: monthlyCount } = await supabaseAdmin
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .gte('created_at', startOfMonth.toISOString());

    // Determine limits based on subscription tier
    const tier = profile?.subscription_tier || 'free';
    const limits = {
      free: 3,
      pro: 50,
      premium: -1, // unlimited
    };

    res.json({
      success: true,
      usage: {
        total_generations: profile?.generation_count || 0,
        monthly_generations: monthlyCount || 0,
        monthly_limit: limits[tier] || 3,
        subscription_tier: tier,
        subscription_status: profile?.subscription_status || 'inactive',
      },
    });
  } catch (error) {
    logger.error('Error in usage endpoint', { error: error.message });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
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

    logger.info('Starting infographic generation', { textLength: text.length, style, layout, imageCount, language });

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

    // Track generation in database (if user is authenticated)
    if (req.user) {
      try {
        const { supabaseAdmin } = await import('./middleware/auth.js');
        const imageUrls = result?.data?.images?.map(img => img.url || img.image_url || img) || [];

        await supabaseAdmin.from('generations').insert({
          user_id: req.user.id,
          input_text: text?.substring(0, 5000), // Limit stored text
          style,
          layout,
          aspect: req.body.aspect || null,
          language,
          image_count: imageCount,
          image_urls: imageUrls,
        });

        // Increment generation count in profile
        await supabaseAdmin.rpc('increment_generation_count', { user_id_input: req.user.id }).catch(() => {
          // Fallback: manual increment if RPC doesn't exist yet
          supabaseAdmin
            .from('profiles')
            .update({ generation_count: supabaseAdmin.raw('generation_count + 1') })
            .eq('id', req.user.id)
            .then(() => {})
            .catch(() => {});
        });
      } catch (trackErr) {
        logger.warn('Failed to track generation', { error: trackErr.message });
      }
    }

  } catch (error) {
    logger.error('Error generating infographics (stream)', { error: error.message, stack: error.stack });
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

    logger.info('Generating infographics (non-streaming)', {
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
    logger.error('Error generating infographics (non-streaming)', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error', { error: err.message, stack: err.stack, url: req.url, method: req.method });
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// In production, serve index.html for all non-API routes (SPA fallback)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(rootDir, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  logger.info(`Summagraph server started`, { port: PORT, env: process.env.NODE_ENV || 'development' });
  logger.info(`Health check available at http://localhost:${PORT}/api/health`);
});
