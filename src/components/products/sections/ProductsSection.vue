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
import { formatCurrencyBRL } from '@/utils'
import type { ProductPayload, ProductResource, ProductStockHistoryResource } from '@/types/backoffice'
import { productsService } from '@/services'

const PRODUCTS_PER_PAGE = 9

type StockMovementType = 'entry' | 'exit'

interface StockMovementRecord {
  id: string
  productId: string
  type: StockMovementType
  quantity: number
  previousStock: number
  currentStock: number
  note?: string
  createdAt: string
}

interface StockHistoryItem {
  id: string
  title: string
  description: string
  occurredAt: string
  tone: 'emerald' | 'rose' | 'slate'
}

const STOCK_HISTORY_STORAGE_KEY = 'sgos:product-stock-history'

const emptyProductPayload = (): ProductPayload => ({
  name: '',
  description: '',
  amount: 0,
  stock: 0,  
})

const emptyStockMovementForm = (): { type: StockMovementType; quantity: number; note: string } => ({
  type: 'entry',
  quantity: 1,
  note: '',
})

const normalizeProductId = (productId: string | number): string => String(productId)

const loadStoredStockMovements = (): StockMovementRecord[] => {
  if (typeof window === 'undefined') {
    return []
  }

  const stored = window.localStorage.getItem(STOCK_HISTORY_STORAGE_KEY)

  if (!stored) {
    return []
  }

  try {
    const parsed = JSON.parse(stored) as StockMovementRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const formatDateTime = (value?: string): string => {
  if (!value) {
    return 'Data indisponivel'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed)
}

const normalizeStockHistoryType = (type?: string): StockMovementType | null => {
  if (!type) {
    return null
  }

  const normalized = type.trim().toLowerCase()

  if (['entry', 'entrada', 'in'].includes(normalized)) {
    return 'entry'
  }

  if (['exit', 'saida', 'saída', 'out'].includes(normalized)) {
    return 'exit'
  }

  return null
}

const mapApiHistoryItem = (item: ProductStockHistoryResource): StockHistoryItem => {
  const movementType = normalizeStockHistoryType(item.type ?? item.movement_type)
  const quantity = Number(item.quantity ?? 0)
  const previousStock = Number(item.previousStock ?? item.previous_stock ?? 0)
  const currentStock = Number(item.currentStock ?? item.current_stock ?? 0)
  const note = item.note?.trim() || item.description?.trim() || ''

  return {
    id: String(item.id),
    title: movementType === 'entry' ? 'Entrada de estoque' : movementType === 'exit' ? 'Saida de estoque' : 'Movimentacao de estoque',
    description: `${movementType === 'entry' ? 'Entrada' : movementType === 'exit' ? 'Saida' : 'Movimentacao'} de ${quantity} unidade(s).${note ? ` Observacao: ${note}` : ''}`,
    occurredAt: item.createdAt ?? item.created_at ?? '',
    tone: movementType === 'entry' ? 'emerald' : movementType === 'exit' ? 'rose' : 'slate',
  }
}

const isLoadingProducts = ref(false)
const submitProductLoading = ref(false)
const submitStockLoading = ref(false)
const productMessage = ref('')
const stockMessage = ref('')
const showProductModal = ref(false)
const showStockModal = ref(false)
const showStockMovementForm = ref(false)
const showFilters = ref(false)
const editingProductId = ref<string | number | null>(null)
const products = ref<ProductResource[]>([])
const isLoadingStockDetails = ref(false)
const stockProduct = ref<ProductResource | null>(null)
const stockMovements = ref<StockMovementRecord[]>(loadStoredStockMovements())
const stockMovementForm = ref(emptyStockMovementForm())

const productFilters = ref({
  search: ''
})

const productForm = ref<ProductPayload>(emptyProductPayload())
const productCurrentPage = ref(1)
  
const isEditingProduct = computed(() => editingProductId.value !== null)

const selectedProductHistory = computed<StockHistoryItem[]>(() => {
  const product = stockProduct.value

  if (!product) {
    return []
  }

  const productId = normalizeProductId(product.id)
  const localMovementItems: StockHistoryItem[] = stockMovements.value
    .filter((item) => item.productId === productId)
    .map((item) => ({
      id: item.id,
      title: item.type === 'entry' ? 'Entrada de estoque' : 'Saida de estoque',
      description: `${item.type === 'entry' ? 'Entrada' : 'Saida'} de ${item.quantity} unidade(s).${item.note ? ` Observacao: ${item.note}` : ''}`,
      occurredAt: item.createdAt,
      tone: item.type === 'entry' ? 'emerald' : 'rose',
    }))

  const systemItems: StockHistoryItem[] = [
    {
      id: `created-${productId}`,
      title: 'Produto cadastrado',
      description: `Produto criado com preco atual de ${formatCurrencyBRL(product.amount)}.`,
      occurredAt: product.created_at,
      tone: 'slate',
    },
  ]

  const apiMovementItems = (product.stockHistory ?? []).map(mapApiHistoryItem)
  const movementItems = apiMovementItems.length ? apiMovementItems : localMovementItems

  return [...movementItems, ...systemItems].sort((current, next) => {
    return new Date(next.occurredAt).getTime() - new Date(current.occurredAt).getTime()
  })
})

const filteredProducts = computed(() => {
  const search = productFilters.value.search.trim().toLowerCase()

  return products.value.filter((item) => {
    const name = item.name?.toLowerCase() ?? ''
    const description = item.description?.toLowerCase() ?? ''
    const amount = item.amount?.toString() ?? ''
    const stock = item.stock?.toString() ?? ''

    const searchMatch = !search || name.includes(search) || description.includes(search) || amount.includes(search) || stock.includes(search)

    return searchMatch
  })
})

const productTotalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredProducts.value.length / PRODUCTS_PER_PAGE))
})

const paginatedProducts = computed(() => {
  const start = (productCurrentPage.value - 1) * PRODUCTS_PER_PAGE
  const end = start + PRODUCTS_PER_PAGE
  return filteredProducts.value.slice(start, end)
})

const productDisplayStart = computed(() => {
  if (!filteredProducts.value.length) {
    return 0
  }

  return (productCurrentPage.value - 1) * PRODUCTS_PER_PAGE + 1
})

const productDisplayEnd = computed(() => {
  return Math.min(productCurrentPage.value * PRODUCTS_PER_PAGE, filteredProducts.value.length)
})

watch(filteredProducts, () => {
  productCurrentPage.value = 1
})

watch(productTotalPages, (totalPages) => {
  if (productCurrentPage.value > totalPages) {
    productCurrentPage.value = totalPages
  }
})

const mapProductToForm = (product: ProductResource): ProductPayload => {
  return {
    name: product.name ?? '',
    description: product.description ?? '',
    amount: product.amount ?? 0,
    stock: product.stock ?? 0,
  }
}

const resetProductModalState = (): void => {
  editingProductId.value = null
  productMessage.value = ''
  productForm.value = emptyProductPayload()
}

const resetStockModalState = (): void => {
  stockMessage.value = ''
  stockProduct.value = null
  stockMovementForm.value = emptyStockMovementForm()
  showStockMovementForm.value = false
}

const persistStockMovements = (movements: StockMovementRecord[]): void => {
  stockMovements.value = movements

  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STOCK_HISTORY_STORAGE_KEY, JSON.stringify(movements))
}

const registerStockMovement = (movement: StockMovementRecord): void => {
  persistStockMovements([movement, ...stockMovements.value])
}

const sanitizePayload = (payload: ProductPayload): ProductPayload => {
  const normalized = { ...payload }

  const keys: Array<keyof ProductPayload> = [
    'name',
    'description',
    'amount',
    'stock',
  ]   

  keys.forEach((key) => {
    const value = normalized[key]

    if (value === undefined || value === null) {
      delete normalized[key]
      return
    }

    if (typeof value === 'string' && !value.trim()) {
      delete normalized[key]
    }
  })

  return normalized
}

const isRequiredInvalid = (payload: ProductPayload): boolean => {
  return !payload.name.trim() || !payload.amount
}

const loadProducts = async (): Promise<void> => {
  isLoadingProducts.value = true
  try {
    const response = await productsService.list()
    products.value = response
  } finally {
    isLoadingProducts.value = false
  }
}

const submitProduct = async (): Promise<void> => {
  productMessage.value = ''
  if (isRequiredInvalid(productForm.value)) {
    productMessage.value = 'Nome e valor são obrigatórios.'
    return
  }
    submitProductLoading.value = true
  try {
    const payload = sanitizePayload(productForm.value)

    if (editingProductId.value !== null) {
      await productsService.update(editingProductId.value, payload)
      productMessage.value = 'Produto atualizado com sucesso.'
    } 

    if (editingProductId.value === null) {
      await productsService.create(payload)
      productMessage.value = 'Produto cadastrado com sucesso.'
    }

    await loadProducts()
    showProductModal.value = false
    resetProductModalState()
  } catch (error) {
    productMessage.value = error instanceof Error
      ? error.message
      : editingProductId.value !== null
        ? 'Erro ao atualizar produto.'
        : 'Erro ao cadastrar produto.'
  } finally {
    submitProductLoading.value = false
  }
}

const openProductModal = (): void => {
  resetProductModalState()
  showProductModal.value = true
}

const openEditProductModal = (product: ProductResource): void => {
  editingProductId.value = product.id
  productMessage.value = ''
  productForm.value = mapProductToForm(product)
  showProductModal.value = true
}

const closeProductModal = (): void => {
  showProductModal.value = false
  loadProducts()
  resetProductModalState()
}

const loadStockProduct = async (productId: string | number): Promise<void> => {
  isLoadingStockDetails.value = true
  stockMessage.value = ''

  try {
    const response = await productsService.show(productId)
    stockProduct.value = response
    productForm.value.stock = response.stock
  } catch (error) {
    stockMessage.value = error instanceof Error ? error.message : 'Erro ao carregar estoque do produto.'
  } finally {
    isLoadingStockDetails.value = false
  }
}

const openStockModal = async (): Promise<void> => {
  if (editingProductId.value === null) {
    return
  }

  showStockModal.value = true
  resetStockModalState()
  await loadStockProduct(editingProductId.value)
}

const closeStockModal = (): void => {
  showStockModal.value = false
  resetStockModalState()
}

const submitStockMovement = async (): Promise<void> => {
  if (!stockProduct.value) {
    stockMessage.value = 'Selecione um produto valido para movimentar o estoque.'
    return
  }
  
  if (stockMovementForm.value.quantity <= 0) {
    stockMessage.value = 'A quantidade deve ser maior que zero.'
    return
  }

  submitStockLoading.value = true

  try {
    const payload = {
      type: 'entrada' as const,
      quantity: stockMovementForm.value.quantity,
      note: stockMovementForm.value.note.trim() || undefined,
    }

    await productsService.adjustStock(stockProduct.value.id, payload.quantity, payload.type, payload.note)

    const movementRecord: StockMovementRecord = {
      id: `local-${Date.now()}`,
      productId: normalizeProductId(stockProduct.value.id),
      type: 'entry',
      quantity: payload.quantity,
      previousStock: stockProduct.value.stock,
      currentStock: stockProduct.value.stock + payload.quantity,
      note: payload.note,
      createdAt: new Date().toISOString(),
    }

    registerStockMovement(movementRecord)
    await loadStockProduct(stockProduct.value.id)
    showStockMovementForm.value = false
    stockMovementForm.value = emptyStockMovementForm()
    stockMessage.value = 'Entrada de estoque registrada com sucesso.'
  } catch (error) {
    stockMessage.value = error instanceof Error ? error.message : 'Erro ao registrar movimentação de estoque.'
  } finally {
    submitStockLoading.value = false
  }
}

const toggleFilters = (): void => {
  showFilters.value = !showFilters.value
}

const deleteProduct = async (productId: string | number): Promise<void> => {
  if (!confirm('Tem certeza que deseja excluir este produto?')) {
    return
  }

  try {
    await productsService.remove(productId)
    showProductModal.value = false
    resetProductModalState()
    await loadProducts()
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Erro ao excluir produto.')
  }
}

onMounted(async () => {
  await loadProducts()
})
</script>

<template>
  <section class="content-section">
    <article class="panel">
      <header class="section-actions">
        <div>
          <h3>Produtos Cadastrados</h3>
          <span>{{ filteredProducts.length }} resultados • {{ products.length }} total</span>
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
          <button type="button" class="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500" @click="openProductModal">+ Novo Produto </button>
        </div>
      </header>

      <transition name="filters-collapse">
        <div v-if="showFilters" class="filter-panel">
          <div class="filter-bar">
            <input v-model="productFilters.search" type="text" placeholder="Pesquisar nome, descricao, valor ou estoque" />
          </div>
        </div>
      </transition>

      <p v-if="isLoadingProducts" class="muted">Carregando produtos...</p>

      <div v-if="!isLoadingProducts" class="product-cards grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 space-x-1">
        <article
          v-for="item in paginatedProducts"
          :key="item.id"
          class="product-card cursor-pointer transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          @click="openEditProductModal(item)"
        >
          <div class="product-card-head">
            <strong>{{ item.name }}</strong>
          </div>
          <p>{{ item.description || 'Sem descrição cadastrada' }}</p>
          <p>{{ formatCurrencyBRL(item.amount) }}</p>
          <p>Estoque: {{ item.stock }} unidades</p>
        </article>
      </div>

      <div v-if="!isLoadingProducts && filteredProducts.length > 0" class="pagination-footer">
        <p class="muted">
          Exibindo {{ productDisplayStart }} a {{ productDisplayEnd }} de {{ filteredProducts.length }} produto(s).
        </p>

        <Pagination
          v-if="filteredProducts.length > PRODUCTS_PER_PAGE"
          v-model:page="productCurrentPage"
          :total="filteredProducts.length"
          :items-per-page="PRODUCTS_PER_PAGE"
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
                :is-active="paginationItem.value === productCurrentPage"
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

      <p v-if="!isLoadingProducts && filteredProducts.length === 0" class="muted">
        Nenhum produto encontrado para os filtros informados.
      </p>
    </article>

    <div
      v-if="showProductModal"
      class="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/55 p-4 md:p-6"
      @click.self="closeProductModal"
    >
      <article class="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 md:px-7 md:py-5">
          <div>
            <h3 class="text-lg font-bold text-slate-900">{{ isEditingProduct ? 'Editar Produto' : 'Novo Produto' }}</h3>
            <p class="mt-1 text-sm text-slate-500">
              {{ isEditingProduct ? 'Atualize os dados do produto selecionado' : 'Preencha os dados para cadastrar o produto' }}
            </p>
          </div>
          <button
            type="button"
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-lg text-slate-500 transition hover:bg-slate-50"
            @click="closeProductModal"
          >
            &times;
          </button>
        </header>

        <div class="flex-1 overflow-y-auto bg-slate-50/70 px-5 py-5 md:px-7 md:py-6">
          <form id="product-form" class="space-y-5" @submit.prevent="submitProduct">
            <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <div class="mb-4 flex items-center gap-3">
                <span class="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Dados do Produto</span>
                <div class="h-px flex-1 bg-slate-200"></div>
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">
                    Nome <span class="text-red-400">*</span>
                  </label>
                  <input
                    v-model="productForm.name"
                    type="text"
                    placeholder="Ex.: Windows 11 Pro"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">
                    Descrição
                  </label>
                  <input
                    v-model="productForm.description"
                    type="text"
                    placeholder="Ex.: Sistema operacional para computadores pessoais"
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
                    v-model.number="productForm.amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex.: 99.90"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">
                    Estoque <span class="text-red-400">*</span>
                  </label>
                  <input
                    v-model.number="productForm.stock"
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
            v-if="productMessage"
            :class="['text-sm font-semibold', productMessage.includes('sucesso') ? 'text-emerald-600' : 'text-red-500']"
          >
            {{ productMessage }}
          </p>
          <span v-else class="hidden md:block"></span>

          <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              v-if="isEditingProduct"
              type="button"
              class="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
              @click="openStockModal"
            >
              Estoque e Historico
            </button>
            <button
              type="button"
              class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              @click="closeProductModal"
            >
              Cancelar
            </button>
            <button
              form="product-form"
              type="submit"
              :disabled="submitProductLoading"
              class="flex min-w-160px items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span
                v-if="submitProductLoading"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              ></span>
              {{ submitProductLoading ? 'Salvando...' : isEditingProduct ? 'Salvar Alterações' : 'Salvar Produto' }}
            </button>
            <button
                v-if="isEditingProduct"
                type="button"
                class="flex min-w-160px items-center justify-center gap-2 rounded-xl border border-red-500 bg-white px-5 py-3 text-sm font-bold text-red-500 transition hover:bg-red-50"
                @click="deleteProduct(editingProductId!)"
            >
              Excluir
            </button>
          </div>
        </footer>
      </article>
    </div>

    <div
      v-if="showStockModal"
      class="fixed inset-0 z-70 flex items-center justify-center bg-slate-900/60 p-4 md:p-6"
      @click.self="closeStockModal"
    >
      <article class="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 md:px-7 md:py-5">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Estoque e Historico</h3>
            <p class="mt-1 text-sm text-slate-500">
              Consulte o saldo atual do produto e registre novas entradas ou saidas.
            </p>
          </div>
          <button
            type="button"
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-lg text-slate-500 transition hover:bg-slate-50"
            @click="closeStockModal"
          >
            &times;
          </button>
        </header>

        <div class="flex-1 overflow-y-auto bg-slate-50/70 px-5 py-5 md:px-7 md:py-6">
          <p v-if="isLoadingStockDetails" class="muted">Carregando dados de estoque...</p>

          <div v-else-if="stockProduct" class="space-y-5">
            <section class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Produto</span>
                <strong class="mt-3 block text-base text-slate-900">{{ stockProduct.name }}</strong>
                <p class="mt-2 text-sm text-slate-500">{{ stockProduct.description || 'Sem descricao cadastrada.' }}</p>
              </article>
              <article class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                <span class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Estoque Atual</span>
                <strong class="mt-3 block text-3xl text-emerald-800">{{ stockProduct.stock }}</strong>
                <p class="mt-2 text-sm text-emerald-700">unidades disponiveis</p>
              </article>
              <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ultima Atualizacao</span>
                <strong class="mt-3 block text-base text-slate-900">{{ formatDateTime(stockProduct.updated_at) }}</strong>
                <p class="mt-2 text-sm text-slate-500">Preco atual: {{ formatCurrencyBRL(stockProduct.amount) }}</p>
              </article>
            </section>

            <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
                <div class="flex items-center gap-3">
                  <span class="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Adicionar ao Estoque</span>
                  <div class="h-px flex-1 bg-slate-200"></div>
                </div>
                <button
                  type="button"
                  class="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  @click="showStockMovementForm = !showStockMovementForm"
                >
                  {{ showStockMovementForm ? 'Ocultar formulario' : 'Nova entrada' }}
                </button>
              </div>

              <form
                v-if="showStockMovementForm"
                class="grid grid-cols-1 gap-4 md:grid-cols-[140px,minmax(0,1fr),auto] md:items-end"
                @submit.prevent="submitStockMovement"
              >
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">Quantidade</label>
                  <input
                    v-model.number="stockMovementForm.quantity"
                    type="number"
                    min="1"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-slate-600">Observacao</label>
                  <input
                    v-model="stockMovementForm.note"
                    type="text"
                    placeholder="Ex.: Compra do fornecedor ou ajuste manual"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <button
                  type="submit"
                  :disabled="submitStockLoading"
                  class="flex min-w-160px items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span
                    v-if="submitStockLoading"
                    class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  ></span>
                  {{ submitStockLoading ? 'Salvando...' : 'Registrar' }}
                </button>
              </form>

              <p v-else class="muted">
                O formulario de movimentacao esta oculto. Clique em Nova entrada para adicionar estoque.
              </p>
            </section>

            <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <div class="mb-4 flex items-center gap-3">
                <span class="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Historico do Estoque</span>
                <div class="h-px flex-1 bg-slate-200"></div>
              </div>

              <div v-if="selectedProductHistory.length" class="space-y-3">
                <article
                  v-for="item in selectedProductHistory"
                  :key="item.id"
                  :class="[
                    'rounded-2xl border p-4',
                    item.tone === 'emerald'
                      ? 'border-emerald-200 bg-emerald-50'
                      : item.tone === 'rose'
                        ? 'border-rose-200 bg-rose-50'
                        : 'border-slate-200 bg-slate-50',
                  ]"
                >
                  <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <strong class="block text-sm text-slate-900">{{ item.title }}</strong>
                      <p class="mt-1 text-sm text-slate-600">{{ item.description }}</p>
                    </div>
                    <span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                      {{ formatDateTime(item.occurredAt) }}
                    </span>
                  </div>
                </article>
              </div>

              <p v-else class="muted">
                Nenhuma movimentacao registrada ainda para este produto.
              </p>
            </section>
          </div>

          <p v-else class="muted">Nao foi possivel carregar os dados do produto.</p>
        </div>

        <footer class="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7">
          <p
            v-if="stockMessage"
            :class="['text-sm font-semibold', stockMessage.includes('sucesso') ? 'text-emerald-600' : 'text-red-500']"
          >
            {{ stockMessage }}
          </p>
          <span v-else class="hidden md:block"></span>

          <button
            type="button"
            class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            @click="closeStockModal"
          >
            Fechar
          </button>
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

.product-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.product-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.8rem;
  display: grid;
  gap: 0.35rem;
}

.product-card-head {
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

.product-card p {
  margin: 0;
  color: #4b5563;
  font-size: 0.86rem;
}

.product-meta {
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
  .product-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .content-section {
    padding-bottom: 5.8rem;
  }

  .filter-bar,
  .product-cards {
    grid-template-columns: 1fr;
  }

  .section-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
