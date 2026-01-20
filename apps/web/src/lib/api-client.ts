/**
 * Type-safe API 客户端
 * 使用 openapi-fetch 创建完全类型安全的 API 调用
 */

import createClient from 'openapi-fetch';
import type { paths } from '../types/api';

/**
 * 创建 API 客户端
 * @param baseUrl API 基础 URL，默认为本地开发环境
 */
export function createApiClient(baseUrl: string = 'http://localhost:8080/api/v1') {
  return createClient<paths>({ baseUrl });
}

// 导出默认客户端实例
export const apiClient = createApiClient();
