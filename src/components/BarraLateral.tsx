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
  IconStar,
  IconStarFilled,
  IconTrash,
  IconUserMinus,
  IconDoorExit,
} from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";
import { useTema } from "../context/TemaContext";
import { useIdioma } from "../context/IdiomaContext";
import { authApi, API_URL } from "../services/api";
import type { Contacto, Grupo, ChatActivo, Idioma, Estado, ResumenConversaciones, ContextAction } from "../interfaces";
import { BarraEstados } from "./BarraEstados";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";

type TabActivo = 'general' | 'contactos' | 'grupos' | 'favoritos'

interface MenuCtx {
  x: number
  y: number
  tipo: 'sala' | 'contacto' | 'grupo'
  id?: string
  nombre: string
  chat_key: string
  esCreador?: boolean
}

interface Props {
  grupos: Grupo[];
  contactos: Contacto[];
  chatActivo: ChatActivo | null;
  visible: boolean;
  presencias: Record<string, boolean>;
  estados: Estado[];
  resumenMensajes: ResumenConversaciones;
  favoritos: Set<string>;
  onCerrar: () => void;
  onSeleccionarChat: (chat: ChatActivo) => void;
  onAbrirContactos: () => void;
  onAbrirGrupos: () => void;
  onAbrirPerfil: () => void;
  onVerEstado: (estado: Estado) => void;
  onSubirEstado: (archivo: File) => void;
  onContextAction: (accion: ContextAction) => void;
}

export function BarraLateral({
  grupos,
  contactos,
  chatActivo,
  visible,
  presencias,
  estados,
  resumenMensajes,
  favoritos,
  onCerrar,
  onSeleccionarChat,
  onAbrirContactos,
  onAbrirGrupos,
  onAbrirPerfil,
  onVerEstado,
  onSubirEstado,
  onContextAction,
}: Props) {
  const { nombre, token, logout, usuarioId, fotoUrl } = useAuth();
  const { tema, toggleTema } = useTema();
  const { t, idioma, cambiarIdioma } = useIdioma();
  const [tabActivo, setTabActivo] = useState<TabActivo>('general');
  const [busquedaContactos, setBusquedaContactos] = useState("");
  const [busquedaGrupos, setBusquedaGrupos] = useState("");
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false);
  const [menuCtx, setMenuCtx] = useState<MenuCtx | null>(null);

  const manejarLogout = async () => {
    if (token) {
      try { await authApi.logout(token) } catch { /* ignorar */ }
    }
    logout();
  };

  const seleccionar = (chat: ChatActivo) => {
    onSeleccionarChat(chat);
    onCerrar();
  };

  const abrirMenu = (e: React.MouseEvent, ctx: MenuCtx) => {
    e.preventDefault()
    setMenuCtx({ ...ctx, x: e.clientX, y: e.clientY })
  }

  const contactosFiltrados = contactos.filter(c =>
    c.nombre.toLowerCase().includes(busquedaContactos.toLowerCase()) ||
    c.telefono.includes(busquedaContactos)
  );

  const gruposFiltrados = grupos.filter(g =>
    g.nombre.toLowerCase().includes(busquedaGrupos.toLowerCase())
  );

  const msgPreview = (key: string, fallback: string): string => {
    const r = resumenMensajes[key];
    if (!r) return fallback;
    const prefix = r.remitente_id === usuarioId ? `${t.chat.you}: ` : '';
    return `${prefix}${r.contenido}`;
  };

  const esSalaActiva = chatActivo?.tipo === 'sala';

  const TABS: { id: TabActivo; label: string; icon: React.ReactNode }[] = [
    { id: 'general',   label: t.nav.general,   icon: <IconMessages size={15} /> },
    { id: 'contactos', label: t.nav.contacts,   icon: <IconUsers size={15} /> },
    { id: 'grupos',    label: t.nav.groups,     icon: <IconUsersGroup size={15} /> },
    { id: 'favoritos', label: t.nav.favorites,  icon: <IconStar size={15} /> },
  ];

  // Construir items del menú contextual según tipo
  const buildMenuItems = (ctx: MenuCtx): ContextMenuItem[] => {
    const esFav = favoritos.has(ctx.chat_key)
    const items: ContextMenuItem[] = [
      {
        label: esFav ? t.chat.removeFavorite : t.chat.addFavorite,
        icon: esFav ? <IconStarFilled size={16} /> : <IconStar size={16} />,
        onClick: () => onContextAction({ tipo: 'favorito', chatKey: ctx.chat_key }),
      },
    ]
    if (ctx.tipo === 'contacto' && ctx.id) {
      items.push({
        label: t.chat.clearChat,
        icon: <IconTrash size={16} />,
        onClick: () => onContextAction({ tipo: 'limpiarPrivado', contactoId: ctx.id! }),
      })
      items.push({
        label: t.chat.deleteContact,
        icon: <IconUserMinus size={16} />,
        onClick: () => onContextAction({ tipo: 'eliminarContacto', contactoId: ctx.id! }),
        danger: true,
      })
    }
    if (ctx.tipo === 'grupo' && ctx.id) {
      if (!ctx.esCreador) {
        items.push({
          label: t.groups.leave,
          icon: <IconDoorExit size={16} />,
          onClick: () => onContextAction({ tipo: 'salirGrupo', grupoId: ctx.id! }),
          danger: true,
        })
      } else {
        items.push({
          label: t.groups.delete,
          icon: <IconTrash size={16} />,
          onClick: () => onContextAction({ tipo: 'eliminarGrupo', grupoId: ctx.id! }),
          danger: true,
        })
      }
    }
    return items
  }

  // Contactos favoritos para el tab de favoritos
  const contactosFav = contactos.filter(c => favoritos.has(`privado:${c.contacto_id}`))
  const gruposFav = grupos.filter(g => favoritos.has(`grupo:${g.id}`))
  const salaFav = favoritos.has('sala')

  return (
    <>
      {visible && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/50 animate-fade-in"
          onClick={onCerrar}
        />
      )}

      {menuCtx && (
        <ContextMenu
          x={menuCtx.x}
          y={menuCtx.y}
          items={buildMenuItems(menuCtx)}
          onClose={() => setMenuCtx(null)}
        />
      )}

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
          width: '380px',
          minWidth: '320px',
          maxWidth: '85vw',
          boxShadow: visible ? 'var(--shadow-lg)' : 'none',
        }}
      >
        {/* ── Cabecera: perfil + ajustes ── */}
        <div className="border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <div style={{ padding: '1.5rem 1.5rem 1.25rem 1.5rem', position: 'relative' }}>
            <button
              onClick={onAbrirPerfil}
              className="flex items-center w-full rounded-2xl p-3 -mx-3 transition-colors hover:bg-[var(--color-bg-tertiary)] text-left"
              style={{ gap: '1rem' }}
              title={t.profile.title}
            >
              <div
                className="rounded-2xl flex items-center justify-center font-bold flex-shrink-0 overflow-hidden"
                style={{
                  backgroundColor: 'var(--color-accent-light)',
                  color: 'var(--color-accent)',
                  width: '3.5rem',
                  height: '3.5rem',
                  fontSize: '1.25rem',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                {fotoUrl
                  ? <img src={`${API_URL}${fotoUrl}`} alt={nombre ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (nombre?.charAt(0).toUpperCase() ?? '?')
                }
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-bold truncate" style={{ color: 'var(--color-text-primary)', fontSize: '1rem', marginBottom: '0.125rem' }}>
                  {nombre}
                </span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  JHT Chat
                </span>
              </div>
            </button>

            <button
              onClick={onCerrar}
              className="md:hidden absolute top-6 right-6 p-2.5 rounded-xl transition-colors hover:bg-[var(--color-bg-tertiary)]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <IconX size={20} />
            </button>
          </div>

          {/* Ajustes colapsables */}
          <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
            <button
              onClick={() => setAjustesAbiertos(v => !v)}
              className="w-full flex items-center justify-between rounded-xl transition-colors hover:bg-[var(--color-bg-tertiary)]"
              style={{ color: 'var(--color-text-muted)', padding: '0.75rem 1rem', fontSize: '0.6875rem', fontWeight: '700', letterSpacing: '0.05em' }}
            >
              <span>{t.nav.theme} & {t.nav.language}</span>
              {ajustesAbiertos ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </button>

            {ajustesAbiertos && (
              <div
                className="rounded-2xl flex items-center justify-between"
                style={{ backgroundColor: 'var(--color-bg-tertiary)', padding: '1rem', marginTop: '0.75rem', gap: '0.75rem' }}
              >
                <button
                  onClick={toggleTema}
                  className="flex items-center rounded-xl transition-colors hover:bg-[var(--color-bg-hover)]"
                  style={{ color: 'var(--color-text-secondary)', padding: '0.625rem 1rem', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '500' }}
                >
                  {tema === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
                  <span>{tema === 'light' ? t.nav.darkTheme : t.nav.lightTheme}</span>
                </button>
                <select
                  value={idioma}
                  onChange={e => cambiarIdioma(e.target.value as Idioma)}
                  className="rounded-xl cursor-pointer outline-none"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', padding: '0.625rem 0.75rem', fontSize: '0.75rem', fontWeight: '500' }}
                >
                  <option value="es">🌐 ES</option>
                  <option value="en">🌐 EN</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ── Stories ── */}
        <div className="flex-shrink-0">
          <BarraEstados
            estados={estados}
            usuarioId={usuarioId ?? ''}
            onVerEstado={onVerEstado}
            onSubirEstado={onSubirEstado}
          />
        </div>

        {/* ── Tabs ── */}
        <div className="flex flex-shrink-0 border-b" style={{ borderColor: 'var(--color-border)' }}>
          {TABS.map(({ id, label, icon }) => {
            const activo = tabActivo === id;
            return (
              <button
                key={id}
                onClick={() => setTabActivo(id)}
                className="flex-1 flex flex-col items-center transition-colors"
                style={{
                  padding: '0.875rem 0.25rem 0.75rem',
                  gap: '0.3rem',
                  color: activo ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  fontWeight: activo ? '700' : '500',
                  fontSize: '0.625rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  borderBottom: activo ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
                }}
              >
                {icon}
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Buscador (solo contactos y grupos) ── */}
        {(tabActivo === 'contactos' || tabActivo === 'grupos') && (
          <div
            className="flex items-center gap-2 flex-shrink-0"
            style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}
          >
            <div
              className="flex items-center flex-1 rounded-xl"
              style={{ backgroundColor: 'var(--color-bg-primary)', border: '1.5px solid var(--color-border)', padding: '0.625rem 0.875rem', gap: '0.5rem' }}
            >
              <IconSearch size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                value={tabActivo === 'contactos' ? busquedaContactos : busquedaGrupos}
                onChange={e => tabActivo === 'contactos' ? setBusquedaContactos(e.target.value) : setBusquedaGrupos(e.target.value)}
                placeholder={tabActivo === 'contactos' ? t.contacts.search : `${t.nav.search}`}
                className="flex-1 bg-transparent outline-none"
                style={{ color: 'var(--color-text-primary)', fontSize: '0.8125rem' }}
              />
              {(tabActivo === 'contactos' ? busquedaContactos : busquedaGrupos) && (
                <button
                  onClick={() => tabActivo === 'contactos' ? setBusquedaContactos('') : setBusquedaGrupos('')}
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <IconX size={14} />
                </button>
              )}
            </div>
            <button
              onClick={tabActivo === 'contactos' ? onAbrirContactos : onAbrirGrupos}
              className="rounded-xl transition-colors hover:bg-[var(--color-accent-light)] flex-shrink-0"
              style={{ color: 'var(--color-accent)', padding: '0.625rem', backgroundColor: 'var(--color-bg-primary)', border: '1.5px solid var(--color-border)' }}
              title={tabActivo === 'contactos' ? t.contacts.add : t.groups.create}
            >
              <IconPlus size={18} />
            </button>
          </div>
        )}

        {/* ── Contenido del tab (scrollable) ── */}
        <div className="flex-1 overflow-y-auto">

          {/* TAB GENERAL */}
          {tabActivo === 'general' && (
            <button
              onClick={() => seleccionar({ tipo: 'sala', nombre: t.chat.generalRoom })}
              onContextMenu={e => abrirMenu(e, { x: 0, y: 0, tipo: 'sala', chat_key: 'sala', nombre: t.chat.generalRoom })}
              className="conv-item w-full flex items-center text-left transition-colors"
              style={{
                backgroundColor: esSalaActiva ? 'var(--color-accent-light)' : 'transparent',
                borderLeft: esSalaActiva ? '4px solid var(--color-accent)' : '4px solid transparent',
                padding: '1.25rem 1.5rem',
                gap: '1rem',
              }}
            >
              <div
                className="rounded-2xl flex items-center justify-center flex-shrink-0 relative"
                style={{ backgroundColor: 'var(--color-accent)', color: '#fff', boxShadow: 'var(--shadow-md)', width: '3rem', height: '3rem' }}
              >
                <IconMessages size={22} />
                {favoritos.has('sala') && (
                  <span className="absolute -top-1 -right-1">
                    <IconStarFilled size={12} style={{ color: '#f59e0b' }} />
                  </span>
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-bold truncate" style={{ color: 'var(--color-text-primary)', fontSize: '0.875rem', marginBottom: '0.2rem' }}>
                  {t.chat.generalRoom}
                </span>
                <span className="truncate" style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  {msgPreview('sala', t.chat.generalRoomDesc)}
                </span>
              </div>
            </button>
          )}

          {/* TAB CONTACTOS */}
          {tabActivo === 'contactos' && (
            <>
              {contactosFiltrados.length === 0 && (
                <p style={{ padding: '1.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  {busquedaContactos ? `Sin resultados para "${busquedaContactos}"` : t.contacts.empty}
                </p>
              )}
              {contactosFiltrados.map(c => renderContacto(c))}
            </>
          )}

          {/* TAB GRUPOS */}
          {tabActivo === 'grupos' && (
            <>
              {gruposFiltrados.length === 0 && (
                <p style={{ padding: '1.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  {busquedaGrupos ? `Sin resultados para "${busquedaGrupos}"` : t.groups.empty}
                </p>
              )}
              {gruposFiltrados.map(g => renderGrupo(g))}
            </>
          )}

          {/* TAB FAVORITOS */}
          {tabActivo === 'favoritos' && (
            <>
              {!salaFav && contactosFav.length === 0 && gruposFav.length === 0 && (
                <div className="flex flex-col items-center justify-center" style={{ padding: '3rem 1.5rem', gap: '0.75rem' }}>
                  <IconStar size={36} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                    Sin favoritos aún.<br />
                    <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>Click derecho en una conversación para agregar.</span>
                  </p>
                </div>
              )}
              {salaFav && (
                <button
                  onClick={() => seleccionar({ tipo: 'sala', nombre: t.chat.generalRoom })}
                  onContextMenu={e => abrirMenu(e, { x: 0, y: 0, tipo: 'sala', chat_key: 'sala', nombre: t.chat.generalRoom })}
                  className="conv-item w-full flex items-center text-left transition-colors"
                  style={{
                    backgroundColor: esSalaActiva ? 'var(--color-accent-light)' : 'transparent',
                    borderLeft: esSalaActiva ? '4px solid var(--color-accent)' : '4px solid transparent',
                    padding: '1.25rem 1.5rem',
                    gap: '1rem',
                  }}
                >
                  <div className="rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-accent)', color: '#fff', boxShadow: 'var(--shadow-md)', width: '3rem', height: '3rem' }}>
                    <IconMessages size={22} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold truncate" style={{ color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                      {t.chat.generalRoom}
                    </span>
                    <span className="truncate" style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                      {msgPreview('sala', t.chat.generalRoomDesc)}
                    </span>
                  </div>
                </button>
              )}
              {contactosFav.map(c => renderContacto(c))}
              {gruposFav.map(g => renderGrupo(g))}
            </>
          )}

          <div style={{ height: '1rem' }} />
        </div>

        {/* ── Footer: logout ── */}
        <div className="border-t flex-shrink-0" style={{ borderColor: 'var(--color-border)', padding: '1.25rem 1.5rem' }}>
          <button
            onClick={manejarLogout}
            className="w-full flex items-center rounded-2xl font-semibold transition-colors hover:bg-[var(--color-bg-tertiary)]"
            style={{ color: 'var(--color-text-secondary)', padding: '0.875rem 1.25rem', gap: '0.75rem', fontSize: '0.875rem' }}
          >
            <IconLogout size={19} />
            {t.nav.logout}
          </button>
        </div>
      </aside>
    </>
  );

  function renderContacto(c: Contacto) {
    const esActivo = chatActivo?.tipo === 'privado' && chatActivo.id === c.contacto_id;
    const online = presencias[c.contacto_id];
    const tienePreview = !!resumenMensajes[`privado:${c.contacto_id}`];
    const textoSec = tienePreview
      ? msgPreview(`privado:${c.contacto_id}`, c.telefono)
      : (online ? t.chat.userOnline : c.telefono);
    const colorSec = !tienePreview && online ? '#22c55e' : 'var(--color-text-muted)';
    const esFav = favoritos.has(`privado:${c.contacto_id}`)
    return (
      <button
        key={c.contacto_id}
        onClick={() => seleccionar({ tipo: 'privado', id: c.contacto_id, nombre: c.nombre })}
        onContextMenu={e => abrirMenu(e, {
          x: 0, y: 0,
          tipo: 'contacto',
          id: c.contacto_id,
          chat_key: `privado:${c.contacto_id}`,
          nombre: c.nombre,
        })}
        className="conv-item w-full flex items-center text-left transition-colors"
        style={{
          backgroundColor: esActivo ? 'var(--color-accent-light)' : 'transparent',
          borderLeft: esActivo ? '4px solid var(--color-accent)' : '4px solid transparent',
          padding: '1rem 1.5rem',
          gap: '1rem',
        }}
      >
        <div className="relative flex-shrink-0">
          <Avatar nombre={c.nombre} />
          <span
            className="absolute rounded-full"
            style={{
              backgroundColor: online ? '#22c55e' : 'var(--color-text-muted)',
              border: '2px solid var(--color-bg-secondary)',
              width: '0.875rem', height: '0.875rem',
              bottom: 0, right: 0,
            }}
          />
          {esFav && (
            <span className="absolute -top-1 -left-1">
              <IconStarFilled size={11} style={{ color: '#f59e0b' }} />
            </span>
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold truncate" style={{ color: 'var(--color-text-primary)', fontSize: '0.875rem', marginBottom: '0.2rem' }}>
            {c.nombre}
          </span>
          <span className="truncate" style={{ color: colorSec, fontSize: '0.75rem', fontWeight: !tienePreview && online ? '500' : '400' }}>
            {textoSec}
          </span>
        </div>
        {(resumenMensajes[`privado:${c.contacto_id}`]?.no_leidos ?? 0) > 0 && (
          <span
            className="rounded-full flex items-center justify-center flex-shrink-0 font-bold"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: '#fff',
              minWidth: '1.375rem',
              height: '1.375rem',
              fontSize: '0.6875rem',
              padding: '0 0.3rem',
            }}
          >
            {resumenMensajes[`privado:${c.contacto_id}`].no_leidos}
          </span>
        )}
      </button>
    );
  }

  function renderGrupo(g: Grupo) {
    const esActivo = chatActivo?.tipo === 'grupo' && chatActivo.id === g.id;
    const esFav = favoritos.has(`grupo:${g.id}`)
    const esCreador = g.creador_id === usuarioId
    return (
      <button
        key={g.id}
        onClick={() => seleccionar({ tipo: 'grupo', id: g.id, nombre: g.nombre })}
        onContextMenu={e => abrirMenu(e, {
          x: 0, y: 0,
          tipo: 'grupo',
          id: g.id,
          chat_key: `grupo:${g.id}`,
          nombre: g.nombre,
          esCreador,
        })}
        className="conv-item w-full flex items-center text-left transition-colors"
        style={{
          backgroundColor: esActivo ? 'var(--color-accent-light)' : 'transparent',
          borderLeft: esActivo ? '4px solid var(--color-accent)' : '4px solid transparent',
          padding: '1rem 1.5rem',
          gap: '1rem',
        }}
      >
        <div className="relative flex-shrink-0">
          <Avatar nombre={g.nombre} icono={<IconUsersGroup size={20} />} />
          {esFav && (
            <span className="absolute -top-1 -left-1">
              <IconStarFilled size={11} style={{ color: '#f59e0b' }} />
            </span>
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold truncate" style={{ color: 'var(--color-text-primary)', fontSize: '0.875rem', marginBottom: '0.2rem' }}>
            {g.nombre}
          </span>
          <span className="truncate" style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
            {msgPreview(`grupo:${g.id}`, `${g.miembros.length} ${t.groups.members}`)}
          </span>
        </div>
      </button>
    );
  }
}

function Avatar({ nombre, icono }: { nombre: string; icono?: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl flex items-center justify-center font-bold flex-shrink-0"
      style={{
        backgroundColor: 'var(--color-accent-light)',
        color: 'var(--color-accent)',
        boxShadow: 'var(--shadow-sm)',
        width: '3rem',
        height: '3rem',
        fontSize: '1rem',
      }}
    >
      {icono ?? nombre.charAt(0).toUpperCase()}
    </div>
  );
}
