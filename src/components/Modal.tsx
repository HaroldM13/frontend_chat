/**
 * Componente Modal reutilizable.
 * Se cierra al hacer clic en el backdrop o al presionar Escape.
 */
import { useEffect, type ReactNode } from 'react'
import { IconX } from '@tabler/icons-react'

interface Props {
  titulo: string
  abierto: boolean
  onCerrar: () => void
  children: ReactNode
}

export function Modal({ titulo, abierto, onCerrar, children }: Props) {
  // Cerrar con tecla Escape
  useEffect(() => {
    const manejar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    if (abierto) document.addEventListener('keydown', manejar)
    return () => document.removeEventListener('keydown', manejar)
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-lg overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        {/* Header del modal */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>
            {titulo}
          </h2>
          <button
            onClick={onCerrar}
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
