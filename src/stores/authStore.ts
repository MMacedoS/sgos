import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthError } from '@/types/auth'
import { authService, HttpClient } from '@/services'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(HttpClient.getToken())
  const isLoading = ref(false)
  const error = ref<AuthError | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  const login = async (email: string, password: string): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.login({ email, password })
      setAuth(response.user, response.token)
    } catch (err) {
      handleError(err)
    } finally {
      isLoading.value = false
    }
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      setAuth(response.user, response.token)
    } catch (err) {
      handleError(err)
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      await authService.logout()
      clearAuth()
    } catch (err) {
      clearAuth()
      handleError(err)
    } finally {
      isLoading.value = false
    }
  }

  const setAuth = (newUser: User, newToken: string): void => {
    user.value = newUser
    token.value = newToken
    HttpClient.setToken(newToken)
  }

  const clearAuth = (): void => {
    user.value = null
    token.value = null
    HttpClient.clearToken()
  }

  const initializeFromStorage = (): void => {
    const storedToken = HttpClient.getToken()
    if (storedToken) {
      token.value = storedToken
    }
  }

  const handleError = (err: unknown): void => {
    if (err instanceof Error) {
      error.value = {
        message: err.message,
        code: (err as any).statusCode || 500,
      }
    }
  }

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    setAuth,
    clearAuth,
    initializeFromStorage,
  }
})
