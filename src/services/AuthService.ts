import { HttpClient } from './HttpClient'
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from '@/types/auth'

export class AuthService {
  private httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await this.httpClient.post<ApiResponse<AuthResponse>>('/v1/auth/login', request)

    return response.data as AuthResponse
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    const response = await this.httpClient.post<ApiResponse<AuthResponse>>(
      '/v1/auth/register',
      request,
    )

    return response.data as AuthResponse
  }

  async logout(): Promise<void> {
    await this.httpClient.post<ApiResponse<null>>('/v1/auth/logout', {})
  }
}

export const createAuthService = (httpClient: HttpClient): AuthService => {
  return new AuthService(httpClient)
}
