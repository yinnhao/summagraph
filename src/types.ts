export interface GenerationOptions {
  text: string;
  style: string;
  layout: string;
  imageCount: number;
  language: 'en' | 'zh';
}

export interface GeneratedImage {
  url: string;
  index: number;
}

export interface GenerationResponse {
  success: boolean;
  images?: GeneratedImage[];
  error?: string;
}
