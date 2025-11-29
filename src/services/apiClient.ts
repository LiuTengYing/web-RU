/**
 * 通用API客户端
 * 统一处理所有API请求，避免重复的请求逻辑
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SimplePaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onUploadProgress?: (progressEvent: { loaded: number; total: number; percentage: number }) => void;
}

class ApiClient {
  private baseURL: string;
  private uploadBaseURL: string;
  private defaultTimeout: number = 10000;
  private defaultRetries: number = 3;
  private defaultRetryDelay: number = 1000;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    // 大文件上传使用HTTPS子域名直连服务器，绕过Cloudflare CDN
    this.uploadBaseURL = 'https://upload.fancygod.com/api';
  }

  /**
   * 通用请求方法
   */
  private async request<T = any>(
    endpoint: string, 
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      ...fetchConfig
    } = config;

    const url = `${this.baseURL}${endpoint}`;
    
    const defaultConfig: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...fetchConfig.headers,
      },
      ...fetchConfig,
    };

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...defaultConfig,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          // 如果有详细错误信息，将其包含在错误消息中
          let errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
          if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
            errorMessage += '\n' + errorData.details.join(', ');
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        
        // 统一处理后端返回格式
        if (result.success !== undefined) {
          return result;
        }
        
        // 兼容旧格式
        return {
          success: true,
          data: result,
        };

      } catch (error) {
        lastError = error as Error;
        
        // 如果是最后一次尝试或者是非网络错误，直接抛出
        if (attempt === retries || !this.isRetryableError(error as Error)) {
          break;
        }
        
        // 等待后重试
        await this.delay(retryDelay * Math.pow(2, attempt));
      }
    }

    console.error(`API request failed after ${retries + 1} attempts: ${endpoint}`, lastError);
    
    return {
      success: false,
      error: lastError?.message || 'Request failed',
    };
  }

  /**
   * GET 请求
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse<T>> {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          searchParams.set(key, String(params[key]));
        }
      });
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    return this.request<T>(url, { ...config, method: 'GET' });
  }

  /**
   * POST 请求
   */
  async post<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT 请求
   */
  async put<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH 请求
   */
  async patch<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * 文件上传（支持进度回调）
   */
  async upload<T = any>(endpoint: string, formData: FormData, config?: RequestConfig): Promise<ApiResponse<T>> {
    const { onUploadProgress, headers, timeout = 3600000, retries = this.defaultRetries, ...restConfig } = config || {}; // 1小时超时
    
    // 如果有进度回调，使用 XMLHttpRequest
    if (onUploadProgress) {
      return this.uploadWithProgress<T>(endpoint, formData, { onUploadProgress, headers, timeout, retries, ...restConfig });
    }
    
    // 否则使用普通的 fetch
    return this.request<T>(endpoint, {
      ...restConfig,
      method: 'POST',
      headers: {
        // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
        ...headers,
      },
      body: formData,
    });
  }

  /**
   * 使用 XMLHttpRequest 实现带进度的文件上传
   */
  private uploadWithProgress<T = any>(
    endpoint: string, 
    formData: FormData, 
    config: RequestConfig & { onUploadProgress: (progressEvent: { loaded: number; total: number; percentage: number }) => void }
  ): Promise<ApiResponse<T>> {
    const { onUploadProgress, headers, timeout = 3600000 } = config; // 1小时超时，移除重试机制
    
    // 检查是否为大文件上传（OSS文件上传），使用直连服务器绕过CDN
    const isOSSUpload = endpoint.includes('/oss-files/upload');
    const baseUrl = isOSSUpload ? this.uploadBaseURL : this.baseURL;
    const url = `${baseUrl}${endpoint}`;

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      // 设置超时
      xhr.timeout = timeout;

      // 上传进度监听
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onUploadProgress({
            loaded: event.loaded,
            total: event.total,
            percentage
          });
        }
      });

      // 请求完成监听
      xhr.addEventListener('load', () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const result = JSON.parse(xhr.responseText);
            
            // 统一处理后端返回格式
            if (result.success !== undefined) {
              resolve(result);
            } else {
              // 兼容旧格式
              resolve({
                success: true,
                data: result,
              });
            }
          } else {
            const errorData = JSON.parse(xhr.responseText || '{}');
            let errorMessage = errorData.error || errorData.message || `HTTP error! status: ${xhr.status}`;
            if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
              errorMessage += '\n' + errorData.details.join(', ');
            }
            resolve({
              success: false,
              error: errorMessage,
            });
          }
        } catch (error) {
          resolve({
            success: false,
            error: 'Failed to parse response',
          });
        }
      });

      // 错误监听
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Network error during upload',
        });
      });

      // 超时监听
      xhr.addEventListener('timeout', () => {
        resolve({
          success: false,
          error: 'Request timeout during upload',
        });
      });

      // 发送请求
      xhr.open('POST', url);
      
      // 设置请求头（除了 Content-Type，让浏览器自动设置）
      if (headers) {
        Object.entries(headers).forEach(([key, value]) => {
          if (key.toLowerCase() !== 'content-type') {
            xhr.setRequestHeader(key, value as string);
          }
        });
      }

      xhr.send(formData);
    });
  }

  /**
   * 判断是否为可重试的错误
   */
  private isRetryableError(error: Error): boolean {
    // 网络错误、超时错误等可以重试
    return (
      error.name === 'AbortError' ||
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout')
    );
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 设置默认配置
   */
  setDefaults(config: {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
  }) {
    if (config.timeout !== undefined) this.defaultTimeout = config.timeout;
    if (config.retries !== undefined) this.defaultRetries = config.retries;
    if (config.retryDelay !== undefined) this.defaultRetryDelay = config.retryDelay;
  }
}

// 创建默认实例
export const apiClient = new ApiClient();

// 导出类型和实例
export default apiClient;

/**
 * 通用CRUD服务基类
 */
export abstract class BaseCrudService<T = any, CreateData = Partial<T>, UpdateData = Partial<T>> {
  protected client: ApiClient;
  protected baseEndpoint: string;

  constructor(baseEndpoint: string, client: ApiClient = apiClient) {
    this.client = client;
    this.baseEndpoint = baseEndpoint;
  }

  /**
   * 获取列表
   */
  async getList(params?: {
    page?: number;
    limit?: number;
    search?: string;
    [key: string]: any;
  }): Promise<ApiResponse<PaginatedResponse<T> | SimplePaginatedResponse<T>>> {
    return this.client.get<PaginatedResponse<T> | SimplePaginatedResponse<T>>(this.baseEndpoint, params);
  }

  /**
   * 获取单个资源
   */
  async getById(id: string): Promise<ApiResponse<T>> {
    return this.client.get<T>(`${this.baseEndpoint}/${id}`);
  }

  /**
   * 创建资源
   */
  async create(data: CreateData): Promise<ApiResponse<T>> {
    return this.client.post<T>(this.baseEndpoint, data);
  }

  /**
   * 更新资源
   */
  async update(id: string, data: UpdateData): Promise<ApiResponse<T>> {
    return this.client.put<T>(`${this.baseEndpoint}/${id}`, data);
  }

  /**
   * 删除资源
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`${this.baseEndpoint}/${id}`);
  }

  /**
   * 批量删除
   */
  async batchDelete(ids: string[]): Promise<ApiResponse<void>> {
    return this.client.post<void>(`${this.baseEndpoint}/batch-delete`, { ids });
  }
}

/**
 * 设置类服务基类
 */
export abstract class BaseSettingsService<T = any> {
  protected client: ApiClient;
  protected baseEndpoint: string;

  constructor(baseEndpoint: string, client: ApiClient = apiClient) {
    this.client = client;
    this.baseEndpoint = baseEndpoint;
  }

  /**
   * 获取设置
   */
  async getSettings(): Promise<ApiResponse<T>> {
    return this.client.get<T>(this.baseEndpoint);
  }

  /**
   * 更新设置
   */
  async updateSettings(data: Partial<T>): Promise<ApiResponse<T>> {
    return this.client.put<T>(this.baseEndpoint, data);
  }

  /**
   * 创建设置
   */
  async createSettings(data: T): Promise<ApiResponse<T>> {
    return this.client.post<T>(this.baseEndpoint, data);
  }
}
