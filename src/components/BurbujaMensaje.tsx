/**
 * Burbuja de mensaje individual con animación de entrada.
 * Mensajes propios: derecha (azul). Ajenos: izquierda (fondo claro).
 * Para mensajes privados propios: muestra ✓ (enviado) o ✓✓ (leído en azul).
 */
import type { Mensaje, MensajeWS } from '../interfaces'
import { useAuth } from '../context/AuthContext'

interface Props {
  mensaje: Mensaje | MensajeWS
}

function formatearHora(fechaIso: string): string {
  try {
    return new Date(fechaIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function CheckMarks({ leido }: { leido: boolean | null | undefined }) {
  if (leido === null || leido === undefined) return null // sala o grupo
  if (leido) {
    // ✓✓ azul — leído
    return (
      <span style={{ color: '#3b82f6', fontSize: '11px', lineHeight: 1 }} title="Leído">
        ✓✓
      </span>
    )
  }
  // ✓ gris — enviado, no leído
  return (
    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', lineHeight: 1 }} title="Enviado">
      ✓
    </span>
  )
}

export function BurbujaMensaje({ mensaje }: Props) {
  const { usuarioId } = useAuth()
  const esPropio = mensaje.remitente_id === usuarioId
  const esPrivado = mensaje.tipo === 'privado'

  return (
    <div
      className={`flex flex-col mb-3 max-w-[78%] sm:max-w-[68%] animate-fade-in-up
        ${esPropio ? 'self-end items-end' : 'self-start items-start'}`}
    >
      {/* Nombre del remitente (solo mensajes ajenos) */}
      {!esPropio && (
        <span
          className="text-xs font-semibold mb-1 ml-1"
          style={{ color: 'var(--color-accent)' }}
        >
          {mensaje.nombre_remitente}
        </span>
      )}

      {/* Burbuja */}
      <div
        className="shadow-msg break-words text-sm leading-relaxed"
        style={{
          backgroundColor: esPropio
            ? 'var(--color-bg-message-own)'
            : 'var(--color-bg-message-other)',
          color: esPropio
            ? 'var(--color-text-message-own)'
            : 'var(--color-text-message-other)',
          borderRadius: esPropio ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          border: esPropio ? 'none' : '1px solid var(--color-border)',
          padding: '10px 14px',
          maxWidth: '100%',
        }}
      >
        {mensaje.contenido}
      </div>

      {/* Hora + checkmarks */}
      <div className="flex items-center gap-1 mt-1 mx-1">
        <span
          className="text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {formatearHora(mensaje.created_at)}
        </span>
        {esPropio && esPrivado && (
          <CheckMarks leido={mensaje.leido} />
        )}
      </div>
    </div>
  )
}
