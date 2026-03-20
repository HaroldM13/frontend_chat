/**
 * Panel de gestión de grupos.
 * Permite crear grupos, ver miembros, agregar miembros, salir o eliminar.
 */
import { useState } from 'react'
import {
  IconPlus,
  IconTrash,
  IconDoorExit,
  IconUsersGroup,
  IconUserPlus,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react'
import { gruposApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useIdioma } from '../context/IdiomaContext'
import type { Grupo, ChatActivo } from '../interfaces'

interface Props {
  grupos: Grupo[]
  onActualizar: () => void
  onIrAlChat: (chat: ChatActivo) => void
  onCerrar: () => void
}

export function PanelGrupos({ grupos, onActualizar, onIrAlChat, onCerrar }: Props) {
  const { token, usuarioId } = useAuth()
  const { t } = useIdioma()
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [grupoExpandido, setGrupoExpandido] = useState<string | null>(null)
  const [telefonoMiembro, setTelefonoMiembro] = useState('')
  const [agregandoEn, setAgregandoEn] = useState<string | null>(null)

  const crearGrupo = async () => {
    if (!nuevoNombre.trim() || !token) return
    setCargando(true)
    setError('')
    try {
      await gruposApi.crear({ nombre: nuevoNombre.trim() }, token)
      setNuevoNombre('')
      onActualizar()
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error)
    } finally {
      setCargando(false)
    }
  }

  const eliminarGrupo = async (grupoId: string) => {
    if (!token || !confirm(t.groups.deleteConfirm)) return
    try {
      await gruposApi.eliminar(grupoId, token)
      onActualizar()
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error)
    }
  }

  const salirGrupo = async (grupoId: string) => {
    if (!token || !confirm(t.groups.leaveConfirm)) return
    try {
      await gruposApi.salir(grupoId, token)
      onActualizar()
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error)
    }
  }

  const agregarMiembro = async (grupoId: string) => {
    if (!telefonoMiembro.trim() || !token) return
    try {
      await gruposApi.agregarMiembro(grupoId, { telefono: telefonoMiembro.trim() }, token)
      setTelefonoMiembro('')
      setAgregandoEn(null)
      onActualizar()
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Formulario para crear grupo */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          {t.groups.create}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={nuevoNombre}
            onChange={e => setNuevoNombre(e.target.value)}
            placeholder={t.groups.namePlaceholder}
            onKeyDown={e => e.key === 'Enter' && crearGrupo()}
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          />
          <button
            onClick={crearGrupo}
            disabled={cargando || !nuevoNombre.trim()}
            className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
          >
            <IconPlus size={16} />
          </button>
        </div>
        {error && (
          <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{error}</p>
        )}
      </div>

      {/* Lista de grupos */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {grupos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <IconUsersGroup size={32} style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {t.groups.empty}
            </p>
          </div>
        ) : (
          grupos.map(g => {
            const esCreador = g.creador_id === usuarioId
            const expandido = grupoExpandido === g.id

            return (
              <div
                key={g.id}
                className="border rounded-xl mb-3 overflow-hidden"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {/* Cabecera del grupo */}
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                  onClick={() => setGrupoExpandido(expandido ? null : g.id)}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
                  >
                    <IconUsersGroup size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {g.nombre}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {g.miembros.length} {t.groups.members}
                      {esCreador && ` · ${t.groups.createdBy} ${t.groups.you}`}
                    </p>
                  </div>
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {expandido ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                  </span>
                </div>

                {/* Detalle expandido */}
                {expandido && (
                  <div className="p-3 space-y-3">
                    {/* Botón de ir al chat */}
                    <button
                      onClick={() => {
                        onIrAlChat({ tipo: 'grupo', id: g.id, nombre: g.nombre })
                        onCerrar()
                      }}
                      className="w-full py-2 rounded-lg text-sm font-medium text-center"
                      style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
                    >
                      {t.contacts.chat}
                    </button>

                    {/* Lista de miembros */}
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                        {t.groups.membersList}
                      </p>
                      {g.miembros.map(m => (
                        <div key={m.id} className="flex items-center gap-2 py-1">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
                          >
                            {m.nombre.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {m.nombre} {m.id === usuarioId && `(${t.chat.you})`}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Agregar miembro */}
                    {agregandoEn === g.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={telefonoMiembro}
                          onChange={e => setTelefonoMiembro(e.target.value)}
                          placeholder={t.groups.addMemberPlaceholder}
                          onKeyDown={e => e.key === 'Enter' && agregarMiembro(g.id)}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
                          style={{
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border)',
                          }}
                        />
                        <button
                          onClick={() => agregarMiembro(g.id)}
                          className="px-2 rounded-lg text-xs"
                          style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
                        >
                          <IconPlus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAgregandoEn(g.id)}
                        className="flex items-center gap-1.5 text-xs"
                        style={{ color: 'var(--color-accent)' }}
                      >
                        <IconUserPlus size={14} />
                        {t.groups.addMember}
                      </button>
                    )}

                    {/* Acciones del grupo */}
                    <div className="flex gap-2 pt-1">
                      {esCreador ? (
                        <button
                          onClick={() => eliminarGrupo(g.id)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                          style={{ backgroundColor: 'var(--color-danger)', color: '#fff' }}
                        >
                          <IconTrash size={13} />
                          {t.groups.delete}
                        </button>
                      ) : (
                        <button
                          onClick={() => salirGrupo(g.id)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                          style={{ border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
                        >
                          <IconDoorExit size={13} />
                          {t.groups.leave}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
