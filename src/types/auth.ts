export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'owner' | 'staff'
}

export interface LoginResult {
  accessToken: string
  user: AuthUser
}

export interface PasswordResetInput {
  email: string
  token: string
  password: string
  passwordConfirmation: string
}
