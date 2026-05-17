/**
 * Input de mensaje con textarea auto-expandible, botón de imagen,
 * grabación de audio (MediaRecorder), adjuntar archivos/video.
 * Nuevas funcionalidades:
 * - Preview de respuesta con botón de cancelar
 * - Indicador de escritura (debounced)
 * - Selector de expiración (mensajes auto-destructibles)
 * - Botón para crear encuesta
 * Enter envía, Shift+Enter hace salto de línea.
 */
import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from 'react'
import {
  IconSend, IconPhoto, IconMicrophone, IconPlayerStop, IconPaperclip,
  IconX, IconFlame, IconChartBar,
} from '@tabler/icons-react'
import { useIdioma } from '../context/IdiomaContext'
import type { ReplyTo } from '../interfaces'

const OPCIONES_EXPIRACION = [
  { label: null, valor: undefined },     // Sin vencimiento
  { label: '1min', valor: 60 },
  { label: '5min', valor: 300 },
  { label: '1h', valor: 3600 },
] as const

type ValorExpiracion = 60 | 300 | 3600 | undefined

interface Props {
  onEnviar: (contenido: string) => void
  onEnviarConMetadata?: (contenido: string, replyToId: string | undefined, expiraEn: number | undefined) => void
  onEnviarImagen?: (archivo: File) => void
  onEnviarArchivo?: (archivo: File) => void
  deshabilitado?: boolean
  replyTo?: ReplyTo | null
  onCancelReply?: () => void
  onTyping?: () => void
  onStopTyping?: () => void
  onCrearEncuesta?: () => void
}

export function InputMensaje({
  onEnviar,
  onEnviarConMetadata,
  onEnviarImagen,
  onEnviarArchivo,
  deshabilitado = false,
  replyTo,
  onCancelReply,
  onTyping,
  onStopTyping,
  onCrearEncuesta,
}: Props) {
  const { t } = useIdioma()
  const [texto, setTexto] = useState('')
  const [grabando, setGrabando] = useState(false)
  const [expiraEn, setExpiraEn] = useState<ValorExpiracion>(undefined)
  const [mostrarExpiracion, setMostrarExpiracion] = useState(false)
  const inputImagenRef = useRef<HTMLInputElement>(null)
  const inputArchivoRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const estaEscribiendoRef = useRef(false)
  const expiryRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown de expiración al clic fuera
  useEffect(() => {
    if (!mostrarExpiracion) return
    const handler = (e: MouseEvent) => {
      if (expiryRef.current && !expiryRef.current.contains(e.target as Node)) {
        setMostrarExpiracion(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mostrarExpiracion])

  const dispararStopTyping = useCallback(() => {
    if (estaEscribiendoRef.current) {
      estaEscribiendoRef.current = false
      onStopTyping?.()
    }
  }, [onStopTyping])

  const manejarCambioTexto = (valor: string) => {
    setTexto(valor)
    if (valor.trim() && onTyping) {
      if (!estaEscribiendoRef.current) {
        estaEscribiendoRef.current = true
        onTyping()
      }
      // Reiniciar el timer de stop typing
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        dispararStopTyping()
      }, 2500)
    } else if (!valor.trim()) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      dispararStopTyping()
    }
  }

  const enviar = () => {
    const contenido = texto.trim()
    if (!contenido || deshabilitado) return

    if (onEnviarConMetadata) {
      onEnviarConMetadata(contenido, replyTo?.id, expiraEn)
    } else {
      onEnviar(contenido)
    }

    setTexto('')
    setExpiraEn(undefined)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    dispararStopTyping()
  }

  const manejarTecla = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  const manejarImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (archivo && onEnviarImagen) {
      onEnviarImagen(archivo)
      e.target.value = ''
    }
  }

  const manejarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (archivo && onEnviarArchivo) {
      onEnviarArchivo(archivo)
      e.target.value = ''
    }
  }

  const iniciarGrabacion = async () => {
    if (!onEnviarArchivo || deshabilitado) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
        MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
        MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : ''
      const ext = mimeType.includes('mp4') ? 'm4a' : 'webm'
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const tipo = mimeType.split(';')[0] || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: tipo })
        const file = new File([blob], `audio.${ext}`, { type: tipo })
        onEnviarArchivo(file)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRecorderRef.current = mr
      setGrabando(true)
    } catch {
      // Micrófono no disponible o permiso denegado
    }
  }

  const detenerGrabacion = () => {
    mediaRecorderRef.current?.stop()
    setGrabando(false)
  }

  const etiquetaExpiracion = () => {
    if (!expiraEn) return null
    if (expiraEn === 60) return t.polls.expiry1min
    if (expiraEn === 300) return t.polls.expiry5min
    return t.polls.expiry1h
  }

  const puedeEnviar = !!texto.trim() && !deshabilitado

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Preview de respuesta */}
      {replyTo && (
        <div
          className="flex items-center"
          style={{
            borderTop: '1px solid var(--color-border)',
            borderLeft: '3px solid var(--color-accent)',
            backgroundColor: 'var(--color-bg-tertiary)',
            padding: '0.5rem 0.75rem',
            gap: '0.5rem',
          }}
        >
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: '700', color: 'var(--color-accent)', marginBottom: '0.125rem' }}>
              {t.messages.replyTo} {replyTo.nombre_remitente}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {replyTo.subtipo === 'imagen' ? '📷 Imagen' :
               replyTo.subtipo === 'audio' ? '🎵 Audio' :
               replyTo.subtipo === 'video' ? '🎬 Video' :
               replyTo.subtipo === 'archivo' ? '📎 Archivo' :
               replyTo.contenido}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem', display: 'flex' }}
            title={t.messages.cancelReply}
          >
            <IconX size={16} />
          </button>
        </div>
      )}

      {/* Fila principal */}
      <div
        className="flex items-end border-t"
        style={{
          borderColor: 'var(--color-border)',
          padding: '0.75rem',
          gap: '0.5rem',
        }}
      >
        {/* Inputs ocultos */}
        <input ref={inputImagenRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={manejarImagen} />
        <input
          ref={inputArchivoRef}
          type="file"
          accept="video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
          style={{ display: 'none' }}
          onChange={manejarArchivo}
        />

        {/* Botón imagen */}
        {onEnviarImagen && !grabando && (
          <button
            type="button"
            onClick={() => !deshabilitado && inputImagenRef.current?.click()}
            disabled={deshabilitado}
            className="flex-shrink-0 flex items-center justify-center rounded-2xl transition-all disabled:opacity-40"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
              width: '2.75rem',
              height: '2.75rem',
            }}
            title="Enviar imagen"
          >
            <IconPhoto size={19} />
          </button>
        )}

        {/* Botón adjuntar archivo / video */}
        {onEnviarArchivo && !grabando && (
          <button
            type="button"
            onClick={() => !deshabilitado && inputArchivoRef.current?.click()}
            disabled={deshabilitado}
            className="flex-shrink-0 flex items-center justify-center rounded-2xl transition-all disabled:opacity-40"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
              width: '2.75rem',
              height: '2.75rem',
            }}
            title={t.common.attachFile}
          >
            <IconPaperclip size={19} />
          </button>
        )}

        {/* Botón encuesta */}
        {onCrearEncuesta && !grabando && (
          <button
            type="button"
            onClick={() => !deshabilitado && onCrearEncuesta()}
            disabled={deshabilitado}
            className="flex-shrink-0 flex items-center justify-center rounded-2xl transition-all disabled:opacity-40"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
              width: '2.75rem',
              height: '2.75rem',
            }}
            title={t.polls.create}
          >
            <IconChartBar size={19} />
          </button>
        )}

        {/* Textarea */}
        {!grabando ? (
          <textarea
            value={texto}
            onChange={e => manejarCambioTexto(e.target.value)}
            onKeyDown={manejarTecla}
            placeholder={t.chat.messagePlaceholder}
            disabled={deshabilitado}
            rows={1}
            className="flex-1 resize-none rounded-2xl outline-none transition-all"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
              border: '2px solid var(--color-border)',
              maxHeight: '140px',
              lineHeight: '1.5',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
            }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 140)}px`
            }}
          />
        ) : (
          /* Indicador de grabación */
          <div
            className="flex-1 flex items-center rounded-2xl"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '2px solid var(--color-danger)',
              padding: '0.75rem 1rem',
              gap: '0.625rem',
            }}
          >
            <span
              className="rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--color-danger)', width: '0.625rem', height: '0.625rem', flexShrink: 0 }}
            />
            <span style={{ color: 'var(--color-danger)', fontSize: '0.875rem', fontWeight: '500' }}>
              {t.common.micStop}...
            </span>
          </div>
        )}

        {/* Selector de expiración (botón llama) */}
        {!grabando && texto.trim() && (
          <div style={{ position: 'relative', flexShrink: 0 }} ref={expiryRef}>
            <button
              type="button"
              onClick={() => setMostrarExpiracion(prev => !prev)}
              className="flex-shrink-0 flex items-center justify-center rounded-2xl transition-all"
              style={{
                backgroundColor: expiraEn ? '#f97316' : 'var(--color-bg-tertiary)',
                color: expiraEn ? '#fff' : 'var(--color-text-muted)',
                border: expiraEn ? 'none' : '1px solid var(--color-border)',
                width: '2.75rem',
                height: '2.75rem',
              }}
              title={t.polls.expiryLabel}
            >
              <IconFlame size={18} />
            </button>
            {mostrarExpiracion && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '110%',
                  right: 0,
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0.75rem',
                  boxShadow: 'var(--shadow-md)',
                  minWidth: '130px',
                  zIndex: 30,
                  overflow: 'hidden',
                }}
              >
                {OPCIONES_EXPIRACION.map(op => (
                  <button
                    key={op.valor ?? 'none'}
                    onClick={() => { setExpiraEn(op.valor as ValorExpiracion); setMostrarExpiracion(false) }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      textAlign: 'left',
                      background: expiraEn === op.valor ? 'var(--color-accent-light)' : 'none',
                      color: expiraEn === op.valor ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                      border: 'none',
                      fontSize: '0.8125rem',
                      fontWeight: expiraEn === op.valor ? '600' : '400',
                      cursor: 'pointer',
                    }}
                  >
                    {op.valor === undefined ? t.polls.noExpiry :
                     op.valor === 60 ? t.polls.expiry1min :
                     op.valor === 300 ? t.polls.expiry5min :
                     t.polls.expiry1h}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Indicador de expiración seleccionada */}
        {expiraEn && !mostrarExpiracion && texto.trim() && (
          <span style={{ fontSize: '0.6875rem', color: '#f97316', flexShrink: 0, fontWeight: '600', alignSelf: 'center' }}>
            {etiquetaExpiracion()}
          </span>
        )}

        {/* Botón micrófono / stop */}
        {onEnviarArchivo && !texto.trim() && (
          <button
            type="button"
            onClick={grabando ? detenerGrabacion : iniciarGrabacion}
            disabled={deshabilitado && !grabando}
            className="flex-shrink-0 flex items-center justify-center rounded-2xl transition-all disabled:opacity-40"
            style={{
              backgroundColor: grabando ? 'var(--color-danger)' : 'var(--color-bg-tertiary)',
              color: grabando ? '#fff' : 'var(--color-text-muted)',
              border: grabando ? 'none' : '1px solid var(--color-border)',
              width: '2.75rem',
              height: '2.75rem',
            }}
            title={grabando ? t.common.micStop : t.common.micStart}
          >
            {grabando ? <IconPlayerStop size={18} /> : <IconMicrophone size={19} />}
          </button>
        )}

        {/* Botón enviar (solo cuando hay texto) */}
        {(!onEnviarArchivo || texto.trim()) && !grabando && (
          <button
            onClick={enviar}
            disabled={!puedeEnviar}
            className="flex-shrink-0 flex items-center justify-center rounded-2xl transition-all"
            style={{
              backgroundColor: puedeEnviar ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
              color: puedeEnviar ? '#fff' : 'var(--color-text-muted)',
              transform: puedeEnviar ? 'scale(1)' : 'scale(0.92)',
              transition: 'all 0.2s ease',
              boxShadow: puedeEnviar ? 'var(--shadow-md)' : 'none',
              width: '2.75rem',
              height: '2.75rem',
            }}
            title={t.chat.send}
          >
            <IconSend size={19} />
          </button>
        )}
      </div>
    </div>
  )
}
