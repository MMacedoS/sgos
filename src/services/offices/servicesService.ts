import type { ApiResourceResponse, ServicePayload, ServiceResource } from '@/types/backoffice'
import type { HttpClient } from '@/services/HttpClient'

export class ServicesService {
  constructor(private readonly httpClient: HttpClient) {}

  async list(): Promise<ServiceResource[]> {
    const response = await this.httpClient.get<ApiResourceResponse<ServiceResource[]>>('/v1/servicos')
    return response.data
  }

  async create(payload: ServicePayload): Promise<ServiceResource> {
    const response = await this.httpClient.post<ApiResourceResponse<ServiceResource>>('/v1/servicos', payload)
    return response.data
  }

  async show(serviceId: string | number): Promise<ServiceResource> {
    const response = await this.httpClient.get<ApiResourceResponse<ServiceResource>>(`/v1/servicos/${serviceId}`)
    return response.data
  }

  async update(serviceId: string | number, payload: ServicePayload): Promise<ServiceResource> {
    const response = await this.httpClient.put<ApiResourceResponse<ServiceResource>>(
      `/v1/servicos/${serviceId}`,
      payload,
    )

    return response.data
  }

  async remove(serviceId: string | number): Promise<void> {
    await this.httpClient.delete(`/v1/servicos/${serviceId}`)
  }
}

export const createServicesService = (httpClient: HttpClient): ServicesService => {
  return new ServicesService(httpClient)
}
