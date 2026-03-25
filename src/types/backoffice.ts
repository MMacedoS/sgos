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
  price: number
  stock: number
  created_at: string
  updated_at: string
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