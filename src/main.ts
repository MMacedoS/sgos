import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores'
import { AUTH_UNAUTHORIZED_EVENT } from '@/config/constants'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const authStore = useAuthStore(pinia)
authStore.initializeFromStorage()

window.addEventListener(AUTH_UNAUTHORIZED_EVENT, () => {
	authStore.clearAuth()

	if (router.currentRoute.value.path !== '/login') {
		router.push('/login')
	}
})

app.use(router)

app.mount('#app')
