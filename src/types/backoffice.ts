export interface PersonPayload {
  nome_razao: string
  cpf_cnpj: string
  data_nascimento?: string
  genero?: 'M' | 'F' | 'O'
  telefone?: string
  email?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
}

export interface PersonResource {
  id: number
  name: string
  document: string
  birth_date?: string
  gender?: string
  phone?: string
  email?: string
  address?: string
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

export interface ApiResourceResponse<T> {
  success: boolean
  data: T
  message: string
}
