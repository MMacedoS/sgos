export interface User {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface AuthResponse {
  user: User
  token: string
  type: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
}

export interface AuthError {
  message: string
  code: number
}
