/**
 * Contexto de idioma.
 * Gestiona el idioma activo y provee las traducciones correspondientes.
 */
import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Idioma } from '../interfaces'
import type { Translations } from '../i18n/es'
import es from '../i18n/es'
import en from '../i18n/en'

interface IdiomaContextType {
  idioma: Idioma
  t: Translations
  cambiarIdioma: (idioma: Idioma) => void
}

const IdiomaContext = createContext<IdiomaContextType | null>(null)

const LS_IDIOMA = 'jht_idioma'

const traducciones: Record<Idioma, Translations> = { es, en }

export function IdiomaProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>(() => {
    return (localStorage.getItem(LS_IDIOMA) as Idioma) || 'es'
  })

  const cambiarIdioma = (nuevoIdioma: Idioma) => {
    setIdioma(nuevoIdioma)
    localStorage.setItem(LS_IDIOMA, nuevoIdioma)
  }

  return (
    <IdiomaContext.Provider value={{ idioma, t: traducciones[idioma], cambiarIdioma }}>
      {children}
    </IdiomaContext.Provider>
  )
}

export function useIdioma(): IdiomaContextType {
  const ctx = useContext(IdiomaContext)
  if (!ctx) throw new Error('useIdioma debe usarse dentro de IdiomaProvider')
  return ctx
}
