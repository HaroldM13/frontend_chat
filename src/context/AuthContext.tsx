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
}

const AuthContext = createContext<AuthContextType | null>(null)

// Claves para localStorage
const LS_TOKEN = 'jht_token'
const LS_USER_ID = 'jht_user_id'
const LS_NOMBRE = 'jht_nombre'

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicializar desde localStorage para persistir sesión al recargar
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem(LS_TOKEN)
    const usuarioId = localStorage.getItem(LS_USER_ID)
    const nombre = localStorage.getItem(LS_NOMBRE)
    return {
      token,
      usuarioId,
      nombre,
      isAuthenticated: !!token,
    }
  })

  const login = useCallback((token: string, usuarioId: string, nombre: string) => {
    localStorage.setItem(LS_TOKEN, token)
    localStorage.setItem(LS_USER_ID, usuarioId)
    localStorage.setItem(LS_NOMBRE, nombre)
    setState({ token, usuarioId, nombre, isAuthenticated: true })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(LS_TOKEN)
    localStorage.removeItem(LS_USER_ID)
    localStorage.removeItem(LS_NOMBRE)
    setState({ token: null, usuarioId: null, nombre: null, isAuthenticated: false })
  }, [])

  const actualizarNombre = useCallback((nuevoNombre: string) => {
    localStorage.setItem(LS_NOMBRE, nuevoNombre)
    setState(prev => ({ ...prev, nombre: nuevoNombre }))
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, actualizarNombre }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
