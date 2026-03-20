/**
 * Contexto de tema (claro/oscuro).
 * Aplica el atributo data-theme al elemento raíz del DOM.
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Tema } from '../interfaces'

interface TemaContextType {
  tema: Tema
  toggleTema: () => void
}

const TemaContext = createContext<TemaContextType | null>(null)

const LS_TEMA = 'jht_tema'

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(() => {
    return (localStorage.getItem(LS_TEMA) as Tema) || 'light'
  })

  // Aplicar el tema al DOM cuando cambia
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    localStorage.setItem(LS_TEMA, tema)
  }, [tema])

  const toggleTema = () => {
    setTema(prev => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <TemaContext.Provider value={{ tema, toggleTema }}>
      {children}
    </TemaContext.Provider>
  )
}

export function useTema(): TemaContextType {
  const ctx = useContext(TemaContext)
  if (!ctx) throw new Error('useTema debe usarse dentro de TemaProvider')
  return ctx
}
