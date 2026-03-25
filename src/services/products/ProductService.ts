import type { ApiResourceResponse, ProductPayload, ProductResource } from '@/types/backoffice'
import type { HttpClient } from '@/services/HttpClient'

export class ProductService {
  constructor(private readonly httpClient: HttpClient) {}

  async list(): Promise<ProductResource[]> {
    const response = await this.httpClient.get<ApiResourceResponse<ProductResource[]>>('/v1/produtos')
    return response.data
  }

  async create(payload: ProductPayload): Promise<ProductResource> {
    const response = await this.httpClient.post<ApiResourceResponse<ProductResource>>('/v1/produtos', payload)
    return response.data
  }

  async show(productId: string | number): Promise<ProductResource> {
    const response = await this.httpClient.get<ApiResourceResponse<ProductResource>>(`/v1/produtos/${productId}`)
    return response.data
  }

  async update(productId: string | number, payload: ProductPayload): Promise<ProductResource> {
    const response = await this.httpClient.put<ApiResourceResponse<ProductResource>>(
      `/v1/produtos/${productId}`,
      payload,
    )

    return response.data
  }

  async remove(productId: string | number): Promise<void> {
    await this.httpClient.delete(`/v1/produtos/${productId}`)
  }

  async adjustStock(productId: string | number, quantity: number, type: 'entrada' | 'saida', note?: string): Promise<ProductResource> {
    const response = await this.httpClient.post<ApiResourceResponse<ProductResource>>(
      `/v1/produtos/${productId}/estoque`,
      {
        quantity,
        type,
        note,
      },
    )

    return response.data
  }
}

export const createProductsService = (httpClient: HttpClient): ProductService => {
  return new ProductService(httpClient)
}
