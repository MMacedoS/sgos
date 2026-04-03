export interface PersonPayload {
  name: string
  cpf_cnpj: string
  birth_date?: string
  gender?: 'M' | 'F' | 'O'
  phone?: string
  email?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zip_code?: string
}

export interface PersonResource {
  id: number
  name: string
  document: string
  birth_date?: string
  gender?: string
  phone?: string
  email?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zip_code?: string
}

export interface CustomerResource {
  id: string
  uuid: number
  person_id: number
  person: PersonResource
  created_at: string
  updated_at: string
}

export interface EmployeeResource {
  id: string
  uuid: number
  person_id: number
  person: PersonResource
  created_at: string
  updated_at: string
}

export interface CustomerResource {
  id: string
  uuid: number
  person_id: number
  person: PersonResource
  created_at: string
  updated_at: string
}

export interface ApiResourceResponse<T> {
  success: boolean
  data: T
  message: string
}

export interface ServiceResource {
  id: string
  name: string
  description?: string
  price: number
  duration_minutes?: number
  created_at: string
  updated_at: string
}

export interface ServiceResponse<T> {
  success: boolean
  data: T
  message: string
}

export interface ServicePayload {
  name: string
  description?: string
  amount: number
  duration_minutes?: number
}

export interface ProductResource {
  id: string
  name: string
  description?: string
  amount: number
  stock: number
  stockHistory?: ProductStockHistoryResource[]
  created_at: string
  updated_at: string
}

export interface ProductStockHistoryResource {
  id: string | number
  type?: string
  movement_type?: string
  quantity?: number
  previousStock?: number
  previous_stock?: number
  currentStock?: number
  current_stock?: number
  note?: string
  description?: string
  createdAt?: string
  created_at?: string
}

export interface ProductPayload {
  name: string
  description?: string
  amount: number
  stock: number
}

export interface ProductResponse<T> {
  success: boolean
  data: T
  message: string
}

export type OrderServiceStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada'
export type OrderPaymentMethod = 'credito' | 'debito' | 'pix' | 'dinheiro' | 'promissoria'
export type OrderPaymentType = 'avista' | 'a_vista' | 'parcelado'
export type OrderPaymentStatus = 'pendente' | 'pago' | 'cancelado'

export interface OrderPaymentInstallmentResource {
  id?: string | number
  installment_number: number
  value: number
  due_date?: string
  payment_date?: string | null
  status?: string
}

export interface OrderServiceResource {
  id: string
  number: string
  customer?: CustomerResource
  employee?: EmployeeResource
  services: ServiceResource[]
  products: ProductResource[]
  service_items?: OrderServiceItemResource[]
  product_items?: OrderProductItemResource[]
  payments?: OrderPaymentResource[]
  total_value: number
  amount?: number
  discount?: number
  discount_percentage?: number
  amount_paid?: number
  amount_due?: number
  opening_date: string
  closing_date?: string
  status: OrderServiceStatus
  note?: string
  created_at: string
  updated_at: string
}

export interface OrderServiceResponse<T> {
  success: boolean
  data: T
  message: string
}

export interface OrderServiceItemResource {
  id?: string | number
  service_id?: string | number
  quantity: number
  unit_price: number
  subtotal?: number
  service?: ServiceResource
}

export interface OrderProductItemResource {
  id?: string | number
  product_id?: string | number
  quantity: number
  unit_price: number
  subtotal?: number
  product?: ProductResource
}

export interface OrderServiceItemPayload {
  service_id: string | number
  quantity: number
  unit_price: number
  subtotal?: number
}

export interface OrderProductItemPayload {
  product_id: string | number
  quantity: number
  unit_price: number
  subtotal?: number
}

export interface OrderPaymentResource {
  id?: string | number
  payment_method?: OrderPaymentMethod
  method?: OrderPaymentMethod
  value?: number
  amount?: number
  type?: OrderPaymentType
  installments?: number
  entry_value?: number | null
  status?: OrderPaymentStatus | string
  payment_date?: string | null
  installment_items?: OrderPaymentInstallmentResource[]
  installment_amount?: number
  paid_at?: string
  note?: string
  created_at?: string
  updated_at?: string
}

export interface OrderPaymentPayload {
  id?: string | number
  payment_method: OrderPaymentMethod
  value: number
  type?: OrderPaymentType
  installments: number
  entry_value?: number | null
  status?: OrderPaymentStatus | string
  payment_date?: string | null
  installment_amount?: number
  paid_at?: string
  note?: string
}

export interface OrderServicePayload {
  customer_id?: string | number
  employee_id?: string | number
  service_items?: OrderServiceItemPayload[]
  product_items?: OrderProductItemPayload[]
  payments?: OrderPaymentPayload[]
  total_value: number
  amount?: number
  discount?: number
  discount_percentage?: number
  opening_date: string
  closing_date?: string
  note?: string
}

export interface OrderServiceStatusPayload {
  status: OrderServiceStatus
}

export type CashStatus = 'aberto' | 'fechado' | 'ativo' | 'inativo'
export type CashMovementType = 'entrada' | 'saida' | 'sangria' | 'suprimento' | 'ajuste'

export interface CashResource {
  id: string | number
  code?: string | number
  employee_id?: string | number
  name?: string
  nome?: string
  description?: string
  descricao?: string
  status?: CashStatus | string
  opening_balance?: number
  initial_balance?: number
  saldo_inicial?: number
  current_balance?: number
  balance?: number
  saldo_atual?: number
  final_balance?: number
  total_entries?: number
  total_inputs?: number
  entradas?: number
  total_exits?: number
  total_outputs?: number
  saidas?: number
  opened_at?: string
  opening_date?: string
  aberto_em?: string
  closed_at?: string
  closing_date?: string
  fechado_em?: string
  note?: string
  observacao?: string
  created_at?: string
  updated_at?: string
}

export interface CashPayload {
  name: string
  nome?: string
  description?: string
  descricao?: string
  opening_balance: number
  initial_balance?: number
  saldo_inicial?: number
}

export interface CashActionPayload {
  opening_balance?: number
  initial_balance?: number
  saldo_inicial?: number
  closing_balance?: number
  current_balance?: number
  balance?: number
  saldo_atual?: number
  amount?: number
  value?: number
  valor?: number
  note?: string
  observacao?: string
}

export interface CashMovementResource {
  id: string | number
  code?: string | number
  cash_id?: string | number
  caixa_id?: string | number
  payment_service_order_id?: string | number | null
  payment_sale_id?: string | number | null
  type?: CashMovementType | string
  tipo?: CashMovementType | string
  amount?: number
  value?: number
  valor?: number
  note?: string
  observacao?: string
  description?: string
  descricao?: string
  occurred_at?: string
  movement_date?: string
  data?: string
  created_at?: string
  updated_at?: string
  cash?: CashResource
  caixa?: CashResource
}

export interface CashMovementPayload {
  cash_id: string | number
  caixa_id?: string | number
  type: CashMovementType
  tipo?: CashMovementType
  amount: number
  value?: number
  valor?: number
  note?: string
  observacao?: string
  description?: string
  descricao?: string
  occurred_at?: string
  data?: string
}