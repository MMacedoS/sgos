import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores'

export function setupAuthGuard(router: Router): void {
  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const isAuthenticated = authStore.isAuthenticated
    const requiresAuth = to.meta.requiresAuth as boolean

    if (requiresAuth && !isAuthenticated) {
      return next('/login')
    }

    if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
      return next('/')
    }

    next()
  })
}
