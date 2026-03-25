import type {
  ApiResourceResponse,
  CustomerResource,
  EmployeeResource,
  PersonPayload,
} from '@/types/backoffice'
import { HttpClient } from './HttpClient'

export class BackofficeService {
  constructor(private readonly httpClient: HttpClient) {}

  async createCustomer(payload: PersonPayload): Promise<CustomerResource> {
    const response = await this.httpClient.post<ApiResourceResponse<CustomerResource>>(
      '/v1/clientes',
      payload,
    )

    return response.data
  }

  async listCustomers(): Promise<CustomerResource[]> {
    const response = await this.httpClient.get<ApiResourceResponse<CustomerResource[]>>('/v1/clientes')

    return response.data
  }

  async createUser(payload: PersonPayload): Promise<EmployeeResource> {
    const response = await this.httpClient.post<ApiResourceResponse<EmployeeResource>>(
      '/v1/funcionarios',
      payload,
    )

    return response.data
  }

  async listUsers(): Promise<EmployeeResource[]> {
    const response = await this.httpClient.get<ApiResourceResponse<EmployeeResource[]>>('/v1/funcionarios')

    return response.data
  }
}

export const createBackofficeService = (httpClient: HttpClient): BackofficeService => {
  return new BackofficeService(httpClient)
}
