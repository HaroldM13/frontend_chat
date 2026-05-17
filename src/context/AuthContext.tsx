/**
 * Contexto de autenticación.
 * Gestiona el estado global del usuario autenticado y persiste el token en localStorage.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AuthState } from '../interfaces'

interface AuthContextType extends AuthState {
  login: (token: string, usuarioId: string, nombre: string) => void
  logout: () => void
  actualizarNombre: (nuevoNombre: string) => void
  actualizarFoto: (url: string | null) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const LS_TOKEN    = 'jht_token'
const LS_USER_ID  = 'jht_user_id'
const LS_NOMBRE   = 'jht_nombre'
const LS_FOTO_URL = 'jht_foto_url'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token    = localStorage.getItem(LS_TOKEN)
    const usuarioId = localStorage.getItem(LS_USER_ID)
    const nombre   = localStorage.getItem(LS_NOMBRE)
    const fotoUrl  = localStorage.getItem(LS_FOTO_URL)
    return {
      token,
      usuarioId,
      nombre,
      fotoUrl,
      isAuthenticated: !!token,
    }
  })

  const login = useCallback((token: string, usuarioId: string, nombre: string) => {
    localStorage.setItem(LS_TOKEN, token)
    localStorage.setItem(LS_USER_ID, usuarioId)
    localStorage.setItem(LS_NOMBRE, nombre)
    setState({ token, usuarioId, nombre, fotoUrl: null, isAuthenticated: true })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(LS_TOKEN)
    localStorage.removeItem(LS_USER_ID)
    localStorage.removeItem(LS_NOMBRE)
    localStorage.removeItem(LS_FOTO_URL)
    setState({ token: null, usuarioId: null, nombre: null, fotoUrl: null, isAuthenticated: false })
  }, [])

  const actualizarNombre = useCallback((nuevoNombre: string) => {
    localStorage.setItem(LS_NOMBRE, nuevoNombre)
    setState(prev => ({ ...prev, nombre: nuevoNombre }))
  }, [])

  const actualizarFoto = useCallback((url: string | null) => {
    if (url) {
      localStorage.setItem(LS_FOTO_URL, url)
    } else {
      localStorage.removeItem(LS_FOTO_URL)
    }
    setState(prev => ({ ...prev, fotoUrl: url }))
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, actualizarNombre, actualizarFoto }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
