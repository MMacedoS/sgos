<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { cashService } from '@/services'
import type {
  CashActionPayload,
  CashMovementPayload,
  CashMovementResource,
  CashMovementType,
  CashPayload,
  CashResource,
} from '@/types/backoffice'
import { formatCurrencyBRL } from '@/utils'

type CashStatusFilter = 'todos' | 'aberto' | 'fechado'
type CashActionType = 'abrir' | 'fechar'

interface CashFormState {
  name: string
  description: string
  openingBalance: number
}

interface CashActionFormState {
  amount: number
  note: string
}

interface MovementFormState {
  cashId: string
  type: CashMovementType
  amount: number
  note: string
  description: string
  occurredAt: string
}

const MOVEMENT_TYPE_OPTIONS: Array<{ value: CashMovementType; label: string }> = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'saida', label: 'Saída' },
  { value: 'sangria', label: 'Sangria' },
  { value: 'suprimento', label: 'Suprimento' },
  { value: 'ajuste', label: 'Ajuste' },
]

const emptyCashForm = (): CashFormState => ({
  name: '',
  description: '',
  openingBalance: 0,
})

const emptyCashActionForm = (): CashActionFormState => ({
  amount: 0,
  note: '',
})

const createTodayDateTimeLocal = (): string => {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 16)
}

const emptyMovementForm = (): MovementFormState => ({
  cashId: '',
  type: 'entrada',
  amount: 0,
  note: '',
  description: '',
  occurredAt: createTodayDateTimeLocal(),
})

const normalizeString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : ''
}

const normalizeId = (value: string | number | undefined | null): string => {
  return String(value ?? '')
}

const safeNumber = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatDateTime = (value?: string): string => {
  if (!value) {
    return 'Data indisponível'
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

const resolveCashName = (cash: CashResource): string => {
  return normalizeString(cash.name ?? cash.nome) || `Caixa #${normalizeId(cash.code)}`
}

const resolveCashDescription = (cash: CashResource): string => {
  return normalizeString(cash.description ?? cash.descricao ?? cash.note ?? cash.observacao)
}

const resolveCashOpeningBalance = (cash: CashResource): number => {
  return safeNumber(cash.opening_balance ?? cash.initial_balance ?? cash.saldo_inicial)
}

const resolveCashCode = (cash: CashResource): string => {
  return normalizeId(cash.code)
}

const resolveCashCurrentBalance = (cash: CashResource): number => {
  const explicitBalance = cash.current_balance ?? cash.balance ?? cash.saldo_atual ?? cash.final_balance

  if (explicitBalance !== undefined && explicitBalance !== null) {
    return safeNumber(explicitBalance)
  }

  return resolveCashOpeningBalance(cash)
}

const resolveCashEntries = (cash: CashResource): number => {
  return safeNumber(cash.total_entries ?? cash.total_inputs ?? cash.entradas)
}

const resolveCashExits = (cash: CashResource): number => {
  return safeNumber(cash.total_exits ?? cash.total_outputs ?? cash.saidas)
}

const resolveCashOpenedAt = (cash: CashResource): string => {
  return normalizeString(cash.opened_at ?? cash.opening_date ?? cash.aberto_em ?? cash.created_at)
}

const resolveCashClosedAt = (cash: CashResource): string => {
  return normalizeString(cash.closed_at ?? cash.closing_date ?? cash.fechado_em)
}

const resolveCashStatus = (cash: CashResource): 'aberto' | 'fechado' => {
  const status = normalizeString(cash.status).toLowerCase()

  if (['aberto', 'open', 'opened', 'ativo', 'active'].includes(status)) {
    return 'aberto'
  }

  if (['fechado', 'closed', 'close', 'inativo', 'inactive'].includes(status)) {
    return 'fechado'
  }

  return resolveCashClosedAt(cash) ? 'fechado' : 'aberto'
}

const resolveMovementCashId = (movement: CashMovementResource): string => {
  return normalizeId(movement.cash_id ?? movement.caixa_id ?? movement.cash?.id ?? movement.caixa?.id)
}

const resolveCashLinkKey = (cash: CashResource): string => {
  return resolveCashCode(cash) || normalizeId(cash.id)
}

const resolveMovementType = (movement: CashMovementResource): CashMovementType => {
  const type = normalizeString(movement.type ?? movement.tipo).toLowerCase()

  if (type === 'saida') {
    return 'saida'
  }

  if (type === 'sangria') {
    return 'sangria'
  }

  if (type === 'suprimento') {
    return 'suprimento'
  }

  if (type === 'ajuste') {
    return 'ajuste'
  }

  return 'entrada'
}

const resolveMovementAmount = (movement: CashMovementResource): number => {
  return safeNumber(movement.amount ?? movement.value ?? movement.valor)
}

const resolveMovementNote = (movement: CashMovementResource): string => {
  return normalizeString(movement.note ?? movement.observacao)
}

const resolveMovementDescription = (movement: CashMovementResource): string => {
  return normalizeString(movement.description ?? movement.descricao)
}

const resolveMovementDate = (movement: CashMovementResource): string => {
  return normalizeString(movement.occurred_at ?? movement.movement_date ?? movement.data ?? movement.created_at ?? movement.updated_at)
}

const resolveMovementOrigin = (movement: CashMovementResource): string => {
  if (movement.payment_service_order_id !== undefined && movement.payment_service_order_id !== null) {
    return `OS #${normalizeId(movement.payment_service_order_id)}`
  }

  if (movement.payment_sale_id !== undefined && movement.payment_sale_id !== null) {
    return `Venda #${normalizeId(movement.payment_sale_id)}`
  }

  return 'Lançamento manual'
}

const buildCashPayload = (form: CashFormState): CashPayload => {
  const description = normalizeString(form.description)

  return {
    name: normalizeString(form.name),
    nome: normalizeString(form.name),
    description: description || undefined,
    descricao: description || undefined,
    opening_balance: safeNumber(form.openingBalance),
    initial_balance: safeNumber(form.openingBalance),
    saldo_inicial: safeNumber(form.openingBalance),
  }
}

const buildCashActionPayload = (type: CashActionType, form: CashActionFormState): CashActionPayload => {
  const amount = safeNumber(form.amount)
  const note = normalizeString(form.note)

  if (type === 'abrir') {
    return {
      opening_balance: amount,
      initial_balance: amount,
      saldo_inicial: amount,
      amount,
      value: amount,
      valor: amount,
      note: note || undefined,
      observacao: note || undefined,
    }
  }

  return {
    closing_balance: amount,
    current_balance: amount,
    balance: amount,
    saldo_atual: amount,
    amount,
    value: amount,
    valor: amount,
    note: note || undefined,
    observacao: note || undefined,
  }
}

const buildMovementPayload = (form: MovementFormState): CashMovementPayload => {
  const note = normalizeString(form.note)
  const description = normalizeString(form.description)
  const occurredAt = normalizeString(form.occurredAt)

  return {
    cash_id: form.cashId,
    caixa_id: form.cashId,
    type: form.type,
    tipo: form.type,
    amount: safeNumber(form.amount),
    value: safeNumber(form.amount),
    valor: safeNumber(form.amount),
    note: note || undefined,
    observacao: note || undefined,
    description: description || undefined,
    descricao: description || undefined,
    occurred_at: occurredAt || undefined,
    data: occurredAt || undefined,
  }
}

const cashes = ref<CashResource[]>([])
const movements = ref<CashMovementResource[]>([])
const selectedCashId = ref<string>('')
const cashMessage = ref('')
const isLoadingData = ref(false)
const isSubmittingCash = ref(false)
const isSubmittingMovement = ref(false)
const isSubmittingAction = ref(false)
const showCashModal = ref(false)
const showMovementModal = ref(false)
const cashActionType = ref<CashActionType | null>(null)
const editingCashId = ref<string | number | null>(null)
const editingMovementId = ref<string | number | null>(null)

const cashFilters = ref<{ search: string; status: CashStatusFilter }>({
  search: '',
  status: 'todos',
})

const cashForm = ref<CashFormState>(emptyCashForm())
const cashActionForm = ref<CashActionFormState>(emptyCashActionForm())
const movementForm = ref<MovementFormState>(emptyMovementForm())

const filteredCashes = computed(() => {
  const search = cashFilters.value.search.trim().toLowerCase()

  return cashes.value.filter((cash) => {
    const matchesSearch = !search
      || resolveCashName(cash).toLowerCase().includes(search)
      || resolveCashDescription(cash).toLowerCase().includes(search)

    const matchesStatus = cashFilters.value.status === 'todos'
      || resolveCashStatus(cash) === cashFilters.value.status

    return matchesSearch && matchesStatus
  })
})

const selectedCash = computed(() => {
  return cashes.value.find((cash) => normalizeId(cash.id) === selectedCashId.value) ?? null
})

const selectedCashMovements = computed(() => {
  const cash = selectedCash.value

  if (!selectedCashId.value || !cash) {
    return []
  }

  const cashKeys = new Set([normalizeId(cash.id), resolveCashLinkKey(cash)].filter(Boolean))

  return movements.value
    .filter((movement) => cashKeys.has(resolveMovementCashId(movement)))
    .sort((current, next) => new Date(resolveMovementDate(next)).getTime() - new Date(resolveMovementDate(current)).getTime())
})

const openCashesCount = computed(() => {
  return cashes.value.filter((cash) => resolveCashStatus(cash) === 'aberto').length
})

const totalBalance = computed(() => {
  return cashes.value.reduce((total, cash) => total + resolveCashCurrentBalance(cash), 0)
})

const movementBalance = computed(() => {
  return selectedCashMovements.value.reduce((total, movement) => {
    const type = resolveMovementType(movement)
    const amount = resolveMovementAmount(movement)
    return ['saida', 'sangria'].includes(type) ? total - amount : total + amount
  }, 0)
})

const isEditingCash = computed(() => editingCashId.value !== null)
const isEditingMovement = computed(() => editingMovementId.value !== null)

watch(filteredCashes, (items) => {
  if (!items.length) {
    selectedCashId.value = ''
    return
  }

  const hasSelectedCash = items.some((cash) => normalizeId(cash.id) === selectedCashId.value)

  if (!hasSelectedCash) {
    selectedCashId.value = normalizeId(items[0]?.id)
  }
}, { immediate: true })

const mergeCash = (cash: CashResource): void => {
  const cashId = normalizeId(cash.id)
  const index = cashes.value.findIndex((item) => normalizeId(item.id) === cashId)

  if (index >= 0) {
    cashes.value.splice(index, 1, cash)
    return
  }

  cashes.value.unshift(cash)
}

const mergeMovement = (movement: CashMovementResource): void => {
  const movementId = normalizeId(movement.id)
  const index = movements.value.findIndex((item) => normalizeId(item.id) === movementId)

  if (index >= 0) {
    movements.value.splice(index, 1, movement)
    return
  }

  movements.value.unshift(movement)
}

const resetCashForm = (): void => {
  editingCashId.value = null
  cashForm.value = emptyCashForm()
}

const resetMovementForm = (): void => {
  editingMovementId.value = null
  movementForm.value = {
    ...emptyMovementForm(),
    cashId: selectedCashId.value,
  }
}

const resetActionForm = (): void => {
  cashActionType.value = null
  cashActionForm.value = emptyCashActionForm()
}

const loadData = async (): Promise<void> => {
  isLoadingData.value = true
  cashMessage.value = ''

  try {
    const [cashResponse, movementResponse] = await Promise.all([
      cashService.list(),
      cashService.listMovements(),
    ])

    cashes.value = cashResponse
    movements.value = movementResponse
  } catch (error) {
    cashMessage.value = error instanceof Error ? error.message : 'Erro ao carregar dados do caixa.'
  } finally {
    isLoadingData.value = false
  }
}

const refreshSelectedCash = async (): Promise<void> => {
  if (!selectedCashId.value) {
    return
  }

  try {
    const detailedCash = await cashService.show(selectedCashId.value)
    mergeCash(detailedCash)
  } catch {
    return
  }
}

const openCreateCashModal = (): void => {
  resetCashForm()
  showCashModal.value = true
}

const openEditCashModal = async (cash: CashResource): Promise<void> => {
  try {
    const detailedCash = await cashService.show(cash.id)
    editingCashId.value = detailedCash.id
    cashForm.value = {
      name: resolveCashName(detailedCash),
      description: resolveCashDescription(detailedCash),
      openingBalance: resolveCashOpeningBalance(detailedCash),
    }
    showCashModal.value = true
  } catch (error) {
    cashMessage.value = error instanceof Error ? error.message : 'Erro ao carregar caixa para edição.'
  }
}

const openMovementCreateModal = (): void => {
  resetMovementForm()
  showMovementModal.value = true
}

const openMovementEditModal = async (movement: CashMovementResource): Promise<void> => {
  try {
    const detailedMovement = await cashService.showMovement(movement.id)
    editingMovementId.value = detailedMovement.id
    movementForm.value = {
      cashId: resolveMovementCashId(detailedMovement),
      type: resolveMovementType(detailedMovement),
      amount: resolveMovementAmount(detailedMovement),
      note: resolveMovementNote(detailedMovement),
      description: resolveMovementDescription(detailedMovement),
      occurredAt: resolveMovementDate(detailedMovement).slice(0, 16) || createTodayDateTimeLocal(),
    }
    showMovementModal.value = true
  } catch (error) {
    cashMessage.value = error instanceof Error ? error.message : 'Erro ao carregar movimentação.'
  }
}

const openCashActionModal = (type: CashActionType, cash: CashResource): void => {
  selectedCashId.value = normalizeId(cash.id)
  cashActionType.value = type
  cashActionForm.value = {
    amount: resolveCashCurrentBalance(cash),
    note: '',
  }
}

const submitCashForm = async (): Promise<void> => {
  isSubmittingCash.value = true
  cashMessage.value = ''

  try {
    const payload = buildCashPayload(cashForm.value)
    const savedCash = editingCashId.value !== null
      ? await cashService.update(editingCashId.value, payload)
      : await cashService.create(payload)

    mergeCash(savedCash)
    selectedCashId.value = normalizeId(savedCash.id)
    cashMessage.value = editingCashId.value !== null ? 'Caixa atualizado com sucesso.' : 'Caixa cadastrado com sucesso.'
    showCashModal.value = false
    resetCashForm()
    await refreshSelectedCash()
  } catch (error) {
    cashMessage.value = error instanceof Error
      ? error.message
      : editingCashId.value !== null
        ? 'Erro ao atualizar caixa.'
        : 'Erro ao cadastrar caixa.'
  } finally {
    isSubmittingCash.value = false
  }
}

const submitMovementForm = async (): Promise<void> => {
  isSubmittingMovement.value = true
  cashMessage.value = ''

  try {
    const payload = buildMovementPayload(movementForm.value)
    const savedMovement = editingMovementId.value !== null
      ? await cashService.updateMovement(editingMovementId.value, payload)
      : await cashService.createMovement(payload)

    mergeMovement(savedMovement)
    selectedCashId.value = normalizeId(payload.cash_id)
    cashMessage.value = editingMovementId.value !== null
      ? 'Movimentação atualizada com sucesso.'
      : 'Movimentação registrada com sucesso.'
    showMovementModal.value = false
    resetMovementForm()
    await refreshSelectedCash()
  } catch (error) {
    cashMessage.value = error instanceof Error
      ? error.message
      : editingMovementId.value !== null
        ? 'Erro ao atualizar movimentação.'
        : 'Erro ao registrar movimentação.'
  } finally {
    isSubmittingMovement.value = false
  }
}

const submitCashAction = async (): Promise<void> => {
  if (!cashActionType.value || !selectedCashId.value) {
    return
  }

  isSubmittingAction.value = true
  cashMessage.value = ''

  try {
    const payload = buildCashActionPayload(cashActionType.value, cashActionForm.value)
    const updatedCash = cashActionType.value === 'abrir'
      ? await cashService.open(selectedCashId.value, payload)
      : await cashService.close(selectedCashId.value, payload)

    mergeCash(updatedCash)
    cashMessage.value = cashActionType.value === 'abrir'
      ? 'Caixa aberto com sucesso.'
      : 'Caixa fechado com sucesso.'
    resetActionForm()
    await loadData()
  } catch (error) {
    cashMessage.value = error instanceof Error
      ? error.message
      : cashActionType.value === 'abrir'
        ? 'Erro ao abrir caixa.'
        : 'Erro ao fechar caixa.'
  } finally {
    isSubmittingAction.value = false
  }
}

const removeCash = async (cash: CashResource): Promise<void> => {
  const confirmed = window.confirm(`Deseja realmente remover ${resolveCashName(cash)}?`)

  if (!confirmed) {
    return
  }

  try {
    await cashService.remove(cash.id)
    const cashId = normalizeId(cash.id)
    cashes.value = cashes.value.filter((item) => normalizeId(item.id) !== cashId)
    movements.value = movements.value.filter((movement) => resolveMovementCashId(movement) !== cashId)
    cashMessage.value = 'Caixa removido com sucesso.'
  } catch (error) {
    cashMessage.value = error instanceof Error ? error.message : 'Erro ao excluir caixa.'
  }
}

const removeMovement = async (movement: CashMovementResource): Promise<void> => {
  const confirmed = window.confirm('Deseja realmente remover esta movimentação?')

  if (!confirmed) {
    return
  }

  try {
    await cashService.removeMovement(movement.id)
    const movementId = normalizeId(movement.id)
    movements.value = movements.value.filter((item) => normalizeId(item.id) !== movementId)
    cashMessage.value = 'Movimentação removida com sucesso.'
    await refreshSelectedCash()
  } catch (error) {
    cashMessage.value = error instanceof Error ? error.message : 'Erro ao excluir movimentação.'
  }
}

onMounted(async () => {
  await loadData()
})
</script>

<template>
  <section class="cash-section">
    <header class="section-header">
      <div>
        <p class="eyebrow">Financeiro</p>
        <h2>Caixa</h2>
        <p class="section-subtitle">Gerencie caixas, abertura e fechamento, além das movimentações financeiras.</p>
      </div>

      <div class="header-actions">
        <button type="button" class="secondary-btn" @click="loadData" :disabled="isLoadingData">
          {{ isLoadingData ? 'Atualizando...' : 'Atualizar' }}
        </button>
        <button type="button" class="primary-btn" @click="openCreateCashModal">Novo caixa</button>
      </div>
    </header>

    <div v-if="cashMessage" class="feedback-banner">
      {{ cashMessage }}
    </div>

    <div class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">Caixas ativos</span>
        <strong>{{ openCashesCount }}</strong>
        <small>Quantidade de caixas com status aberto.</small>
      </article>

      <article class="summary-card">
        <span class="summary-label">Saldo consolidado</span>
        <strong>{{ formatCurrencyBRL(totalBalance) }}</strong>
        <small>Soma do saldo atual retornado pela API.</small>
      </article>

      <article class="summary-card highlight-card">
        <span class="summary-label">Impacto das movimentações</span>
        <strong>{{ formatCurrencyBRL(movementBalance) }}</strong>
        <small>Resultado líquido das movimentações do caixa selecionado.</small>
      </article>
    </div>

    <div class="toolbar">
      <label class="field search-field">
        <span>Buscar</span>
        <input v-model="cashFilters.search" type="search" placeholder="Nome, descrição ou observação" />
      </label>

      <label class="field status-field">
        <span>Status</span>
        <select v-model="cashFilters.status">
          <option value="todos">Todos</option>
          <option value="aberto">Abertos</option>
          <option value="fechado">Fechados</option>
        </select>
      </label>
    </div>

    <div class="content-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h3>Caixas cadastrados</h3>
            <p>{{ filteredCashes.length }} item(ns) encontrados</p>
          </div>
        </div>

        <div v-if="isLoadingData" class="empty-state">Carregando caixas...</div>

        <div v-else-if="!filteredCashes.length" class="empty-state">
          Nenhum caixa encontrado com os filtros atuais.
        </div>

        <div v-else class="cash-list">
          <article
            v-for="cash in filteredCashes"
            :key="cash.id"
            class="cash-card"
            :class="{ selected: selectedCashId === String(cash.id) }"
            @click="selectedCashId = String(cash.id)"
          >
            <div class="cash-card-top">
              <div>
                <h4>{{ resolveCashName(cash) }}</h4>
                <p>
                  {{ resolveCashDescription(cash) || 'Sem descrição informada.' }}
                  {{ resolveCashCode(cash) ? ` Código: ${resolveCashCode(cash)}.` : '' }}
                </p>
              </div>
              <span class="status-badge" :class="resolveCashStatus(cash)">
                {{ resolveCashStatus(cash) === 'aberto' ? 'Aberto' : 'Fechado' }}
              </span>
            </div>

            <div class="cash-metrics">
              <div>
                <span>Saldo inicial</span>
                <strong>{{ formatCurrencyBRL(resolveCashOpeningBalance(cash)) }}</strong>
              </div>
              <div>
                <span>Saldo atual</span>
                <strong>{{ formatCurrencyBRL(resolveCashCurrentBalance(cash)) }}</strong>
              </div>
              <div>
                <span>Entradas</span>
                <strong>{{ formatCurrencyBRL(resolveCashEntries(cash)) }}</strong>
              </div>
              <div>
                <span>Saídas</span>
                <strong>{{ formatCurrencyBRL(resolveCashExits(cash)) }}</strong>
              </div>
            </div>

            <div class="cash-dates">
              <span>Abertura: {{ formatDateTime(resolveCashOpenedAt(cash)) }}</span>
              <span>Fechamento: {{ resolveCashClosedAt(cash) ? formatDateTime(resolveCashClosedAt(cash)) : 'Em aberto' }}</span>
            </div>

            <div class="card-actions">
              <button type="button" class="ghost-btn" @click.stop="openEditCashModal(cash)">Editar</button>
              <button
                type="button"
                class="ghost-btn"
                @click.stop="openCashActionModal(resolveCashStatus(cash) === 'aberto' ? 'fechar' : 'abrir', cash)"
              >
                {{ resolveCashStatus(cash) === 'aberto' ? 'Fechar' : 'Abrir' }}
              </button>
              <button type="button" class="danger-btn" @click.stop="removeCash(cash)">Excluir</button>
            </div>
          </article>
        </div>
      </section>

      <section class="panel details-panel">
        <div v-if="selectedCash" class="details-shell">
          <div class="panel-header">
            <div>
              <h3>{{ resolveCashName(selectedCash) }}</h3>
              <p>{{ resolveCashDescription(selectedCash) || 'Detalhamento do caixa e das movimentações.' }}</p>
            </div>

            <div class="header-actions compact">
              <button type="button" class="secondary-btn" @click="openMovementCreateModal">Nova movimentação</button>
              <button
                type="button"
                class="primary-btn"
                @click="openCashActionModal(resolveCashStatus(selectedCash) === 'aberto' ? 'fechar' : 'abrir', selectedCash)"
              >
                {{ resolveCashStatus(selectedCash) === 'aberto' ? 'Fechar caixa' : 'Abrir caixa' }}
              </button>
            </div>
          </div>

          <div class="detail-cards">
            <article class="detail-card">
              <span>Código</span>
              <strong>{{ resolveCashCode(selectedCash) || 'Sem código' }}</strong>
            </article>
            <article class="detail-card">
              <span>Status</span>
              <strong>{{ resolveCashStatus(selectedCash) === 'aberto' ? 'Aberto' : 'Fechado' }}</strong>
            </article>
            <article class="detail-card">
              <span>Saldo inicial</span>
              <strong>{{ formatCurrencyBRL(resolveCashOpeningBalance(selectedCash)) }}</strong>
            </article>
            <article class="detail-card">
              <span>Saldo atual</span>
              <strong>{{ formatCurrencyBRL(resolveCashCurrentBalance(selectedCash)) }}</strong>
            </article>
            <article class="detail-card">
              <span>Atualizado em</span>
              <strong>{{ formatDateTime(selectedCash.updated_at ?? resolveCashOpenedAt(selectedCash)) }}</strong>
            </article>
          </div>

          <div class="movements-block">
            <div class="panel-header">
              <div>
                <h3>Movimentações</h3>
                <p>{{ selectedCashMovements.length }} registro(s) vinculados a este caixa.</p>
              </div>
            </div>

            <div v-if="!selectedCashMovements.length" class="empty-state compact">
              Nenhuma movimentação encontrada para este caixa.
            </div>

            <div v-else class="movement-list">
              <article v-for="movement in selectedCashMovements" :key="movement.id" class="movement-card">
                <div class="movement-main">
                  <div>
                    <span class="movement-type" :class="resolveMovementType(movement)">
                      {{ resolveMovementType(movement) }}
                    </span>
                    <h4>{{ resolveMovementDescription(movement) || 'Movimentação sem descrição' }}</h4>
                    <p>
                      {{ resolveMovementNote(movement) || 'Sem observação adicional.' }}
                      Origem: {{ resolveMovementOrigin(movement) }}.
                    </p>
                  </div>

                  <div class="movement-aside">
                    <strong>{{ formatCurrencyBRL(resolveMovementAmount(movement)) }}</strong>
                    <span>{{ formatDateTime(resolveMovementDate(movement)) }}</span>
                  </div>
                </div>

                <div class="card-actions inline-actions">
                  <button type="button" class="ghost-btn" @click="openMovementEditModal(movement)">Editar</button>
                  <button type="button" class="danger-btn" @click="removeMovement(movement)">Excluir</button>
                </div>
              </article>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          Selecione um caixa para visualizar saldo e movimentações.
        </div>
      </section>
    </div>

    <div v-if="showCashModal" class="modal-overlay" @click.self="showCashModal = false">
      <div class="modal-card">
        <div class="panel-header">
          <div>
            <h3>{{ isEditingCash ? 'Editar caixa' : 'Novo caixa' }}</h3>
            <p>Informe os dados principais para cadastro do caixa.</p>
          </div>
        </div>

        <form class="form-grid" @submit.prevent="submitCashForm">
          <label class="field full-width">
            <span>Nome</span>
            <input v-model="cashForm.name" type="text" required placeholder="Ex.: Caixa principal" />
          </label>

          <label class="field full-width">
            <span>Descrição</span>
            <textarea v-model="cashForm.description" rows="3" placeholder="Observações do caixa"></textarea>
          </label>

          <label class="field">
            <span>Saldo inicial</span>
            <input v-model.number="cashForm.openingBalance" type="number" min="0" step="0.01" required />
          </label>

          <div class="modal-actions full-width">
            <button type="button" class="ghost-btn" @click="showCashModal = false">Cancelar</button>
            <button type="submit" class="primary-btn" :disabled="isSubmittingCash">
              {{ isSubmittingCash ? 'Salvando...' : isEditingCash ? 'Atualizar caixa' : 'Cadastrar caixa' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showMovementModal" class="modal-overlay" @click.self="showMovementModal = false">
      <div class="modal-card">
        <div class="panel-header">
          <div>
            <h3>{{ isEditingMovement ? 'Editar movimentação' : 'Nova movimentação' }}</h3>
            <p>Registre entradas, saídas, sangrias ou ajustes do caixa.</p>
          </div>
        </div>

        <form class="form-grid" @submit.prevent="submitMovementForm">
          <label class="field">
            <span>Caixa</span>
            <select v-model="movementForm.cashId" required>
              <option disabled value="">Selecione</option>
              <option v-for="cash in cashes" :key="cash.id" :value="String(cash.id)">
                {{ resolveCashName(cash) }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Tipo</span>
            <select v-model="movementForm.type" required>
              <option v-for="option in MOVEMENT_TYPE_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Valor</span>
            <input v-model.number="movementForm.amount" type="number" min="0" step="0.01" required />
          </label>

          <label class="field">
            <span>Data/Hora</span>
            <input v-model="movementForm.occurredAt" type="datetime-local" />
          </label>

          <label class="field full-width">
            <span>Descrição</span>
            <input v-model="movementForm.description" type="text" placeholder="Resumo da movimentação" />
          </label>

          <label class="field full-width">
            <span>Observação</span>
            <textarea v-model="movementForm.note" rows="3" placeholder="Detalhes adicionais"></textarea>
          </label>

          <div class="modal-actions full-width">
            <button type="button" class="ghost-btn" @click="showMovementModal = false">Cancelar</button>
            <button type="submit" class="primary-btn" :disabled="isSubmittingMovement">
              {{ isSubmittingMovement ? 'Salvando...' : isEditingMovement ? 'Atualizar movimentação' : 'Registrar movimentação' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="cashActionType" class="modal-overlay" @click.self="resetActionForm()">
      <div class="modal-card small-modal">
        <div class="panel-header">
          <div>
            <h3>{{ cashActionType === 'abrir' ? 'Abrir caixa' : 'Fechar caixa' }}</h3>
            <p>Informe o valor de referência e, se necessário, uma observação.</p>
          </div>
        </div>

        <form class="form-grid" @submit.prevent="submitCashAction">
          <label class="field full-width">
            <span>{{ cashActionType === 'abrir' ? 'Saldo de abertura' : 'Saldo de fechamento' }}</span>
            <input v-model.number="cashActionForm.amount" type="number" min="0" step="0.01" required />
          </label>

          <label class="field full-width">
            <span>Observação</span>
            <textarea v-model="cashActionForm.note" rows="3" placeholder="Opcional"></textarea>
          </label>

          <div class="modal-actions full-width">
            <button type="button" class="ghost-btn" @click="resetActionForm()">Cancelar</button>
            <button type="submit" class="primary-btn" :disabled="isSubmittingAction">
              {{ isSubmittingAction ? 'Processando...' : cashActionType === 'abrir' ? 'Abrir caixa' : 'Fechar caixa' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cash-section {
  padding: 1.5rem;
  display: grid;
  gap: 1.25rem;
}

.section-header,
.panel-header,
.movement-main,
.card-actions,
.header-actions,
.modal-actions,
.cash-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.eyebrow {
  margin: 0 0 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.72rem;
  color: #6366f1;
  font-weight: 700;
}

.section-header h2,
.panel-header h3,
.cash-card h4,
.movement-card h4 {
  margin: 0;
}

.section-subtitle,
.panel-header p,
.cash-card p,
.movement-card p {
  margin: 0.35rem 0 0;
  color: #64748b;
}

.summary-grid,
.content-grid,
.detail-cards,
.cash-metrics,
.form-grid,
.toolbar {
  display: grid;
  gap: 1rem;
}

.summary-grid {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.summary-card,
.panel,
.detail-card,
.cash-card,
.movement-card,
.modal-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.06);
}

.summary-card,
.detail-card {
  padding: 1rem 1.1rem;
}

.summary-label,
.detail-card span,
.cash-metrics span,
.cash-dates span,
.movement-aside span,
.field span {
  display: block;
  font-size: 0.85rem;
  color: #64748b;
}

.summary-card strong,
.detail-card strong,
.movement-aside strong {
  display: block;
  margin-top: 0.45rem;
  font-size: 1.35rem;
  color: #0f172a;
}

.summary-card small {
  display: block;
  margin-top: 0.45rem;
  color: #64748b;
}

.highlight-card {
  background: linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%);
}

.toolbar {
  grid-template-columns: minmax(0, 1fr) 180px;
}

.content-grid {
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  align-items: start;
}

.panel,
.details-shell,
.movements-block,
.cash-list,
.movement-list {
  display: grid;
  gap: 1rem;
}

.panel {
  padding: 1.1rem;
  min-height: 0;
}

.content-grid > .panel {
  max-height: calc(100dvh - 19rem);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.content-grid > .panel::-webkit-scrollbar {
  width: 0.55rem;
}

.content-grid > .panel::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.content-grid > .panel::-webkit-scrollbar-track {
  background: transparent;
}

.cash-card,
.movement-card {
  padding: 1rem;
}

.cash-card {
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.cash-card:hover,
.cash-card.selected {
  border-color: #6366f1;
  transform: translateY(-1px);
  box-shadow: 0 24px 40px rgba(99, 102, 241, 0.14);
}

.status-badge,
.movement-type {
  border-radius: 999px;
  padding: 0.4rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: capitalize;
}

.status-badge.aberto,
.movement-type.entrada,
.movement-type.suprimento {
  background: #dcfce7;
  color: #166534;
}

.status-badge.fechado,
.movement-type.saida,
.movement-type.sangria {
  background: #fee2e2;
  color: #991b1b;
}

.movement-type.ajuste {
  background: #e0e7ff;
  color: #3730a3;
}

.cash-metrics {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 1rem;
}

.cash-metrics strong,
.cash-dates,
.empty-state,
.feedback-banner {
  color: #0f172a;
}

.cash-dates {
  display: grid;
  gap: 0.25rem;
  margin-top: 1rem;
}

.empty-state,
.feedback-banner {
  padding: 1rem 1.1rem;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
}

.feedback-banner {
  border-style: solid;
  background: #eef2ff;
  border-color: #c7d2fe;
}

.compact {
  align-items: center;
}

.inline-actions {
  justify-content: flex-end;
}

.field {
  display: grid;
  gap: 0.45rem;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  font: inherit;
  color: #0f172a;
  background: #fff;
}

.field textarea {
  resize: vertical;
}

.full-width {
  grid-column: 1 / -1;
}

.primary-btn,
.secondary-btn,
.ghost-btn,
.danger-btn {
  border: 0;
  border-radius: 12px;
  padding: 0.78rem 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.2s ease, opacity 0.2s ease;
}

.primary-btn {
  background: #4f46e5;
  color: #fff;
}

.secondary-btn {
  background: #e2e8f0;
  color: #0f172a;
}

.ghost-btn {
  background: #eef2ff;
  color: #3730a3;
}

.danger-btn {
  background: #fee2e2;
  color: #b91c1c;
}

.primary-btn:disabled,
.secondary-btn:disabled,
.ghost-btn:disabled,
.danger-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: grid;
  place-items: center;
  padding: 1rem;
  z-index: 30;
}

.modal-card {
  width: min(680px, 100%);
  padding: 1.25rem;
}

.small-modal {
  width: min(480px, 100%);
}

.form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 1rem;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .content-grid > .panel {
    max-height: none;
    overflow: visible;
  }
}

@media (max-width: 768px) {
  .cash-section {
    padding: 1rem;
  }

  .section-header,
  .panel-header,
  .movement-main,
  .card-actions,
  .header-actions,
  .modal-actions,
  .cash-card-top {
    flex-direction: column;
  }

  .toolbar,
  .form-grid,
  .cash-metrics,
  .detail-cards {
    grid-template-columns: 1fr;
  }

  .header-actions,
  .modal-actions {
    width: 100%;
  }

  .header-actions > button,
  .modal-actions > button,
  .card-actions > button {
    width: 100%;
  }
}
</style>
