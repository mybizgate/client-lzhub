import type { AuthUser, LoginResult, PasswordResetInput } from '../../types/auth'
import { HttpError, type HttpClient } from '../http'
import { clearStaffToken, getStaffToken, setStaffToken } from '../session'

export interface AuthRepository {
  login(email: string, password: string): Promise<LoginResult>
  logout(): Promise<void>
  me(): Promise<AuthUser | null>
  /** Always resolves with the API's neutral message; never reveals whether the e-mail exists. */
  forgotPassword(email: string): Promise<string>
  resetPassword(input: PasswordResetInput): Promise<string>
}

export class ApiAuthRepository implements AuthRepository {
  constructor(private readonly http: HttpClient) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const result = await this.http.post<{ access_token: string; user: AuthUser }>('/auth/login', { email, password })
    return { accessToken: result.access_token, user: result.user }
  }

  async logout(): Promise<void> {
    await this.http.post<unknown>('/auth/logout', {})
  }

  async me(): Promise<AuthUser | null> {
    try {
      const result = await this.http.get<{ data: AuthUser }>('/auth/me')
      return result.data
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) return null
      throw error
    }
  }

  async forgotPassword(email: string): Promise<string> {
    const result = await this.http.post<{ message: string }>('/auth/forgot-password', { email })
    return result.message
  }

  async resetPassword(input: PasswordResetInput): Promise<string> {
    const result = await this.http.post<{ message: string }>('/auth/reset-password', {
      email: input.email,
      token: input.token,
      password: input.password,
      password_confirmation: input.passwordConfirmation,
    })
    return result.message
  }
}

export class LocalAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<LoginResult> {
    const normalized = email.trim().toLowerCase()
    if (normalized.endsWith('@lzhub.test') && normalized.slice(0, -'@lzhub.test'.length) && password === 'demo') {
      setStaffToken('local-owner')
      return {
        accessToken: 'local-owner',
        user: { id: '1', name: 'Pemilik Demo', email: normalized, role: 'owner' },
      }
    }
    throw new HttpError(401, 'E-mel atau kata laluan salah.')
  }

  async logout(): Promise<void> {
    clearStaffToken()
  }

  async me(): Promise<AuthUser | null> {
    return getStaffToken() === 'local-owner'
      ? { id: '1', name: 'Pemilik Demo', email: 'pemilik@lzhub.test', role: 'owner' }
      : null
  }

  async forgotPassword(): Promise<string> {
    return 'Mod prototaip: tiada e-mel dihantar. Log masuk dengan mana-mana e-mel @lzhub.test dan kata laluan "demo".'
  }

  async resetPassword(input: PasswordResetInput): Promise<string> {
    if (input.password.length < 8) throw new HttpError(422, 'Kata laluan mesti sekurang-kurangnya 8 aksara.')
    if (input.password !== input.passwordConfirmation) throw new HttpError(422, 'Pengesahan kata laluan tidak sepadan.')
    return 'Mod prototaip: kata laluan demo kekal "demo".'
  }
}
