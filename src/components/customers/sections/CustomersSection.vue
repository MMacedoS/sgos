<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { customersService } from '@/services'
import type { CustomerResource, PersonPayload } from '@/types/backoffice'

const emptyPersonPayload = (): PersonPayload => ({
  nome_razao: '',
  cpf_cnpj: '',
  data_nascimento: '',
  genero: 'O',
  telefone: '',
  email: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
})

const isLoadingCustomers = ref(false)
const submitCustomerLoading = ref(false)
const customerMessage = ref('')
const showCustomerModal = ref(false)
const customers = ref<CustomerResource[]>([])

const customerFilters = ref({
  search: '',
  city: '',
  state: '',
})

const customerForm = ref<PersonPayload>(emptyPersonPayload())

const filteredCustomers = computed(() => {
  const search = customerFilters.value.search.trim().toLowerCase()
  const city = customerFilters.value.city.trim().toLowerCase()
  const state = customerFilters.value.state.trim().toLowerCase()

  return customers.value.filter((item) => {
    const name = item.person.name?.toLowerCase() ?? ''
    const document = item.person.document?.toLowerCase() ?? ''
    const email = item.person.email?.toLowerCase() ?? ''
    const personCity = item.person.city?.toLowerCase() ?? ''
    const personState = item.person.state?.toLowerCase() ?? ''

    const searchMatch = !search || name.includes(search) || document.includes(search) || email.includes(search)
    const cityMatch = !city || personCity.includes(city)
    const stateMatch = !state || personState.includes(state)

    return searchMatch && cityMatch && stateMatch
  })
})

const sanitizePayload = (payload: PersonPayload): PersonPayload => {
  const normalized = { ...payload }

  const keys: Array<keyof PersonPayload> = [
    'data_nascimento',
    'telefone',
    'email',
    'logradouro',
    'numero',
    'complemento',
    'bairro',
    'cidade',
    'estado',
    'cep',
  ]

  keys.forEach((key) => {
    if (!normalized[key]) {
      delete normalized[key]
    }
  })

  if (normalized.genero) {
    normalized.genero = normalized.genero.toUpperCase() as 'M' | 'F' | 'O'
  }

  return normalized
}

const isRequiredInvalid = (payload: PersonPayload): boolean => {
  return !payload.nome_razao.trim() || !payload.cpf_cnpj.trim()
}

const loadCustomers = async (): Promise<void> => {
  isLoadingCustomers.value = true
  try {
    const response = await customersService.list()
    customers.value = response
  } finally {
    isLoadingCustomers.value = false
  }
}

const submitCustomer = async (): Promise<void> => {
  customerMessage.value = ''
  if (isRequiredInvalid(customerForm.value)) {
    customerMessage.value = 'Nome/Razão e CPF/CNPJ são obrigatórios.'
    return
  }

  submitCustomerLoading.value = true
  try {
    await customersService.create(sanitizePayload(customerForm.value))
    customerMessage.value = 'Cliente cadastrado com sucesso.'
    customerForm.value = emptyPersonPayload()
    await loadCustomers()
    showCustomerModal.value = false
  } catch (error) {
    customerMessage.value = error instanceof Error ? error.message : 'Erro ao cadastrar cliente.'
  } finally {
    submitCustomerLoading.value = false
  }
}

const openCustomerModal = (): void => {
  customerMessage.value = ''
  showCustomerModal.value = true
}

const closeCustomerModal = (): void => {
  showCustomerModal.value = false
}

onMounted(async () => {
  await loadCustomers()
})
</script>

<template>
  <section class="content-section">
    <article class="panel">
      <header class="section-actions">
        <div>
          <h3>Clientes Cadastrados</h3>
          <span>{{ filteredCustomers.length }} resultados • {{ customers.length }} total</span>
        </div>
        <button type="button" class="btn-primary add-customer-btn" @click="openCustomerModal">+ Novo Cliente</button>
      </header>

      <div class="filter-bar">
        <input v-model="customerFilters.search" type="text" placeholder="Pesquisar nome, documento ou e-mail" />
        <input v-model="customerFilters.city" type="text" placeholder="Filtrar por cidade" />
        <input v-model="customerFilters.state" type="text" maxlength="2" placeholder="UF" />
      </div>

      <p v-if="isLoadingCustomers" class="muted">Carregando clientes...</p>

      <div v-if="!isLoadingCustomers" class="customer-cards">
        <article v-for="item in filteredCustomers" :key="item.id" class="customer-card">
          <div class="customer-card-head">
            <strong>{{ item.person.name }}</strong>
            <span class="doc-badge">{{ item.person.document }}</span>
          </div>
          <p>{{ item.person.email || 'Sem e-mail cadastrado' }}</p>
          <p>{{ item.person.phone || 'Sem telefone cadastrado' }}</p>
          <div class="customer-meta">
            <span>{{ item.person.city || 'Cidade não informada' }}</span>
            <span>{{ item.person.state || '--' }}</span>
          </div>
        </article>
      </div>

      <p v-if="!isLoadingCustomers && filteredCustomers.length === 0" class="muted">
        Nenhum cliente encontrado para os filtros informados.
      </p>
    </article>

    <div v-if="showCustomerModal" class="modal-backdrop" @click.self="closeCustomerModal">
      <article class="modal-card">
        <header class="modal-header">
          <h3>Novo Cliente</h3>
          <button type="button" class="close-btn" @click="closeCustomerModal">×</button>
        </header>

        <form class="form-grid" @submit.prevent="submitCustomer">
          <input v-model="customerForm.nome_razao" type="text" placeholder="Nome/Razão *" />
          <input v-model="customerForm.cpf_cnpj" type="text" placeholder="CPF/CNPJ *" />
          <input v-model="customerForm.email" type="email" placeholder="E-mail" />
          <input v-model="customerForm.telefone" type="text" placeholder="Telefone" />
          <input v-model="customerForm.data_nascimento" type="date" placeholder="Data nascimento" />
          <select v-model="customerForm.genero">
            <option value="O">Gênero</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
            <option value="O">Outro</option>
          </select>
          <input v-model="customerForm.logradouro" type="text" placeholder="Logradouro" />
          <input v-model="customerForm.numero" type="text" placeholder="Número" />
          <input v-model="customerForm.bairro" type="text" placeholder="Bairro" />
          <input v-model="customerForm.cidade" type="text" placeholder="Cidade" />
          <input v-model="customerForm.estado" type="text" placeholder="Estado" maxlength="2" />
          <input v-model="customerForm.cep" type="text" placeholder="CEP" />
          <textarea v-model="customerForm.complemento" placeholder="Complemento" />
          <button :disabled="submitCustomerLoading" type="submit" class="btn-primary">
            {{ submitCustomerLoading ? 'Salvando...' : 'Salvar Cliente' }}
          </button>
        </form>

        <p v-if="customerMessage" class="feedback">{{ customerMessage }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.content-section {
  padding: 1rem;
  padding-bottom: 6rem;
  display: grid;
  gap: 1rem;
}

.panel {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
}

.panel header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.panel header h3 {
  margin: 0;
}

.panel header span {
  color: #6b7280;
  font-size: 0.85rem;
}

.section-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
}

.add-customer-btn {
  width: fit-content;
}

.filter-bar {
  display: grid;
  grid-template-columns: 1.6fr 1fr 90px;
  gap: 0.65rem;
  margin-bottom: 0.9rem;
}

.filter-bar input {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.62rem 0.72rem;
  font: inherit;
}

.customer-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.customer-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.8rem;
  display: grid;
  gap: 0.35rem;
}

.customer-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.doc-badge {
  font-size: 0.74rem;
  font-weight: 700;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 999px;
  padding: 0.18rem 0.55rem;
}

.customer-card p {
  margin: 0;
  color: #4b5563;
  font-size: 0.86rem;
}

.customer-meta {
  display: flex;
  justify-content: space-between;
  color: #6b7280;
  font-size: 0.8rem;
  margin-top: 0.35rem;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: grid;
  place-items: center;
  z-index: 60;
  padding: 1rem;
}

.modal-card {
  width: min(920px, 100%);
  max-height: 88dvh;
  overflow: auto;
  background: #fff;
  border-radius: 14px;
  padding: 1rem;
  box-shadow: 0 20px 50px rgba(2, 6, 23, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.close-btn {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #fff;
  font-size: 1.2rem;
  cursor: pointer;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.form-grid input,
.form-grid select,
.form-grid textarea,
.btn-primary {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.62rem 0.72rem;
  font: inherit;
}

.form-grid textarea {
  min-height: 80px;
  grid-column: 1 / -1;
}

.btn-primary {
  grid-column: 1 / -1;
  border: 0;
  background: #4f46e5;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.feedback {
  margin: 0.7rem 0 0;
  color: #4f46e5;
  font-weight: 600;
}

.muted {
  color: #6b7280;
  font-size: 0.84rem;
}

@media (max-width: 1024px) {
  .customer-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .content-section {
    padding-bottom: 5.8rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .filter-bar,
  .customer-cards {
    grid-template-columns: 1fr;
  }

  .section-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
