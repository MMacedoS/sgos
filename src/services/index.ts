import { HttpClient } from './HttpClient'
import { createAuthService } from './AuthService'
import { createBackofficeService } from './BackofficeService'
import { createUsersService } from './users/UsersService'
import { createCustomersService } from './customers/CustomersService'
import { createServicesService } from './offices/servicesService'
import { createProductsService } from './products/ProductService'

const httpClient = new HttpClient()
export const authService = createAuthService(httpClient)
export const backofficeService = createBackofficeService(httpClient)
export const usersService = createUsersService(httpClient)
export const customersService = createCustomersService(httpClient)
export const servicesService = createServicesService(httpClient)
export const productsService = createProductsService(httpClient)

export {
  HttpClient,
  createAuthService,
  createBackofficeService,
  createUsersService,
  createCustomersService,
  createServicesService,
  createProductsService
}
