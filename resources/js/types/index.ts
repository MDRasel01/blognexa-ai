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
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  site_uuid?: string;
  backend_url?: string;
  last_ping_at?: string;
  message?: string;
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
