/**
 * Modal de perfil del usuario conectado.
 * Permite ver info, editar nombre (PATCH /usuarios/perfil) y acceder al borrado de cuenta.
 */
import { useState } from 'react'
import { IconUser, IconEdit, IconCheck, IconX, IconTrash } from '@tabler/icons-react'
import { useAuth } from '../context/AuthContext'
import { useIdioma } from '../context/IdiomaContext'
import { usuariosApi } from '../services/api'

interface Props {
  onEliminarPerfil: () => void
}

export function ModalPerfil({ onEliminarPerfil }: Props) {
  const { nombre, token, actualizarNombre } = useAuth()
  const { t } = useIdioma()

  const [editando, setEditando] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  const iniciarEdicion = () => {
    setNuevoNombre(nombre ?? '')
    setEditando(true)
    setError('')
    setExito(false)
  }

  const cancelarEdicion = () => {
    setEditando(false)
    setError('')
  }

  const guardarNombre = async () => {
    if (!nuevoNombre.trim() || !token) return
    setGuardando(true)
    setError('')
    try {
      await usuariosApi.editarNombre(nuevoNombre.trim(), token)
      actualizarNombre(nuevoNombre.trim())
      setEditando(false)
      setExito(true)
      setTimeout(() => setExito(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error)
    } finally {
      setGuardando(false)
    }
  }

  return (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    {/* Avatar + nombre */}
    <div
      className="flex flex-col items-center border-b"
      style={{ 
        borderColor: 'var(--color-border)',
        paddingBottom: '1.5rem',
        gap: '1.25rem'
      }}
    >
      <div
        className="rounded-3xl flex items-center justify-center font-bold"
        style={{
          backgroundColor: 'var(--color-accent-light)',
          color: 'var(--color-accent)',
          boxShadow: 'var(--shadow-lg)',
          width: '7rem',
          height: '7rem',
          fontSize: '2.5rem'
        }}
      >
        {nombre?.charAt(0).toUpperCase() ?? <IconUser size={40} />}
      </div>

      {editando ? (
        <div className="w-full flex" style={{ gap: '0.75rem' }}>
          <input
            type="text"
            value={nuevoNombre}
            onChange={e => setNuevoNombre(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') guardarNombre()
              if (e.key === 'Escape') cancelarEdicion()
            }}
            placeholder={t.profile.namePlaceholder}
            autoFocus
            className="flex-1 rounded-xl outline-none"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
              border: '2px solid var(--color-accent)',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem'
            }}
          />
          <button
            onClick={guardarNombre}
            disabled={guardando || !nuevoNombre.trim()}
            className="rounded-xl transition-colors disabled:opacity-40"
            style={{ 
              backgroundColor: 'var(--color-accent)', 
              color: '#fff',
              padding: '0.75rem'
            }}
            title={t.common.save}
          >
            <IconCheck size={20} />
          </button>
          <button
            onClick={cancelarEdicion}
            className="rounded-xl transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
              padding: '0.75rem'
            }}
            title={t.profile.cancel}
          >
            <IconX size={20} />
          </button>
        </div>
      ) : (
        <div className="flex items-center" style={{ gap: '0.75rem' }}>
          <span
            className="font-bold"
            style={{ 
              color: 'var(--color-text-primary)',
              fontSize: '1.25rem'
            }}
          >
            {nombre}
          </span>
          <button
            onClick={iniciarEdicion}
            className="rounded-xl transition-colors hover:bg-[var(--color-bg-tertiary)]"
            style={{ 
              color: 'var(--color-text-muted)',
              padding: '0.5rem'
            }}
            title={t.profile.editName}
          >
            <IconEdit size={18} />
          </button>
        </div>
      )}

      {error && (
        <p style={{ 
          color: 'var(--color-danger)',
          fontSize: '0.875rem'
        }}>{error}</p>
      )}
      {exito && (
        <p style={{ 
          color: '#22c55e',
          fontSize: '0.875rem'
        }}>{t.profile.editSuccess}</p>
      )}
    </div>

    {/* Botón eliminar perfil */}
    <button
      onClick={onEliminarPerfil}
      className="w-full flex items-center justify-center font-semibold rounded-xl transition-colors"
      style={{
        color: 'var(--color-danger)',
        border: '2px solid var(--color-danger)',
        backgroundColor: 'transparent',
        padding: '0.875rem',
        gap: '0.5rem',
        fontSize: '0.875rem'
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.1)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
      }}
    >
      <IconTrash size={18} />
      {t.profile.delete}
    </button>
  </div>
)
}
