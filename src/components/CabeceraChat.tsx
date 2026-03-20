/**
 * Cabecera del chat activo.
 * - Hamburgesa para mostrar/ocultar sidebar en móvil (< md).
 * - Para chats privados: indicador de presencia del contacto + botón eliminar conversación.
 * - Para grupos: botón salir + eliminar (si eres creador).
 */
import { useState, useRef, useEffect } from "react";
import {
  IconUsersGroup,
  IconUser,
  IconMessages,
  IconMenu2,
  IconDots,
  IconTrash,
  IconLogout2,
} from "@tabler/icons-react";
import type { ChatActivo } from "../interfaces";
import { useIdioma } from "../context/IdiomaContext";

interface Props {
  chat: ChatActivo;
  conectadoWS: boolean;
  presenciaContacto?: boolean | null;
  esCreadorGrupo?: boolean;
  onToggleSidebar: () => void;
  onEliminarChat?: () => void;
  onEliminarGrupo?: () => void;
  onSalirGrupo?: () => void;
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
  const { t } = useIdioma();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Al inicio del componente, actualiza los iconos:
  const icono = {
    sala: <IconMessages size={24} />,
    privado: <IconUser size={24} />,
    grupo: <IconUsersGroup size={24} />,
  }[chat.tipo];

  // Estado de presencia a mostrar
  const { puntColor, subtitulo } = (() => {
    if (!conectadoWS) {
      return {
        puntColor: "var(--color-text-muted)",
        subtitulo: t.common.connecting,
      };
    }
    if (chat.tipo === "privado") {
      const online = presenciaContacto === true;
      return {
        puntColor: online ? "#22c55e" : "var(--color-text-muted)",
        subtitulo: online ? t.chat.userOnline : t.chat.userOffline,
      };
    }
    // sala / grupo — solo mostrar WS conectado
    return { puntColor: "#22c55e", subtitulo: t.common.online };
  })();

  const tieneMenu =
    (chat.tipo === "privado" && onEliminarChat) ||
    (chat.tipo === "grupo" && (onEliminarGrupo || onSalirGrupo));

  return (
  <div
    className="flex items-center border-b flex-shrink-0 animate-fade-in"
    style={{
      backgroundColor: 'var(--color-bg-secondary)',
      borderColor: 'var(--color-border)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      zIndex: 10,
      padding: '1.25rem 1.5rem',
      gap: '1rem'
    }}
  >
    {/* Botón hamburguesa — solo en móvil */}
    <button
      onClick={onToggleSidebar}
      className="md:hidden rounded-2xl transition-colors"
      style={{ 
        color: 'var(--color-text-secondary)', 
        backgroundColor: 'var(--color-bg-tertiary)',
        padding: '0.75rem',
        marginRight: '0.25rem'
      }}
      title="Menú"
    >
      <IconMenu2 size={22} />
    </button>

    {/* Avatar */}
    <div
      className="rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{
        backgroundColor: 'var(--color-accent-light)',
        color: 'var(--color-accent)',
        boxShadow: 'var(--shadow-md)',
        width: '3rem',
        height: '3rem'
      }}
    >
      {icono}
    </div>

    {/* Nombre + presencia */}
    <div className="flex flex-col flex-1 min-w-0" style={{ gap: '0.25rem' }}>
      <span
        className="font-bold truncate"
        style={{ 
          color: 'var(--color-text-primary)',
          fontSize: '1rem'
        }}
      >
        {chat.nombre}
      </span>
      <div className="flex items-center" style={{ gap: '0.5rem' }}>
        <span
          className="rounded-full flex-shrink-0"
          style={{ 
            backgroundColor: puntColor,
            width: '0.5rem',
            height: '0.5rem'
          }}
        />
        <span 
          className="font-medium" 
          style={{ 
            color: puntColor,
            fontSize: '0.75rem'
          }}
        >
          {subtitulo}
        </span>
      </div>
    </div>

    {/* Menú de acciones */}
    {tieneMenu && (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuAbierto(v => !v)}
          className="rounded-2xl transition-colors hover:bg-[var(--color-bg-tertiary)]"
          style={{ 
            color: 'var(--color-text-secondary)',
            padding: '0.75rem'
          }}
          title="Opciones"
        >
          <IconDots size={22} />
        </button>

        {menuAbierto && (
          <div
            className="absolute right-0 top-full rounded-2xl shadow-lg overflow-hidden z-50 animate-fade-in"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              minWidth: '220px',
              marginTop: '0.5rem'
            }}
          >
            {chat.tipo === 'privado' && onEliminarChat && (
              <MenuBtn
                icon={<IconTrash size={18} />}
                label={t.chat.deleteChat}
                danger
                onClick={() => { setMenuAbierto(false); onEliminarChat() }}
              />
            )}
            {chat.tipo === 'grupo' && onSalirGrupo && (
              <MenuBtn
                icon={<IconLogout2 size={18} />}
                label={t.groups.leave}
                onClick={() => { setMenuAbierto(false); onSalirGrupo() }}
              />
            )}
            {chat.tipo === 'grupo' && esCreadorGrupo && onEliminarGrupo && (
              <MenuBtn
                icon={<IconTrash size={18} />}
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
      className="w-full flex items-center text-left font-medium transition-colors hover:bg-[var(--color-bg-tertiary)]"
      style={{ 
        color: danger ? 'var(--color-danger)' : 'var(--color-text-secondary)',
        padding: '1rem 1.5rem',
        gap: '0.75rem',
        fontSize: '0.875rem'
      }}
    >
      {icon}
      {label}
    </button>
  )
}
