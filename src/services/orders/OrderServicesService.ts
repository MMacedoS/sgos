import type { HttpClient } from '@/services/HttpClient'
import type {
  ApiResourceResponse,
  OrderPaymentInstallmentResource,
  OrderPaymentPayload,
  OrderPaymentResource,
  OrderServicePayload,
  OrderServiceResource,
  OrderServiceStatus,
  OrderServiceStatusPayload,
} from '@/types/backoffice'

export class OrderServicesService {
  constructor(private readonly httpClient: HttpClient) {}

  async list(): Promise<OrderServiceResource[]> {
    const response = await this.httpClient.get<ApiResourceResponse<OrderServiceResource[]>>('/v1/ordens-servico')
    return response.data
  }

  async create(payload: OrderServicePayload): Promise<OrderServiceResource> {
    const response = await this.httpClient.post<ApiResourceResponse<OrderServiceResource>>('/v1/ordens-servico', payload)
    return response.data
  }

  async show(orderId: string | number): Promise<OrderServiceResource> {
    const response = await this.httpClient.get<ApiResourceResponse<OrderServiceResource>>(`/v1/ordens-servico/${orderId}`)
    return response.data
  }

  async update(orderId: string | number, payload: OrderServicePayload): Promise<OrderServiceResource> {
    const response = await this.httpClient.put<ApiResourceResponse<OrderServiceResource>>(
      `/v1/ordens-servico/${orderId}`,
      payload,
    )

    return response.data
  }

  async updateStatus(orderId: string | number, status: OrderServiceStatus): Promise<OrderServiceResource> {
    const payload: OrderServiceStatusPayload = { status }
    const response = await this.httpClient.patch<ApiResourceResponse<OrderServiceResource>>(
      `/v1/ordens-servico/${orderId}/status`,
      payload,
    )

    return response.data
  }

  async receivePayments(orderId: string | number, payments: OrderPaymentPayload[]): Promise<OrderServiceResource> {
    const response = await this.httpClient.post<ApiResourceResponse<OrderServiceResource>>(
      `/v1/ordens-servico/${orderId}/payments`,
      { payments },
    )

    return response.data
  }

  async updatePayment(paymentId: string | number, payload: Partial<OrderPaymentPayload>): Promise<OrderPaymentResource> {
    const response = await this.httpClient.patch<ApiResourceResponse<OrderPaymentResource>>(
      `/v1/payments/${paymentId}`,
      payload,
    )

    return response.data
  }

  async removePayment(paymentId: string | number): Promise<void> {
    await this.httpClient.delete(`/v1/payments/${paymentId}`)
  }

  async updatePaymentInstallment(
    paymentId: string | number,
    installmentId: string | number,
    payload: Partial<OrderPaymentInstallmentResource>,
  ): Promise<OrderPaymentInstallmentResource> {
    const response = await this.httpClient.patch<ApiResourceResponse<OrderPaymentInstallmentResource>>(
      `/v1/payments/${paymentId}/installments/${installmentId}`,
      payload,
    )

    return response.data
  }

  async removePaymentInstallment(paymentId: string | number, installmentId: string | number): Promise<void> {
    await this.httpClient.delete(`/v1/payments/${paymentId}/installments/${installmentId}`)
  }

  async remove(orderId: string | number): Promise<void> {
    await this.httpClient.delete(`/v1/ordens-servico/${orderId}`)
  }
}

export const createOrderServicesService = (httpClient: HttpClient): OrderServicesService => {
  return new OrderServicesService(httpClient)
}