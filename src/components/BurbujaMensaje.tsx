/**
 * Burbuja de mensaje individual con:
 * - Soporte para mensajes eliminados (soft delete)
 * - Cita/respuesta (reply_to) con preview
 * - Barra de acciones al hacer hover (reaccionar, responder, editar, eliminar)
 * - Reacciones: pills con emoji + conteo
 * - Badge "editado"
 * - Renderizado de encuestas con barras de progreso en tiempo real
 * - Contador de expiración para mensajes auto-destructibles
 * - Checkmarks de lectura ✓/✓✓
 */
import { useState, useEffect, useRef } from 'react'
import type { Mensaje, MensajeWS, OpcionEncuesta } from '../interfaces'
import { useAuth } from '../context/AuthContext'
import { useIdioma } from '../context/IdiomaContext'
import { API_URL } from '../services/api'
import { IconFile, IconFileTypePdf, IconFileTypeDocx, IconFileTypeXls, IconTrash, IconEdit, IconCornerUpLeft, IconMoodSmile } from '@tabler/icons-react'

const EMOJIS_RAPIDOS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉']

interface Props {
  mensaje: Mensaje | MensajeWS
  onReply?: (m: Mensaje | MensajeWS) => void
  onEdit?: (m: Mensaje | MensajeWS) => void
  onDelete?: (m: Mensaje | MensajeWS) => void
  onReaccionar?: (msgId: string, emoji: string) => void
  onVotar?: (msgId: string, opcionId: string) => void
}

function iconoArchivo(nombre?: string) {
  const ext = nombre?.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return <IconFileTypePdf size={22} />
  if (ext === 'doc' || ext === 'docx') return <IconFileTypeDocx size={22} />
  if (ext === 'xls' || ext === 'xlsx') return <IconFileTypeXls size={22} />
  return <IconFile size={22} />
}

function ArchivoAdjunto({ url, nombre, esPropio }: { url: string; nombre?: string; esPropio: boolean }) {
  return (
    <a
      href={url}
      download={nombre}
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        textDecoration: 'none',
        color: esPropio ? 'var(--color-text-message-own)' : 'var(--color-text-message-other)',
        maxWidth: '240px',
      }}
    >
      <span style={{ flexShrink: 0, opacity: 0.85 }}>{iconoArchivo(nombre)}</span>
      <span style={{ fontSize: '0.8125rem', lineHeight: 1.3, wordBreak: 'break-word', fontWeight: '500' }}>
        {nombre || 'Archivo adjunto'}
      </span>
    </a>
  )
}

function formatearHora(fechaIso: string): string {
  try {
    return new Date(fechaIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function CheckMarks({ leido }: { leido: boolean | null | undefined }) {
  if (leido === null || leido === undefined) return null
  if (leido) {
    return (
      <span style={{ color: '#3b82f6', fontSize: '0.75rem', lineHeight: 1, fontWeight: '600' }} title="Leído">
        ✓✓
      </span>
    )
  }
  return (
    <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', lineHeight: 1, fontWeight: '600' }} title="Enviado">
      ✓
    </span>
  )
}

/** Cuenta regresiva para mensajes auto-destructibles. */
function CountdownTimer({ expiraAt }: { expiraAt: string }) {
  const [segundosRestantes, setSegundosRestantes] = useState(() => {
    const diff = Math.floor((new Date(expiraAt).getTime() - Date.now()) / 1000)
    return Math.max(0, diff)
  })

  useEffect(() => {
    if (segundosRestantes <= 0) return
    const id = setInterval(() => {
      setSegundosRestantes(prev => {
        if (prev <= 1) { clearInterval(id); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (segundosRestantes <= 0) return null

  const h = Math.floor(segundosRestantes / 3600)
  const m = Math.floor((segundosRestantes % 3600) / 60)
  const s = segundosRestantes % 60
  const texto = h > 0
    ? `${h}h ${m.toString().padStart(2, '0')}m`
    : `${m}:${s.toString().padStart(2, '0')}`

  return (
    <span
      style={{
        fontSize: '0.6875rem',
        color: segundosRestantes < 60 ? 'var(--color-danger)' : '#f97316',
        fontWeight: '600',
        letterSpacing: '0.02em',
      }}
      title="Expira en"
    >
      ⏱ {texto}
    </span>
  )
}

/** Renderiza la encuesta con barras de progreso y botones de voto. */
function EncuestaView({
  contenido,
  msgId,
  votos,
  opciones: opcionesProp,
  esPropio,
  onVotar,
  usuarioId,
}: {
  contenido: string
  msgId: string
  votos?: Record<string, number> | null
  opciones?: OpcionEncuesta[]
  esPropio: boolean
  onVotar?: (msgId: string, opcionId: string) => void
  usuarioId: string | null
}) {
  let pregunta = ''
  let opciones: OpcionEncuesta[] = opcionesProp ?? []

  try {
    const parsed = JSON.parse(contenido) as { pregunta: string; opciones: OpcionEncuesta[] }
    pregunta = parsed.pregunta ?? ''
    if (!opcionesProp?.length) opciones = parsed.opciones ?? []
  } catch {
    // Si el contenido no es JSON válido, mostrar como texto plano
    return <span style={{ fontStyle: 'italic', opacity: 0.7 }}>📊 Encuesta</span>
  }

  const totalVotos = votos ? Object.values(votos).reduce((a, b) => a + b, 0) : 0
  const colorBase = esPropio ? 'rgba(255,255,255,0.25)' : 'var(--color-accent-light)'
  const colorFill = esPropio ? 'rgba(255,255,255,0.6)' : 'var(--color-accent)'
  const colorTexto = esPropio ? 'var(--color-text-message-own)' : 'var(--color-text-message-other)'
  void usuarioId

  return (
    <div style={{ minWidth: '200px', maxWidth: '280px' }}>
      <p style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.9rem', color: colorTexto, lineHeight: 1.4 }}>
        📊 {pregunta}
      </p>
      {opciones.map(op => {
        const votos_op = votos?.[op.id] ?? 0
        const pct = totalVotos > 0 ? Math.round((votos_op / totalVotos) * 100) : 0
        return (
          <button
            key={op.id}
            onClick={() => onVotar?.(msgId, op.id)}
            disabled={!onVotar}
            style={{
              display: 'block',
              width: '100%',
              marginBottom: '0.5rem',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: onVotar ? 'pointer' : 'default',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                borderRadius: '0.5rem',
                overflow: 'hidden',
                backgroundColor: colorBase,
                position: 'relative',
                height: '2rem',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${pct}%`,
                  backgroundColor: colorFill,
                  transition: 'width 0.4s ease',
                  borderRadius: '0.5rem',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0 0.625rem',
                  height: '100%',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  color: colorTexto,
                }}
              >
                <span>{op.texto}</span>
                <span style={{ opacity: 0.75, fontSize: '0.75rem' }}>{votos_op > 0 ? `${pct}%` : ''}</span>
              </div>
            </div>
          </button>
        )
      })}
      {totalVotos > 0 && (
        <p style={{ fontSize: '0.6875rem', opacity: 0.6, marginTop: '0.25rem', color: colorTexto }}>
          {totalVotos} voto{totalVotos !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

export function BurbujaMensaje({ mensaje, onReply, onEdit, onDelete, onReaccionar, onVotar }: Props) {
  const { usuarioId } = useAuth()
  const { t } = useIdioma()
  const esPropio = mensaje.remitente_id === usuarioId
  const esPrivado = mensaje.tipo === 'privado'
  const [hovered, setHovered] = useState(false)
  const [mostrarEmojis, setMostrarEmojis] = useState(false)
  const emojiRef = useRef<HTMLDivElement>(null)

  // Cerrar picker de emojis al hacer clic fuera
  useEffect(() => {
    if (!mostrarEmojis) return
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setMostrarEmojis(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mostrarEmojis])

  const esEliminado = mensaje.eliminado
  const reacciones = mensaje.reacciones ?? []

  return (
    <div
      className={`flex flex-col animate-fade-in-up max-w-[85%] sm:max-w-[75%] md:max-w-[65%]
        ${esPropio ? 'self-end items-end' : 'self-start items-start'}`}
      style={{ marginBottom: '1.25rem', position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMostrarEmojis(false) }}
    >
      {/* Nombre del remitente (solo mensajes ajenos) */}
      {!esPropio && (
        <span
          className="font-bold"
          style={{
            color: 'var(--color-accent)',
            fontSize: '0.75rem',
            marginBottom: '0.5rem',
            marginLeft: '0.5rem',
          }}
        >
          {mensaje.nombre_remitente}
        </span>
      )}

      {/* Preview de respuesta (reply_to) */}
      {!esEliminado && mensaje.reply_to && (
        <div
          style={{
            borderLeft: '3px solid var(--color-accent)',
            backgroundColor: esPropio ? 'rgba(255,255,255,0.15)' : 'var(--color-bg-tertiary)',
            borderRadius: '0.5rem 0.5rem 0 0',
            padding: '0.375rem 0.625rem',
            marginBottom: '-0.25rem',
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          <p
            style={{
              fontSize: '0.6875rem',
              fontWeight: '700',
              color: 'var(--color-accent)',
              marginBottom: '0.125rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {mensaje.reply_to.nombre_remitente}
          </p>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '220px',
            }}
          >
            {mensaje.reply_to.subtipo === 'imagen' ? '📷 Imagen' :
             mensaje.reply_to.subtipo === 'audio' ? '🎵 Audio' :
             mensaje.reply_to.subtipo === 'video' ? '🎬 Video' :
             mensaje.reply_to.subtipo === 'archivo' ? '📎 Archivo' :
             mensaje.reply_to.contenido}
          </p>
        </div>
      )}

      {/* Burbuja */}
      <div
        className="shadow-msg break-words"
        style={{
          backgroundColor: esEliminado
            ? 'var(--color-bg-tertiary)'
            : esPropio
              ? 'var(--color-bg-message-own)'
              : 'var(--color-bg-message-other)',
          color: esEliminado
            ? 'var(--color-text-muted)'
            : esPropio
              ? 'var(--color-text-message-own)'
              : 'var(--color-text-message-other)',
          borderRadius: esPropio ? '1.25rem 1.25rem 0.375rem 1.25rem' : '1.25rem 1.25rem 1.25rem 0.375rem',
          border: (esPropio && !esEliminado) ? 'none' : '1px solid var(--color-border)',
          padding: (!esEliminado && (mensaje.subtipo === 'imagen' || mensaje.subtipo === 'video')) ? '0.375rem'
            : (!esEliminado && (mensaje.subtipo === 'audio' || mensaje.subtipo === 'archivo')) ? '0.625rem 0.875rem'
            : '0.875rem 1.125rem',
          maxWidth: '100%',
          minWidth: '4rem',
          fontSize: '0.9375rem',
          lineHeight: '1.5',
          fontStyle: esEliminado ? 'italic' : 'normal',
          boxShadow: esPropio
            ? '0 2px 8px rgba(30, 77, 140, 0.25)'
            : 'var(--shadow-msg)',
          overflow: 'hidden',
        }}
      >
        {esEliminado ? (
          <span style={{ opacity: 0.65, fontSize: '0.875rem' }}>
            🗑️ {t.messages.deleted}
          </span>
        ) : mensaje.subtipo === 'encuesta' ? (
          <EncuestaView
            contenido={mensaje.contenido}
            msgId={mensaje.id}
            votos={mensaje.votos}
            opciones={mensaje.opciones}
            esPropio={esPropio}
            onVotar={onVotar}
            usuarioId={usuarioId}
          />
        ) : mensaje.subtipo === 'imagen' ? (
          <img
            src={`${API_URL}${mensaje.contenido}`}
            alt="imagen"
            style={{
              maxWidth: 'min(260px, 100%)',
              maxHeight: '320px',
              width: '100%',
              borderRadius: '0.75rem',
              display: 'block',
              cursor: 'pointer',
            }}
            onClick={() => window.open(`${API_URL}${mensaje.contenido}`, '_blank')}
          />
        ) : mensaje.subtipo === 'audio' ? (
          <audio
            controls
            src={`${API_URL}${mensaje.contenido}`}
            style={{ display: 'block', maxWidth: '280px', minWidth: '200px', height: '2.5rem' }}
          />
        ) : mensaje.subtipo === 'video' ? (
          <video
            controls
            src={`${API_URL}${mensaje.contenido}`}
            style={{ maxWidth: 'min(280px, 100%)', maxHeight: '200px', borderRadius: '0.75rem', display: 'block' }}
          />
        ) : mensaje.subtipo === 'archivo' ? (
          <ArchivoAdjunto url={`${API_URL}${mensaje.contenido}`} nombre={mensaje.nombre_archivo} esPropio={esPropio} />
        ) : (
          mensaje.contenido
        )}
      </div>

      {/* Hora + checkmarks + editado + countdown */}
      <div className="flex items-center" style={{
        gap: '0.375rem',
        marginTop: '0.375rem',
        marginLeft: esPropio ? '0' : '0.5rem',
        marginRight: esPropio ? '0.5rem' : '0',
        flexWrap: 'wrap',
      }}>
        <span
          className="font-medium"
          style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem' }}
        >
          {formatearHora(mensaje.created_at)}
        </span>
        {esPropio && esPrivado && <CheckMarks leido={mensaje.leido} />}
        {!esEliminado && mensaje.editado && (
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem', fontStyle: 'italic' }}>
            · {t.messages.edited}
          </span>
        )}
        {!esEliminado && mensaje.expira_at && (
          <CountdownTimer expiraAt={mensaje.expira_at} />
        )}
      </div>

      {/* Reacciones */}
      {!esEliminado && reacciones.length > 0 && (
        <div
          className="flex flex-wrap"
          style={{ gap: '0.25rem', marginTop: '0.375rem', marginLeft: esPropio ? 0 : '0.5rem', marginRight: esPropio ? '0.5rem' : 0 }}
        >
          {reacciones.map(r => {
            const yoReaccione = r.usuarios.includes(usuarioId ?? '')
            return (
              <button
                key={r.emoji}
                onClick={() => onReaccionar?.(mensaje.id, r.emoji)}
                title={r.usuarios.length > 0 ? `${r.count} reacción(es)` : ''}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  border: yoReaccione ? '1.5px solid var(--color-accent)' : '1.5px solid var(--color-border)',
                  backgroundColor: yoReaccione ? 'var(--color-accent-light)' : 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                }}
              >
                <span>{r.emoji}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{r.count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Barra de acciones al hacer hover */}
      {!esEliminado && hovered && (
        <div
          className="flex items-center"
          style={{
            position: 'absolute',
            top: '-2rem',
            [esPropio ? 'right' : 'left']: 0,
            gap: '0.25rem',
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.75rem',
            padding: '0.25rem 0.375rem',
            boxShadow: 'var(--shadow-md)',
            zIndex: 10,
          }}
        >
          {/* Emoji picker toggle */}
          {onReaccionar && (
            <div style={{ position: 'relative' }} ref={emojiRef}>
              <button
                onClick={() => setMostrarEmojis(prev => !prev)}
                title={t.messages.react}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '0.5rem',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <IconMoodSmile size={16} />
              </button>
              {mostrarEmojis && (
                <div
                  style={{
                    position: 'absolute',
                    top: '110%',
                    [esPropio ? 'right' : 'left']: 0,
                    display: 'flex',
                    gap: '0.25rem',
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.75rem',
                    padding: '0.375rem',
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 20,
                    flexWrap: 'nowrap',
                  }}
                >
                  {EMOJIS_RAPIDOS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => { onReaccionar(mensaje.id, emoji); setMostrarEmojis(false) }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.125rem',
                        padding: '0.25rem',
                        borderRadius: '0.5rem',
                        lineHeight: 1,
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.3)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Responder */}
          {onReply && (
            <button
              onClick={() => onReply(mensaje)}
              title={t.messages.reply}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '0.5rem',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <IconCornerUpLeft size={16} />
            </button>
          )}

          {/* Editar (solo propios, solo texto) */}
          {onEdit && esPropio && !mensaje.subtipo && (
            <button
              onClick={() => onEdit(mensaje)}
              title={t.messages.edit}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '0.5rem',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <IconEdit size={16} />
            </button>
          )}

          {/* Eliminar (solo propios) */}
          {onDelete && esPropio && (
            <button
              onClick={() => onDelete(mensaje)}
              title={t.messages.delete}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '0.5rem',
                color: 'var(--color-danger)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <IconTrash size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
