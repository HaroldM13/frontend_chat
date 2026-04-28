/**
 * Barra lateral con lista de conversaciones.
 * Responsive: oculta solo en móvil (< md), siempre visible en tablet/desktop.
 * Cabecera: área de perfil clicable (abre ModalPerfil) + controles de tema/idioma.
 * Pie: botón de cerrar sesión.
 */
import { useState } from "react";
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
} from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";
import { useTema } from "../context/TemaContext";
import { useIdioma } from "../context/IdiomaContext";
import { authApi } from "../services/api";
import type { Contacto, Grupo, ChatActivo, Idioma, Estado } from "../interfaces";
import { BarraEstados } from "./BarraEstados";

interface Props {
  grupos: Grupo[];
  contactos: Contacto[];
  chatActivo: ChatActivo | null;
  visible: boolean;
  presencias: Record<string, boolean>;
  estados: Estado[];
  onCerrar: () => void;
  onSeleccionarChat: (chat: ChatActivo) => void;
  onAbrirContactos: () => void;
  onAbrirGrupos: () => void;
  onAbrirPerfil: () => void;
  onVerEstado: (estado: Estado) => void;
  onSubirEstado: (archivo: File) => void;
}

export function BarraLateral({
  grupos,
  contactos,
  chatActivo,
  visible,
  presencias,
  estados,
  onCerrar,
  onSeleccionarChat,
  onAbrirContactos,
  onAbrirGrupos,
  onAbrirPerfil,
  onVerEstado,
  onSubirEstado,
}: Props) {
  const { nombre, token, logout, usuarioId } = useAuth();
  const { tema, toggleTema } = useTema();
  const { t, idioma, cambiarIdioma } = useIdioma();
  const [busqueda, setBusqueda] = useState("");
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false);

  const manejarLogout = async () => {
    if (token) {
      try {
        await authApi.logout(token);
      } catch {
        /* ignorar */
      }
    }
    logout();
  };

  const seleccionar = (chat: ChatActivo) => {
    onSeleccionarChat(chat);
    onCerrar(); // en móvil cierra la barra al seleccionar
  };

  const contactosFiltrados = contactos.filter(
    (c) =>
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.telefono.includes(busqueda),
  );
  const gruposFiltrados = grupos.filter((g) =>
    g.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const esSalaActiva = chatActivo?.tipo === "sala";

  return (
  <>
    {/* Overlay oscuro en móvil cuando la barra está visible */}
    {visible && (
      <div
        className="md:hidden fixed inset-0 z-20 bg-black/50 animate-fade-in"
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
        width: '340px',
        minWidth: '320px',
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
        <div style={{ padding: '1.5rem 1.5rem 1.25rem 1.5rem' }}>
          <button
            onClick={onAbrirPerfil}
            className="flex items-center w-full rounded-2xl p-3 -mx-3 transition-colors hover:bg-[var(--color-bg-tertiary)] text-left"
            style={{ gap: '1rem' }}
            title={t.profile.title}
          >
            <div
              className="rounded-2xl flex items-center justify-center font-bold flex-shrink-0"
              style={{
                backgroundColor: 'var(--color-accent-light)',
                color: 'var(--color-accent)',
                width: '3.5rem',
                height: '3.5rem',
                fontSize: '1.25rem',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {nombre?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span
                className="font-bold truncate"
                style={{ 
                  color: 'var(--color-text-primary)',
                  fontSize: '1rem',
                  marginBottom: '0.125rem'
                }}
              >
                {nombre}
              </span>
              <span
                style={{ 
                  color: 'var(--color-text-muted)',
                  fontSize: '0.75rem'
                }}
              >
                JHT Chat
              </span>
            </div>
          </button>

          {/* Cerrar en móvil */}
          <button
            onClick={onCerrar}
            className="md:hidden absolute top-6 right-6 p-2.5 rounded-xl transition-colors hover:bg-[var(--color-bg-tertiary)]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Ajustes: tema + idioma (colapsable) */}
        <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
          <button
            onClick={() => setAjustesAbiertos(v => !v)}
            className="w-full flex items-center justify-between rounded-xl transition-colors hover:bg-[var(--color-bg-tertiary)]"
            style={{ 
              color: 'var(--color-text-muted)',
              padding: '0.75rem 1rem',
              fontSize: '0.6875rem',
              fontWeight: '700',
              letterSpacing: '0.05em'
            }}
          >
            <span>{t.nav.theme} & {t.nav.language}</span>
            {ajustesAbiertos ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </button>

          {ajustesAbiertos && (
            <div 
              className="rounded-2xl flex items-center justify-between"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                padding: '1rem',
                marginTop: '0.75rem',
                gap: '0.75rem'
              }}
            >
              {/* Tema */}
              <button
                onClick={toggleTema}
                className="flex items-center rounded-xl transition-colors hover:bg-[var(--color-bg-hover)]"
                style={{ 
                  color: 'var(--color-text-secondary)',
                  padding: '0.625rem 1rem',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}
                title={tema === 'light' ? t.nav.darkTheme : t.nav.lightTheme}
              >
                {tema === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
                <span>{tema === 'light' ? t.nav.darkTheme : t.nav.lightTheme}</span>
              </button>

              {/* Idioma */}
              <select
                value={idioma}
                onChange={e => cambiarIdioma(e.target.value as Idioma)}
                className="rounded-xl cursor-pointer outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                  padding: '0.625rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: '500'
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
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <div
          className="flex items-center rounded-2xl"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1.5px solid var(--color-border)',
            padding: '0.875rem 1.25rem',
            gap: '0.75rem'
          }}
        >
          <IconSearch size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder={t.nav.search}
            className="flex-1 bg-transparent outline-none"
            style={{ 
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </div>

      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-y-auto">
        {/* Estados */}
        <BarraEstados
          estados={estados}
          usuarioId={usuarioId ?? ''}
          onVerEstado={onVerEstado}
          onSubirEstado={onSubirEstado}
        />

        {/* Sala General */}
        <button
          onClick={() => seleccionar({ tipo: 'sala', nombre: t.chat.generalRoom })}
          className="conv-item w-full flex items-center text-left transition-colors"
          style={{
            backgroundColor: esSalaActiva ? 'var(--color-accent-light)' : 'transparent',
            borderLeft: esSalaActiva ? '4px solid var(--color-accent)' : '4px solid transparent',
            padding: '1.25rem 1.5rem',
            gap: '1rem'
          }}
        >
          <div
            className="rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: '#fff',
              boxShadow: 'var(--shadow-md)',
              width: '3rem',
              height: '3rem'
            }}
          >
            <IconMessages size={24} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span 
              className="font-bold truncate" 
              style={{ 
                color: 'var(--color-text-primary)',
                fontSize: '0.875rem',
                marginBottom: '0.125rem'
              }}
            >
              {t.chat.generalRoom}
            </span>
            <span 
              className="truncate" 
              style={{ 
                color: 'var(--color-text-muted)',
                fontSize: '0.75rem'
              }}
            >
              {t.chat.generalRoomDesc}
            </span>
          </div>
        </button>

        {/* Contactos */}
        <SectionHeader
          icon={<IconUsers size={16} />}
          titulo={t.contacts.title}
          onAccion={onAbrirContactos}
        />
        {contactosFiltrados.length === 0 && !busqueda && (
          <p 
            style={{ 
              padding: '1rem 1.5rem',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)'
            }}
          >
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
              className="conv-item w-full flex items-center text-left transition-colors"
              style={{
                backgroundColor: esActivo ? 'var(--color-accent-light)' : 'transparent',
                borderLeft: esActivo ? '4px solid var(--color-accent)' : '4px solid transparent',
                padding: '1rem 1.5rem',
                gap: '1rem'
              }}
            >
              <div className="relative flex-shrink-0">
                <Avatar nombre={c.nombre} />
                {/* Punto de presencia */}
                <span
                  className="absolute rounded-full"
                  style={{
                    backgroundColor: online ? '#22c55e' : 'var(--color-text-muted)',
                    borderColor: 'var(--color-bg-secondary)',
                    width: '0.875rem',
                    height: '0.875rem',
                    bottom: '0',
                    right: '0',
                    border: '2px solid'
                  }}
                />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span 
                  className="font-semibold truncate" 
                  style={{ 
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    marginBottom: '0.125rem'
                  }}
                >
                  {c.nombre}
                </span>
                <span 
                  className="truncate" 
                  style={{ 
                    color: online ? '#22c55e' : 'var(--color-text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: online ? '500' : '400'
                  }}
                >
                  {online ? t.chat.userOnline : c.telefono}
                </span>
              </div>
            </button>
          )
        })}

        {/* Grupos */}
        <SectionHeader
          icon={<IconUsersGroup size={16} />}
          titulo={t.groups.title}
          onAccion={onAbrirGrupos}
        />
        {gruposFiltrados.length === 0 && !busqueda && (
          <p 
            style={{ 
              padding: '1rem 1.5rem',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)'
            }}
          >
            {t.groups.empty}
          </p>
        )}
        {gruposFiltrados.map(g => {
          const esActivo = chatActivo?.tipo === 'grupo' && chatActivo.id === g.id
          return (
            <button
              key={g.id}
              onClick={() => seleccionar({ tipo: 'grupo', id: g.id, nombre: g.nombre })}
              className="conv-item w-full flex items-center text-left transition-colors"
              style={{
                backgroundColor: esActivo ? 'var(--color-accent-light)' : 'transparent',
                borderLeft: esActivo ? '4px solid var(--color-accent)' : '4px solid transparent',
                padding: '1rem 1.5rem',
                gap: '1rem'
              }}
            >
              <Avatar nombre={g.nombre} icono={<IconUsersGroup size={20} />} />
              <div className="flex flex-col min-w-0 flex-1">
                <span 
                  className="font-semibold truncate" 
                  style={{ 
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    marginBottom: '0.125rem'
                  }}
                >
                  {g.nombre}
                </span>
                <span 
                  className="truncate" 
                  style={{ 
                    color: 'var(--color-text-muted)',
                    fontSize: '0.75rem'
                  }}
                >
                  {g.miembros.length} {t.groups.members}
                </span>
              </div>
            </button>
          )
        })}

        <div style={{ height: '1.5rem' }} />
      </div>

      {/* Pie: logout */}
      <div
        className="border-t flex-shrink-0"
        style={{ 
          borderColor: 'var(--color-border)',
          padding: '1.25rem 1.5rem'
        }}
      >
        <button
          onClick={manejarLogout}
          className="w-full flex items-center rounded-2xl font-semibold transition-colors hover:bg-[var(--color-bg-tertiary)]"
          style={{ 
            color: 'var(--color-text-secondary)',
            padding: '0.875rem 1.25rem',
            gap: '0.75rem',
            fontSize: '0.875rem'
          }}
        >
          <IconLogout size={19} />
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
      className="flex items-center justify-between"
      style={{ 
        backgroundColor: 'var(--color-bg-tertiary)',
        padding: '0.875rem 1.5rem',
        marginTop: '0.75rem'
      }}
    >
      <div className="flex items-center" style={{ gap: '0.625rem' }}>
        <span style={{ color: 'var(--color-text-muted)' }}>{icon}</span>
        <span
          className="font-bold uppercase"
          style={{ 
            color: 'var(--color-text-muted)',
            fontSize: '0.6875rem',
            letterSpacing: '0.1em'
          }}
        >
          {titulo}
        </span>
      </div>
      <button
        onClick={onAccion}
        className="rounded-xl transition-colors hover:bg-[var(--color-bg-hover)]"
        style={{ 
          color: 'var(--color-accent)',
          padding: '0.5rem'
        }}
        title={`Agregar ${titulo}`}
      >
        <IconPlus size={17} />
      </button>
    </div>
  )
}

function Avatar({ nombre, icono }: { nombre: string; icono?: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl flex items-center justify-center font-bold"
      style={{
        backgroundColor: 'var(--color-accent-light)',
        color: 'var(--color-accent)',
        boxShadow: 'var(--shadow-sm)',
        width: '3rem',
        height: '3rem',
        fontSize: '1rem'
      }}
    >
      {icono ?? nombre.charAt(0).toUpperCase()}
    </div>
  )
}
