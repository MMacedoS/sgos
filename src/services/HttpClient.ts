import { API_BASE_URL, AUTH_UNAUTHORIZED_EVENT, TOKEN_KEY, TOKEN_TYPE, USER_KEY } from '@/config/constants'
import type { ApiResponse } from '@/types/auth'

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: unknown
}

export class HttpClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body })
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async patch<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body })
  }

  private async request<T>(endpoint: string, config: RequestConfig): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = this.buildHeaders(config.headers)
    const init: RequestInit = {
      method: config.method || 'GET',
      headers,
    }

    if (config.body) {
      init.body = JSON.stringify(config.body)
    }

    const response = await fetch(url, init)

    return this.handleResponse<T>(response)
  }

  private buildHeaders(customHeaders?: Record<string, string>): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders,
    }

    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `${TOKEN_TYPE} ${token}`
    }

    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json()

    if (response.status === 401) {
      HttpClient.clearToken()
      localStorage.removeItem(USER_KEY)
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
    }

    throw_if(!response.ok, new HttpError(data.message, response.status))

    return data as T
  }

  private getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  }

  static setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  }

  static clearToken(): void {
    localStorage.removeItem(TOKEN_KEY)
  }

  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  }
}

export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

function throw_if(condition: boolean, error: Error): void {
  if (condition) throw error
}
