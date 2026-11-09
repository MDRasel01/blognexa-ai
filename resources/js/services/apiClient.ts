/**
 * BlogNexa AI - Centralized Frontend REST API Client
 */

import {
  BootConfig,
  ApiResponse,
  PluginStatus,
  ConnectionStatus,
  PluginSettings,
  AIConfig,
  SEODetectionResponse,
  PostTypesResponse,
  CoreEngineStatusResponse,
} from '../types';

class ApiClient {
  private getBootConfig(): BootConfig {
    if (typeof window !== 'undefined' && window.blognexaBootConfig) {
      return window.blognexaBootConfig;
    }

    return {
      api: {
        restUrl: '/wp-json/blognexa/v1',
        nonce: '',
        namespace: 'blognexa/v1',
      },
      site: {
        name: 'WordPress Site',
        url: '',
        version: '1.0.0',
      },
      user: {
        id: 0,
        name: 'Administrator',
        capabilities: {},
      },
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const config = this.getBootConfig();
    const baseUrl = config.api.restUrl.replace(/\/+$/, '');
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    const url = `${baseUrl}/${cleanEndpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-WP-Nonce': config.api.nonce,
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || `HTTP error ${response.status}: ${response.statusText}`;
      const err = new Error(errorMsg);
      (err as any).status = response.status;
      (err as any).code = data?.code || 'blognexa_api_error';
      (err as any).data = data?.data;
      throw err;
    }

    return data as T;
  }

  public async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async getStatus(): Promise<ApiResponse<PluginStatus>> {
    return this.request<ApiResponse<PluginStatus>>('status');
  }

  public async getConnectionStatus(): Promise<ApiResponse<ConnectionStatus>> {
    return this.request<ApiResponse<ConnectionStatus>>('connection/status');
  }

  public async getSettings(): Promise<ApiResponse<PluginSettings>> {
    return this.request<ApiResponse<PluginSettings>>('settings');
  }

  public async updateSettings(settings: Partial<PluginSettings>): Promise<ApiResponse<Partial<PluginSettings>>> {
    return this.request<ApiResponse<Partial<PluginSettings>>>('settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  public async getAIConfig(): Promise<ApiResponse<AIConfig>> {
    return this.request<ApiResponse<AIConfig>>('ai/config');
  }

  public async saveAIConfig(config: Partial<AIConfig>): Promise<ApiResponse<{ message: string; config: AIConfig }>> {
    return this.request<ApiResponse<{ message: string; config: AIConfig }>>('ai/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  public async testAIConnection(params?: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('ai/test', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  public async getSEODetection(): Promise<ApiResponse<SEODetectionResponse>> {
    return this.request<ApiResponse<SEODetectionResponse>>('integrations/seo');
  }

  public async setPrimarySEO(provider: string): Promise<ApiResponse<SEODetectionResponse>> {
    return this.request<ApiResponse<SEODetectionResponse>>('integrations/seo/primary', {
      method: 'POST',
      body: JSON.stringify({ provider }),
    });
  }

  public async getPostTypes(): Promise<ApiResponse<PostTypesResponse>> {
    return this.request<ApiResponse<PostTypesResponse>>('integrations/post-types');
  }

  public async savePostTypes(enabledTypes: string[]): Promise<ApiResponse<PostTypesResponse>> {
    return this.request<ApiResponse<PostTypesResponse>>('integrations/post-types', {
      method: 'POST',
      body: JSON.stringify({ enabled_types: enabledTypes }),
    });
  }

  public async getCoreEngineStatus(): Promise<ApiResponse<CoreEngineStatusResponse>> {
    return this.request<ApiResponse<CoreEngineStatusResponse>>('integrations/core');
  }
}

export const apiClient = new ApiClient();

