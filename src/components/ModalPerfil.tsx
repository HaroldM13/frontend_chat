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
    <div className="space-y-5">
      {/* Avatar + nombre */}
      <div
        className="flex flex-col items-center gap-3 pb-5 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
          style={{
            backgroundColor: 'var(--color-accent-light)',
            color: 'var(--color-accent)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {nombre?.charAt(0).toUpperCase() ?? <IconUser size={32} />}
        </div>

        {editando ? (
          <div className="w-full flex gap-2">
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
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
                border: '1.5px solid var(--color-accent)',
              }}
            />
            <button
              onClick={guardarNombre}
              disabled={guardando || !nuevoNombre.trim()}
              className="p-2 rounded-lg transition-colors disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
              title={t.common.save}
            >
              <IconCheck size={16} />
            </button>
            <button
              onClick={cancelarEdicion}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-secondary)',
              }}
              title={t.profile.cancel}
            >
              <IconX size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span
              className="font-semibold text-lg"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {nombre}
            </span>
            <button
              onClick={iniciarEdicion}
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-bg-tertiary)]"
              style={{ color: 'var(--color-text-muted)' }}
              title={t.profile.editName}
            >
              <IconEdit size={15} />
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>
        )}
        {exito && (
          <p className="text-xs" style={{ color: '#22c55e' }}>{t.profile.editSuccess}</p>
        )}
      </div>

      {/* Botón eliminar perfil */}
      <button
        onClick={onEliminarPerfil}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors"
        style={{
          color: 'var(--color-danger)',
          border: '1.5px solid var(--color-danger)',
          backgroundColor: 'transparent',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
            'rgba(239,68,68,0.08)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
        }}
      >
        <IconTrash size={15} />
        {t.profile.delete}
      </button>
    </div>
  )
}
