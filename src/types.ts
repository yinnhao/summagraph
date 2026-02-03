export interface GenerationOptions {
  text: string;
  style: string;
  layout: string;
  imageCount: number;
  language: 'en' | 'zh';
  aspect?: string;
}

export interface GeneratedImage {
  url: string;
  index: number;
  title?: string;
  layout?: string;
  aspect?: string;
}

export interface GenerationResponse {
  success: boolean;
  images?: GeneratedImage[];
  error?: string;
}

export interface StyleOption {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
}

export interface LayoutOption {
  id: string;
  name: string;
  nameEn?: string;
  icon?: string;
  description?: string;
}

export interface ApiOptions {
  styles: StyleOption[];
  layouts: LayoutOption[];
}
