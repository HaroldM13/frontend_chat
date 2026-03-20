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
  <div className="flex flex-col h-full" style={{ maxHeight: '600px' }}>
    {/* Formulario para crear grupo */}
    <div className="border-b" style={{ 
      borderColor: 'var(--color-border)',
      padding: '1.5rem'
    }}>
      <p className="font-semibold" style={{ 
        color: 'var(--color-text-secondary)',
        fontSize: '0.875rem',
        marginBottom: '1rem'
      }}>
        {t.groups.create}
      </p>
      <div className="flex" style={{ gap: '0.75rem' }}>
        <input
          type="text"
          value={nuevoNombre}
          onChange={e => setNuevoNombre(e.target.value)}
          placeholder={t.groups.namePlaceholder}
          onKeyDown={e => e.key === 'Enter' && crearGrupo()}
          className="flex-1 rounded-xl outline-none"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)',
            border: '1.5px solid var(--color-border)',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem'
          }}
        />
        <button
          onClick={crearGrupo}
          disabled={cargando || !nuevoNombre.trim()}
          className="rounded-xl font-medium disabled:opacity-40"
          style={{ 
            backgroundColor: 'var(--color-accent)', 
            color: '#fff',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem'
          }}
        >
          <IconPlus size={20} />
        </button>
      </div>
      {error && (
        <p style={{ 
          color: 'var(--color-danger)',
          fontSize: '0.75rem',
          marginTop: '0.5rem'
        }}>{error}</p>
      )}
    </div>

    {/* Lista de grupos */}
    <div className="flex-1 overflow-y-auto" style={{ padding: '1.5rem' }}>
      {grupos.length === 0 ? (
        <div className="flex flex-col items-center justify-center" style={{ 
          paddingTop: '3rem',
          paddingBottom: '3rem',
          gap: '0.75rem'
        }}>
          <IconUsersGroup size={40} style={{ color: 'var(--color-text-muted)' }} />
          <p className="font-medium" style={{ 
            color: 'var(--color-text-muted)',
            fontSize: '0.875rem'
          }}>
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
              className="border rounded-2xl overflow-hidden"
              style={{ 
                borderColor: 'var(--color-border)',
                marginBottom: '1rem'
              }}
            >
              {/* Cabecera del grupo */}
              <div
                className="flex items-center cursor-pointer"
                style={{ 
                  backgroundColor: 'var(--color-bg-tertiary)',
                  padding: '1.25rem',
                  gap: '1rem'
                }}
                onClick={() => setGrupoExpandido(expandido ? null : g.id)}
              >
                <div
                  className="rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: 'var(--color-accent-light)', 
                    color: 'var(--color-accent)',
                    width: '2.75rem',
                    height: '2.75rem'
                  }}
                >
                  <IconUsersGroup size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate" style={{ 
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    marginBottom: '0.125rem'
                  }}>
                    {g.nombre}
                  </p>
                  <p style={{ 
                    color: 'var(--color-text-muted)',
                    fontSize: '0.75rem'
                  }}>
                    {g.miembros.length} {t.groups.members}
                    {esCreador && ` · ${t.groups.createdBy} ${t.groups.you}`}
                  </p>
                </div>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {expandido ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                </span>
              </div>

              {/* Detalle expandido */}
              {expandido && (
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Botón de ir al chat */}
                  <button
                    onClick={() => {
                      onIrAlChat({ tipo: 'grupo', id: g.id, nombre: g.nombre })
                      onCerrar()
                    }}
                    className="w-full text-center font-semibold rounded-xl transition-colors hover:opacity-90"
                    style={{ 
                      backgroundColor: 'var(--color-accent)', 
                      color: '#fff',
                      padding: '0.75rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    {t.contacts.chat}
                  </button>

                  {/* Lista de miembros */}
                  <div>
                    <p className="font-bold uppercase" style={{ 
                      color: 'var(--color-text-muted)',
                      fontSize: '0.6875rem',
                      letterSpacing: '0.05em',
                      marginBottom: '0.75rem'
                    }}>
                      {t.groups.membersList}
                    </p>
                    {g.miembros.map(m => (
                      <div key={m.id} className="flex items-center" style={{ 
                        gap: '0.75rem',
                        padding: '0.5rem 0'
                      }}>
                        <div
                          className="rounded-xl flex items-center justify-center font-bold"
                          style={{ 
                            backgroundColor: 'var(--color-accent-light)', 
                            color: 'var(--color-accent)',
                            width: '2rem',
                            height: '2rem',
                            fontSize: '0.75rem'
                          }}
                        >
                          {m.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ 
                          color: 'var(--color-text-secondary)',
                          fontSize: '0.875rem'
                        }}>
                          {m.nombre} {m.id === usuarioId && `(${t.chat.you})`}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Agregar miembro */}
                  {agregandoEn === g.id ? (
                    <div className="flex" style={{ gap: '0.75rem' }}>
                      <input
                        type="text"
                        value={telefonoMiembro}
                        onChange={e => setTelefonoMiembro(e.target.value)}
                        placeholder={t.groups.addMemberPlaceholder}
                        onKeyDown={e => e.key === 'Enter' && agregarMiembro(g.id)}
                        className="flex-1 rounded-xl outline-none"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          color: 'var(--color-text-primary)',
                          border: '1.5px solid var(--color-border)',
                          padding: '0.625rem 0.875rem',
                          fontSize: '0.875rem'
                        }}
                      />
                      <button
                        onClick={() => agregarMiembro(g.id)}
                        className="rounded-xl"
                        style={{ 
                          backgroundColor: 'var(--color-accent)', 
                          color: '#fff',
                          padding: '0.625rem 0.875rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        <IconPlus size={18} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAgregandoEn(g.id)}
                      className="flex items-center font-medium"
                      style={{ 
                        color: 'var(--color-accent)',
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      <IconUserPlus size={18} />
                      {t.groups.addMember}
                    </button>
                  )}

                  {/* Acciones del grupo */}
                  <div className="flex" style={{ gap: '0.75rem', paddingTop: '0.5rem' }}>
                    {esCreador ? (
                      <button
                        onClick={() => eliminarGrupo(g.id)}
                        className="flex items-center font-medium rounded-xl"
                        style={{ 
                          backgroundColor: 'var(--color-danger)', 
                          color: '#fff',
                          padding: '0.625rem 1.25rem',
                          gap: '0.5rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        <IconTrash size={16} />
                        {t.groups.delete}
                      </button>
                    ) : (
                      <button
                        onClick={() => salirGrupo(g.id)}
                        className="flex items-center font-medium rounded-xl"
                        style={{ 
                          border: '1.5px solid var(--color-danger)', 
                          color: 'var(--color-danger)',
                          padding: '0.625rem 1.25rem',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          backgroundColor: 'transparent'
                        }}
                      >
                        <IconDoorExit size={16} />
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
