<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { customersService, orderServicesService, productsService, servicesService, usersService } from '@/services'
import type {
  CustomerResource,
  EmployeeResource,
  OrderPaymentInstallmentResource,
  OrderPaymentMethod,
  OrderPaymentPayload,
  OrderPaymentResource,
  OrderPaymentStatus,
  OrderProductItemResource,
  OrderServicePayload,
  OrderServiceItemResource,
  OrderServiceResource,
  OrderServiceStatus,
  ProductResource,
  ServiceResource,
} from '@/types/backoffice'
import { formatCurrencyBRL } from '@/utils'

type OrderStatusFilter = 'todos' | OrderServiceStatus
type OrderItemType = 'service' | 'product'

interface OrderLineItemForm {
  id: string
  quantity: number
  unit_price: number
}

interface OrderPaymentForm {
  id: string
  method: OrderPaymentMethod
  amount: number
  installments: number
  isPersisted: boolean
  status?: string
  payment_date?: string | null
  installment_items?: OrderPaymentInstallmentResource[]
  note?: string
}

interface OrderFormState {
  customer_id?: string | number
  employee_id?: string | number
  services: OrderLineItemForm[]
  products: OrderLineItemForm[]
  payments: OrderPaymentForm[]
  opening_date: string
  closing_date?: string
  note?: string
}

interface OrderLineItemView {
  id: string
  name: string
  description?: string
  quantity: number
  unit_price: number
  subtotal: number
  meta?: string
}

interface OrderStatusOption {
  value: OrderServiceStatus
  label: string
  badgeLabel: string
  helper: string
  icon: string
  badgeClass: string
  cardClass: string
  surfaceClass: string
}

interface PaymentMethodOption {
  value: OrderPaymentMethod
  label: string
}

interface RemovalConfirmationState {
  visible: boolean
  target: 'payment' | 'installment' | null
  paymentId?: string
  installmentId?: string | number
}

const ORDER_STATUS_OPTIONS: OrderStatusOption[] = [
  {
    value: 'aberta',
    label: 'Aberta',
    badgeLabel: 'Aberta',
    helper: 'Aguardando inicio',
    icon: '○',
    badgeClass: 'status-open',
    cardClass: 'status-chip-open',
    surfaceClass: 'order-card-open',
  },
  {
    value: 'em_andamento',
    label: 'Em andamento',
    badgeLabel: 'Em andamento',
    helper: 'Servico em execucao',
    icon: '◔',
    badgeClass: 'status-progress',
    cardClass: 'status-chip-progress',
    surfaceClass: 'order-card-progress',
  },
  {
    value: 'concluida',
    label: 'Concluida',
    badgeLabel: 'Concluida',
    helper: 'Finalizada com sucesso',
    icon: '✓',
    badgeClass: 'status-done',
    cardClass: 'status-chip-done',
    surfaceClass: 'order-card-done',
  },
  {
    value: 'cancelada',
    label: 'Cancelada',
    badgeLabel: 'Cancelada',
    helper: 'Encerrada sem execucao',
    icon: '✕',
    badgeClass: 'status-cancelled',
    cardClass: 'status-chip-cancelled',
    surfaceClass: 'order-card-cancelled',
  },
]

const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { value: 'credito', label: 'Crédito' },
  { value: 'debito', label: 'Débito' },
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'promissoria', label: 'Promissória' },
]

const createDefaultOpeningDate = (): string => {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

const emptyOrderForm = (): OrderFormState => ({
  customer_id: undefined,
  employee_id: undefined,
  services: [],
  products: [],
  payments: [],
  opening_date: createDefaultOpeningDate(),
  closing_date: undefined,
  note: undefined,
})

const normalizeId = (value: string | number | undefined): string => String(value ?? '')

const createLineItem = (id: string | number, unitPrice: number): OrderLineItemForm => ({
  id: normalizeId(id),
  quantity: 1,
  unit_price: unitPrice,
})

const createPaymentItem = (): OrderPaymentForm => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  method: 'pix',
  amount: 0,
  installments: 1,
  isPersisted: false,
  note: undefined,
})

const normalizeDateValue = (value?: string): string | undefined => {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return undefined
  }

  return trimmed.slice(0, 10)
}

const formatDate = (value?: string): string => {
  if (!value) {
    return 'Data indisponivel'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(parsed)
}

const getCustomerName = (customer?: CustomerResource): string => {
  return customer?.person?.name?.trim() || 'Cliente nao informado'
}

const getEmployeeName = (employee?: EmployeeResource): string => {
  return employee?.person?.name?.trim() || 'Responsavel nao informado'
}

const mapServiceItemResource = (item: OrderServiceItemResource): OrderLineItemForm | null => {
  const serviceId = item.service_id ?? item.service?.id

  if (serviceId === undefined || serviceId === null) {
    return null
  }

  return {
    id: normalizeId(serviceId),
    quantity: Math.max(1, Number(item.quantity ?? 1)),
    unit_price: Math.max(0, Number(item.unit_price ?? item.service?.price ?? 0)),
  }
}

const mapProductItemResource = (item: OrderProductItemResource): OrderLineItemForm | null => {
  const productId = item.product_id ?? item.product?.id

  if (productId === undefined || productId === null) {
    return null
  }

  return {
    id: normalizeId(productId),
    quantity: Math.max(1, Number(item.quantity ?? 1)),
    unit_price: Math.max(0, Number(item.unit_price ?? item.product?.amount ?? 0)),
  }
}

const mapPaymentResource = (payment: OrderPaymentResource): OrderPaymentForm | null => {
  const method = payment.payment_method ?? payment.method

  if (!method) {
    return null
  }

  const amount = Number(payment.value ?? payment.amount ?? 0)
  const installments = Math.max(1, Math.floor(Number(payment.installments ?? 1)))

  return {
    id: normalizeId(payment.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    method,
    amount: Math.max(0, amount),
    installments,
    isPersisted: true,
    status: payment.status,
    payment_date: payment.payment_date ?? payment.paid_at ?? null,
    installment_items: payment.installment_items,
    note: payment.note ?? undefined,
  }
}

const mapOrderToForm = (order: OrderServiceResource): OrderFormState => ({
  customer_id: order.customer?.id,
  employee_id: order.employee?.id,
  services: order.service_items?.length
    ? order.service_items.map(mapServiceItemResource).filter((item): item is OrderLineItemForm => item !== null)
    : (order.services ?? []).map((service) => createLineItem(service.id, Number(service.price ?? 0))),
  products: order.product_items?.length
    ? order.product_items.map(mapProductItemResource).filter((item): item is OrderLineItemForm => item !== null)
    : (order.products ?? []).map((product) => createLineItem(product.id, Number(product.amount ?? 0))),
  payments: order.payments?.length
    ? order.payments.map(mapPaymentResource).filter((item): item is OrderPaymentForm => item !== null)
    : [],
  opening_date: normalizeDateValue(order.opening_date) ?? createDefaultOpeningDate(),
  closing_date: normalizeDateValue(order.closing_date),
  note: order.note ?? undefined,
})

const isLoadingOrders = ref(false)
const isLoadingDependencies = ref(false)
const submitOrderLoading = ref(false)
const submitPaymentsLoading = ref(false)
const orderMessage = ref('')
const showOrderModal = ref(false)
const showFilters = ref(false)
const editingOrderId = ref<string | number | null>(null)
const statusUpdateOrderId = ref<string | number | null>(null)
const orders = ref<OrderServiceResource[]>([])
const customers = ref<CustomerResource[]>([])
const employees = ref<EmployeeResource[]>([])
const services = ref<ServiceResource[]>([])
const products = ref<ProductResource[]>([])

const orderFilters = ref<{ search: string; status: OrderStatusFilter }>({
  search: '',
  status: 'todos',
})

const productSelectionSearch = ref('')
const serviceSelectionSearch = ref('')
const orderForm = ref<OrderFormState>(emptyOrderForm())
const selectedPaymentIds = ref<string[]>([])
const removalConfirmation = ref<RemovalConfirmationState>({
  visible: false,
  target: null,
})

const isEditingOrder = computed(() => editingOrderId.value !== null)
const hasSelectedPersistedPayments = computed(() => selectedPaymentIds.value.length > 0)

const selectedServiceIds = computed(() => new Set(orderForm.value.services.map((item) => item.id)))
const selectedProductIds = computed(() => new Set(orderForm.value.products.map((item) => item.id)))

const filteredAvailableServices = computed(() => {
  const search = serviceSelectionSearch.value.trim().toLowerCase()

  return services.value.filter((service) => {
    const name = service.name?.toLowerCase() ?? ''
    const description = service.description?.toLowerCase() ?? ''
    return !search || name.includes(search) || description.includes(search)
  })
})

const filteredAvailableProducts = computed(() => {
  const search = productSelectionSearch.value.trim().toLowerCase()

  return products.value.filter((product) => {
    const name = product.name?.toLowerCase() ?? ''
    const description = product.description?.toLowerCase() ?? ''
    const stock = String(product.stock ?? '')
    return !search || name.includes(search) || description.includes(search) || stock.includes(search)
  })
})

const selectedServiceItems = computed<OrderLineItemView[]>(() => {
  return orderForm.value.services.map((item) => {
    const resource = services.value.find((service) => normalizeId(service.id) === item.id)
    const subtotal = item.quantity * item.unit_price

    return {
      id: item.id,
      name: resource?.name ?? `Servico ${item.id}`,
      description: resource?.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal,
      meta: resource?.duration_minutes ? `${resource.duration_minutes} min` : undefined,
    }
  })
})

const selectedProductItems = computed<OrderLineItemView[]>(() => {
  return orderForm.value.products.map((item) => {
    const resource = products.value.find((product) => normalizeId(product.id) === item.id)
    const subtotal = item.quantity * item.unit_price

    return {
      id: item.id,
      name: resource?.name ?? `Produto ${item.id}`,
      description: resource?.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal,
      meta: resource ? `Estoque: ${resource.stock}` : undefined,
    }
  })
})

const calculatedTotal = computed(() => {
  const serviceTotal = selectedServiceItems.value.reduce((sum, item) => sum + item.subtotal, 0)
  const productTotal = selectedProductItems.value.reduce((sum, item) => sum + item.subtotal, 0)
  return serviceTotal + productTotal
})

const paymentsTotal = computed(() => {
  return orderForm.value.payments.reduce((sum, payment) => sum + Math.max(0, Number(payment.amount || 0)), 0)
})

const paymentBalance = computed(() => {
  return Math.max(0, calculatedTotal.value - paymentsTotal.value)
})

const getStatusOption = (status: OrderServiceStatus): OrderStatusOption => {
  const matchedOption = ORDER_STATUS_OPTIONS.find((option) => option.value === status)

  if (matchedOption) {
    return matchedOption
  }

  return {
    value: 'aberta',
    label: 'Aberta',
    badgeLabel: 'Aberta',
    helper: 'Aguardando inicio',
    icon: '○',
    badgeClass: 'status-open',
    cardClass: 'status-chip-open',
    surfaceClass: 'order-card-open',
  }
}

const orderStats = computed(() => {
  const openCount = orders.value.filter((order) => order.status === 'aberta').length
  const inProgressCount = orders.value.filter((order) => order.status === 'em_andamento').length
  const completedCount = orders.value.filter((order) => order.status === 'concluida').length
  const cancelledCount = orders.value.filter((order) => order.status === 'cancelada').length
  const totalAmount = orders.value.reduce((sum, order) => sum + Number(order.total_value ?? 0), 0)

  return {
    openCount,
    inProgressCount,
    completedCount,
    cancelledCount,
    totalAmount,
  }
})

const filteredOrders = computed(() => {
  const search = orderFilters.value.search.trim().toLowerCase()
  const status = orderFilters.value.status

  return orders.value.filter((order) => {
    const customerName = getCustomerName(order.customer).toLowerCase()
    const employeeName = getEmployeeName(order.employee).toLowerCase()
    const orderNumber = order.number?.toLowerCase() ?? ''
    const note = order.note?.toLowerCase() ?? ''
    const orderStatus = order.status

    const searchMatch = !search
      || orderNumber.includes(search)
      || customerName.includes(search)
      || employeeName.includes(search)
      || note.includes(search)

    const statusMatch = status === 'todos' || status === orderStatus

    return searchMatch && statusMatch
  })
})

const loadOrders = async (): Promise<void> => {
  isLoadingOrders.value = true

  try {
    orders.value = await orderServicesService.list()
  } finally {
    isLoadingOrders.value = false
  }
}

const loadDependencies = async (): Promise<void> => {
  isLoadingDependencies.value = true

  try {
    const [customersResponse, employeesResponse, servicesResponse, productsResponse] = await Promise.all([
      customersService.list(),
      usersService.list(),
      servicesService.list(),
      productsService.list(),
    ])

    customers.value = customersResponse
    employees.value = employeesResponse
    services.value = servicesResponse
    products.value = productsResponse
  } finally {
    isLoadingDependencies.value = false
  }
}

const resetOrderModalState = (): void => {
  editingOrderId.value = null
  selectedPaymentIds.value = []
  orderMessage.value = ''
  serviceSelectionSearch.value = ''
  productSelectionSearch.value = ''
  orderForm.value = emptyOrderForm()
}

const updateOrderStatus = async (order: OrderServiceResource, status: OrderServiceStatus): Promise<void> => {
  if (order.status === status || statusUpdateOrderId.value === order.id) {
    return
  }

  statusUpdateOrderId.value = order.id
  orderMessage.value = ''

  try {
    const updatedOrder = await orderServicesService.updateStatus(order.id, status)
    orders.value = orders.value.map((entry) => (entry.id === order.id ? updatedOrder : entry))
    orderMessage.value = 'Status da ordem atualizado com sucesso.'
  } catch (error) {
    orderMessage.value = error instanceof Error ? error.message : 'Erro ao atualizar status da ordem.'
  } finally {
    statusUpdateOrderId.value = null
  }
}

const getFormItems = (type: OrderItemType): OrderLineItemForm[] => {
  return type === 'service' ? orderForm.value.services : orderForm.value.products
}

const addService = (service: ServiceResource): void => {
  const serviceId = normalizeId(service.id)

  if (selectedServiceIds.value.has(serviceId)) {
    return
  }

  orderForm.value.services = [...orderForm.value.services, createLineItem(service.id, Number(service.price ?? 0))]
}

const addProduct = (product: ProductResource): void => {
  const productId = normalizeId(product.id)

  if (selectedProductIds.value.has(productId)) {
    return
  }

  orderForm.value.products = [...orderForm.value.products, createLineItem(product.id, Number(product.amount ?? 0))]
}

const removeItem = (type: OrderItemType, itemId: string): void => {
  const items = getFormItems(type).filter((item) => item.id !== itemId)

  if (type === 'service') {
    orderForm.value.services = items
    return
  }

  orderForm.value.products = items
}

const updateItemQuantity = (type: OrderItemType, itemId: string, quantity: number): void => {
  const safeQuantity = Math.max(1, Math.floor(Number(quantity) || 1))
  const items = getFormItems(type).map((item) => {
    if (item.id !== itemId) {
      return item
    }

    return {
      ...item,
      quantity: safeQuantity,
    }
  })

  if (type === 'service') {
    orderForm.value.services = items
    return
  }

  orderForm.value.products = items
}

const updateItemPrice = (type: OrderItemType, itemId: string, value: number): void => {
  const safePrice = Math.max(0, Number(value) || 0)
  const items = getFormItems(type).map((item) => {
    if (item.id !== itemId) {
      return item
    }

    return {
      ...item,
      unit_price: safePrice,
    }
  })

  if (type === 'service') {
    orderForm.value.services = items
    return
  }

  orderForm.value.products = items
}

const addPayment = (): void => {
  orderForm.value.payments = [...orderForm.value.payments, createPaymentItem()]
}

const isPaidStatus = (status?: string | null): boolean => {
  return String(status ?? '').trim().toLowerCase() === 'pago'
}

const isPaymentLocked = (payment: OrderPaymentForm): boolean => {
  return payment.isPersisted && isPaidStatus(payment.status) && Boolean(payment.payment_date)
}

const isInstallmentLocked = (installment?: OrderPaymentInstallmentResource): boolean => {
  return isPaidStatus(installment?.status) && Boolean(installment?.payment_date)
}

const reloadEditingOrder = async (): Promise<void> => {
  if (editingOrderId.value === null) {
    return
  }

  const detailedOrder = await orderServicesService.show(editingOrderId.value)
  orderForm.value = mapOrderToForm(detailedOrder)
  selectedPaymentIds.value = []
}

const openRemovalConfirmation = (state: Omit<RemovalConfirmationState, 'visible'>): void => {
  removalConfirmation.value = {
    visible: true,
    ...state,
  }
}

const closeRemovalConfirmation = (message?: string): void => {
  removalConfirmation.value = {
    visible: false,
    target: null,
  }

  if (message) {
    orderMessage.value = message
  }
}

const requestRemovePayment = (paymentId: string): void => {
  const targetPayment = orderForm.value.payments.find((payment) => payment.id === paymentId)

  if (!targetPayment) {
    return
  }

  if (isPaymentLocked(targetPayment)) {
    orderMessage.value = 'Pagamento efetivado nao pode ser removido.'
    return
  }

  openRemovalConfirmation({
    target: 'payment',
    paymentId,
  })
}

const requestRemoveInstallment = (paymentId: string, installmentId?: string | number): void => {
  const payment = orderForm.value.payments.find((entry) => entry.id === paymentId)

  if (payment && isPaymentLocked(payment)) {
    orderMessage.value = 'Pagamento efetivado nao permite remover parcelas.'
    return
  }

  if (!installmentId) {
    orderMessage.value = 'Parcela sem identificador para remover.'
    return
  }

  const targetInstallment = payment?.installment_items?.find((entry) => String(entry.id) === String(installmentId))
  if (isInstallmentLocked(targetInstallment)) {
    orderMessage.value = 'Parcela efetivada nao pode ser removida.'
    return
  }

  openRemovalConfirmation({
    target: 'installment',
    paymentId,
    installmentId,
  })
}

const confirmRemoval = async (): Promise<void> => {
  const { target, paymentId, installmentId } = removalConfirmation.value

  if (!target || !paymentId) {
    closeRemovalConfirmation()
    return
  }

  closeRemovalConfirmation()

  if (target === 'payment') {
    await removePayment(paymentId)
    return
  }

  await removeInstallment(paymentId, installmentId)
}

const removePayment = async (paymentId: string): Promise<void> => {
  const targetPayment = orderForm.value.payments.find((payment) => payment.id === paymentId)

  if (!targetPayment) {
    return
  }

  if (!targetPayment.isPersisted) {
    orderForm.value.payments = orderForm.value.payments.filter((payment) => payment.id !== paymentId)
    selectedPaymentIds.value = selectedPaymentIds.value.filter((id) => id !== paymentId)
    return
  }

  if (isPaymentLocked(targetPayment)) {
    orderMessage.value = 'Pagamento efetivado nao pode ser removido.'
    return
  }

  submitPaymentsLoading.value = true
  orderMessage.value = ''

  try {
    await orderServicesService.removePayment(paymentId)
    await reloadEditingOrder()
    orderMessage.value = 'Pagamento removido com sucesso.'
  } catch (error) {
    orderMessage.value = error instanceof Error ? error.message : 'Erro ao remover pagamento.'
  } finally {
    submitPaymentsLoading.value = false
  }
}

const togglePaymentSelection = (paymentId: string, checked: boolean): void => {
  if (checked) {
    selectedPaymentIds.value = [...new Set([...selectedPaymentIds.value, paymentId])]
    return
  }

  selectedPaymentIds.value = selectedPaymentIds.value.filter((id) => id !== paymentId)
}

const updatePaymentMethod = (paymentId: string, method: OrderPaymentMethod): void => {
  orderForm.value.payments = orderForm.value.payments.map((payment) => {
    if (payment.id !== paymentId) {
      return payment
    }

    if (isPaymentLocked(payment)) {
      return payment
    }

    return {
      ...payment,
      method,
    }
  })
}

const updatePaymentAmount = (paymentId: string, amount: number): void => {
  const safeAmount = Math.max(0, Number(amount) || 0)

  orderForm.value.payments = orderForm.value.payments.map((payment) => {
    if (payment.id !== paymentId) {
      return payment
    }

    if (isPaymentLocked(payment)) {
      return payment
    }

    return {
      ...payment,
      amount: safeAmount,
    }
  })
}

const updatePaymentInstallments = (paymentId: string, installments: number): void => {
  const safeInstallments = Math.max(1, Math.floor(Number(installments) || 1))

  orderForm.value.payments = orderForm.value.payments.map((payment) => {
    if (payment.id !== paymentId) {
      return payment
    }

    if (isPaymentLocked(payment)) {
      return payment
    }

    return {
      ...payment,
      installments: safeInstallments,
    }
  })
}

const updatePaymentNote = (paymentId: string, note: string): void => {
  orderForm.value.payments = orderForm.value.payments.map((payment) => {
    if (payment.id !== paymentId) {
      return payment
    }

    if (isPaymentLocked(payment)) {
      return payment
    }

    return {
      ...payment,
      note: note.trim() || undefined,
    }
  })
}

const updateInstallmentField = (
  paymentId: string,
  installmentId: string | number,
  field: 'value' | 'due_date' | 'status',
  rawValue: string,
): void => {
  orderForm.value.payments = orderForm.value.payments.map((payment) => {
    if (payment.id !== paymentId) {
      return payment
    }

    if (isPaymentLocked(payment)) {
      return payment
    }

    const updatedInstallments = payment.installment_items?.map((installment) => {
      if (String(installment.id) !== String(installmentId)) {
        return installment
      }

      if (isInstallmentLocked(installment)) {
        return installment
      }

      if (field === 'value') {
        return {
          ...installment,
          value: Math.max(0, Number(rawValue) || 0),
        }
      }

      return {
        ...installment,
        [field]: rawValue,
      }
    })

    return {
      ...payment,
      installment_items: updatedInstallments,
    }
  })
}

const updateInstallment = async (paymentId: string, installment: OrderPaymentInstallmentResource): Promise<void> => {
  const payment = orderForm.value.payments.find((entry) => entry.id === paymentId)

  if (payment && isPaymentLocked(payment)) {
    orderMessage.value = 'Pagamento efetivado nao permite alteracoes nas parcelas.'
    return
  }

  if (isInstallmentLocked(installment)) {
    orderMessage.value = 'Parcela efetivada nao pode ser alterada.'
    return
  }

  if (!installment.id) {
    orderMessage.value = 'Parcela sem identificador para atualizar.'
    return
  }

  submitPaymentsLoading.value = true
  orderMessage.value = ''

  try {
    await orderServicesService.updatePaymentInstallment(paymentId, installment.id, {
      value: installment.value,
      due_date: installment.due_date,
      status: installment.status,
      payment_date: installment.payment_date,
    })
    await reloadEditingOrder()
    orderMessage.value = 'Parcela atualizada com sucesso.'
  } catch (error) {
    orderMessage.value = error instanceof Error ? error.message : 'Erro ao atualizar parcela.'
  } finally {
    submitPaymentsLoading.value = false
  }
}

const removeInstallment = async (paymentId: string, installmentId?: string | number): Promise<void> => {
  const payment = orderForm.value.payments.find((entry) => entry.id === paymentId)

  if (payment && isPaymentLocked(payment)) {
    orderMessage.value = 'Pagamento efetivado nao permite remover parcelas.'
    return
  }

  if (!installmentId) {
    orderMessage.value = 'Parcela sem identificador para remover.'
    return
  }

  const targetInstallment = payment?.installment_items?.find((entry) => String(entry.id) === String(installmentId))
  if (isInstallmentLocked(targetInstallment)) {
    orderMessage.value = 'Parcela efetivada nao pode ser removida.'
    return
  }

  submitPaymentsLoading.value = true
  orderMessage.value = ''

  try {
    await orderServicesService.removePaymentInstallment(paymentId, installmentId)
    await reloadEditingOrder()
    orderMessage.value = 'Parcela removida com sucesso.'
  } catch (error) {
    orderMessage.value = error instanceof Error ? error.message : 'Erro ao remover parcela.'
  } finally {
    submitPaymentsLoading.value = false
  }
}

const sanitizePayments = (options?: {
  onlyNew?: boolean
  onlyPersisted?: boolean
  onlySelected?: boolean
  forceStatus?: OrderPaymentStatus
  forcePaymentDate?: string | null
}): OrderPaymentPayload[] => {
  const onlyNew = options?.onlyNew ?? false
  const onlyPersisted = options?.onlyPersisted ?? false
  const onlySelected = options?.onlySelected ?? false

  return orderForm.value.payments
    .filter((payment) => payment.amount > 0)
    .filter((payment) => (onlyNew ? !payment.isPersisted : true))
    .filter((payment) => (onlyPersisted ? payment.isPersisted : true))
    .filter((payment) => (onlySelected ? selectedPaymentIds.value.includes(payment.id) : true))
    .map((payment) => {
      const safeAmount = Number(payment.amount || 0)
      const safeInstallments = Math.max(1, Math.floor(Number(payment.installments) || 1))
      const paymentType = safeInstallments > 1 ? 'parcelado' : 'avista'

      return {
        id: payment.isPersisted ? payment.id : undefined,
        payment_method: payment.method,
        value: safeAmount,
        type: paymentType,
        installments: safeInstallments,
        entry_value: null,
        status: options?.forceStatus ?? payment.status,
        payment_date: options?.forcePaymentDate ?? payment.payment_date ?? null,
        installment_amount: safeInstallments > 0 ? Number((safeAmount / safeInstallments).toFixed(2)) : safeAmount,
        note: payment.note?.trim() || undefined,
      }
    })
}

const validatePaymentsForInsert = (): string | null => {
  if (editingOrderId.value === null) {
    return 'Salve a ordem antes de inserir recebimentos.'
  }

  const hasInvalidPayment = orderForm.value.payments
    .filter((payment) => !payment.isPersisted)
    .some((payment) => payment.amount <= 0 || payment.installments < 1)
  if (hasInvalidPayment) {
    return 'Revise os pagamentos antes de inserir.'
  }

  const payments = sanitizePayments({ onlyNew: true })
  if (!payments.length) {
    return 'Adicione pelo menos um pagamento com valor maior que zero.'
  }

  if (paymentsTotal.value > calculatedTotal.value + 0.01) {
    return 'O total de recebimentos nao pode ser maior que o total da ordem.'
  }

  return null
}

const insertPayments = async (): Promise<void> => {
  orderMessage.value = ''

  const validationError = validatePaymentsForInsert()
  if (validationError) {
    orderMessage.value = validationError
    return
  }

  if (editingOrderId.value === null) {
    return
  }

  submitPaymentsLoading.value = true

  try {
    await orderServicesService.receivePayments(editingOrderId.value, sanitizePayments({ onlyNew: true }))
    await Promise.all([loadOrders(), reloadEditingOrder()])
    selectedPaymentIds.value = []
    orderMessage.value = 'Recebimentos inseridos com sucesso.'
  } catch (error) {
    orderMessage.value = error instanceof Error ? error.message : 'Erro ao inserir recebimentos.'
  } finally {
    submitPaymentsLoading.value = false
  }
}

const applyPaymentUpdates = async (payload: OrderPaymentPayload[], successMessage: string): Promise<void> => {
  if (!payload.length) {
    orderMessage.value = 'Nao ha pagamentos validos para atualizar.'
    return
  }

  submitPaymentsLoading.value = true

  try {
    await Promise.all(
      payload
        .filter((payment) => payment.id)
        .map((payment) => orderServicesService.updatePayment(payment.id!, payment)),
    )

    await reloadEditingOrder()
    selectedPaymentIds.value = []
    orderMessage.value = successMessage
  } catch (error) {
    orderMessage.value = error instanceof Error ? error.message : 'Erro ao atualizar pagamentos.'
  } finally {
    submitPaymentsLoading.value = false
  }
}

const updatePersistedPayments = async (): Promise<void> => {
  orderMessage.value = ''

  if (editingOrderId.value === null) {
    orderMessage.value = 'Salve a ordem antes de atualizar recebimentos.'
    return
  }

  const payload = sanitizePayments({ onlyPersisted: true })
  await applyPaymentUpdates(payload, 'Pagamentos atualizados com sucesso.')
}

const settleSelectedPayments = async (): Promise<void> => {
  orderMessage.value = ''

  if (editingOrderId.value === null) {
    orderMessage.value = 'Salve a ordem antes de efetivar recebimentos.'
    return
  }

  if (!hasSelectedPersistedPayments.value) {
    orderMessage.value = 'Selecione ao menos um pagamento para efetivar.'
    return
  }

  const payload = sanitizePayments({
    onlyPersisted: true,
    onlySelected: true,
    forceStatus: 'pago',
    forcePaymentDate: new Date().toISOString().slice(0, 10),
  })

  await applyPaymentUpdates(payload, 'Pagamentos selecionados efetivados com sucesso.')
}

const sanitizePayload = (): OrderServicePayload => {
  const serviceItems = orderForm.value.services.map((item) => ({
    service_id: item.id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.quantity * item.unit_price,
  }))

  const productItems = orderForm.value.products.map((item) => ({
    product_id: item.id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.quantity * item.unit_price,
  }))

  const payload: OrderServicePayload = {
    customer_id: orderForm.value.customer_id,
    employee_id: orderForm.value.employee_id,
    service_items: serviceItems,
    product_items: productItems,
    total_value: calculatedTotal.value,
    opening_date: normalizeDateValue(orderForm.value.opening_date) ?? '',
    closing_date: normalizeDateValue(orderForm.value.closing_date),
    note: orderForm.value.note?.trim() || undefined,
  }

  if (!payload.customer_id) {
    delete payload.customer_id
  }

  if (!payload.employee_id) {
    delete payload.employee_id
  }

  if (!payload.closing_date) {
    delete payload.closing_date
  }

  return payload
}

const validateForm = (): string | null => {
  if (!orderForm.value.customer_id) {
    return 'Selecione um cliente para a ordem de servico.'
  }

  if (!orderForm.value.opening_date) {
    return 'Informe a data de abertura.'
  }

  if (!orderForm.value.services.length && !orderForm.value.products.length) {
    return 'Adicione pelo menos um servico ou produto.'
  }

  const invalidService = orderForm.value.services.some((item) => item.quantity <= 0 || item.unit_price < 0)
  if (invalidService) {
    return 'Revise quantidade e valor dos servicos selecionados.'
  }

  const invalidProduct = orderForm.value.products.some((item) => item.quantity <= 0 || item.unit_price < 0)
  if (invalidProduct) {
    return 'Revise quantidade e valor dos produtos selecionados.'
  }

  const invalidPayment = orderForm.value.payments
    .filter((payment) => !payment.isPersisted)
    .some((payment) => payment.amount <= 0 || payment.installments < 1)
  if (invalidPayment) {
    return 'Revise os pagamentos: valor deve ser maior que zero e parcelas no minimo 1.'
  }

  if (paymentsTotal.value > calculatedTotal.value + 0.01) {
    return 'O total de recebimentos nao pode ser maior que o total da ordem.'
  }

  const stockViolation = orderForm.value.products.find((item) => {
    const product = products.value.find((entry) => normalizeId(entry.id) === item.id)
    return product && item.quantity > Number(product.stock ?? 0)
  })

  if (stockViolation) {
    const product = products.value.find((entry) => normalizeId(entry.id) === stockViolation.id)
    return `A quantidade do produto ${product?.name ?? stockViolation.id} excede o estoque disponivel.`
  }

  return null
}

const submitOrder = async (): Promise<void> => {
  orderMessage.value = ''

  const validationError = validateForm()

  if (validationError) {
    orderMessage.value = validationError
    return
  }

  submitOrderLoading.value = true

  try {
    const payload = sanitizePayload()

    if (editingOrderId.value !== null) {
      await orderServicesService.update(editingOrderId.value, payload)
      orderMessage.value = 'Ordem de servico atualizada com sucesso.'
    }

    if (editingOrderId.value === null) {
      await orderServicesService.create(payload)
      orderMessage.value = 'Ordem de servico cadastrada com sucesso.'
    }

    await loadOrders()
    showOrderModal.value = false
    resetOrderModalState()
  } catch (error) {
    orderMessage.value = error instanceof Error
      ? error.message
      : editingOrderId.value !== null
        ? 'Erro ao atualizar ordem de servico.'
        : 'Erro ao cadastrar ordem de servico.'
  } finally {
    submitOrderLoading.value = false
  }
}

const openOrderModal = async (): Promise<void> => {
  resetOrderModalState()

  if (!customers.value.length && !employees.value.length && !services.value.length && !products.value.length) {
    await loadDependencies()
  }

  showOrderModal.value = true
}

const openEditOrderModal = async (order: OrderServiceResource): Promise<void> => {
  editingOrderId.value = order.id
  selectedPaymentIds.value = []
  orderMessage.value = ''
  serviceSelectionSearch.value = ''
  productSelectionSearch.value = ''

  try {
    const detailedOrder = await orderServicesService.show(order.id)
    orderForm.value = mapOrderToForm(detailedOrder)
  } catch {
    orderForm.value = mapOrderToForm(order)
  }

  showOrderModal.value = true
}

const closeOrderModal = (): void => {
  showOrderModal.value = false
  resetOrderModalState()
}

const toggleFilters = (): void => {
  showFilters.value = !showFilters.value
}

const deleteOrder = async (orderId: string | number): Promise<void> => {
  if (!confirm('Tem certeza que deseja excluir esta ordem de servico?')) {
    return
  }

  try {
    await orderServicesService.remove(orderId)
    showOrderModal.value = false
    resetOrderModalState()
    await loadOrders()
  } catch (error) {
    orderMessage.value = error instanceof Error ? error.message : 'Erro ao excluir ordem de servico.'
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadOrders(), loadDependencies()])
  } catch (error) {
    orderMessage.value = error instanceof Error ? error.message : 'Erro ao carregar ordens de servico.'
  }
})
</script>

<template>
  <section class="content-section">
    <article class="panel">
      <header class="section-actions">
        <div>
          <h3>Ordens de Servico</h3>
          <span>{{ filteredOrders.length }} resultados • {{ orders.length }} total</span>
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
          <button
            type="button"
            class="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500"
            @click="openOrderModal"
          >
            + Nova OS
          </button>
        </div>
      </header>

      <section class="summary-grid">
        <article class="summary-card summary-card-open">
          <span>Abertas</span>
          <strong>{{ orderStats.openCount }}</strong>
        </article>
        <article class="summary-card summary-card-progress">
          <span>Em andamento</span>
          <strong>{{ orderStats.inProgressCount }}</strong>
        </article>
        <article class="summary-card summary-card-done">
          <span>Concluidas</span>
          <strong>{{ orderStats.completedCount }}</strong>
        </article>
        <article class="summary-card summary-card-cancelled">
          <span>Canceladas</span>
          <strong>{{ orderStats.cancelledCount }}</strong>
        </article>
        <article class="summary-card summary-card-total">
          <span>Valor total</span>
          <strong>{{ formatCurrencyBRL(orderStats.totalAmount) }}</strong>
        </article>
      </section>

      <transition name="filters-collapse">
        <div v-if="showFilters" class="filter-panel">
          <div class="filter-bar filter-bar-orders">
            <input
              v-model="orderFilters.search"
              type="text"
              placeholder="Pesquisar numero, cliente, responsavel ou observacao"
            />

            <select v-model="orderFilters.status">
              <option value="todos">Todos os status</option>
              <option value="aberta">Abertas</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluida">Concluidas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>
        </div>
      </transition>

      <p v-if="orderMessage && !showOrderModal" class="muted text-red-500">{{ orderMessage }}</p>
      <p v-if="isLoadingOrders" class="muted">Carregando ordens de servico...</p>

      <div v-if="!isLoadingOrders" class="order-cards">
        <article
          v-for="order in filteredOrders"
          :key="order.id"
          :class="['order-card', getStatusOption(order.status).surfaceClass, 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md']"
          @click="openEditOrderModal(order)"
        >
          <div class="order-card-head">
            <div>
              <strong>{{ order.number || `OS ${order.id}` }}</strong>
              <p>{{ getCustomerName(order.customer) }}</p>
            </div>
            <span :class="['status-badge', getStatusOption(order.status).badgeClass]">
              {{ getStatusOption(order.status).badgeLabel }}
            </span>
          </div>

          <div class="order-meta-grid">
            <div>
              <span class="meta-label">Responsavel</span>
              <p>{{ getEmployeeName(order.employee) }}</p>
            </div>
            <div>
              <span class="meta-label">Abertura</span>
              <p>{{ formatDate(order.opening_date) }}</p>
            </div>
            <div>
              <span class="meta-label">Fechamento</span>
              <p>{{ formatDate(order.closing_date) }}</p>
            </div>
            <div>
              <span class="meta-label">Total</span>
              <p class="value-highlight">{{ formatCurrencyBRL(order.total_value) }}</p>
            </div>
          </div>

          <div class="selection-summary">
            <span>{{ order.services.length }} servico(s)</span>
            <span>{{ order.products.length }} produto(s)</span>
          </div>

          <div class="status-field" @click.stop>
            <span class="meta-label">Alterar status</span>
            <div class="status-actions">
              <button
                v-for="option in ORDER_STATUS_OPTIONS"
                :key="option.value"
                type="button"
                :disabled="statusUpdateOrderId === order.id"
                :class="[
                  'status-chip',
                  option.cardClass,
                  order.status === option.value ? 'status-chip-active' : '',
                ]"
                @click.stop="updateOrderStatus(order, option.value)"
              >
                <span class="status-chip-main">
                  <span class="status-chip-icon" aria-hidden="true">{{ option.icon }}</span>
                  <span class="status-chip-label">{{ option.label }}</span>
                </span>
                <small class="status-chip-helper">{{ option.helper }}</small>
              </button>
            </div>
            <span v-if="statusUpdateOrderId === order.id" class="status-feedback">Atualizando status...</span>
          </div>

          <p class="note-preview">{{ order.note || 'Sem observacoes registradas.' }}</p>
        </article>
      </div>

      <p v-if="!isLoadingOrders && filteredOrders.length === 0" class="muted">
        Nenhuma ordem de servico encontrada para os filtros informados.
      </p>
    </article>

    <div
      v-if="showOrderModal"
      class="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/55 p-4 md:p-6"
      @click.self="closeOrderModal"
    >
      <article class="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 md:px-7 md:py-5">
          <div>
            <h3 class="text-lg font-bold text-slate-900">{{ isEditingOrder ? 'Editar Ordem de Servico' : 'Nova Ordem de Servico' }}</h3>
            <p class="mt-1 text-sm text-slate-500">
              {{ isEditingOrder ? 'Atualize itens, quantidades e valores da ordem.' : 'Monte a ordem com itens editaveis, quantidade e valor unitario.' }}
            </p>
          </div>
          <button
            type="button"
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-lg text-slate-500 transition hover:bg-slate-50"
            @click="closeOrderModal"
          >
            &times;
          </button>
        </header>

        <div class="flex-1 overflow-y-auto bg-slate-50/70 px-5 py-5 md:px-7 md:py-6">
          <form id="order-form" class="space-y-5" @submit.prevent="submitOrder">
            <section class="grid gap-5 xl:grid-cols-[minmax(0,1.8fr),minmax(320px,0.9fr)]">
              <div class="space-y-5">
                <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                  <div class="mb-4 flex items-center gap-3">
                    <span class="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Dados da Ordem</span>
                    <div class="h-px flex-1 bg-slate-200"></div>
                  </div>

                  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-medium text-slate-600">
                        Cliente <span class="text-red-400">*</span>
                      </label>
                      <select
                        v-model="orderForm.customer_id"
                        class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      >
                        <option :value="undefined">Selecione um cliente</option>
                        <option v-for="customer in customers" :key="customer.id" :value="customer.id">
                          {{ customer.person.name }}
                        </option>
                      </select>
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-medium text-slate-600">Responsavel</label>
                      <select
                        v-model="orderForm.employee_id"
                        class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      >
                        <option :value="undefined">Selecione um responsavel</option>
                        <option v-for="employee in employees" :key="employee.id" :value="employee.id">
                          {{ employee.person.name }}
                        </option>
                      </select>
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-medium text-slate-600">
                        Data de abertura <span class="text-red-400">*</span>
                      </label>
                      <input
                        v-model="orderForm.opening_date"
                        type="date"
                        class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      />
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-medium text-slate-600">Data de fechamento</label>
                      <input
                        v-model="orderForm.closing_date"
                        type="date"
                        class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  <div class="mt-4 flex flex-col gap-1.5">
                    <label class="text-xs font-medium text-slate-600">Observacoes</label>
                    <textarea
                      v-model="orderForm.note"
                      rows="4"
                      placeholder="Descreva defeito, escopo do atendimento ou combinados com o cliente"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    ></textarea>
                  </div>
                </article>

                <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                  <div class="picker-header">
                    <div>
                      <span class="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Servicos</span>
                      <p class="picker-helper">Adicione e ajuste quantidade ou valor unitario.</p>
                    </div>
                    <input
                      v-model="serviceSelectionSearch"
                      type="text"
                      placeholder="Buscar servico"
                      class="picker-search"
                    />
                  </div>

                  <div v-if="isLoadingDependencies" class="muted">Carregando servicos...</div>
                  <div v-else class="picker-grid">
                    <button
                      v-for="service in filteredAvailableServices"
                      :key="service.id"
                      type="button"
                      :disabled="selectedServiceIds.has(normalizeId(service.id))"
                      class="picker-tile"
                      @click="addService(service)"
                    >
                      <strong>{{ service.name }}</strong>
                      <p>{{ service.description || 'Sem descricao cadastrada.' }}</p>
                      <span>{{ formatCurrencyBRL(service.price) }}</span>
                      <small>{{ service.duration_minutes ? `${service.duration_minutes} min` : 'Sem duracao informada' }}</small>
                    </button>
                  </div>

                  <div class="selected-section">
                    <div class="selected-header">
                      <span class="meta-label">Servicos selecionados</span>
                      <strong>{{ selectedServiceItems.length }}</strong>
                    </div>

                    <div v-if="selectedServiceItems.length" class="line-items">
                      <article v-for="item in selectedServiceItems" :key="item.id" class="line-item-card">
                        <div class="line-item-main">
                          <div>
                            <strong>{{ item.name }}</strong>
                            <p>{{ item.description || 'Sem descricao cadastrada.' }}</p>
                            <small>{{ item.meta || 'Sem detalhes adicionais' }}</small>
                          </div>
                          <button type="button" class="remove-button" @click="removeItem('service', item.id)">
                            Remover
                          </button>
                        </div>

                        <div class="line-item-fields">
                          <label>
                            <span>Qtd.</span>
                            <input
                              :value="item.quantity"
                              type="number"
                              min="1"
                              @input="updateItemQuantity('service', item.id, Number(($event.target as HTMLInputElement).value))"
                            />
                          </label>
                          <label>
                            <span>Valor unitario</span>
                            <input
                              :value="item.unit_price"
                              type="number"
                              min="0"
                              step="0.01"
                              @input="updateItemPrice('service', item.id, Number(($event.target as HTMLInputElement).value))"
                            />
                          </label>
                          <div class="subtotal-box">
                            <span>Subtotal</span>
                            <strong>{{ formatCurrencyBRL(item.subtotal) }}</strong>
                          </div>
                        </div>
                      </article>
                    </div>
                    <p v-else class="muted">Nenhum servico adicionado.</p>
                  </div>
                </article>

                <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                  <div class="picker-header">
                    <div>
                      <span class="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Produtos</span>
                      <p class="picker-helper">Busque, adicione e ajuste quantidade ou valor unitario.</p>
                    </div>
                    <input
                      v-model="productSelectionSearch"
                      type="text"
                      placeholder="Buscar produto por nome, descricao ou estoque"
                      class="picker-search"
                    />
                  </div>

                  <div v-if="isLoadingDependencies" class="muted">Carregando produtos...</div>
                  <div v-else class="picker-grid">
                    <button
                      v-for="product in filteredAvailableProducts"
                      :key="product.id"
                      type="button"
                      :disabled="selectedProductIds.has(normalizeId(product.id))"
                      class="picker-tile"
                      @click="addProduct(product)"
                    >
                      <strong>{{ product.name }}</strong>
                      <p>{{ product.description || 'Sem descricao cadastrada.' }}</p>
                      <span>{{ formatCurrencyBRL(product.amount) }}</span>
                      <small>Estoque: {{ product.stock }}</small>
                    </button>
                  </div>

                  <div class="selected-section">
                    <div class="selected-header">
                      <span class="meta-label">Produtos selecionados</span>
                      <strong>{{ selectedProductItems.length }}</strong>
                    </div>

                    <div v-if="selectedProductItems.length" class="line-items">
                      <article v-for="item in selectedProductItems" :key="item.id" class="line-item-card">
                        <div class="line-item-main">
                          <div>
                            <strong>{{ item.name }}</strong>
                            <p>{{ item.description || 'Sem descricao cadastrada.' }}</p>
                            <small>{{ item.meta || 'Sem detalhes adicionais' }}</small>
                          </div>
                          <button type="button" class="remove-button" @click="removeItem('product', item.id)">
                            Remover
                          </button>
                        </div>

                        <div class="line-item-fields">
                          <label>
                            <span>Qtd.</span>
                            <input
                              :value="item.quantity"
                              type="number"
                              min="1"
                              @input="updateItemQuantity('product', item.id, Number(($event.target as HTMLInputElement).value))"
                            />
                          </label>
                          <label>
                            <span>Valor unitario</span>
                            <input
                              :value="item.unit_price"
                              type="number"
                              min="0"
                              step="0.01"
                              @input="updateItemPrice('product', item.id, Number(($event.target as HTMLInputElement).value))"
                            />
                          </label>
                          <div class="subtotal-box">
                            <span>Subtotal</span>
                            <strong>{{ formatCurrencyBRL(item.subtotal) }}</strong>
                          </div>
                        </div>
                      </article>
                    </div>
                    <p v-else class="muted">Nenhum produto adicionado.</p>
                  </div>
                </article>
              </div>

              <aside class="space-y-5">
                <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                  <div class="mb-4 flex items-center gap-3">
                    <span class="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Resumo Financeiro</span>
                    <div class="h-px flex-1 bg-slate-200"></div>
                  </div>

                  <div class="summary-stack">
                    <div>
                      <span class="meta-label">Servicos selecionados</span>
                      <strong>{{ selectedServiceItems.length }}</strong>
                    </div>
                    <div>
                      <span class="meta-label">Produtos selecionados</span>
                      <strong>{{ selectedProductItems.length }}</strong>
                    </div>
                    <div>
                      <span class="meta-label">Itens totais</span>
                      <strong>{{ selectedServiceItems.length + selectedProductItems.length }}</strong>
                    </div>
                    <div>
                      <span class="meta-label">Total previsto</span>
                      <strong class="value-highlight">{{ formatCurrencyBRL(calculatedTotal) }}</strong>
                    </div>
                    <div>
                      <span class="meta-label">Total recebido</span>
                      <strong>{{ formatCurrencyBRL(paymentsTotal) }}</strong>
                    </div>
                    <div>
                      <span class="meta-label">Saldo pendente</span>
                      <strong :class="paymentBalance === 0 ? 'text-emerald-600' : 'text-amber-600'">
                        {{ formatCurrencyBRL(paymentBalance) }}
                      </strong>
                    </div>
                  </div>
                </article>

                <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                  <div class="mb-4 flex items-center gap-3">
                    <span class="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Recebimentos</span>
                    <div class="h-px flex-1 bg-slate-200"></div>
                  </div>

                  <div class="space-y-3">
                    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        class="w-full rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
                        @click="addPayment"
                      >
                        + Adicionar pagamento
                      </button>

                      <button
                        type="button"
                        :disabled="!isEditingOrder || submitPaymentsLoading"
                        class="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                        @click="insertPayments"
                      >
                        {{ submitPaymentsLoading ? 'Inserindo...' : 'Inserir recebimentos' }}
                      </button>
                    </div>

                    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        :disabled="!isEditingOrder || submitPaymentsLoading || !hasSelectedPersistedPayments"
                        class="w-full rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        @click="settleSelectedPayments"
                      >
                        {{ submitPaymentsLoading ? 'Processando...' : 'Efetivar selecionados' }}
                      </button>

                      <button
                        type="button"
                        :disabled="!isEditingOrder || submitPaymentsLoading"
                        class="w-full rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                        @click="updatePersistedPayments"
                      >
                        {{ submitPaymentsLoading ? 'Processando...' : 'Atualizar pagamentos' }}
                      </button>
                    </div>

                    <p v-if="!isEditingOrder" class="text-xs text-slate-500">
                      Salve a ordem primeiro para inserir recebimentos.
                    </p>

                    <div v-if="orderForm.payments.length" class="space-y-3">
                      <article
                        v-for="payment in orderForm.payments"
                        :key="payment.id"
                        class="rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <label v-if="payment.isPersisted" class="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600">
                          <input
                            type="checkbox"
                            :disabled="isPaymentLocked(payment)"
                            :checked="selectedPaymentIds.includes(payment.id)"
                            @change="togglePaymentSelection(payment.id, ($event.target as HTMLInputElement).checked)"
                          />
                          Selecionar para efetivar
                        </label>

                        <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
                          <label class="flex flex-col gap-1">
                            <span class="text-xs font-medium text-slate-600">Forma de pagamento</span>
                            <select
                              :value="payment.method"
                              :disabled="isPaymentLocked(payment)"
                              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                              @change="updatePaymentMethod(payment.id, ($event.target as HTMLSelectElement).value as OrderPaymentMethod)"
                            >
                              <option v-for="option in PAYMENT_METHOD_OPTIONS" :key="option.value" :value="option.value">
                                {{ option.label }}
                              </option>
                            </select>
                          </label>

                          <label class="flex flex-col gap-1">
                            <span class="text-xs font-medium text-slate-600">Valor</span>
                            <input
                              :value="payment.amount"
                              type="number"
                              min="0"
                              step="0.01"
                              :disabled="isPaymentLocked(payment)"
                              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                              @input="updatePaymentAmount(payment.id, Number(($event.target as HTMLInputElement).value))"
                            />
                          </label>

                          <label class="flex flex-col gap-1">
                            <span class="text-xs font-medium text-slate-600">Parcelas</span>
                            <input
                              :value="payment.installments"
                              type="number"
                              min="1"
                              step="1"
                              :disabled="isPaymentLocked(payment)"
                              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                              @input="updatePaymentInstallments(payment.id, Number(($event.target as HTMLInputElement).value))"
                            />
                          </label>

                          <div class="rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <span class="text-xs font-medium text-slate-600">Valor por parcela</span>
                            <p class="mt-1 text-sm font-semibold text-slate-800">
                              {{ formatCurrencyBRL(payment.amount / Math.max(1, payment.installments)) }}
                            </p>
                          </div>
                        </div>

                        <label class="mt-2 flex flex-col gap-1">
                          <span class="text-xs font-medium text-slate-600">Observacao (opcional)</span>
                          <input
                            :value="payment.note"
                            type="text"
                            :disabled="isPaymentLocked(payment)"
                            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                            placeholder="Ex.: 3x no credito"
                            @input="updatePaymentNote(payment.id, ($event.target as HTMLInputElement).value)"
                          />
                        </label>

                        <div class="mt-3 flex items-center justify-between">
                          <small class="text-slate-500">{{ payment.installments }}x</small>
                          <button
                            type="button"
                            :disabled="isPaymentLocked(payment)"
                            class="text-sm font-semibold text-red-500 transition hover:text-red-600"
                            @click="requestRemovePayment(payment.id)"
                          >
                            Remover
                          </button>
                        </div>

                        <div class="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                          <div class="rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <span class="text-xs font-medium text-slate-600">Status</span>
                            <p class="mt-1 text-sm font-semibold text-slate-800">{{ payment.status || 'Nao informado' }}</p>
                          </div>
                          <div class="rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <span class="text-xs font-medium text-slate-600">Data de pagamento</span>
                            <p class="mt-1 text-sm font-semibold text-slate-800">{{ formatDate(payment.payment_date ?? undefined) }}</p>
                          </div>
                        </div>

                        <div v-if="payment.installment_items?.length" class="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                          <span class="text-xs font-medium uppercase tracking-[0.08em] text-slate-600">Parcelas</span>
                          <ul class="mt-2 space-y-2">
                            <li
                              v-for="installment in payment.installment_items"
                              :key="installment.id ?? `${payment.id}-${installment.installment_number}`"
                              class="rounded-md border border-slate-100 bg-slate-50 px-2 py-2 text-xs"
                            >
                              <div class="mb-2 flex items-center justify-between gap-2">
                                <strong class="text-slate-700">{{ installment.installment_number }}ª parcela</strong>
                                <span class="text-slate-500">ID: {{ installment.id ?? '-' }}</span>
                              </div>

                              <div class="grid grid-cols-1 gap-2 md:grid-cols-3">
                                <label class="flex flex-col gap-1">
                                  <span class="text-slate-500">Valor</span>
                                  <input
                                    :value="installment.value"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    :disabled="isPaymentLocked(payment) || isInstallmentLocked(installment)"
                                    class="rounded border border-slate-200 bg-white px-2 py-1"
                                    @input="updateInstallmentField(payment.id, installment.id!, 'value', ($event.target as HTMLInputElement).value)"
                                  />
                                </label>

                                <label class="flex flex-col gap-1">
                                  <span class="text-slate-500">Vencimento</span>
                                  <input
                                    :value="installment.due_date"
                                    type="date"
                                    :disabled="isPaymentLocked(payment) || isInstallmentLocked(installment)"
                                    class="rounded border border-slate-200 bg-white px-2 py-1"
                                    @input="updateInstallmentField(payment.id, installment.id!, 'due_date', ($event.target as HTMLInputElement).value)"
                                  />
                                </label>

                                <label class="flex flex-col gap-1">
                                  <span class="text-slate-500">Status</span>
                                  <select
                                    :value="installment.status || 'pendente'"
                                    :disabled="isPaymentLocked(payment) || isInstallmentLocked(installment)"
                                    class="rounded border border-slate-200 bg-white px-2 py-1"
                                    @change="updateInstallmentField(payment.id, installment.id!, 'status', ($event.target as HTMLSelectElement).value)"
                                  >
                                    <option value="pendente">Pendente</option>
                                    <option value="pago">Pago</option>
                                    <option value="cancelado">Cancelado</option>
                                  </select>
                                </label>
                              </div>

                              <div class="mt-2 flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  :disabled="submitPaymentsLoading || isPaymentLocked(payment) || isInstallmentLocked(installment)"
                                  class="rounded border border-indigo-300 px-2 py-1 font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  @click="updateInstallment(payment.id, installment)"
                                >
                                  Atualizar parcela
                                </button>
                                <button
                                  type="button"
                                  :disabled="submitPaymentsLoading || isPaymentLocked(payment) || isInstallmentLocked(installment)"
                                  class="rounded border border-red-300 px-2 py-1 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  @click="requestRemoveInstallment(payment.id, installment.id)"
                                >
                                  Remover parcela
                                </button>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </article>
                    </div>

                    <p v-else class="muted">Nenhum pagamento adicionado.</p>
                  </div>
                </article>

                <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                  <div class="mb-4 flex items-center gap-3">
                    <span class="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Fechamento da Ordem</span>
                    <div class="h-px flex-1 bg-slate-200"></div>
                  </div>

                  <div class="space-y-4">
                    <div>
                      <span class="meta-label">Servicos</span>
                      <ul v-if="selectedServiceItems.length" class="preview-list">
                        <li v-for="item in selectedServiceItems" :key="item.id">
                          <div>
                            <span>{{ item.name }}</span>
                            <small>{{ item.quantity }} x {{ formatCurrencyBRL(item.unit_price) }}</small>
                          </div>
                          <strong>{{ formatCurrencyBRL(item.subtotal) }}</strong>
                        </li>
                      </ul>
                      <p v-else class="muted">Nenhum servico selecionado.</p>
                    </div>

                    <div>
                      <span class="meta-label">Produtos</span>
                      <ul v-if="selectedProductItems.length" class="preview-list">
                        <li v-for="item in selectedProductItems" :key="item.id">
                          <div>
                            <span>{{ item.name }}</span>
                            <small>{{ item.quantity }} x {{ formatCurrencyBRL(item.unit_price) }}</small>
                          </div>
                          <strong>{{ formatCurrencyBRL(item.subtotal) }}</strong>
                        </li>
                      </ul>
                      <p v-else class="muted">Nenhum produto selecionado.</p>
                    </div>
                  </div>
                </article>
              </aside>
            </section>
          </form>
        </div>

        <footer class="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7">
          <p
            v-if="orderMessage"
            :class="['text-sm font-semibold', orderMessage.includes('sucesso') ? 'text-emerald-600' : 'text-red-500']"
          >
            {{ orderMessage }}
          </p>
          <span v-else class="hidden md:block"></span>

          <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              @click="closeOrderModal"
            >
              Cancelar
            </button>
            <button
              form="order-form"
              type="submit"
              :disabled="submitOrderLoading"
              class="flex min-w-160px items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span
                v-if="submitOrderLoading"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              ></span>
              {{ submitOrderLoading ? 'Salvando...' : isEditingOrder ? 'Salvar Alteracoes' : 'Salvar Ordem' }}
            </button>
            <button
              v-if="isEditingOrder"
              type="button"
              class="flex min-w-160px items-center justify-center gap-2 rounded-xl border border-red-500 bg-white px-5 py-3 text-sm font-bold text-red-500 transition hover:bg-red-50"
              @click="deleteOrder(editingOrderId!)"
            >
              Excluir
            </button>
          </div>
        </footer>
      </article>
    </div>

    <div
      v-if="removalConfirmation.visible"
      class="fixed inset-0 z-70 flex items-center justify-center bg-slate-900/55 p-4"
      @click.self="closeRemovalConfirmation('Remocao cancelada.')"
    >
      <article class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <h4 class="text-base font-bold text-slate-900">Confirmar remocao</h4>
        <p class="mt-2 text-sm text-slate-600">
          {{ removalConfirmation.target === 'payment' ? 'Deseja remover este pagamento?' : 'Deseja remover esta parcela?' }}
        </p>

        <div class="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            @click="closeRemovalConfirmation('Remocao cancelada.')"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
            @click="confirmRemoval"
          >
            Confirmar
          </button>
        </div>
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.summary-card {
  border-radius: 14px;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  display: grid;
  gap: 0.35rem;
}

.summary-card span {
  color: #475569;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.summary-card strong {
  font-size: 1.5rem;
  color: #0f172a;
}

.summary-card-open {
  background: linear-gradient(135deg, #eff6ff, #f8fafc);
}

.summary-card-progress {
  background: linear-gradient(135deg, #fff7ed, #fffbeb);
}

.summary-card-done {
  background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
}

.summary-card-cancelled {
  background: linear-gradient(135deg, #fef2f2, #fff7f7);
}

.summary-card-total {
  background: linear-gradient(135deg, #eef2ff, #f8fafc);
}

.filter-panel {
  margin-bottom: 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  padding: 0.85rem;
}

.filter-bar {
  display: grid;
  gap: 0.65rem;
}

.filter-bar-orders {
  grid-template-columns: minmax(0, 2fr) minmax(180px, 220px);
}

.filter-bar input,
.filter-bar select {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.62rem 0.72rem;
  font: inherit;
  background: #fff;
}

.order-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.order-card {
  --order-card-border: #e2e8f0;
  --order-card-surface: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  --order-card-accent: linear-gradient(90deg, rgba(148, 163, 184, 0.22), rgba(148, 163, 184, 0.02));
  --order-card-shadow: 0 16px 28px rgba(15, 23, 42, 0.06);
  background: var(--order-card-surface);
  border: 1px solid var(--order-card-border);
  border-radius: 14px;
  padding: 1rem;
  display: grid;
  gap: 0.85rem;
  position: relative;
  overflow: hidden;
  box-shadow: var(--order-card-shadow);
}

.order-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: var(--order-card-accent);
}

.order-card-open {
  --order-card-border: #bfdbfe;
  --order-card-surface: linear-gradient(180deg, #ffffff 0%, #f4f9ff 100%);
  --order-card-accent: linear-gradient(90deg, rgba(59, 130, 246, 0.72), rgba(191, 219, 254, 0.18));
}

.order-card-progress {
  --order-card-border: #fed7aa;
  --order-card-surface: linear-gradient(180deg, #ffffff 0%, #fffaf2 100%);
  --order-card-accent: linear-gradient(90deg, rgba(249, 115, 22, 0.72), rgba(254, 215, 170, 0.18));
}

.order-card-done {
  --order-card-border: #bbf7d0;
  --order-card-surface: linear-gradient(180deg, #ffffff 0%, #f3fff7 100%);
  --order-card-accent: linear-gradient(90deg, rgba(34, 197, 94, 0.72), rgba(187, 247, 208, 0.18));
}

.order-card-cancelled {
  --order-card-border: #fecaca;
  --order-card-surface: linear-gradient(180deg, #ffffff 0%, #fff6f6 100%);
  --order-card-accent: linear-gradient(90deg, rgba(239, 68, 68, 0.7), rgba(254, 202, 202, 0.18));
}

.order-card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.order-card-head strong {
  display: block;
  color: #0f172a;
}

.order-card-head p,
.order-meta-grid p,
.note-preview {
  margin: 0;
  color: #475569;
}

.order-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.meta-label {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  margin-bottom: 0.2rem;
}

.status-badge {
  border-radius: 999px;
  padding: 0.35rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.status-open {
  background: #dcfce7;
  color: #166534;
}

.status-progress {
  background: #ffedd5;
  color: #9a3412;
}

.status-done {
  background: #dcfce7;
  color: #166534;
}

.status-cancelled {
  background: #fee2e2;
  color: #b91c1c;
}

.selection-summary {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.selection-summary span {
  border-radius: 999px;
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.2rem 0.6rem;
  font-size: 0.74rem;
  font-weight: 600;
}

.status-field {
  display: grid;
  gap: 0.55rem;
}

.status-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

.status-chip {
  display: grid;
  gap: 0.18rem;
  text-align: left;
  border-radius: 14px;
  border: 1px solid transparent;
  padding: 0.8rem 0.9rem;
  background: #f8fafc;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, opacity 0.18s ease;
}

.status-chip:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

.status-chip:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.status-chip-active {
  border-color: currentColor;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9), 0 10px 22px rgba(15, 23, 42, 0.08);
}

.status-chip-label {
  font-size: 0.86rem;
  font-weight: 700;
}

.status-chip-main {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.status-chip-icon {
  display: inline-grid;
  place-items: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.58);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.65);
  font-size: 0.76rem;
  font-weight: 800;
  line-height: 1;
}

.status-chip-helper {
  font-size: 0.72rem;
  line-height: 1.35;
  opacity: 0.9;
}

.status-chip-open {
  background: linear-gradient(135deg, #eff6ff, #f8fbff);
  color: #1d4ed8;
}

.status-chip-progress {
  background: linear-gradient(135deg, #fff7ed, #fffbeb);
  color: #c2410c;
}

.status-chip-done {
  background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
  color: #15803d;
}

.status-chip-cancelled {
  background: linear-gradient(135deg, #fef2f2, #fff7f7);
  color: #dc2626;
}

.status-feedback {
  font-size: 0.76rem;
  color: #64748b;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.picker-helper {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.84rem;
}

.picker-search {
  width: min(320px, 100%);
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #fff;
  padding: 0.72rem 0.8rem;
  font: inherit;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.picker-tile {
  text-align: left;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.9rem;
  background: linear-gradient(180deg, #fff, #f8fafc);
  display: grid;
  gap: 0.35rem;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.picker-tile:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #a5b4fc;
  box-shadow: 0 10px 24px rgba(99, 102, 241, 0.08);
}

.picker-tile:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.picker-tile strong {
  color: #0f172a;
}

.picker-tile p,
.picker-tile small {
  margin: 0;
  color: #64748b;
}

.picker-tile span {
  color: #3730a3;
  font-weight: 700;
}

.selected-section {
  margin-top: 1rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.selected-header strong,
.summary-stack strong {
  color: #0f172a;
  font-size: 1.2rem;
}

.line-items {
  display: grid;
  gap: 0.85rem;
}

.line-item-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 0.95rem;
  background: #f8fafc;
  display: grid;
  gap: 0.9rem;
}

.line-item-main {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.line-item-main p,
.line-item-main small {
  margin: 0.2rem 0 0;
  color: #64748b;
}

.remove-button {
  border: 1px solid #fecaca;
  background: #fff;
  color: #dc2626;
  border-radius: 10px;
  padding: 0.55rem 0.8rem;
  font-weight: 600;
  height: fit-content;
}

.line-item-fields {
  display: grid;
  grid-template-columns: minmax(100px, 120px) minmax(160px, 1fr) minmax(140px, 180px);
  gap: 0.75rem;
  align-items: end;
}

.line-item-fields label {
  display: grid;
  gap: 0.35rem;
}

.line-item-fields span,
.subtotal-box span,
.preview-list small {
  font-size: 0.78rem;
  color: #64748b;
}

.line-item-fields input {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #fff;
  padding: 0.72rem 0.8rem;
  font: inherit;
}

.subtotal-box {
  border: 1px solid #dbeafe;
  border-radius: 12px;
  padding: 0.72rem 0.8rem;
  background: #eff6ff;
}

.subtotal-box strong {
  display: block;
  margin-top: 0.25rem;
  color: #1d4ed8;
}

.summary-stack {
  display: grid;
  gap: 1rem;
}

.preview-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
  display: grid;
  gap: 0.65rem;
}

.preview-list li {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.65rem;
}

.preview-list li:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.preview-list span,
.preview-list strong {
  display: block;
}

.value-highlight {
  color: #1d4ed8;
  font-weight: 700;
}

.note-preview {
  font-size: 0.86rem;
  line-height: 1.45;
}

.muted {
  color: #6b7280;
  font-size: 0.84rem;
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

@media (max-width: 1180px) {
  .summary-grid,
  .order-cards,
  .picker-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .line-item-fields {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .content-section {
    padding-bottom: 5.8rem;
  }

  .section-actions,
  .order-card-head,
  .picker-header,
  .line-item-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-grid,
  .order-cards,
  .picker-grid,
  .order-meta-grid,
  .filter-bar-orders,
  .status-actions {
    grid-template-columns: 1fr;
  }

  .picker-search {
    width: 100%;
  }
}
</style>