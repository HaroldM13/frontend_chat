import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BarraLateral } from "../components/BarraLateral";
import { CabeceraChat } from "../components/CabeceraChat";
import { AreaMensajes } from "../components/AreaMensajes";
import { InputMensaje } from "../components/InputMensaje";
import { Modal } from "../components/Modal";
import { ModalPerfil } from "../components/ModalPerfil";
import { PanelContactos } from "../components/PanelContactos";
import { PanelGrupos } from "../components/PanelGrupos";
import { ModalEncuesta } from "../components/ModalEncuesta";
import { useAuth } from "../context/AuthContext";
import { useIdioma } from "../context/IdiomaContext";
import {
  contactosApi,
  gruposApi,
  mensajesApi,
  usuariosApi,
  estadosApi,
  favoritosApi,
  reaccionesApi,
  encuestasApi,
} from "../services/api";
import { cacheDB } from "../services/cacheDB";
import { ModalVisorEstado } from "../components/ModalVisorEstado";
import { useWebSocket } from "../hooks/useWebSocket";
import type {
  Contacto,
  Grupo,
  ChatActivo,
  Mensaje,
  MensajeWS,
  Estado,
  ResumenConversaciones,
  ContextAction,
  ReplyTo,
} from "../interfaces";
import { IconMessageCircle, IconMenu2 } from "@tabler/icons-react";

export function ChatPage() {
  const { token, usuarioId, logout, actualizarFoto } = useAuth();
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

  // Resumen último mensaje por conversación
  const [resumenMensajes, setResumenMensajes] = useState<ResumenConversaciones>({});

  // Favoritos
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());

  // Paginación hacia atrás
  const LIMITE_PAGINA = 50;
  const [hayMas, setHayMas] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);

  // Visibilidad de la barra lateral
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Responder/citar mensaje
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);

  // Edición de mensajes
  const [mensajeEditando, setMensajeEditando] = useState<(Mensaje | MensajeWS) | null>(null);
  const [textoEdicion, setTextoEdicion] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Modal encuesta
  const [modalEncuesta, setModalEncuesta] = useState(false);

  // Modales
  const [modalContactos, setModalContactos] = useState(false);
  const [modalGrupos, setModalGrupos] = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  const [modalEliminarPerfil, setModalEliminarPerfil] = useState(false);
  const [modalEliminarChat, setModalEliminarChat] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  // cacheKey para IndexedDB
  const cacheKey = useMemo((): string | null => {
    if (!chatActivo) return null;
    if (chatActivo.tipo === 'sala') return 'sala';
    if (chatActivo.tipo === 'privado' && chatActivo.id) return `privado:${chatActivo.id}`;
    if (chatActivo.tipo === 'grupo' && chatActivo.id) return `grupo:${chatActivo.id}`;
    return null;
  }, [chatActivo]);

  // Sala WebSocket activa
  const salaWS = (() => {
    if (!chatActivo) return null;
    if (chatActivo.tipo === "sala") return "sala";
    if (chatActivo.tipo === "privado") return `privado/${chatActivo.id}`;
    if (chatActivo.tipo === "grupo") return `grupo/${chatActivo.id}`;
    return null;
  })();

  const { mensajesRT, conectado, enviar, enviarEvento, escribiendo } = useWebSocket(salaWS, token);

  /**
   * Combinar historial HTTP + mensajes RT, evitando duplicados.
   * Los eventos tipo "mensajes_leidos" / "escribiendo" etc no tienen id de msg útil
   * y ya se manejan en el hook, por lo que no aparecen aquí.
   */
  const todosMensajes = useMemo((): (Mensaje | MensajeWS)[] => {
    const historialIds = new Set(historial.map((m) => m.id));
    const soloNuevos = mensajesRT.filter((m) => {
      const tipoReal = m.tipo as string;
      if (!m.id) return false;
      if (['mensajes_leidos', 'escribiendo', 'dejo_escribir', 'mensaje_editado',
           'mensaje_eliminado', 'reaccion', 'voto_encuesta'].includes(tipoReal)) return false;
      return !historialIds.has(m.id);
    });
    return [...historial, ...soloNuevos];
  }, [historial, mensajesRT]);

  // Sincronizar ediciones/eliminaciones del historial cuando llegan eventos RT
  useEffect(() => {
    if (mensajesRT.length === 0) return;
    const ultimo = mensajesRT[mensajesRT.length - 1];
    if (!ultimo) return;

    if (ultimo.tipo === 'mensaje_editado' && ultimo.id) {
      setHistorial(prev => prev.map(m =>
        m.id === ultimo.id ? { ...m, contenido: ultimo.contenido, editado: true } : m
      ));
      return;
    }
    if (ultimo.tipo === 'mensaje_eliminado' && ultimo.id) {
      setHistorial(prev => prev.map(m =>
        m.id === ultimo.id ? { ...m, eliminado: true, contenido: '' } : m
      ));
      return;
    }
    if (ultimo.tipo === 'reaccion' && ultimo.mensaje_id) {
      setHistorial(prev => prev.map(m =>
        m.id === ultimo.mensaje_id ? { ...m, reacciones: ultimo.reacciones } : m
      ));
      return;
    }
    if (ultimo.tipo === 'voto_encuesta' && ultimo.mensaje_id) {
      setHistorial(prev => prev.map(m =>
        m.id === ultimo.mensaje_id ? { ...m, votos: ultimo.votos } : m
      ));
      return;
    }
  }, [mensajesRT]);

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

  // Cargar foto de perfil y favoritos al iniciar sesión
  useEffect(() => {
    if (!token) return;
    usuariosApi.perfil(token)
      .then(u => { if (u.foto_url) actualizarFoto(u.foto_url) })
      .catch(() => {});
    favoritosApi.listar(token)
      .then(lista => setFavoritos(new Set(lista.map(f => f.chat_key))))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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

  // Cargar y refrescar resumen de último mensaje cada 30 s
  const cargarResumen = useCallback(async () => {
    if (!token) return;
    try {
      const r = await mensajesApi.resumen(token);
      setResumenMensajes(r);
    } catch { /* ignorar */ }
  }, [token]);

  useEffect(() => {
    cargarResumen();
    const id = setInterval(cargarResumen, 30_000);
    return () => clearInterval(id);
  }, [cargarResumen]);

  // Actualizar resumen en tiempo real cuando llega un mensaje RT al chat activo
  useEffect(() => {
    if (!chatActivo || mensajesRT.length === 0) return;
    const ultimo = mensajesRT[mensajesRT.length - 1];
    if (!ultimo) return;
    const tipoReal = ultimo.tipo as string;
    if (['mensajes_leidos', 'escribiendo', 'dejo_escribir', 'mensaje_editado',
         'mensaje_eliminado', 'reaccion', 'voto_encuesta'].includes(tipoReal)) return;

    // Verificar que el mensaje pertenece al chat activo
    if (ultimo.tipo !== chatActivo.tipo) return;
    if (chatActivo.tipo === 'privado' && chatActivo.id &&
        ultimo.remitente_id !== chatActivo.id &&
        ultimo.destinatario_id !== chatActivo.id) return;
    if (chatActivo.tipo === 'grupo' && ultimo.grupo_id !== chatActivo.id) return;

    let key = '';
    if (chatActivo.tipo === 'sala') key = 'sala';
    else if (chatActivo.tipo === 'privado' && chatActivo.id) key = `privado:${chatActivo.id}`;
    else if (chatActivo.tipo === 'grupo' && chatActivo.id) key = `grupo:${chatActivo.id}`;
    else return;

    const contenidoPreview =
      ultimo.subtipo === 'imagen' ? '📷 Imagen' :
      ultimo.subtipo === 'audio' ? '🎵 Audio' :
      ultimo.subtipo === 'video' ? '🎬 Video' :
      ultimo.subtipo === 'archivo' ? '📎 Archivo' :
      ultimo.subtipo === 'encuesta' ? '📊 Encuesta' :
      ultimo.contenido

    setResumenMensajes(prev => ({
      ...prev,
      [key]: {
        nombre_remitente: ultimo.nombre_remitente,
        remitente_id: ultimo.remitente_id,
        contenido: contenidoPreview,
        subtipo: ultimo.subtipo,
        created_at: ultimo.created_at,
      }
    }));
  }, [mensajesRT, chatActivo]);

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

  // Cargar historial al cambiar de chat con carga desde cache primero
  useEffect(() => {
    const cargar = async () => {
      if (!chatActivo || !token) {
        setHistorial([]);
        setHayMas(false);
        return;
      }
      setCargandoHistorial(true);
      setHistorial([]);
      setHayMas(false);
      setReplyTo(null);

      // Mostrar cache inmediatamente
      if (cacheKey) {
        const cached = await cacheDB.obtener(cacheKey);
        if (cached.length > 0) {
          setHistorial(cached);
          setCargandoHistorial(false);
        }
      }

      try {
        let msgs: Mensaje[] = [];
        if (chatActivo.tipo === "sala") {
          msgs = await mensajesApi.historialSala(token, LIMITE_PAGINA);
        } else if (chatActivo.tipo === "privado" && chatActivo.id) {
          msgs = await mensajesApi.historialPrivado(chatActivo.id, token, LIMITE_PAGINA);
          mensajesApi.marcarLeidos(chatActivo.id, token).catch(() => {});
          // Limpiar badge de no leídos al abrir el chat
          const key = `privado:${chatActivo.id}`;
          setResumenMensajes(prev => {
            if (!prev[key]) return prev;
            return { ...prev, [key]: { ...prev[key], no_leidos: 0 } };
          });
        } else if (chatActivo.tipo === "grupo" && chatActivo.id) {
          msgs = await mensajesApi.historialGrupo(chatActivo.id, token, LIMITE_PAGINA);
        }
        setHayMas(msgs.length === LIMITE_PAGINA);
        setHistorial(msgs);
        // Actualizar cache
        if (cacheKey && msgs.length > 0) {
          cacheDB.guardar(cacheKey, msgs).catch(() => {});
        }
      } catch {
        // Si falla la red, mantener el cache
      } finally {
        setCargandoHistorial(false);
      }
    };
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatActivo?.tipo, chatActivo?.id, token]);

  // Cargar mensajes anteriores (paginación hacia atrás)
  const cargarMas = useCallback(async () => {
    if (!chatActivo || !token || !hayMas || cargandoMas || historial.length === 0) return;
    const masAntiguo = historial[0];
    const anclaId = masAntiguo.id;

    setCargandoMas(true);
    try {
      let viejos: Mensaje[] = [];
      if (chatActivo.tipo === "sala") {
        viejos = await mensajesApi.historialSala(token, LIMITE_PAGINA, masAntiguo.created_at);
      } else if (chatActivo.tipo === "privado" && chatActivo.id) {
        viejos = await mensajesApi.historialPrivado(chatActivo.id, token, LIMITE_PAGINA, masAntiguo.created_at);
      } else if (chatActivo.tipo === "grupo" && chatActivo.id) {
        viejos = await mensajesApi.historialGrupo(chatActivo.id, token, LIMITE_PAGINA, masAntiguo.created_at);
      }
      setHayMas(viejos.length === LIMITE_PAGINA);
      setHistorial(prev => [...viejos, ...prev]);
      // Restaurar scroll: ir al elemento que era el primero antes de cargar
      setTimeout(() => {
        document.getElementById(`msg-${anclaId}`)?.scrollIntoView({ block: 'start' });
      }, 50);
    } catch { /* ignorar */ }
    finally { setCargandoMas(false); }
  }, [chatActivo, token, hayMas, cargandoMas, historial]);

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

  // ─── Typing indicators ───────────────────────────────────────────────────────

  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const manejarTyping = useCallback(() => {
    enviarEvento({ tipo: 'escribiendo' });
  }, [enviarEvento]);

  const manejarStopTyping = useCallback(() => {
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    enviarEvento({ tipo: 'dejo_escribir' });
  }, [enviarEvento]);

  // ─── Envío de mensajes ────────────────────────────────────────────────────────

  const manejarEnviarConMetadata = useCallback((
    contenido: string,
    replyToId: string | undefined,
    expiraEn: number | undefined,
  ) => {
    const evento: Record<string, unknown> = { contenido };
    if (replyToId) evento.reply_to_id = replyToId;
    if (expiraEn) evento.expira_en = expiraEn;
    enviarEvento(evento);
    setReplyTo(null);
  }, [enviarEvento]);

  // ─── Acciones sobre mensajes ─────────────────────────────────────────────────

  const manejarReply = useCallback((msg: Mensaje | MensajeWS) => {
    setReplyTo({
      id: msg.id,
      contenido: msg.contenido,
      nombre_remitente: msg.nombre_remitente,
      subtipo: msg.subtipo,
    });
  }, []);

  const manejarEdit = useCallback((msg: Mensaje | MensajeWS) => {
    setMensajeEditando(msg);
    setTextoEdicion(msg.contenido);
  }, []);

  const confirmarEdicion = async () => {
    if (!mensajeEditando || !token || !textoEdicion.trim()) return;
    setGuardandoEdicion(true);
    try {
      await mensajesApi.editarMensaje(mensajeEditando.id, textoEdicion.trim(), token);
      setHistorial(prev => prev.map(m =>
        m.id === mensajeEditando.id ? { ...m, contenido: textoEdicion.trim(), editado: true } : m
      ));
      setMensajeEditando(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : t.common.error);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const manejarDelete = useCallback(async (msg: Mensaje | MensajeWS) => {
    if (!token) return;
    if (!confirm(t.messages.delete + '?')) return;
    try {
      await mensajesApi.eliminarMensajePropio(msg.id, token);
      setHistorial(prev => prev.map(m =>
        m.id === msg.id ? { ...m, eliminado: true, contenido: '' } : m
      ));
    } catch (e) {
      alert(e instanceof Error ? e.message : t.common.error);
    }
  }, [token, t]);

  const manejarReaccionar = useCallback(async (msgId: string, emoji: string) => {
    if (!token) return;
    try {
      const resp = await reaccionesApi.toggle(msgId, emoji, token);
      setHistorial(prev => prev.map(m =>
        m.id === msgId ? { ...m, reacciones: resp.reacciones } : m
      ));
    } catch { /* ignorar */ }
  }, [token]);

  const manejarVotar = useCallback(async (msgId: string, opcionId: string) => {
    if (!token) return;
    try {
      const resp = await encuestasApi.votar(msgId, opcionId, token);
      setHistorial(prev => prev.map(m =>
        m.id === msgId ? { ...m, votos: resp.votos } : m
      ));
    } catch { /* ignorar */ }
  }, [token]);

  const manejarCrearEncuesta = async (pregunta: string, opciones: string[]) => {
    if (!chatActivo || !token) return;
    const payload = {
      pregunta,
      opciones,
      tipo_chat: chatActivo.tipo,
      destinatario_id: chatActivo.tipo === 'privado' ? chatActivo.id : undefined,
      grupo_id: chatActivo.tipo === 'grupo' ? chatActivo.id : undefined,
    };
    try {
      await encuestasApi.crear(payload, token);
      // El mensaje llega por WS; no es necesario añadirlo manualmente
    } catch (e) {
      alert(e instanceof Error ? e.message : t.common.error);
    }
  };

  // ─── Acciones de perfil/chat ─────────────────────────────────────────────────

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

  const manejarEnviarArchivo = async (archivo: File) => {
    if (!chatActivo || !token) return;
    try {
      await mensajesApi.subirArchivo(
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

  const toggleFavorito = async (chatKey: string) => {
    if (!token) return;
    try {
      if (favoritos.has(chatKey)) {
        await favoritosApi.quitar(chatKey, token);
        setFavoritos(prev => { const s = new Set(prev); s.delete(chatKey); return s; });
      } else {
        await favoritosApi.agregar(chatKey, token);
        setFavoritos(prev => new Set(prev).add(chatKey));
      }
    } catch { /* ignorar */ }
  };

  const manejarContextAction = async (accion: ContextAction) => {
    if (!token) return;
    try {
      switch (accion.tipo) {
        case 'favorito':
          await toggleFavorito(accion.chatKey);
          break;
        case 'limpiarPrivado':
          if (!confirm(t.chat.clearChatConfirm)) return;
          await mensajesApi.eliminarChatPrivado(accion.contactoId, token);
          if (chatActivo?.tipo === 'privado' && chatActivo.id === accion.contactoId) {
            setHistorial([]);
          }
          break;
        case 'eliminarContacto':
          if (!confirm(`${t.contacts.delete}?`)) return;
          await contactosApi.eliminar(accion.contactoId, token);
          if (chatActivo?.tipo === 'privado' && chatActivo.id === accion.contactoId) {
            setChatActivo(null);
          }
          cargarDatos();
          break;
        case 'salirGrupo':
          if (!confirm(t.groups.leaveConfirm)) return;
          await gruposApi.salir(accion.grupoId, token);
          if (chatActivo?.tipo === 'grupo' && chatActivo.id === accion.grupoId) {
            setChatActivo(null);
          }
          cargarDatos();
          break;
        case 'eliminarGrupo':
          if (!confirm(t.groups.deleteConfirm)) return;
          await gruposApi.eliminar(accion.grupoId, token);
          if (chatActivo?.tipo === 'grupo' && chatActivo.id === accion.grupoId) {
            setChatActivo(null);
          }
          cargarDatos();
          break;
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : t.common.error);
    }
  };

  // Filtrar el indicador de escritura para no mostrar el propio usuario
  const escribiendoFiltrado = escribiendo.filter(u => u.usuario_id !== usuarioId);

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
        resumenMensajes={resumenMensajes}
        favoritos={favoritos}
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
        onContextAction={manejarContextAction}
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
              hayMas={hayMas}
              cargandoMas={cargandoMas}
              onCargarMas={cargarMas}
              escribiendo={escribiendoFiltrado}
              onReply={manejarReply}
              onEdit={manejarEdit}
              onDelete={manejarDelete}
              onReaccionar={manejarReaccionar}
              onVotar={manejarVotar}
            />
            <InputMensaje
              onEnviar={enviar}
              onEnviarConMetadata={manejarEnviarConMetadata}
              onEnviarImagen={manejarEnviarImagen}
              onEnviarArchivo={manejarEnviarArchivo}
              deshabilitado={!conectado}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              onTyping={manejarTyping}
              onStopTyping={manejarStopTyping}
              onCrearEncuesta={() => setModalEncuesta(true)}
            />
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
            className="leading-relaxed"
            style={{ color: "var(--color-text-secondary)", fontSize: '0.9375rem' }}
          >
            {t.profile.deleteConfirm}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setModalEliminarPerfil(false)}
              disabled={eliminando}
              className="flex-1 rounded-2xl font-semibold transition-colors"
              style={{
                border: "2px solid var(--color-border)",
                color: "var(--color-text-secondary)",
                padding: '1rem 1.25rem',
                fontSize: '0.9375rem',
              }}
            >
              {t.profile.cancel}
            </button>
            <button
              onClick={eliminarPerfil}
              disabled={eliminando}
              className="flex-1 rounded-2xl font-semibold transition-colors disabled:opacity-60"
              style={{
                backgroundColor: "var(--color-danger)",
                color: "#fff",
                padding: '1rem 1.25rem',
                fontSize: '0.9375rem',
              }}
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
            className="leading-relaxed"
            style={{ color: "var(--color-text-secondary)", fontSize: '0.9375rem' }}
          >
            {t.chat.deleteChatConfirm}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setModalEliminarChat(false)}
              disabled={eliminando}
              className="flex-1 rounded-2xl font-semibold transition-colors"
              style={{
                border: "2px solid var(--color-border)",
                color: "var(--color-text-secondary)",
                padding: '1rem 1.25rem',
                fontSize: '0.9375rem',
              }}
            >
              {t.profile.cancel}
            </button>
            <button
              onClick={confirmarEliminarChat}
              disabled={eliminando}
              className="flex-1 rounded-2xl font-semibold transition-colors disabled:opacity-60"
              style={{
                backgroundColor: "var(--color-danger)",
                color: "#fff",
                padding: '1rem 1.25rem',
                fontSize: '0.9375rem',
              }}
            >
              {eliminando ? t.common.loading : t.chat.deleteChatBtn}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal edición de mensaje */}
      {mensajeEditando && (
        <Modal
          titulo={t.messages.edit}
          abierto={true}
          onCerrar={() => setMensajeEditando(null)}
        >
          <div className="space-y-4">
            <textarea
              value={textoEdicion}
              onChange={e => setTextoEdicion(e.target.value)}
              rows={3}
              maxLength={4000}
              className="w-full rounded-2xl resize-none outline-none"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
                border: '2px solid var(--color-border)',
                padding: '0.75rem 1rem',
                fontSize: '0.9375rem',
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setMensajeEditando(null)}
                className="flex-1 rounded-2xl font-semibold"
                style={{
                  border: '2px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  padding: '0.875rem 1.25rem',
                  fontSize: '0.9375rem',
                }}
              >
                {t.profile.cancel}
              </button>
              <button
                onClick={confirmarEdicion}
                disabled={guardandoEdicion || !textoEdicion.trim()}
                className="flex-1 rounded-2xl font-semibold disabled:opacity-60"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: '#fff',
                  padding: '0.875rem 1.25rem',
                  fontSize: '0.9375rem',
                }}
              >
                {guardandoEdicion ? t.common.loading : t.common.save}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal encuesta */}
      <ModalEncuesta
        visible={modalEncuesta}
        onCerrar={() => setModalEncuesta(false)}
        onCrear={manejarCrearEncuesta}
      />
    </div>
  );
}
