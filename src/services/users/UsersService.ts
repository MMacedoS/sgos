import type { ApiResourceResponse, EmployeeResource, PersonPayload } from '@/types/backoffice'
import type { HttpClient } from '@/services/HttpClient'

export class UsersService {
  constructor(private readonly httpClient: HttpClient) {}

  async list(): Promise<EmployeeResource[]> {
    const response = await this.httpClient.get<ApiResourceResponse<EmployeeResource[]>>('/v1/funcionarios')
    return response.data
  }

  async create(payload: PersonPayload): Promise<EmployeeResource> {
    const response = await this.httpClient.post<ApiResourceResponse<EmployeeResource>>('/v1/funcionarios', payload)
    return response.data
  }

  async show(userId: string | number): Promise<EmployeeResource> {
    const response = await this.httpClient.get<ApiResourceResponse<EmployeeResource>>(`/v1/funcionarios/${userId}`)
    return response.data
  }

  async update(userId: string | number, payload: PersonPayload): Promise<EmployeeResource> {
    const response = await this.httpClient.put<ApiResourceResponse<EmployeeResource>>(
      `/v1/funcionarios/${userId}`,
      payload,
    )

    return response.data
  }

  async remove(userId: string | number): Promise<void> {
    await this.httpClient.delete(`/v1/funcionarios/${userId}`)
  }
}

export const createUsersService = (httpClient: HttpClient): UsersService => {
  return new UsersService(httpClient)
}
