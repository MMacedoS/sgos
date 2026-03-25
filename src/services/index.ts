import { HttpClient } from './HttpClient'
import { createAuthService } from './AuthService'
import { createBackofficeService } from './BackofficeService'
import { createUsersService } from './users/UsersService'
import { createCustomersService } from './customers/CustomersService'

const httpClient = new HttpClient()
export const authService = createAuthService(httpClient)
export const backofficeService = createBackofficeService(httpClient)
export const usersService = createUsersService(httpClient)
export const customersService = createCustomersService(httpClient)

export {
  HttpClient,
  createAuthService,
  createBackofficeService,
  createUsersService,
  createCustomersService,
}
