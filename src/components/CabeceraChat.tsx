/**
 * Cabecera del chat activo.
 * - Hamburgesa para mostrar/ocultar sidebar en móvil (< md).
 * - Para chats privados: indicador de presencia del contacto + botón eliminar conversación.
 * - Para grupos: botón salir + eliminar (si eres creador).
 */
import { useState, useRef, useEffect } from 'react'
import {
  IconUsersGroup,
  IconUser,
  IconMessages,
  IconMenu2,
  IconDots,
  IconTrash,
  IconLogout2,
} from '@tabler/icons-react'
import type { ChatActivo } from '../interfaces'
import { useIdioma } from '../context/IdiomaContext'

interface Props {
  chat: ChatActivo
  conectadoWS: boolean
  presenciaContacto?: boolean | null
  esCreadorGrupo?: boolean
  onToggleSidebar: () => void
  onEliminarChat?: () => void
  onEliminarGrupo?: () => void
  onSalirGrupo?: () => void
}

export function CabeceraChat({
  chat,
  conectadoWS,
  presenciaContacto,
  esCreadorGrupo,
  onToggleSidebar,
  onEliminarChat,
  onEliminarGrupo,
  onSalirGrupo,
}: Props) {
  const { t } = useIdioma()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const icono = {
    sala: <IconMessages size={19} />,
    privado: <IconUser size={19} />,
    grupo: <IconUsersGroup size={19} />,
  }[chat.tipo]

  // Estado de presencia a mostrar
  const { puntColor, subtitulo } = (() => {
    if (!conectadoWS) {
      return { puntColor: 'var(--color-text-muted)', subtitulo: t.common.connecting }
    }
    if (chat.tipo === 'privado') {
      const online = presenciaContacto === true
      return {
        puntColor: online ? '#22c55e' : 'var(--color-text-muted)',
        subtitulo: online ? t.chat.userOnline : t.chat.userOffline,
      }
    }
    // sala / grupo — solo mostrar WS conectado
    return { puntColor: '#22c55e', subtitulo: t.common.online }
  })()

  const tieneMenu =
    (chat.tipo === 'privado' && onEliminarChat) ||
    (chat.tipo === 'grupo' && (onEliminarGrupo || onSalirGrupo))

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0 animate-fade-in"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        zIndex: 10,
      }}
    >
      {/* Botón hamburguesa — solo en móvil */}
      <button
        onClick={onToggleSidebar}
        className="md:hidden p-2 rounded-xl transition-colors mr-1"
        style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-tertiary)' }}
        title="Menú"
      >
        <IconMenu2 size={18} />
      </button>

      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: 'var(--color-accent-light)',
          color: 'var(--color-accent)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {icono}
      </div>

      {/* Nombre + presencia */}
      <div className="flex flex-col flex-1 min-w-0">
        <span
          className="font-semibold text-sm truncate"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {chat.nombre}
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: puntColor }}
          />
          <span className="text-xs" style={{ color: puntColor }}>
            {subtitulo}
          </span>
        </div>
      </div>

      {/* Menú de acciones */}
      {tieneMenu && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuAbierto(v => !v)}
            className="p-2 rounded-xl transition-colors hover:bg-[var(--color-bg-tertiary)]"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Opciones"
          >
            <IconDots size={18} />
          </button>

          {menuAbierto && (
            <div
              className="absolute right-0 top-full mt-1 rounded-xl shadow-card overflow-hidden z-50 animate-fade-in"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                minWidth: '180px',
              }}
            >
              {chat.tipo === 'privado' && onEliminarChat && (
                <MenuBtn
                  icon={<IconTrash size={15} />}
                  label={t.chat.deleteChat}
                  danger
                  onClick={() => { setMenuAbierto(false); onEliminarChat() }}
                />
              )}
              {chat.tipo === 'grupo' && onSalirGrupo && (
                <MenuBtn
                  icon={<IconLogout2 size={15} />}
                  label={t.groups.leave}
                  onClick={() => { setMenuAbierto(false); onSalirGrupo() }}
                />
              )}
              {chat.tipo === 'grupo' && esCreadorGrupo && onEliminarGrupo && (
                <MenuBtn
                  icon={<IconTrash size={15} />}
                  label={t.groups.delete}
                  danger
                  onClick={() => { setMenuAbierto(false); onEliminarGrupo() }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MenuBtn({
  icon,
  label,
  danger = false,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] text-left"
      style={{ color: danger ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}
    >
      {icon}
      {label}
    </button>
  )
}
