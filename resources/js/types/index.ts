/**
 * BlogNexa AI - Frontend TypeScript Definitions
 */

export interface BootConfig {
  api: {
    restUrl: string;
    nonce: string;
    namespace: string;
  };
  site: {
    name: string;
    url: string;
    version: string;
  };
  user: {
    id: number;
    name: string;
    capabilities: Record<string, boolean>;
  };
}

declare global {
  interface Window {
    blognexaBootConfig?: BootConfig;
  }
}

export interface PluginStatus {
  plugin: {
    name: string;
    version: string;
    db_version: string;
    status: string;
  };
  environment: {
    php_version: string;
    wp_version: string;
    mysql_version: string;
  };
  timestamp: string;
}

export interface ConnectionStatus {
  connected: boolean;
  status: 'connected' | 'disconnected' | 'connecting' | 'error' | 'standalone_active' | 'setup_required';
  mode?: 'standalone' | 'cloud';
  provider?: string;
  model?: string;
  site_uuid?: string;
  backend_url?: string;
  last_ping_at?: string;
  message?: string;
}

export interface AIConfig {
  provider: 'gemini' | 'openai';
  gemini_model: string;
  gemini_api_key: string;
  has_gemini_key: boolean;
  openai_model: string;
  openai_api_key: string;
  has_openai_key: boolean;
  is_configured: boolean;
  last_tested_at: string | null;
  last_test_status: string | null;
}

export interface PluginSettings {
  writing_language: string;
  default_content_type: 'post' | 'page';
  default_approval_mode: 'manual' | 'auto';
  content_quality_threshold: number;
  brand_voice: string;
  backend_url: string;
  data_retention_days: number;
  purge_data_on_uninstall: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  timestamp: string;
  meta?: Record<string, any>;
}

export interface ApiError {
  code: string;
  message: string;
  data?: {
    status?: number;
    details?: any;
  };
}

export interface SEOProviderItem {
  id: 'rankmath' | 'yoast' | 'aioseo';
  name: string;
  slug: string;
  file: string;
  status: 'connected' | 'installed_inactive' | 'not_installed';
  status_label: string;
  version: string;
  description: string;
  action_url: string;
  is_active: boolean;
  is_primary: boolean;
}

export interface SEODetectionResponse {
  providers: Record<string, SEOProviderItem>;
  active_count: number;
  primary_provider: string | null;
  has_conflict: boolean;
  conflict_message: string | null;
}

export interface DiscoveredPostType {
  slug: string;
  name: string;
  label: string;
  singular_label: string;
  is_public: boolean;
  show_in_rest: boolean;
  is_builtin: boolean;
  published_count: number;
  is_enabled: boolean;
  description: string;
}

export interface PostTypesResponse {
  post_types: DiscoveredPostType[];
  enabled_types: string[];
}

export interface CoreEngineStatusResponse {
  engine: {
    name: string;
    status: string;
    status_label: string;
    description: string;
  };
  runtime: {
    wp_version: string;
    php_version: string;
    mysql_version: string;
    rest_available: boolean;
    rest_namespace: string;
    multisite: boolean;
    memory_limit: string;
    max_upload_size: string;
  };
}

export type ModuleId =
  | 'overview'
  | 'website-intelligence'
  | 'knowledge-base'
  | 'content-strategy'
  | 'seo-research'
  | 'blog-studio'
  | 'image-studio'
  | 'publishing'
  | 'analytics'
  | 'integrations'
  | 'settings';
