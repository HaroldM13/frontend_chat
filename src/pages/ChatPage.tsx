import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BarraLateral } from "../components/BarraLateral";
import { CabeceraChat } from "../components/CabeceraChat";
import { AreaMensajes } from "../components/AreaMensajes";
import { InputMensaje } from "../components/InputMensaje";
import { Modal } from "../components/Modal";
import { ModalPerfil } from "../components/ModalPerfil";
import { PanelContactos } from "../components/PanelContactos";
import { PanelGrupos } from "../components/PanelGrupos";
import { useAuth } from "../context/AuthContext";
import { useIdioma } from "../context/IdiomaContext";
import {
  contactosApi,
  gruposApi,
  mensajesApi,
  usuariosApi,
  estadosApi,
} from "../services/api";
import { ModalVisorEstado } from "../components/ModalVisorEstado";
import { useWebSocket } from "../hooks/useWebSocket";
import type {
  Contacto,
  Grupo,
  ChatActivo,
  Mensaje,
  MensajeWS,
  Estado,
} from "../interfaces";
import { IconMessageCircle, IconMenu2 } from "@tabler/icons-react";

export function ChatPage() {
  const { token, usuarioId, logout } = useAuth();
  const { t } = useIdioma();

  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [chatActivo, setChatActivo] = useState<ChatActivo | null>(null);

  // Historial HTTP (cargado al cambiar de chat)
  const [historial, setHistorial] = useState<Mensaje[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  // Presencias de contactos (polling cada 30 s)
  const [presencias, setPresencias] = useState<Record<string, boolean>>({});

  // Estados (stories)
  const [estados, setEstados] = useState<Estado[]>([]);
  const [estadoVisor, setEstadoVisor] = useState<Estado | null>(null);

  // Visibilidad de la barra lateral
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Modales
  const [modalContactos, setModalContactos] = useState(false);
  const [modalGrupos, setModalGrupos] = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  const [modalEliminarPerfil, setModalEliminarPerfil] = useState(false);
  const [modalEliminarChat, setModalEliminarChat] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  // Sala WebSocket activa
  const salaWS = (() => {
    if (!chatActivo) return null;
    if (chatActivo.tipo === "sala") return "sala";
    if (chatActivo.tipo === "privado") return `privado/${chatActivo.id}`;
    if (chatActivo.tipo === "grupo") return `grupo/${chatActivo.id}`;
    return null;
  })();

  const { mensajesRT, conectado, enviar } = useWebSocket(salaWS, token);

  /**
   * Combinar historial HTTP + mensajes RT, evitando duplicados.
   */
  const todosMensajes = useMemo((): (Mensaje | MensajeWS)[] => {
    const historialIds = new Set(historial.map((m) => m.id));
    const soloNuevos = mensajesRT.filter((m) => !historialIds.has(m.id));
    return [...historial, ...soloNuevos];
  }, [historial, mensajesRT]);

  // Grupo activo (para saber si el usuario es creador)
  const grupoActivo =
    chatActivo?.tipo === "grupo"
      ? (grupos.find((g) => g.id === chatActivo.id) ?? null)
      : null;
  const esCreadorGrupo = grupoActivo?.creador_id === usuarioId;

  // Presencia del contacto activo
  const presenciaContacto: boolean | null =
    chatActivo?.tipo === "privado" && chatActivo.id
      ? (presencias[chatActivo.id] ?? null)
      : null;

  // Cargar contactos y grupos
  const cargarDatos = useCallback(async () => {
    if (!token) return;
    try {
      const [c, g] = await Promise.all([
        contactosApi.listar(token),
        gruposApi.listar(token),
      ]);
      setContactos(c);
      setGrupos(g);
    } catch {
      /* ignorar */
    }
  }, [token]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Cargar y refrescar estados cada 60 s
  const cargarEstados = useCallback(async () => {
    if (!token) return;
    try {
      const lista = await estadosApi.listar(token);
      setEstados(lista);
    } catch { /* ignorar */ }
  }, [token]);

  useEffect(() => {
    cargarEstados();
    const id = setInterval(cargarEstados, 60_000);
    return () => clearInterval(id);
  }, [cargarEstados]);

  // Polling de presencias cada 30 s
  useEffect(() => {
    if (!token || contactos.length === 0) return;
    const poll = async () => {
      const nuevas: Record<string, boolean> = {};
      await Promise.all(
        contactos.map(async (c) => {
          try {
            const p = await usuariosApi.presencia(c.contacto_id, token);
            nuevas[c.contacto_id] = p.conectado;
          } catch {
            /* ignorar */
          }
        }),
      );
      setPresencias(nuevas);
    };
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [token, contactos]);

  // Cargar historial al cambiar de chat; marcar leídos al abrir chat privado
  useEffect(() => {
    const cargar = async () => {
      if (!chatActivo || !token) {
        setHistorial([]);
        return;
      }
      setCargandoHistorial(true);
      setHistorial([]);
      try {
        let msgs: Mensaje[] = [];
        if (chatActivo.tipo === "sala") {
          msgs = await mensajesApi.historialSala(token);
        } else if (chatActivo.tipo === "privado" && chatActivo.id) {
          msgs = await mensajesApi.historialPrivado(chatActivo.id, token);
          // Marcar como leídos al abrir el chat privado
          mensajesApi.marcarLeidos(chatActivo.id, token).catch(() => {});
        } else if (chatActivo.tipo === "grupo" && chatActivo.id) {
          msgs = await mensajesApi.historialGrupo(chatActivo.id, token);
        }
        setHistorial(msgs);
      } catch {
        setHistorial([]);
      } finally {
        setCargandoHistorial(false);
      }
    };
    cargar();
  }, [chatActivo?.tipo, chatActivo?.id, token]);

  // Marcar leídos cuando llegan mensajes RT del otro usuario en chat privado
  const lastRtLengthRef = useRef(0);
  useEffect(() => {
    if (
      chatActivo?.tipo !== "privado" ||
      !chatActivo.id ||
      !token ||
      mensajesRT.length === lastRtLengthRef.current
    )
      return;
    lastRtLengthRef.current = mensajesRT.length;
    const ultimo = mensajesRT[mensajesRT.length - 1];
    if (ultimo && ultimo.remitente_id !== usuarioId) {
      mensajesApi.marcarLeidos(chatActivo.id, token).catch(() => {});
    }
  }, [mensajesRT, chatActivo, token, usuarioId]);

  // ─── Acciones ────────────────────────────────────────────────────────────────

  const eliminarPerfil = async () => {
    if (!token) return;
    setEliminando(true);
    try {
      await usuariosApi.eliminarPerfil(token);
      logout();
    } catch (e) {
      alert(e instanceof Error ? e.message : t.common.error);
      setEliminando(false);
    }
  };

  const confirmarEliminarChat = async () => {
    if (
      !chatActivo ||
      chatActivo.tipo !== "privado" ||
      !chatActivo.id ||
      !token
    )
      return;
    setEliminando(true);
    try {
      await mensajesApi.eliminarChatPrivado(chatActivo.id, token);
      setHistorial([]);
      setModalEliminarChat(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : t.common.error);
    } finally {
      setEliminando(false);
    }
  };

  const eliminarGrupoActivo = async () => {
    if (!chatActivo || chatActivo.tipo !== "grupo" || !chatActivo.id || !token)
      return;
    if (!confirm(t.groups.deleteConfirm)) return;
    try {
      await gruposApi.eliminar(chatActivo.id, token);
      setChatActivo(null);
      cargarDatos();
    } catch (e) {
      alert(e instanceof Error ? e.message : t.common.error);
    }
  };

  const salirGrupoActivo = async () => {
    if (!chatActivo || chatActivo.tipo !== "grupo" || !chatActivo.id || !token)
      return;
    if (!confirm(t.groups.leaveConfirm)) return;
    try {
      await gruposApi.salir(chatActivo.id, token);
      setChatActivo(null);
      cargarDatos();
    } catch (e) {
      alert(e instanceof Error ? e.message : t.common.error);
    }
  };

  const manejarSubirEstado = async (archivo: File) => {
    if (!token) return;
    try {
      const nuevo = await estadosApi.subir(archivo, token);
      setEstados(prev => [nuevo, ...prev.filter(e => e.usuario_id !== nuevo.usuario_id)]);
    } catch (e) {
      alert(e instanceof Error ? e.message : t.common.error);
    }
  };

  const manejarEliminarEstado = async (estadoId: string) => {
    if (!token) return;
    try {
      await estadosApi.eliminar(estadoId, token);
      setEstados(prev => prev.filter(e => e.id !== estadoId));
    } catch { /* ignorar */ }
  };

  const manejarEnviarImagen = async (archivo: File) => {
    if (!chatActivo || !token) return;
    try {
      await mensajesApi.subirImagen(
        archivo,
        chatActivo.tipo,
        token,
        chatActivo.tipo === "privado" ? chatActivo.id : undefined,
        chatActivo.tipo === "grupo" ? chatActivo.id : undefined,
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : t.common.error);
    }
  };

  return (
  <div
    className="flex h-screen overflow-hidden"
    style={{ backgroundColor: "var(--color-bg-primary)" }}
  >
    {/* Barra lateral */}
    <BarraLateral
      grupos={grupos}
      contactos={contactos}
      chatActivo={chatActivo}
      visible={sidebarVisible}
      presencias={presencias}
      estados={estados}
      onCerrar={() => setSidebarVisible(false)}
      onSeleccionarChat={(chat) => {
        setChatActivo(chat);
        setSidebarVisible(false);
      }}
      onAbrirContactos={() => setModalContactos(true)}
      onAbrirGrupos={() => setModalGrupos(true)}
      onAbrirPerfil={() => setModalPerfil(true)}
      onVerEstado={setEstadoVisor}
      onSubirEstado={manejarSubirEstado}
    />

    {/* Panel de chat */}
    <main className="flex-1 flex flex-col overflow-hidden min-w-0">
      {chatActivo ? (
        <>
          <CabeceraChat
            chat={chatActivo}
            conectadoWS={conectado}
            presenciaContacto={presenciaContacto}
            esCreadorGrupo={esCreadorGrupo}
            onToggleSidebar={() => setSidebarVisible((v) => !v)}
            onEliminarChat={
              chatActivo.tipo === "privado"
                ? () => setModalEliminarChat(true)
                : undefined
            }
            onEliminarGrupo={
              chatActivo.tipo === "grupo" ? eliminarGrupoActivo : undefined
            }
            onSalirGrupo={
              chatActivo.tipo === "grupo" ? salirGrupoActivo : undefined
            }
          />
          <AreaMensajes
            mensajes={todosMensajes}
            cargando={cargandoHistorial}
          />
          <InputMensaje onEnviar={enviar} onEnviarImagen={manejarEnviarImagen} deshabilitado={!conectado} />
        </>
      ) : (
        /* Pantalla de bienvenida */
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 animate-fade-in">
          <button
            onClick={() => setSidebarVisible(true)}
            className="md:hidden absolute top-6 left-6 p-3 rounded-xl shadow-card"
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
            }}
          >
            <IconMenu2 size={22} />
          </button>

          <div
            className="w-28 h-28 rounded-3xl flex items-center justify-center"
            style={{
              backgroundColor: "var(--color-accent-light)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <IconMessageCircle
              size={56}
              style={{ color: "var(--color-accent)" }}
            />
          </div>
          <div className="text-center space-y-3">
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {t.chat.selectChat}
            </p>
            <p
              className="text-sm max-w-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              {t.chat.selectChatDesc}
            </p>
          </div>
        </div>
      )}
    </main>

    {/* Modal Contactos */}
    <Modal
      titulo={t.contacts.title}
      abierto={modalContactos}
      onCerrar={() => setModalContactos(false)}
    >
      <PanelContactos
        contactos={contactos}
        onActualizar={cargarDatos}
        onIrAlChat={(chat) => {
          setChatActivo(chat);
          setModalContactos(false);
        }}
        onCerrar={() => setModalContactos(false)}
      />
    </Modal>

    {/* Modal Grupos */}
    <Modal
      titulo={t.groups.title}
      abierto={modalGrupos}
      onCerrar={() => setModalGrupos(false)}
    >
      <PanelGrupos
        grupos={grupos}
        onActualizar={cargarDatos}
        onIrAlChat={(chat) => {
          setChatActivo(chat);
          setModalGrupos(false);
        }}
        onCerrar={() => setModalGrupos(false)}
      />
    </Modal>

    {/* Modal Perfil */}
    <Modal
      titulo={t.profile.title}
      abierto={modalPerfil}
      onCerrar={() => setModalPerfil(false)}
    >
      <ModalPerfil
        onEliminarPerfil={() => {
          setModalPerfil(false);
          setModalEliminarPerfil(true);
        }}
      />
    </Modal>

    {/* Modal Eliminar perfil */}
    <Modal
      titulo={t.profile.delete}
      abierto={modalEliminarPerfil}
      onCerrar={() => setModalEliminarPerfil(false)}
    >
      <div className="space-y-6">
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {t.profile.deleteConfirm}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setModalEliminarPerfil(false)}
            disabled={eliminando}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{
              border: "1.5px solid var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            {t.profile.cancel}
          </button>
          <button
            onClick={eliminarPerfil}
            disabled={eliminando}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            style={{ backgroundColor: "var(--color-danger)", color: "#fff" }}
          >
            {eliminando ? t.common.loading : t.profile.deleteBtn}
          </button>
        </div>
      </div>
    </Modal>

    {/* Visor de estados */}
    {estadoVisor && (
      <ModalVisorEstado
        estado={estadoVisor}
        onCerrar={() => setEstadoVisor(null)}
        onEliminar={manejarEliminarEstado}
      />
    )}

    {/* Modal Eliminar conversación */}
    <Modal
      titulo={t.chat.deleteChat}
      abierto={modalEliminarChat}
      onCerrar={() => setModalEliminarChat(false)}
    >
      <div className="space-y-6">
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {t.chat.deleteChatConfirm}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setModalEliminarChat(false)}
            disabled={eliminando}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{
              border: "1.5px solid var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            {t.profile.cancel}
          </button>
          <button
            onClick={confirmarEliminarChat}
            disabled={eliminando}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            style={{ backgroundColor: "var(--color-danger)", color: "#fff" }}
          >
            {eliminando ? t.common.loading : t.chat.deleteChatBtn}
          </button>
        </div>
      </div>
    </Modal>
  </div>
);
}
