<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useCepLookup, usePersonFormFields } from '@/composables'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { customersService } from '@/services'
import { formatCEP, formatPhoneBR, isValidCPF, isValidPhoneBR } from '@/utils'
import type { CustomerResource, EmployeeResource, PersonPayload, PersonResource } from '@/types/backoffice'

const CUSTOMERS_PER_PAGE = 9

const emptyPersonPayload = (): PersonPayload => ({
  name: '',
  cpf_cnpj: '',
  birth_date: '',
  gender: 'O',
  phone: '',
  email: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zip_code: '',
})

const isLoadingCustomers = ref(false)
const submitCustomerLoading = ref(false)
const customerMessage = ref('')
const showCustomerModal = ref(false)
const showFilters = ref(false)
const editingCustomerId = ref<string | number | null>(null)
const deletingCustomerId = ref<string | number | null>(null)
const customers = ref<EmployeeResource[]>([])

const customerFilters = ref({
  search: '',
  city: '',
  state: '',
})

const customerForm = ref<PersonPayload>(emptyPersonPayload())
const { cepMessage, handleCepInput, isLoadingCep, loadAddressByCep, resetCepState } = useCepLookup(customerForm)
const { formatDocument, formatDocumentDisplay, formatPhoneDisplay, handleDocumentInput, handlePhoneInput, onlyDigits } = usePersonFormFields(customerForm)

const isEditingCustomer = computed(() => editingCustomerId.value !== null)
const customerCurrentPage = ref(1)

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

const customerTotalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredCustomers.value.length / CUSTOMERS_PER_PAGE))
})

const paginatedCustomers = computed(() => {
  const start = (customerCurrentPage.value - 1) * CUSTOMERS_PER_PAGE
  const end = start + CUSTOMERS_PER_PAGE
  return filteredCustomers.value.slice(start, end)
})

const customerDisplayStart = computed(() => {
  if (!filteredCustomers.value.length) {
    return 0
  }

  return (customerCurrentPage.value - 1) * CUSTOMERS_PER_PAGE + 1
})

const customerDisplayEnd = computed(() => {
  return Math.min(customerCurrentPage.value * CUSTOMERS_PER_PAGE, filteredCustomers.value.length)
})

watch(filteredCustomers, () => {
  customerCurrentPage.value = 1
})

watch(customerTotalPages, (totalPages) => {
  if (customerCurrentPage.value > totalPages) {
    customerCurrentPage.value = totalPages
  }
})

const mapPersonToForm = (person: PersonResource): PersonPayload => {
  return {
    name: person.name ?? '',
    cpf_cnpj: formatDocument(person.document ?? ''),
    birth_date: person.birth_date ?? '',
    gender: (person.gender?.toUpperCase() as 'M' | 'F' | 'O') ?? 'O',
    phone: person.phone ? formatPhoneBR(person.phone) : '',
    email: person.email ?? '',
    street: person.street ?? '',
    number: person.number ?? '',
    complement: person.complement ?? '',
    neighborhood: person.neighborhood ?? '',
    city: person.city ?? '',
    state: person.state ?? '',
    zip_code: person.zip_code ? formatCEP(person.zip_code) : '',
  }
}

const resetCustomerModalState = (): void => {
  editingCustomerId.value = null
  customerMessage.value = ''
  resetCepState()
  customerForm.value = emptyPersonPayload()
}

const sanitizePayload = (payload: PersonPayload): PersonPayload => {
  const normalized = { ...payload }

  normalized.cpf_cnpj = onlyDigits(normalized.cpf_cnpj)

  if (normalized.zip_code) {
    normalized.zip_code = onlyDigits(normalized.zip_code)
  }

  if (normalized.phone) {
    normalized.phone = onlyDigits(normalized.phone)
  }

  const keys: Array<keyof PersonPayload> = [
    'birth_date',
    'phone',
    'email',
    'street',
    'number',
    'complement',
    'neighborhood',
    'city',
    'state',
    'zip_code',
  ]

  keys.forEach((key) => {
    if (!normalized[key]) {
      delete normalized[key]
    }
  })

  if (normalized.gender) {
    normalized.gender = normalized.gender.toUpperCase() as 'M' | 'F' | 'O'
  }

  return normalized
}

const isRequiredInvalid = (payload: PersonPayload): boolean => {
  return !payload.name.trim() || !payload.cpf_cnpj.trim()
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

  const documentDigits = onlyDigits(customerForm.value.cpf_cnpj)
  if (documentDigits.length === 11 && !isValidCPF(documentDigits)) {
    customerMessage.value = 'CPF inválido.'
    return
  }

  if (customerForm.value.phone && !isValidPhoneBR(customerForm.value.phone)) {
    customerMessage.value = 'Telefone inválido.'
    return
  }

  submitCustomerLoading.value = true
  try {
    const payload = sanitizePayload(customerForm.value)

    if (editingCustomerId.value !== null) {
      await customersService.update(editingCustomerId.value, payload)
      customerMessage.value = 'Cliente atualizado com sucesso.'
    } 
    if (editingCustomerId.value === null) {
      await customersService.create(payload)
      customerMessage.value = 'Cliente cadastrado com sucesso.'
    }

    await loadCustomers()
    showCustomerModal.value = false
    resetCustomerModalState()
  } catch (error) {
    customerMessage.value = error instanceof Error
      ? error.message
      : editingCustomerId.value !== null
        ? 'Erro ao atualizar cliente.'
        : 'Erro ao cadastrar cliente.'
  } finally {
    submitCustomerLoading.value = false
  }
}

const openCustomerModal = (): void => {
  resetCustomerModalState()
  showCustomerModal.value = true
}

const openEditCustomerModal = (customer: CustomerResource): void => {
  editingCustomerId.value = customer.id
  customerMessage.value = ''
  resetCepState()
  customerForm.value = mapPersonToForm(customer.person)
  showCustomerModal.value = true
}

const closeCustomerModal = (): void => {
  showCustomerModal.value = false
  resetCustomerModalState()
}

const toggleFilters = (): void => {
  showFilters.value = !showFilters.value
}

const deleteCustomer = async (customerId: string | number): Promise<void> => {
  if (!confirm('Tem certeza que deseja excluir este cliente?')) {
    return
  }

  try {
    await customersService.remove(customerId)
    showCustomerModal.value = false;
    resetCustomerModalState()
    await loadCustomers()
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Erro ao excluir cliente.')
  }
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
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="toggleFilters"
          >
            <span>Filtros</span>
            <span class="text-xs text-slate-400">{{ showFilters ? 'Ocultar' : 'Mostrar' }}</span>
          </button>
          <button type="button" class="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500" @click="openCustomerModal">+ Novo Cliente</button>
        </div>
      </header>

      <transition name="filters-collapse">
        <div v-if="showFilters" class="filter-panel">
          <div class="filter-bar">
            <input v-model="customerFilters.search" type="text" placeholder="Pesquisar nome, documento ou e-mail" />
            <input v-model="customerFilters.city" type="text" placeholder="Filtrar por cidade" />
            <input v-model="customerFilters.state" type="text" maxlength="2" placeholder="UF" />
          </div>
        </div>
      </transition>

      <p v-if="isLoadingCustomers" class="muted">Carregando clientes...</p>

      <div v-if="!isLoadingCustomers" class="customer-cards">
        <article
          v-for="item in paginatedCustomers"
          :key="item.id"
          class="customer-card cursor-pointer transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          @click="openEditCustomerModal(item)"
        >
          <div class="customer-card-head">
            <strong>{{ item.person.name }}</strong>
            <span class="doc-badge">{{ formatDocumentDisplay(item.person.document) }}</span>
          </div>
          <p>{{ item.person.email || 'Sem e-mail cadastrado' }}</p>
          <p>{{ formatPhoneDisplay(item.person.phone) }}</p>
          <div class="customer-meta">
            <span>{{ item.person.city || 'Cidade não informada' }}</span>
            <span>{{ item.person.state || '--' }}</span>
          </div>
        </article>
      </div>

      <div v-if="!isLoadingCustomers && filteredCustomers.length > 0" class="pagination-footer">
        <p class="muted">
          Exibindo {{ customerDisplayStart }} a {{ customerDisplayEnd }} de {{ filteredCustomers.length }} cliente(s).
        </p>

        <Pagination
          v-if="filteredCustomers.length > CUSTOMERS_PER_PAGE"
          v-model:page="customerCurrentPage"
          :total="filteredCustomers.length"
          :items-per-page="CUSTOMERS_PER_PAGE"
          :sibling-count="1"
          show-edges
          class="w-full justify-end"
        >
          <PaginationContent v-slot="{ items }">
            <PaginationFirst />
            <PaginationPrevious />

            <template
              v-for="(paginationItem, index) in items"
              :key="`${paginationItem.type}-${index}`"
            >
              <PaginationItem
                v-if="paginationItem.type === 'page'"
                :value="paginationItem.value"
                :is-active="paginationItem.value === customerCurrentPage"
              >
                {{ paginationItem.value }}
              </PaginationItem>
              <PaginationEllipsis v-else :index="index" />
            </template>

            <PaginationNext />
            <PaginationLast />
          </PaginationContent>
        </Pagination>
      </div>

      <p v-if="!isLoadingCustomers && filteredCustomers.length === 0" class="muted">
        Nenhum cliente encontrado para os filtros informados.
      </p>
    </article>

    <div
      v-if="showCustomerModal"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/55 p-4 md:p-6"
      @click.self="closeCustomerModal"
    >
      <article class="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 md:px-7 md:py-5">
          <div>
            <h3 class="text-lg font-bold text-slate-900">{{ isEditingCustomer ? 'Editar Cliente' : 'Novo Cliente' }}</h3>
            <p class="mt-1 text-sm text-slate-500">
              {{ isEditingCustomer ? 'Atualize os dados do cliente selecionado' : 'Preencha os dados para cadastrar o cliente' }}
            </p>
          </div>
          <button
            type="button"
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-lg text-slate-500 transition hover:bg-slate-50"
            @click="closeCustomerModal"
          >
            &times;
          </button>
        </header>

        <div class="flex-1 overflow-y-auto bg-slate-50/70 px-5 py-5 md:px-7 md:py-6">
          <form id="customer-form" class="space-y-5" @submit.prevent="submitCustomer">
            <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <div class="mb-4 flex items-center gap-3">
                <span class="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Dados Pessoais</span>
                <div class="h-px flex-1 bg-slate-200"></div>
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">
                    Nome / Razão Social <span class="text-red-400">*</span>
                  </label>
                  <input
                    v-model="customerForm.name"
                    type="text"
                    placeholder="Ex.: João Silva"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">
                    CPF / CNPJ <span class="text-red-400">*</span>
                  </label>
                  <input
                    v-model="customerForm.cpf_cnpj"
                    type="text"
                    placeholder="000.000.000-00"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    @input="handleDocumentInput"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">E-mail</label>
                  <input
                    v-model="customerForm.email"
                    type="email"
                    placeholder="exemplo@email.com"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">Telefone</label>
                  <input
                    v-model="customerForm.phone"
                    type="text"
                    placeholder="(00) 90000-0000"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    @input="handlePhoneInput"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">Data de Nascimento</label>
                  <input
                    v-model="customerForm.birth_date"
                    type="date"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">Gênero</label>
                  <select
                    v-model="customerForm.gender"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="O">Outro / Prefiro não informar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
              </div>
            </section>

            <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <div class="mb-4 flex items-center gap-3">
                <span class="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Endereço</span>
                <div class="h-px flex-1 bg-slate-200"></div>
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">CEP</label>
                  <input
                    v-model="customerForm.zip_code"
                    type="text"
                    placeholder="00000-000"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    @input="handleCepInput"
                    @blur="loadAddressByCep"
                  />
                  <span
                    class="text-xs"
                    :class="cepMessage === 'Endereco preenchido automaticamente.' ? 'text-emerald-600' : 'text-slate-500'"
                  >
                    {{ isLoadingCep ? 'Buscando CEP...' : cepMessage || 'Ao informar o CEP, o endereco e preenchido automaticamente.' }}
                  </span>
                </div>

                <div class="flex flex-col gap-1.5 md:col-span-2">
                  <label class="text-xs font-medium text-slate-600">Logradouro</label>
                  <input
                    v-model="customerForm.street"
                    type="text"
                    placeholder="Rua, Av., Travessa..."
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">Número</label>
                  <input
                    v-model="customerForm.number"
                    type="text"
                    placeholder="123"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">Bairro</label>
                  <input
                    v-model="customerForm.neighborhood"
                    type="text"
                    placeholder="Bairro"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">Cidade</label>
                  <input
                    v-model="customerForm.city"
                    type="text"
                    placeholder="Cidade"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">Estado (UF)</label>
                  <input
                    v-model="customerForm.state"
                    type="text"
                    placeholder="SP"
                    maxlength="2"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div class="flex flex-col gap-1.5 md:col-span-2">
                  <label class="text-xs font-medium text-slate-600">Complemento</label>
                  <input
                    v-model="customerForm.complement"
                    type="text"
                    placeholder="Apto, bloco, sala..."
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>
            </section>
          </form>
        </div>

        <footer class="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7">
          <p
            v-if="customerMessage"
            :class="['text-sm font-semibold', customerMessage.includes('sucesso') ? 'text-emerald-600' : 'text-red-500']"
          >
            {{ customerMessage }}
          </p>
          <span v-else class="hidden md:block"></span>

          <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              @click="closeCustomerModal"
            >
              Cancelar
            </button>
            <button
              form="customer-form"
              type="submit"
              :disabled="submitCustomerLoading"
              class="flex min-w-160px items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span
                v-if="submitCustomerLoading"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              ></span>
              {{ submitCustomerLoading ? 'Salvando...' : isEditingCustomer ? 'Salvar Alterações' : 'Salvar Cliente' }}
            </button>
            <button
                v-if="isEditingCustomer"
                type="button"
                class="flex min-w-160px items-center justify-center gap-2 rounded-xl border border-red-500 bg-white px-5 py-3 text-sm font-bold text-red-500 transition hover:bg-red-50"
                @click="deleteCustomer(editingCustomerId!)"
            >
              Excluir
            </button>

          </div>
        </footer>
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

.filter-bar {
  display: grid;
  grid-template-columns: 1.6fr 1fr 90px;
  gap: 0.65rem;
}

.filter-panel {
  margin-bottom: 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  padding: 0.85rem;
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

.muted {
  color: #6b7280;
  font-size: 0.84rem;
}

.pagination-footer {
  margin-top: 1rem;
  display: grid;
  gap: 0.75rem;
}

.filters-collapse-enter-active,
.filters-collapse-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.filters-collapse-enter-from,
.filters-collapse-leave-to {
  opacity: 0;
  transform: translateY(-6px);
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
