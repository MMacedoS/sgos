import type { ApiResourceResponse, CustomerResource, PersonPayload } from '@/types/backoffice'
import type { HttpClient } from '@/services/HttpClient'

export class CustomersService {
  constructor(private readonly httpClient: HttpClient) {}

  async list(): Promise<CustomerResource[]> {
    const response = await this.httpClient.get<ApiResourceResponse<CustomerResource[]>>('/v1/clientes')
    return response.data
  }

  async create(payload: PersonPayload): Promise<CustomerResource> {
    const response = await this.httpClient.post<ApiResourceResponse<CustomerResource>>('/v1/clientes', payload)
    return response.data
  }

  async show(customerId: string | number): Promise<CustomerResource> {
    const response = await this.httpClient.get<ApiResourceResponse<CustomerResource>>(`/v1/clientes/${customerId}`)
    return response.data
  }

  async update(customerId: string | number, payload: PersonPayload): Promise<CustomerResource> {
    const response = await this.httpClient.put<ApiResourceResponse<CustomerResource>>(
      `/v1/clientes/${customerId}`,
      payload,
    )

    return response.data
  }

  async remove(customerId: string | number): Promise<void> {
    await this.httpClient.delete(`/v1/clientes/${customerId}`)
  }
}

export const createCustomersService = (httpClient: HttpClient): CustomersService => {
  return new CustomersService(httpClient)
}
