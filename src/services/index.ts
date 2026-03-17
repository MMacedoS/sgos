import { HttpClient } from './HttpClient'
import { createAuthService } from './AuthService'

const httpClient = new HttpClient()
export const authService = createAuthService(httpClient)
export { HttpClient, createAuthService }
