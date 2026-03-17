import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import LoginForm from '@/components/LoginForm.vue'
import RegisterForm from '@/components/RegisterForm.vue'
import DashboardView from '@/views/DashboardView.vue'
import { setupAuthGuard } from './guards'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginForm,
    meta: {
      requiresAuth: false,
      layout: 'blank',
    },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterForm,
    meta: {
      requiresAuth: false,
      layout: 'blank',
    },
  },
  {
    path: '/',
    name: 'home',
    component: DashboardView,
    meta: {
      requiresAuth: true,
      layout: 'default',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

setupAuthGuard(router)

export default router
