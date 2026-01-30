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

// Generate infographics endpoint
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
