/**
 * Modal fullscreen para ver un estado (story).
 * - Barra de progreso: 15 segundos de visualización, se cierra solo al llegar a 0.
 * - Muestra cuánto tiempo queda en el sistema (de los 5 minutos totales).
 */
import { useEffect, useState, useRef } from 'react'
import { IconX, IconTrash } from '@tabler/icons-react'
import type { Estado } from '../interfaces'
import { API_URL } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useIdioma } from '../context/IdiomaContext'

const VIEWER_SECONDS = 15

interface Props {
  estado: Estado
  onCerrar: () => void
  onEliminar: (id: string) => void
}

export function ModalVisorEstado({ estado, onCerrar, onEliminar }: Props) {
  const { usuarioId } = useAuth()
  const { t } = useIdioma()
  const [viewerProgress, setViewerProgress] = useState(100)
  const [sistemaTimeLeft, setSistemaTimeLeft] = useState('')
  const esPropio = estado.usuario_id === usuarioId
  const startRef = useRef(Date.now())

  useEffect(() => {
    startRef.current = Date.now()

    const tick = () => {
      const transcurrido = (Date.now() - startRef.current) / 1000
      const viewerRestante = Math.max(0, VIEWER_SECONDS - transcurrido)
      setViewerProgress((viewerRestante / VIEWER_SECONDS) * 100)

      // Tiempo restante en el sistema (los 5 min)
      const expira = new Date(estado.expira_at).getTime()
      const sistemaRestante = Math.max(0, expira - Date.now())
      const mins = Math.floor(sistemaRestante / 60000)
      const segs = Math.floor((sistemaRestante % 60000) / 1000)
      setSistemaTimeLeft(`${mins}m ${segs}s`)

      if (viewerRestante <= 0) {
        onCerrar()
      }
    }

    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [estado, onCerrar])

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCerrar])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
      onClick={onCerrar}
    >
      {/* Barra de progreso — 15 segundos de visor */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{ height: '3px', backgroundColor: 'rgba(255,255,255,0.2)' }}
      >
        <div
          style={{
            height: '100%',
            width: `${viewerProgress}%`,
            backgroundColor: 'var(--color-accent)',
            transition: 'width 0.5s linear',
          }}
        />
      </div>

      {/* Cabecera */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between"
        style={{ padding: '1.25rem 1.5rem', paddingTop: '1rem' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center" style={{ gap: '0.75rem' }}>
          <div
            className="rounded-2xl flex items-center justify-center font-bold flex-shrink-0"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: '#fff',
              width: '2.5rem',
              height: '2.5rem',
              fontSize: '1rem',
            }}
          >
            {estado.nombre_usuario.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white" style={{ fontSize: '0.9375rem' }}>
              {estado.nombre_usuario}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
              {t.estados.minLeft}: {sistemaTimeLeft}
            </span>
          </div>
        </div>

        <div className="flex items-center" style={{ gap: '0.5rem' }}>
          {esPropio && (
            <button
              onClick={() => { onEliminar(estado.id); onCerrar() }}
              className="rounded-xl p-2 transition-colors hover:bg-white/10"
              style={{ color: '#ef4444' }}
              title={t.estados.delete}
            >
              <IconTrash size={20} />
            </button>
          )}
          <button
            onClick={onCerrar}
            className="rounded-xl p-2 transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.8)' }}
          >
            <IconX size={22} />
          </button>
        </div>
      </div>

      {/* Imagen */}
      <img
        src={`${API_URL}${estado.url_imagen}`}
        alt={`Estado de ${estado.nombre_usuario}`}
        style={{
          maxWidth: '90vw',
          maxHeight: '80vh',
          borderRadius: '1rem',
          objectFit: 'contain',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      />
    </div>
  )
}
