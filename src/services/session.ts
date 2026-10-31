import { env } from '../config/env'
import { createStorage } from './storage'

export const sessionStorageInstance = createStorage(env.clientCode)

export const getGuestToken = () => sessionStorageInstance.get<string>('guest-token')
export const setGuestToken = (token: string) => sessionStorageInstance.set('guest-token', token)
export const clearGuestToken = () => sessionStorageInstance.remove('guest-token')

export const getStaffToken = () => sessionStorageInstance.get<string>('auth-token')
export const setStaffToken = (token: string) => sessionStorageInstance.set('auth-token', token)
export const clearStaffToken = () => sessionStorageInstance.remove('auth-token')
