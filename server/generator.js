// Infographic generator - integrates with baoyu-xhs-images skill
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Generates infographics using the baoyu-xhs-images skill
 * @param {Object} options - Generation options
 * @param {string} options.text - Input text
 * @param {string} options.style - Visual style
 * @param {string} options.layout - Layout option
 * @param {number} options.imageCount - Number of images to generate
 * @param {string} options.language - Language (en or zh)
 * @param {Function} options.onProgress - Progress callback function
 * @returns {Promise<Object>} - Generated images result
 */
export async function generateInfographics({ text, style, layout, imageCount, language, onProgress }) {
  const useMock = process.env.MOCK_GENERATION !== 'false';
  logger.info(`Starting infographic generation (Mode: ${useMock ? 'MOCK' : 'REAL'})`, { style, layout, imageCount, language, textLength: text.length });

  if (useMock) {
    return generateMock({ text, style, layout, imageCount, language, onProgress });
  } else {
    return generateReal({ text, style, layout, imageCount, language, onProgress });
  }
}

async function generateReal({ text, style, layout, imageCount, language, onProgress }) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'bridge.py');
    const pythonProcess = spawn('python3', [pythonScript]);

    let outputData = '';
    let errorData = '';

    // Send input data to Python script
    const inputData = JSON.stringify({ text, style, layout, imageCount, language });
    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Log all stderr for debugging
        logger.debug(`Python stderr: ${line}`);

        // Parse progress messages
        try {
          // Look for JSON-like string
          if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
            const msg = JSON.parse(line);
            if (msg.type === 'progress_update' && onProgress) {
              onProgress({
                step: msg.step,
                total: msg.total,
                progress: msg.progress,
                message: msg.message,
                timestamp: new Date().toISOString()
              });
            }
          }
        } catch (e) {
          // Ignore parsing errors for non-JSON logs
        }
      }
      
      errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        logger.error(`Python script exited with code ${code}`, { stderr: errorData });
        return reject(new Error(`Generation failed: ${errorData || 'Unknown error'}`));
      }

      try {
        const result = JSON.parse(outputData);
        if (!result.success) {
          throw new Error(result.error || 'Unknown error in Python script');
        }
        
        // Final progress update
        if (onProgress) {
          onProgress({
            step: 4,
            total: 4,
            progress: 100,
            message: { zh: '完成！', en: 'Complete!' },
            timestamp: new Date().toISOString()
          });
        }
        
        resolve(result);
      } catch (err) {
        logger.error('Failed to parse Python output', { output: outputData, error: err.message });
        reject(new Error('Invalid response from generation service'));
      }
    });
  });
}

async function generateMock({ text, style, layout, imageCount, language, onProgress }) {
  try {
    const steps = [
      { step: 1, total: 4, zh: '正在解析文本结构...', en: 'Analyzing text structure...', progress: 10 },
      { step: 2, total: 4, zh: '提取关键信息并构建提示词...', en: 'Extracting key insights & building prompt...', progress: 40 },
      { step: 3, total: 4, zh: '正在生成精美图像...', en: 'Generating artwork...', progress: 70 },
      { step: 4, total: 4, zh: '完成最终处理...', en: 'Finalizing output...', progress: 100 },
    ];

    // Execute each step with progress updates
    for (const currentStep of steps) {
      // Log each step
      logger.info(`Processing step ${currentStep.step}/${currentStep.total}: ${currentStep.zh} / ${currentStep.en}`, {
        step: currentStep.step,
        total: currentStep.total,
        progress: currentStep.progress
      });

      // Report progress
      if (onProgress) {
        onProgress({
          step: currentStep.step,
          total: currentStep.total,
          progress: currentStep.progress,
          message: currentStep,
          timestamp: new Date().toISOString()
        });
      }

      // Simulate processing time for each step (varied durations)
      const delay = 500 + Math.random() * 1500;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Mock response for development
    // Use fixed image IDs to ensure consistency within the session
    const baseImageId = Math.floor(Math.random() * 1000);
    const mockImages = Array.from({ length: imageCount }, (_, i) => ({
      url: `https://picsum.photos/id/${baseImageId + i}/800/1200`,
      index: i
    }));

    // Final progress update
    if (onProgress) {
      onProgress({
        step: steps.length,
        total: steps.length,
        progress: 100,
        message: { zh: '完成！', en: 'Complete!' },
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Infographic generation completed successfully', {
      imageCount: mockImages.length,
      layout,
      aspect: 'landscape'
    });

    return {
      success: true,
      ok: true,
      data: {
        images: mockImages,
        layout: layout,
        aspect: 'landscape'
      }
    };
  } catch (error) {
    logger.error('Generator error occurred', { error: error.message, stack: error.stack });
    return {
      success: false,
      error: error.message || 'Failed to generate infographics'
    };
  }
}

