/**
 * BlogNexa AI - Centralized Frontend REST API Client
 */

import { BootConfig, ApiResponse, PluginStatus, ConnectionStatus, PluginSettings } from '../types';

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
}

export const apiClient = new ApiClient();

