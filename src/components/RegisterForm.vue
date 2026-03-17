<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables'

const router = useRouter()
const { register, isLoading, error } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const formError = ref('')

const handleSubmit = async (): Promise<void> => {
  formError.value = ''

  if (!name.value || !email.value || !password.value || !passwordConfirmation.value) {
    formError.value = 'Todos os campos são obrigatórios'
    return
  }

  if (password.value !== passwordConfirmation.value) {
    formError.value = 'As senhas não coincidem'
    return
  }

  if (password.value.length < 8) {
    formError.value = 'A senha deve ter pelo menos 8 caracteres'
    return
  }

  try {
    await register(name.value, email.value, password.value, passwordConfirmation.value)
    router.push('/')
  } catch (err) {
    formError.value = error.value?.message || 'Erro ao registrar'
  }
}

const navigateToLogin = (): void => {
  router.push('/login')
}
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <h1>Registre-se</h1>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">Nome</label>
          <input
            id="name"
            v-model="name"
            type="text"
            placeholder="Seu nome completo"
            class="form-input"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="seu@email.com"
            class="form-input"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="password">Senha</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            class="form-input"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="password-confirmation">Confirmar Senha</label>
          <input
            id="password-confirmation"
            v-model="passwordConfirmation"
            type="password"
            placeholder="Confirme sua senha"
            class="form-input"
            :disabled="isLoading"
          />
        </div>

        <div v-if="formError" class="error-message">
          {{ formError }}
        </div>

        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Registrando...' : 'Registrar' }}
        </button>
      </form>

      <p class="login-link">
        Já tem conta?
        <button type="button" @click="navigateToLogin" class="link-button">
          Faça login
        </button>
      </p>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-card {
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
  box-sizing: border-box;
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

.login-link {
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
