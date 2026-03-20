/**
 * Barra lateral con lista de conversaciones.
 * Responsive: oculta solo en móvil (< md), siempre visible en tablet/desktop.
 * Cabecera: área de perfil clicable (abre ModalPerfil) + controles de tema/idioma.
 * Pie: botón de cerrar sesión.
 */
import { useState } from 'react'
import {
  IconUsers,
  IconUsersGroup,
  IconMessages,
  IconSun,
  IconMoon,
  IconLogout,
  IconSearch,
  IconPlus,
  IconX,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react'
import { useAuth } from '../context/AuthContext'
import { useTema } from '../context/TemaContext'
import { useIdioma } from '../context/IdiomaContext'
import { authApi } from '../services/api'
import type { Contacto, Grupo, ChatActivo, Idioma } from '../interfaces'

interface Props {
  grupos: Grupo[]
  contactos: Contacto[]
  chatActivo: ChatActivo | null
  visible: boolean
  presencias: Record<string, boolean>
  onCerrar: () => void
  onSeleccionarChat: (chat: ChatActivo) => void
  onAbrirContactos: () => void
  onAbrirGrupos: () => void
  onAbrirPerfil: () => void
}

export function BarraLateral({
  grupos,
  contactos,
  chatActivo,
  visible,
  presencias,
  onCerrar,
  onSeleccionarChat,
  onAbrirContactos,
  onAbrirGrupos,
  onAbrirPerfil,
}: Props) {
  const { nombre, token, logout } = useAuth()
  const { tema, toggleTema } = useTema()
  const { t, idioma, cambiarIdioma } = useIdioma()
  const [busqueda, setBusqueda] = useState('')
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false)

  const manejarLogout = async () => {
    if (token) {
      try { await authApi.logout(token) } catch { /* ignorar */ }
    }
    logout()
  }

  const seleccionar = (chat: ChatActivo) => {
    onSeleccionarChat(chat)
    onCerrar() // en móvil cierra la barra al seleccionar
  }

  const contactosFiltrados = contactos.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono.includes(busqueda)
  )
  const gruposFiltrados = grupos.filter(g =>
    g.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const esSalaActiva = chatActivo?.tipo === 'sala'

  return (
    <>
      {/* Overlay oscuro en móvil cuando la barra está visible */}
      {visible && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/40 animate-fade-in"
          onClick={onCerrar}
        />
      )}

      {/* Panel lateral */}
      <aside
        className={`
          flex flex-col h-full
          fixed md:relative z-30 md:z-auto
          top-0 left-0
          transition-transform duration-300 ease-in-out
          ${visible ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRight: '1px solid var(--color-border)',
          width: '280px',
          minWidth: '260px',
          maxWidth: '85vw',
          boxShadow: visible ? 'var(--shadow-lg)' : 'none',
        }}
      >
        {/* Cabecera: perfil + botón cerrar en móvil */}
        <div
          className="border-b flex-shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {/* Área de perfil */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <button
              onClick={onAbrirPerfil}
              className="flex items-center gap-3 flex-1 min-w-0 rounded-xl p-1.5 -ml-1.5 transition-colors hover:bg-[var(--color-bg-tertiary)] text-left"
              title={t.profile.title}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  backgroundColor: 'var(--color-accent-light)',
                  color: 'var(--color-accent)',
                }}
              >
                {nombre?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div className="flex flex-col min-w-0">
                <span
                  className="text-sm font-semibold truncate"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {nombre}
                </span>
                <span
                  className="text-xs"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  JHT Chat
                </span>
              </div>
            </button>

            {/* Cerrar en móvil */}
            <button
              onClick={onCerrar}
              className="md:hidden p-1.5 rounded-lg transition-colors hover:bg-[var(--color-bg-tertiary)]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <IconX size={17} />
            </button>
          </div>

          {/* Ajustes: tema + idioma (colapsable) */}
          <div className="px-3 pb-3">
            <button
              onClick={() => setAjustesAbiertos(v => !v)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-[var(--color-bg-tertiary)]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <span className="font-medium uppercase tracking-wider">{t.nav.theme} & {t.nav.language}</span>
              {ajustesAbiertos ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
            </button>

            {ajustesAbiertos && (
              <div className="mt-2 px-3 py-2 rounded-xl flex items-center justify-between"
                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
              >
                {/* Tema */}
                <button
                  onClick={toggleTema}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-[var(--color-bg-hover)]"
                  style={{ color: 'var(--color-text-secondary)' }}
                  title={tema === 'light' ? t.nav.darkTheme : t.nav.lightTheme}
                >
                  {tema === 'light' ? <IconMoon size={15} /> : <IconSun size={15} />}
                  <span className="text-xs">{tema === 'light' ? t.nav.darkTheme : t.nav.lightTheme}</span>
                </button>

                {/* Idioma */}
                <select
                  value={idioma}
                  onChange={e => cambiarIdioma(e.target.value as Idioma)}
                  className="text-xs rounded-lg px-2 py-1.5 cursor-pointer outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                  title={t.nav.language}
                >
                  <option value="es">🌐 ES</option>
                  <option value="en">🌐 EN</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Búsqueda */}
        <div className="px-3 py-2.5 flex-shrink-0">
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1.5px solid var(--color-border)',
            }}
          >
            <IconSearch size={14} style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder={t.nav.search}
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>

        {/* Lista de conversaciones */}
        <div className="flex-1 overflow-y-auto">
          {/* Sala General */}
          <button
            onClick={() => seleccionar({ tipo: 'sala', nombre: t.chat.generalRoom })}
            className="conv-item w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left"
            style={{
              backgroundColor: esSalaActiva ? 'var(--color-accent-light)' : 'transparent',
              borderLeft: esSalaActiva ? '3px solid var(--color-accent)' : '3px solid transparent',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: '#fff',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <IconMessages size={19} />
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-semibold truncate w-full" style={{ color: 'var(--color-text-primary)' }}>
                {t.chat.generalRoom}
              </span>
              <span className="text-xs truncate w-full" style={{ color: 'var(--color-text-muted)' }}>
                {t.chat.generalRoomDesc}
              </span>
            </div>
          </button>

          {/* Contactos */}
          <SectionHeader
            icon={<IconUsers size={13} />}
            titulo={t.contacts.title}
            onAccion={onAbrirContactos}
          />
          {contactosFiltrados.length === 0 && !busqueda && (
            <p className="px-5 py-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t.contacts.empty}
            </p>
          )}
          {contactosFiltrados.map(c => {
            const esActivo = chatActivo?.tipo === 'privado' && chatActivo.id === c.contacto_id
            const online = presencias[c.contacto_id]
            return (
              <button
                key={c.contacto_id}
                onClick={() => seleccionar({ tipo: 'privado', id: c.contacto_id, nombre: c.nombre })}
                className="conv-item w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                style={{
                  backgroundColor: esActivo ? 'var(--color-accent-light)' : 'transparent',
                  borderLeft: esActivo ? '3px solid var(--color-accent)' : '3px solid transparent',
                }}
              >
                <div className="relative flex-shrink-0">
                  <Avatar nombre={c.nombre} />
                  {/* Punto de presencia */}
                  <span
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                    style={{
                      backgroundColor: online ? '#22c55e' : 'var(--color-text-muted)',
                      borderColor: 'var(--color-bg-secondary)',
                    }}
                  />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-sm font-medium truncate w-full" style={{ color: 'var(--color-text-primary)' }}>
                    {c.nombre}
                  </span>
                  <span className="text-xs truncate w-full" style={{ color: online ? '#22c55e' : 'var(--color-text-muted)' }}>
                    {online ? t.chat.userOnline : c.telefono}
                  </span>
                </div>
              </button>
            )
          })}

          {/* Grupos */}
          <SectionHeader
            icon={<IconUsersGroup size={13} />}
            titulo={t.groups.title}
            onAccion={onAbrirGrupos}
          />
          {gruposFiltrados.length === 0 && !busqueda && (
            <p className="px-5 py-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t.groups.empty}
            </p>
          )}
          {gruposFiltrados.map(g => {
            const esActivo = chatActivo?.tipo === 'grupo' && chatActivo.id === g.id
            return (
              <button
                key={g.id}
                onClick={() => seleccionar({ tipo: 'grupo', id: g.id, nombre: g.nombre })}
                className="conv-item w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                style={{
                  backgroundColor: esActivo ? 'var(--color-accent-light)' : 'transparent',
                  borderLeft: esActivo ? '3px solid var(--color-accent)' : '3px solid transparent',
                }}
              >
                <Avatar nombre={g.nombre} icono={<IconUsersGroup size={16} />} />
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-sm font-medium truncate w-full" style={{ color: 'var(--color-text-primary)' }}>
                    {g.nombre}
                  </span>
                  <span className="text-xs truncate w-full" style={{ color: 'var(--color-text-muted)' }}>
                    {g.miembros.length} {t.groups.members}
                  </span>
                </div>
              </button>
            )
          })}

          <div className="h-3" />
        </div>

        {/* Pie: logout */}
        <div
          className="px-3 py-3 border-t flex-shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            onClick={manejarLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--color-bg-tertiary)]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <IconLogout size={16} />
            {t.nav.logout}
          </button>
        </div>
      </aside>
    </>
  )
}

function SectionHeader({
  icon,
  titulo,
  onAccion,
}: {
  icon: React.ReactNode
  titulo: string
  onAccion: () => void
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2 mt-1"
      style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--color-text-muted)' }}>{icon}</span>
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {titulo}
        </span>
      </div>
      <button
        onClick={onAccion}
        className="p-1 rounded-lg transition-colors hover:bg-[var(--color-bg-hover)]"
        style={{ color: 'var(--color-accent)' }}
        title={`Agregar ${titulo}`}
      >
        <IconPlus size={14} />
      </button>
    </div>
  )
}

function Avatar({ nombre, icono }: { nombre: string; icono?: React.ReactNode }) {
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
      style={{
        backgroundColor: 'var(--color-accent-light)',
        color: 'var(--color-accent)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {icono ?? nombre.charAt(0).toUpperCase()}
    </div>
  )
}
