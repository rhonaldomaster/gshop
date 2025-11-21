'use client';

import { useSession } from 'next-auth/react';
import { useCallback } from 'react';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

export function useApi() {
  const { data: session } = useSession();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

  const request = useCallback(
    async <T,>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
      const { method = 'GET', body, headers = {} } = options;

      const authHeaders: Record<string, string> = {};

      if (session?.user?.accessToken) {
        authHeaders['Authorization'] = `Bearer ${session.user.accessToken}`;
      }

      const url = `${baseUrl}${endpoint}`;

      const config: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...headers,
        },
      };

      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }

      try {
        const response = await fetch(url, config);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('API Request failed:', error);
        throw error;
      }
    },
    [session, baseUrl]
  );

  const get = useCallback(
    <T,>(endpoint: string, headers?: Record<string, string>): Promise<T> => {
      return request<T>(endpoint, { method: 'GET', headers });
    },
    [request]
  );

  const post = useCallback(
    <T,>(endpoint: string, body: any, headers?: Record<string, string>): Promise<T> => {
      return request<T>(endpoint, { method: 'POST', body, headers });
    },
    [request]
  );

  const put = useCallback(
    <T,>(endpoint: string, body: any, headers?: Record<string, string>): Promise<T> => {
      return request<T>(endpoint, { method: 'PUT', body, headers });
    },
    [request]
  );

  const patch = useCallback(
    <T,>(endpoint: string, body: any, headers?: Record<string, string>): Promise<T> => {
      return request<T>(endpoint, { method: 'PATCH', body, headers });
    },
    [request]
  );

  const del = useCallback(
    <T,>(endpoint: string, headers?: Record<string, string>): Promise<T> => {
      return request<T>(endpoint, { method: 'DELETE', headers });
    },
    [request]
  );

  return {
    get,
    post,
    put,
    patch,
    delete: del,
    request,
  };
}
