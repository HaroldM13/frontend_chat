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
  if (leido === null || leido === undefined) return null
  if (leido) {
    return (
      <span style={{ 
        color: '#3b82f6', 
        fontSize: '0.75rem', 
        lineHeight: 1, 
        fontWeight: '600' 
      }} title="Leído">
        ✓✓
      </span>
    )
  }
  return (
    <span style={{ 
      color: 'rgba(255,255,255,0.65)', 
      fontSize: '0.75rem', 
      lineHeight: 1, 
      fontWeight: '600' 
    }} title="Enviado">
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
      className={`flex flex-col animate-fade-in-up max-w-[85%] sm:max-w-[75%] md:max-w-[65%]
        ${esPropio ? 'self-end items-end' : 'self-start items-start'}`}
      style={{ marginBottom: '1.25rem' }}
    >
      {/* Nombre del remitente (solo mensajes ajenos) */}
      {!esPropio && (
        <span
          className="font-bold"
          style={{ 
            color: 'var(--color-accent)',
            fontSize: '0.75rem',
            marginBottom: '0.5rem',
            marginLeft: '0.5rem'
          }}
        >
          {mensaje.nombre_remitente}
        </span>
      )}

      {/* Burbuja */}
      <div
        className="shadow-msg break-words"
        style={{
          backgroundColor: esPropio
            ? 'var(--color-bg-message-own)'
            : 'var(--color-bg-message-other)',
          color: esPropio
            ? 'var(--color-text-message-own)'
            : 'var(--color-text-message-other)',
          borderRadius: esPropio ? '1.25rem 1.25rem 0.375rem 1.25rem' : '1.25rem 1.25rem 1.25rem 0.375rem',
          border: esPropio ? 'none' : '1px solid var(--color-border)',
          padding: '0.875rem 1.125rem',
          maxWidth: '100%',
          minWidth: '4rem',
          fontSize: '0.9375rem',
          lineHeight: '1.5',
          boxShadow: esPropio 
            ? '0 2px 8px rgba(30, 77, 140, 0.25)' 
            : 'var(--shadow-msg)',
        }}
      >
        {mensaje.contenido}
      </div>

      {/* Hora + checkmarks */}
      <div className="flex items-center" style={{ 
        gap: '0.375rem',
        marginTop: '0.375rem',
        marginLeft: esPropio ? '0' : '0.5rem',
        marginRight: esPropio ? '0.5rem' : '0'
      }}>
        <span
          className="font-medium"
          style={{ 
            color: 'var(--color-text-muted)',
            fontSize: '0.6875rem'
          }}
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