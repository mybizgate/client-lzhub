import { repositories } from './repositories'
import type { PasswordResetInput } from '../types/auth'

export const authService = {
  login: (email: string, password: string) => repositories.auth.login(email, password),
  logout: () => repositories.auth.logout(),
  me: () => repositories.auth.me(),
  forgotPassword: (email: string) => repositories.auth.forgotPassword(email),
  resetPassword: (input: PasswordResetInput) => repositories.auth.resetPassword(input),
}
