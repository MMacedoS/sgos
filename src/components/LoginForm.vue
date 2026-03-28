<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables'
import Input from './ui/input/Input.vue'
import Button from './ui/button/Button.vue'

const router = useRouter()
const { login, isLoading, error } = useAuth()

const email = ref('')
const password = ref('')
const formError = ref('')

const handleSubmit = async (): Promise<void> => {
  formError.value = ''

  if (!email.value || !password.value) {
    formError.value = 'Email e senha são obrigatórios'
    return
  }

  try {
    await login(email.value, password.value)
    router.push('/')
  } catch (err) {
    formError.value = error.value?.message || 'Erro ao fazer login'
  }
}

const navigateToRegister = (): void => {
  router.push('/register')
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Login</h1>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">Email</label>
          <Input
            id="email"
            v-model="email"
            type="email"            
            placeholder="seu@email.com"
            :disabled="isLoading"/>
        </div>

        <div class="form-group">
          <label for="password">Senha</label>
          <Input
            id="password"
            v-model="password"
            type="password"
            placeholder="Sua senha"
            :disabled="isLoading"
          />
        </div>

        <div v-if="formError" class="error-message">
          {{ formError }}
        </div>

        <Button type="submit" variant="outline" class="btn-primary shadow-blue-700" :disabled="isLoading">
          {{ isLoading ? 'Conectando...' : 'Login' }}
        </Button>
      </form>

      <p class="register-link">
        Não tem conta?
        <span>Entre em contato com o administrador do sistema.</span>
        <!-- <button type="button" @click="navigateToRegister" class="link-button">
          Registre-se
        </button> -->
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
  font-size: 1.75rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.error-message {
  background-color: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #5568d3;
}

.btn-primary:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
  font-size: 0.875rem;
}

.link-button {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-weight: 600;
  text-decoration: underline;
  padding: 0;
  font: inherit;
}

.link-button:hover {
  color: #5568d3;
}
</style>
