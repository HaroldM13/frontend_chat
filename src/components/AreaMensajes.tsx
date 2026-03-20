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
      <div className="flex-1 flex items-center justify-center gap-3">
        <div
          className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
        />
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t.common.loading}
        </span>
      </div>
    )
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-5 flex flex-col"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {mensajes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 animate-fade-in">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-accent-light)' }}
          >
            <IconMessages size={28} style={{ color: 'var(--color-accent)' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            {t.chat.noMessages}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
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
