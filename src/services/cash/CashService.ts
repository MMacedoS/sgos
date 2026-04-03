import type {
  ApiResourceResponse,
  CashActionPayload,
  CashMovementPayload,
  CashMovementResource,
  CashPayload,
  CashResource,
} from '@/types/backoffice'
import type { HttpClient } from '@/services/HttpClient'

export class CashService {
  constructor(private readonly httpClient: HttpClient) {}

  async list(): Promise<CashResource[]> {
    const response = await this.httpClient.get<ApiResourceResponse<CashResource[]>>('/v1/caixas')
    return response.data
  }

  async show(cashId: string | number): Promise<CashResource> {
    const response = await this.httpClient.get<ApiResourceResponse<CashResource>>(`/v1/caixas/${cashId}`)
    return response.data
  }

  async create(payload: CashPayload): Promise<CashResource> {
    const response = await this.httpClient.post<ApiResourceResponse<CashResource>>('/v1/caixas', payload)
    return response.data
  }

  async update(cashId: string | number, payload: CashPayload): Promise<CashResource> {
    const response = await this.httpClient.put<ApiResourceResponse<CashResource>>(`/v1/caixas/${cashId}`, payload)
    return response.data
  }

  async remove(cashId: string | number): Promise<void> {
    await this.httpClient.delete(`/v1/caixas/${cashId}`)
  }

  async open(cashId: string | number, payload: CashActionPayload): Promise<CashResource> {
    const response = await this.httpClient.post<ApiResourceResponse<CashResource>>(`/v1/caixas/${cashId}/abrir`, payload)
    return response.data
  }

  async close(cashId: string | number, payload: CashActionPayload): Promise<CashResource> {
    const response = await this.httpClient.post<ApiResourceResponse<CashResource>>(`/v1/caixas/${cashId}/fechar`, payload)
    return response.data
  }

  async listMovements(): Promise<CashMovementResource[]> {
    const response = await this.httpClient.get<ApiResourceResponse<CashMovementResource[]>>('/v1/movimentos-caixa')
    return response.data
  }

  async showMovement(movementId: string | number): Promise<CashMovementResource> {
    const response = await this.httpClient.get<ApiResourceResponse<CashMovementResource>>(`/v1/movimentos-caixa/${movementId}`)
    return response.data
  }

  async createMovement(payload: CashMovementPayload): Promise<CashMovementResource> {
    const response = await this.httpClient.post<ApiResourceResponse<CashMovementResource>>('/v1/movimentos-caixa', payload)
    return response.data
  }

  async updateMovement(movementId: string | number, payload: CashMovementPayload): Promise<CashMovementResource> {
    const response = await this.httpClient.put<ApiResourceResponse<CashMovementResource>>(`/v1/movimentos-caixa/${movementId}`, payload)
    return response.data
  }

  async removeMovement(movementId: string | number): Promise<void> {
    await this.httpClient.delete(`/v1/movimentos-caixa/${movementId}`)
  }
}

export const createCashService = (httpClient: HttpClient): CashService => {
  return new CashService(httpClient)
}