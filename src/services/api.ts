import { GenerationOptions, GenerationResponse } from '../types';

export async function generateInfographics(options: GenerationOptions): Promise<GenerationResponse> {
  try {
    // This will be handled by the backend API
    // For now, we'll return a placeholder response
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('Generation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating infographics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
