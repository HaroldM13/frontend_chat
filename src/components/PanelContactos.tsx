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
  <div className="flex flex-col h-full" style={{ maxHeight: '600px' }}>
    {/* Formulario para agregar contacto */}
    <div
      className="border-b"
      style={{ 
        borderColor: 'var(--color-border)',
        padding: '1.5rem'
      }}
    >
      <p className="font-semibold" style={{ 
        color: 'var(--color-text-secondary)',
        fontSize: '0.875rem',
        marginBottom: '1rem'
      }}>
        {t.contacts.add}
      </p>
      <div className="flex" style={{ gap: '0.75rem' }}>
        <input
          type="text"
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
          placeholder={t.contacts.addPlaceholder}
          onKeyDown={e => e.key === 'Enter' && agregar()}
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
          onClick={agregar}
          disabled={cargando || !telefono.trim()}
          className="rounded-xl font-medium transition-colors disabled:opacity-40"
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

    {/* Búsqueda */}
    <div style={{ padding: '1rem 1.5rem' }}>
      <input
        type="text"
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder={t.contacts.search}
        className="w-full rounded-xl outline-none"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-primary)',
          border: '1.5px solid var(--color-border)',
          padding: '0.625rem 1rem',
          fontSize: '0.875rem'
        }}
      />
    </div>

    {/* Lista de contactos */}
    <div className="flex-1 overflow-y-auto" style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
      {contactosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center" style={{ 
          paddingTop: '3rem',
          paddingBottom: '3rem',
          gap: '0.75rem'
        }}>
          <IconUserOff size={40} style={{ color: 'var(--color-text-muted)' }} />
          <p className="font-medium" style={{ 
            color: 'var(--color-text-muted)',
            fontSize: '0.875rem'
          }}>
            {t.contacts.empty}
          </p>
        </div>
      ) : (
        contactosFiltrados.map(c => (
          <div
            key={c.contacto_id}
            className="flex items-center border-b"
            style={{ 
              borderColor: 'var(--color-border-light)',
              padding: '1rem 0',
              gap: '1rem'
            }}
          >
            <div
              className="rounded-2xl flex items-center justify-center font-bold flex-shrink-0"
              style={{ 
                backgroundColor: 'var(--color-accent-light)', 
                color: 'var(--color-accent)',
                width: '2.75rem',
                height: '2.75rem',
                fontSize: '0.9375rem'
              }}
            >
              {c.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate" style={{ 
                color: 'var(--color-text-primary)',
                fontSize: '0.875rem',
                marginBottom: '0.125rem'
              }}>
                {c.nombre}
              </p>
              <p style={{ 
                color: 'var(--color-text-muted)',
                fontSize: '0.75rem'
              }}>
                {c.telefono}
              </p>
            </div>
            <button
              onClick={() => {
                onIrAlChat({ tipo: 'privado', id: c.contacto_id, nombre: c.nombre })
                onCerrar()
              }}
              className="rounded-xl transition-colors hover:bg-[var(--color-bg-tertiary)]"
              style={{ 
                color: 'var(--color-accent)',
                padding: '0.625rem'
              }}
              title={t.contacts.chat}
            >
              <IconMessageCircle size={20} />
            </button>
            <button
              onClick={() => eliminar(c.contacto_id)}
              className="rounded-xl transition-colors hover:bg-[var(--color-bg-tertiary)]"
              style={{ 
                color: 'var(--color-danger)',
                padding: '0.625rem'
              }}
              title={t.contacts.delete}
            >
              <IconTrash size={20} />
            </button>
          </div>
        ))
      )}
    </div>
  </div>
)
}
