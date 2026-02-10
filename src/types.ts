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

// Auth & User types
export type SubscriptionTier = 'free' | 'pro' | 'premium';
export type SubscriptionStatus = 'active' | 'inactive' | 'past_due' | 'canceled';

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  generation_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  paypal_subscription_id: string;
  paypal_plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
}
