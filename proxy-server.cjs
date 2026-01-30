/**
 * Claude Code Proxy Server for baoyu-infographic skill
 *
 * This server runs in Claude Code environment and proxies requests
 * to the baoyu-infographic skill, making it accessible via HTTP API.
 *
 * Usage:
 * 1. Start this server in Claude Code: node proxy-server.cjs
 * 2. Your web app calls this server's HTTP endpoints
 * 3. This server calls baoyu-infographic skill via exec
 */

import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Temp directory for files
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Output directory
const OUTPUT_DIR = path.join(__dirname, 'infographics');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'baoyu-infographic-proxy' });
});

// Generate infographic
app.post('/api/generate', async (req, res) => {
  try {
    const { text, layout = 'bento-grid', style = 'craft-handmade', aspect = 'portrait', language = 'en' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    console.log('Generating infographic:', {
      textLength: text.length,
      layout,
      style,
      aspect,
      language
    });

    // Create temp file with content
    const timestamp = Date.now();
    const tempFile = path.join(TEMP_DIR, `input-${timestamp}.md`);
    fs.writeFileSync(tempFile, text);

    // Build skill command
    const skillCommand = `/skill content-skills:baoyu-infographic "${tempFile}" --layout ${layout} --style ${style} --aspect ${aspect} --lang ${language}`;

    console.log('Executing skill command:', skillCommand);

    // Execute skill command
    const { stdout, stderr } = await execAsync(skillCommand, {
      timeout: 120000, // 2 minutes timeout
      cwd: __dirname
    });

    if (stderr) {
      console.error('Skill stderr:', stderr);
    }

    console.log('Skill stdout:', stdout);

    // Find generated infographic image
    // The skill creates output in infographic/{topic-slug}/ directory
    const infographicDir = path.join(__dirname, 'infographic');
    const generatedFiles = findLatestFiles(infographicDir, '.png', 1);

    if (generatedFiles.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate infographic - no output file found'
      });
    }

    const imagePath = generatedFiles[0];

    // Convert to URL-accessible path
    const imageUrl = `/images/${path.basename(imagePath)}`;

    res.json({
      success: true,
      data: {
        imagePath,
        imageUrl,
        layout,
        style,
        aspect,
        language
      }
    });

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate infographic'
    });
  }
});

// Serve generated images
app.use('/images', express.static(OUTPUT_DIR));

// Helper: Find latest files
function findLatestFiles(dir, extension, limit) {
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir)
    .filter(file => file.endsWith(extension))
    .map(file => ({
      name: file,
      path: path.join(dir, file),
      time: fs.statSync(path.join(dir, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time)
    .slice(0, limit)
    .map(f => f.path);

  return files;
}

// Start server
app.listen(PORT, () => {
  console.log(`\n🎨 baoyu-infographic Proxy Server`);
  console.log(`📡 Running on: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 Generate endpoint: http://localhost:${PORT}/api/generate`);
  console.log(`\n✅ Ready to accept requests from your Summagraph app!\n`);
});
