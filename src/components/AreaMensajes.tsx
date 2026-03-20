/**
 * Área de scroll con las burbujas de mensajes.
 * Scroll automático al último mensaje.
 */
import { useEffect, useRef } from 'react'
import { BurbujaMensaje } from './BurbujaMensaje'
import type { Mensaje, MensajeWS } from '../interfaces'
import { useIdioma } from '../context/IdiomaContext'
import { IconMessages } from '@tabler/icons-react'

interface Props {
  mensajes: (Mensaje | MensajeWS)[]
  cargando?: boolean
}

export function AreaMensajes({ mensajes, cargando = false }: Props) {
  const { t } = useIdioma()
  const finRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes.length])

  if (cargando) {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ gap: '0.75rem' }}>
      <div
        className="rounded-full border-3 border-t-transparent animate-spin"
        style={{ 
          borderColor: 'var(--color-accent)', 
          borderTopColor: 'transparent',
          width: '1.5rem',
          height: '1.5rem',
          borderWidth: '3px'
        }}
      />
      <span 
        className="font-medium" 
        style={{ 
          color: 'var(--color-text-muted)',
          fontSize: '0.875rem'
        }}
      >
        {t.common.loading}
      </span>
    </div>
  )
}

return (
  <div
    className="flex-1 overflow-y-auto flex flex-col"
    style={{ 
      backgroundColor: 'var(--color-bg-primary)',
      padding: '1.5rem'
    }}
  >
    {mensajes.length === 0 ? (
      <div className="flex-1 flex flex-col items-center justify-center animate-fade-in" style={{ gap: '1rem' }}>
        <div
          className="rounded-3xl flex items-center justify-center"
          style={{ 
            backgroundColor: 'var(--color-accent-light)',
            boxShadow: 'var(--shadow-md)',
            width: '5rem',
            height: '5rem'
          }}
        >
          <IconMessages size={36} style={{ color: 'var(--color-accent)' }} />
        </div>
        <p className="font-bold" style={{ 
          color: 'var(--color-text-secondary)',
          fontSize: '1rem'
        }}>
          {t.chat.noMessages}
        </p>
        <p style={{ 
          color: 'var(--color-text-muted)',
          fontSize: '0.875rem'
        }}>
          {t.chat.startConversation}
        </p>
      </div>
    ) : (
      <>
        {mensajes.map(m => (
          <BurbujaMensaje key={m.id} mensaje={m} />
        ))}
        <div ref={finRef} />
      </>
    )}
  </div>
)
}
