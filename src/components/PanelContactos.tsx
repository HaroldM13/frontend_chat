/**
 * Panel de gestión de contactos.
 * Permite agregar, listar y eliminar contactos.
 */
import { useState } from 'react'
import { IconPlus, IconTrash, IconMessageCircle, IconUserOff } from '@tabler/icons-react'
import { contactosApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useIdioma } from '../context/IdiomaContext'
import type { Contacto, ChatActivo } from '../interfaces'

interface Props {
  contactos: Contacto[]
  onActualizar: () => void
  onIrAlChat: (chat: ChatActivo) => void
  onCerrar: () => void
}

export function PanelContactos({ contactos, onActualizar, onIrAlChat, onCerrar }: Props) {
  const { token } = useAuth()
  const { t } = useIdioma()
  const [telefono, setTelefono] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const agregar = async () => {
    if (!telefono.trim() || !token) return
    setCargando(true)
    setError('')
    try {
      await contactosApi.agregar({ telefono: telefono.trim() }, token)
      setTelefono('')
      onActualizar()
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error)
    } finally {
      setCargando(false)
    }
  }

  const eliminar = async (contactoId: string) => {
    if (!token) return
    try {
      await contactosApi.eliminar(contactoId, token)
      onActualizar()
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error)
    }
  }

  const contactosFiltrados = contactos.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono.includes(busqueda)
  )

  return (
    <div className="flex flex-col h-full">
      {/* Formulario para agregar contacto */}
      <div
        className="p-4 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          {t.contacts.add}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            placeholder={t.contacts.addPlaceholder}
            onKeyDown={e => e.key === 'Enter' && agregar()}
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          />
          <button
            onClick={agregar}
            disabled={cargando || !telefono.trim()}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
          >
            <IconPlus size={16} />
          </button>
        </div>
        {error && (
          <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{error}</p>
        )}
      </div>

      {/* Búsqueda */}
      <div className="px-4 py-2">
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder={t.contacts.search}
          className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        />
      </div>

      {/* Lista de contactos */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {contactosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <IconUserOff size={32} style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {t.contacts.empty}
            </p>
          </div>
        ) : (
          contactosFiltrados.map(c => (
            <div
              key={c.contacto_id}
              className="flex items-center gap-3 py-3 border-b"
              style={{ borderColor: 'var(--color-border-light)' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
              >
                {c.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {c.nombre}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {c.telefono}
                </p>
              </div>
              <button
                onClick={() => {
                  onIrAlChat({ tipo: 'privado', id: c.contacto_id, nombre: c.nombre })
                  onCerrar()
                }}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--color-accent)' }}
                title={t.contacts.chat}
              >
                <IconMessageCircle size={16} />
              </button>
              <button
                onClick={() => eliminar(c.contacto_id)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--color-danger)' }}
                title={t.contacts.delete}
              >
                <IconTrash size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
