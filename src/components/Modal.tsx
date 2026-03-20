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
    className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
    style={{ 
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: '1.5rem'
    }}
    onClick={e => { if (e.target === e.currentTarget) onCerrar() }}
  >
    <div
      className="w-full rounded-3xl shadow-2xl overflow-hidden animate-scale-in"
      style={{ 
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        maxWidth: '32rem'
      }}
    >
      {/* Header del modal */}
      <div
        className="flex items-center justify-between border-b"
        style={{ 
          borderColor: 'var(--color-border)',
          padding: '1.5rem 1.75rem'
        }}
      >
        <h2 className="font-bold" style={{ 
          color: 'var(--color-text-primary)',
          fontSize: '1.125rem'
        }}>
          {titulo}
        </h2>
        <button
          onClick={onCerrar}
          className="rounded-xl transition-colors hover:bg-[var(--color-bg-tertiary)]"
          style={{ 
            color: 'var(--color-text-muted)',
            padding: '0.5rem'
          }}
        >
          <IconX size={20} />
        </button>
      </div>

      {/* Contenido */}
      <div style={{ padding: '1.75rem' }}>{children}</div>
    </div>
  </div>
)
}
