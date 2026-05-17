/**
 * Área de scroll con las burbujas de mensajes.
 * Scroll automático al último mensaje cuando se está cerca del fondo.
 * Infinite scroll hacia atrás: IntersectionObserver en el tope del contenedor.
 * Muestra indicador de escritura animado al fondo cuando alguien está escribiendo.
 */
import { useEffect, useRef } from 'react'
import { BurbujaMensaje } from './BurbujaMensaje'
import type { Mensaje, MensajeWS } from '../interfaces'
import type { UsuarioEscribiendo } from '../hooks/useWebSocket'
import { useIdioma } from '../context/IdiomaContext'
import { IconMessages } from '@tabler/icons-react'

interface Props {
  mensajes: (Mensaje | MensajeWS)[]
  cargando?: boolean
  hayMas?: boolean
  cargandoMas?: boolean
  onCargarMas?: () => void
  escribiendo?: UsuarioEscribiendo[]
  onReply?: (m: Mensaje | MensajeWS) => void
  onEdit?: (m: Mensaje | MensajeWS) => void
  onDelete?: (m: Mensaje | MensajeWS) => void
  onReaccionar?: (msgId: string, emoji: string) => void
  onVotar?: (msgId: string, opcionId: string) => void
}

function TypingIndicator({ usuarios }: { usuarios: UsuarioEscribiendo[] }) {
  if (usuarios.length === 0) return null

  const nombres =
    usuarios.length === 1
      ? usuarios[0].nombre
      : usuarios.map(u => u.nombre).join(', ')

  return (
    <div
      className="self-start flex items-center animate-fade-in-up"
      style={{ marginBottom: '0.75rem', gap: '0.5rem' }}
    >
      <div
        className="shadow-msg flex items-center"
        style={{
          backgroundColor: 'var(--color-bg-message-other)',
          border: '1px solid var(--color-border)',
          borderRadius: '1.25rem 1.25rem 1.25rem 0.375rem',
          padding: '0.625rem 1rem',
          gap: '0.375rem',
        }}
      >
        {/* Puntos animados */}
        <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-text-muted)',
                animation: `typing-bounce 1.2s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', fontStyle: 'italic' }}>
          {nombres}
        </span>
      </div>
    </div>
  )
}

export function AreaMensajes({
  mensajes,
  cargando = false,
  hayMas = false,
  cargandoMas = false,
  onCargarMas,
  escribiendo = [],
  onReply,
  onEdit,
  onDelete,
  onReaccionar,
  onVotar,
}: Props) {
  const { t } = useIdioma()
  const containerRef = useRef<HTMLDivElement>(null)
  const finRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(0)

  // Refs estables para el callback del observer (evita recrear el observer en cada render)
  const cargandoMasRef = useRef(cargandoMas)
  const onCargarMasRef = useRef(onCargarMas)
  useEffect(() => { cargandoMasRef.current = cargandoMas }, [cargandoMas])
  useEffect(() => { onCargarMasRef.current = onCargarMas }, [onCargarMas])

  // IntersectionObserver en el sentinel del tope → carga automática al llegar arriba
  useEffect(() => {
    const sentinel = sentinelRef.current
    const container = containerRef.current
    if (!sentinel || !container || !hayMas) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !cargandoMasRef.current && onCargarMasRef.current) {
          onCargarMasRef.current()
        }
      },
      { root: container, threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hayMas])

  // Scroll al fondo en carga inicial o cuando llegan mensajes nuevos (si estamos cerca del fondo)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const esNuevoCargado = prevLengthRef.current === 0 && mensajes.length > 0
    const distanciaAlFondo = container.scrollHeight - container.scrollTop - container.clientHeight
    const cercaDelFondo = distanciaAlFondo < 150

    if (esNuevoCargado || cercaDelFondo) {
      finRef.current?.scrollIntoView({ behavior: esNuevoCargado ? 'auto' : 'smooth' })
    }

    prevLengthRef.current = mensajes.length
  }, [mensajes.length])

  // Scroll al fondo cuando alguien empieza a escribir
  useEffect(() => {
    if (escribiendo.length > 0) {
      const container = containerRef.current
      if (!container) return
      const distanciaAlFondo = container.scrollHeight - container.scrollTop - container.clientHeight
      if (distanciaAlFondo < 200) {
        finRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [escribiendo.length])

  if (cargando) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ gap: '0.75rem' }}>
        <div
          className="rounded-full animate-spin"
          style={{
            borderColor: 'var(--color-accent)',
            borderTopColor: 'transparent',
            width: '1.5rem',
            height: '1.5rem',
            border: '3px solid',
          }}
        />
        <span className="font-medium" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          {t.common.loading}
        </span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto flex flex-col"
      style={{ backgroundColor: 'var(--color-bg-primary)', padding: '1.5rem' }}
    >
      {mensajes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in" style={{ gap: '1rem' }}>
          <div
            className="rounded-3xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-accent-light)', boxShadow: 'var(--shadow-md)', width: '5rem', height: '5rem' }}
          >
            <IconMessages size={36} style={{ color: 'var(--color-accent)' }} />
          </div>
          <p className="font-bold" style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
            {t.chat.noMessages}
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {t.chat.startConversation}
          </p>
        </div>
      ) : (
        <>
          {/* Sentinel invisible en el tope — el observer lo vigila */}
          <div ref={sentinelRef} style={{ height: '1px' }} />

          {/* Spinner de carga de mensajes más antiguos */}
          {cargandoMas && (
            <div className="flex justify-center" style={{ marginBottom: '1rem' }}>
              <div
                className="rounded-full animate-spin"
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  border: '2.5px solid var(--color-accent)',
                  borderTopColor: 'transparent',
                }}
              />
            </div>
          )}

          {mensajes.map(m => (
            <div key={m.id} id={`msg-${m.id}`}>
              <BurbujaMensaje
                mensaje={m}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onReaccionar={onReaccionar}
                onVotar={onVotar}
              />
            </div>
          ))}

          {/* Indicador de escritura */}
          <TypingIndicator usuarios={escribiendo} />

          <div ref={finRef} />
        </>
      )}
    </div>
  )
}
