import { computed } from 'vue'
import { useAuthStore } from '@/stores'

export function useAuth() {
  const store = useAuthStore()

  const user = computed(() => store.user)
  const token = computed(() => store.token)
  const isAuthenticated = computed(() => store.isAuthenticated)
  const isLoading = computed(() => store.isLoading)
  const error = computed(() => store.error)

  const login = (email: string, password: string) => store.login(email, password)
  const register = (name: string, email: string, password: string, passwordConfirmation: string) =>
    store.register(name, email, password, passwordConfirmation)
  const logout = () => store.logout()

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
  }
}
