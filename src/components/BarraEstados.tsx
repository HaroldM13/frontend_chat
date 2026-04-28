/**
 * Franja horizontal de estados (stories) dentro del sidebar.
 * Muestra el propio estado primero (con "+" si no tienes), luego los demás.
 */
import { useRef } from 'react'
import { IconPlus } from '@tabler/icons-react'
import type { Estado } from '../interfaces'
import { API_URL } from '../services/api'
import { useIdioma } from '../context/IdiomaContext'

interface Props {
  estados: Estado[]
  usuarioId: string
  onVerEstado: (estado: Estado) => void
  onSubirEstado: (archivo: File) => void
}

export function BarraEstados({ estados, usuarioId, onVerEstado, onSubirEstado }: Props) {
  const { t } = useIdioma()
  const inputRef = useRef<HTMLInputElement>(null)

  const propioEstado = estados.find(e => e.usuario_id === usuarioId)
  const otrosEstados = estados.filter(e => e.usuario_id !== usuarioId)

  const seleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (archivo) {
      onSubirEstado(archivo)
      e.target.value = ''
    }
  }

  if (estados.length === 0 && !propioEstado) {
    return (
      <div
        style={{
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center" style={{ gap: '0.75rem' }}>
          {/* Botón para subir propio estado */}
          <button
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center flex-shrink-0"
            style={{ gap: '0.375rem' }}
            title={t.estados.add}
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: '3rem',
                height: '3rem',
                border: '2px dashed var(--color-border)',
                color: 'var(--color-text-muted)',
                backgroundColor: 'var(--color-bg-tertiary)',
              }}
            >
              <IconPlus size={20} />
            </div>
            <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>
              {t.estados.my}
            </span>
          </button>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {t.estados.noEstados}
          </span>
        </div>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={seleccionarArchivo} />
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '0.75rem 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div
        className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden"
        style={{ gap: '1rem', padding: '0 1.5rem', scrollbarWidth: 'none' }}
      >
        {/* Propio estado */}
        <button
          onClick={() => propioEstado ? onVerEstado(propioEstado) : inputRef.current?.click()}
          className="flex flex-col items-center flex-shrink-0 transition-opacity hover:opacity-80"
          style={{ gap: '0.375rem' }}
          title={propioEstado ? t.estados.my : t.estados.add}
        >
          <div style={{ position: 'relative' }}>
            <div
              className="flex items-center justify-center rounded-full overflow-hidden"
              style={{
                width: '3.25rem',
                height: '3.25rem',
                border: propioEstado
                  ? '2.5px solid var(--color-accent)'
                  : '2px dashed var(--color-border)',
                backgroundColor: 'var(--color-bg-tertiary)',
              }}
            >
              {propioEstado ? (
                <img
                  src={`${API_URL}${propioEstado.url_imagen}`}
                  alt="mi estado"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <IconPlus size={20} style={{ color: 'var(--color-text-muted)' }} />
              )}
            </div>
            {!propioEstado && (
              <div
                className="absolute rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: '#fff',
                  width: '1.125rem',
                  height: '1.125rem',
                  bottom: 0,
                  right: 0,
                  border: '2px solid var(--color-bg-secondary)',
                }}
              >
                <IconPlus size={10} />
              </div>
            )}
          </div>
          <span
            className="truncate"
            style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', maxWidth: '3.5rem' }}
          >
            {t.estados.my}
          </span>
        </button>

        {/* Estados de otros */}
        {otrosEstados.map(estado => (
          <button
            key={estado.id}
            onClick={() => onVerEstado(estado)}
            className="flex flex-col items-center flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ gap: '0.375rem' }}
            title={estado.nombre_usuario}
          >
            <div
              className="flex items-center justify-center rounded-full overflow-hidden"
              style={{
                width: '3.25rem',
                height: '3.25rem',
                border: '2.5px solid var(--color-accent)',
                backgroundColor: 'var(--color-bg-tertiary)',
              }}
            >
              <img
                src={`${API_URL}${estado.url_imagen}`}
                alt={estado.nombre_usuario}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <span
              className="truncate"
              style={{ fontSize: '0.625rem', color: 'var(--color-text-secondary)', maxWidth: '3.5rem' }}
            >
              {estado.nombre_usuario}
            </span>
          </button>
        ))}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={seleccionarArchivo} />
    </div>
  )
}
