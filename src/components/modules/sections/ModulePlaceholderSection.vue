<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
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
import type { ServicePayload, ServiceResource } from '@/types/backoffice'
import { servicesService } from '@/services'
import { formatCurrencyBRL } from '@/utils'

const SERVICES_PER_PAGE = 9

const emptyServicePayload = (): ServicePayload => ({
  name: '',
  description: '',
  amount: 0,
  duration_minutes: 0,
})

const isLoadingServices = ref(false)
const submitServiceLoading = ref(false)
const serviceMessage = ref('')
const showServiceModal = ref(false)
const showFilters = ref(false)
const editingServiceId = ref<string | number | null>(null)
const deletingServiceId = ref<string | number | null>(null)
const services = ref<ServiceResource[]>([])

const serviceFilters = ref({
  search: ''
})

const serviceForm = ref<ServicePayload>(emptyServicePayload())
const serviceCurrentPage = ref(1)

const isEditingService = computed(() => editingServiceId.value !== null)

const filteredServices = computed(() => {
  const search = serviceFilters.value.search.trim().toLowerCase()

  return services.value.filter((item) => {
    const name = item.name?.toLowerCase() ?? ''
    const description = item.description?.toLowerCase() ?? ''
    const price = item.price?.toString() ?? ''
    const duration = item.duration_minutes?.toString() ?? ''

    const searchMatch = !search || name.includes(search) || description.includes(search) || price.includes(search) || duration.includes(search)

    return searchMatch
  })
})

const serviceTotalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredServices.value.length / SERVICES_PER_PAGE))
})

const paginatedServices = computed(() => {
  const start = (serviceCurrentPage.value - 1) * SERVICES_PER_PAGE
  const end = start + SERVICES_PER_PAGE
  return filteredServices.value.slice(start, end)
})

const serviceDisplayStart = computed(() => {
  if (!filteredServices.value.length) {
    return 0
  }

  return (serviceCurrentPage.value - 1) * SERVICES_PER_PAGE + 1
})

const serviceDisplayEnd = computed(() => {
  return Math.min(serviceCurrentPage.value * SERVICES_PER_PAGE, filteredServices.value.length)
})

watch(filteredServices, () => {
  serviceCurrentPage.value = 1
})

watch(serviceTotalPages, (totalPages) => {
  if (serviceCurrentPage.value > totalPages) {
    serviceCurrentPage.value = totalPages
  }
})

const mapServiceToForm = (service: ServiceResource): ServicePayload => {
  return {
    name: service.name ?? '',
    description: service.description ?? '',
    amount: service.price ?? 0,
    duration_minutes: service.duration_minutes ?? 0,
  }
}

const resetServiceModalState = (): void => {
  editingServiceId.value = null
  serviceMessage.value = ''
  serviceForm.value = emptyServicePayload()
}

const sanitizePayload = (payload: ServicePayload): ServicePayload => {
  const normalized = { ...payload }

  const keys: Array<keyof ServicePayload> = [
    'name',
    'description',
    'amount',
    'duration_minutes',
  ]   

  keys.forEach((key) => {
    if (!normalized[key]) {
      delete normalized[key]
    }
  })

  return normalized
}

const isRequiredInvalid = (payload: ServicePayload): boolean => {
  return !payload.name.trim() || !payload.amount
}

const loadServices = async (): Promise<void> => {
  isLoadingServices.value = true
  try {
    const response = await servicesService.list()
    services.value = response
  } finally {
    isLoadingServices.value = false
  }
}

const submitService = async (): Promise<void> => {
  serviceMessage.value = ''
  if (isRequiredInvalid(serviceForm.value)) {
    serviceMessage.value = 'Nome e valor são obrigatórios.'
    return
  }
    submitServiceLoading.value = true
  try {
    const payload = sanitizePayload(serviceForm.value)

    if (editingServiceId.value !== null) {
      await servicesService.update(editingServiceId.value, payload)
      serviceMessage.value = 'Serviço atualizado com sucesso.'
    } 

    if (editingServiceId.value === null) {
      await servicesService.create(payload)
      serviceMessage.value = 'Serviço cadastrado com sucesso.'
    }

    await loadServices()
    showServiceModal.value = false
    resetServiceModalState()
  } catch (error) {
    serviceMessage.value = error instanceof Error
      ? error.message
      : editingServiceId.value !== null
        ? 'Erro ao atualizar serviço.'
        : 'Erro ao cadastrar serviço.'
  } finally {
    submitServiceLoading.value = false
  }
}

const openServiceModal = (): void => {
  resetServiceModalState()
  showServiceModal.value = true
}

const openEditServiceModal = (service: ServiceResource): void => {
  editingServiceId.value = service.id
  serviceMessage.value = ''
  serviceForm.value = mapServiceToForm(service)
  showServiceModal.value = true
}

const closeServiceModal = (): void => {
  showServiceModal.value = false
  resetServiceModalState()
}

const toggleFilters = (): void => {
  showFilters.value = !showFilters.value
}

const deleteservice = async (serviceId: string | number): Promise<void> => {
  if (!confirm('Tem certeza que deseja excluir este cliente?')) {
    return
  }

  try {
    await servicesService.remove(serviceId)
    showServiceModal.value = false;
    resetServiceModalState()
    await loadServices()
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Erro ao excluir serviço.')
  }
}

onMounted(async () => {
  await loadServices()
})
</script>

<template>
  <section class="content-section">
    <article class="panel">
      <header class="section-actions">
        <div>
          <h3>Serviços Cadastrados</h3>
          <span>{{ filteredServices.length }} resultados • {{ services.length }} total</span>
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
          <button type="button" class="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500" @click="openServiceModal">+ Novo Serviço</button>
        </div>
      </header>

      <transition name="filters-collapse">
        <div v-if="showFilters" class="filter-panel">
          <div class="filter-bar">
            <input v-model="serviceFilters.search" type="text" placeholder="Pesquisar nome, documento ou e-mail" />
          </div>
        </div>
      </transition>

      <p v-if="isLoadingServices" class="muted">Carregando serviços...</p>

      <div v-if="!isLoadingServices" class="service-cards grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 space-x-1">
        <article
          v-for="item in paginatedServices"
          :key="item.id"
          class="service-card cursor-pointer transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          @click="openEditServiceModal(item)"
        >
          <div class="service-card-head">
            <strong>{{ item.name }}</strong>
          </div>
          <p>{{ item.description || 'Sem descrição cadastrada' }}</p>
          <p>{{ formatCurrencyBRL(item.price) }}</p>
          <p>Duração: {{ item.duration_minutes }} minutos</p>
        </article>
      </div>

      <div v-if="!isLoadingServices && filteredServices.length > 0" class="pagination-footer">
        <p class="muted">
          Exibindo {{ serviceDisplayStart }} a {{ serviceDisplayEnd }} de {{ filteredServices.length }} servico(s).
        </p>

        <Pagination
          v-if="filteredServices.length > SERVICES_PER_PAGE"
          v-model:page="serviceCurrentPage"
          :total="filteredServices.length"
          :items-per-page="SERVICES_PER_PAGE"
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
                :is-active="paginationItem.value === serviceCurrentPage"
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

      <p v-if="!isLoadingServices && filteredServices.length === 0" class="muted">
        Nenhum serviço encontrado para os filtros informados.
      </p>
    </article>

    <div
      v-if="showServiceModal"
      class="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/55 p-4 md:p-6"
      @click.self="closeServiceModal"
    >
      <article class="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 md:px-7 md:py-5">
          <div>
            <h3 class="text-lg font-bold text-slate-900">{{ isEditingService ? 'Editar Serviço' : 'Novo Serviço' }}</h3>
            <p class="mt-1 text-sm text-slate-500">
              {{ isEditingService ? 'Atualize os dados do serviço selecionado' : 'Preencha os dados para cadastrar o serviço' }}
            </p>
          </div>
          <button
            type="button"
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-lg text-slate-500 transition hover:bg-slate-50"
            @click="closeServiceModal"
          >
            &times;
          </button>
        </header>

        <div class="flex-1 overflow-y-auto bg-slate-50/70 px-5 py-5 md:px-7 md:py-6">
          <form id="service-form" class="space-y-5" @submit.prevent="submitService">
            <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <div class="mb-4 flex items-center gap-3">
                <span class="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Dados do Serviços</span>
                <div class="h-px flex-1 bg-slate-200"></div>
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">
                    Nome <span class="text-red-400">*</span>
                  </label>
                  <input
                    v-model="serviceForm.name"
                    type="text"
                    placeholder="Ex.: João Silva"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">
                    Descrição
                  </label>
                  <input
                    v-model="serviceForm.description"
                    type="text"
                    placeholder="Ex.: Atendimento completo para corte de cabelo"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">
                    Preço <span class="text-red-400">*</span>
                  </label>
                  <input
                    v-model.number="serviceForm.amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex.: 99.90"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">
                    Duração (minutos) <span class="text-red-400">*</span>
                  </label>
                  <input
                    v-model.number="serviceForm.duration_minutes"
                    type="number"
                    min="0"
                    placeholder="Ex.: 60"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>
            </section>
          </form>
        </div>

        <footer class="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7">
          <p
            v-if="serviceMessage"
            :class="['text-sm font-semibold', serviceMessage.includes('sucesso') ? 'text-emerald-600' : 'text-red-500']"
          >
            {{ serviceMessage }}
          </p>
          <span v-else class="hidden md:block"></span>

          <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              @click="closeServiceModal"
            >
              Cancelar
            </button>
            <button
              form="service-form"
              type="submit"
              :disabled="submitServiceLoading"
              class="flex min-w-160px items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span
                v-if="submitServiceLoading"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              ></span>
              {{ submitServiceLoading ? 'Salvando...' : isEditingService ? 'Salvar Alterações' : 'Salvar Serviço' }}
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

.service-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.service-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.8rem;
  display: grid;
  gap: 0.35rem;
}

.service-card-head {
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

.service-card p {
  margin: 0;
  color: #4b5563;
  font-size: 0.86rem;
}

.service-meta {
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
  .service-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .content-section {
    padding-bottom: 5.8rem;
  }

  .filter-bar,
  .service-cards {
    grid-template-columns: 1fr;
  }

  .section-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
