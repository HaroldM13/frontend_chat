import type {
  AuthResponse, RegistroPayload, Estado,
  Contacto, AgregarContactoPayload,
  Grupo, CrearGrupoPayload, AgregarMiembroPayload,
  Mensaje, Usuario, Presencia, ResumenConversaciones, Favorito, Reaccion, OpcionEncuesta,
} from '../interfaces'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function peticion<T>(endpoint: string, opciones: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opciones.headers as Record<string, string> || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${endpoint}`, { ...opciones, headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error desconocido' }))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  if (res.status === 204) return {} as T
  return res.json() as Promise<T>
}

// ─── Autenticación ─────────────────────────────────────────────────────────
export const authApi = {
  enviarOtp: (telefono: string) =>
    peticion<{ mensaje: string }>('/auth/enviar-otp', { method: 'POST', body: JSON.stringify({ telefono }) }),
  registro: (datos: RegistroPayload) =>
    peticion<AuthResponse>('/auth/registro', { method: 'POST', body: JSON.stringify(datos) }),
  login: (telefono: string) =>
    peticion<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ telefono }) }),
  logout: (token: string) =>
    peticion<{ mensaje: string }>('/auth/logout', { method: 'POST' }, token),
}

// ─── Usuarios ──────────────────────────────────────────────────────────────
export const usuariosApi = {
  perfil: (token: string) =>
    peticion<Usuario>('/usuarios/perfil', {}, token),

  editarNombre: (nombre: string, token: string) =>
    peticion<{ mensaje: string; nombre: string }>('/usuarios/perfil', {
      method: 'PATCH',
      body: JSON.stringify({ nombre }),
    }, token),

  editarDescripcion: (descripcion: string, token: string) =>
    peticion<{ mensaje: string; descripcion: string }>('/usuarios/perfil', {
      method: 'PATCH',
      body: JSON.stringify({ descripcion }),
    }, token),

  subirFoto: async (archivo: File, token: string): Promise<{ foto_url: string }> => {
    const form = new FormData()
    form.append('archivo', archivo)
    const res = await fetch(`${API_URL}/usuarios/perfil/foto`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Error desconocido' }))
      throw new Error(err.detail || `Error ${res.status}`)
    }
    return res.json()
  },

  eliminarPerfil: (token: string) =>
    peticion<{ mensaje: string }>('/usuarios/perfil', { method: 'DELETE' }, token),

  buscar: (telefono: string, token: string) =>
    peticion<Usuario>(`/usuarios/buscar/${telefono}`, {}, token),

  presencia: (usuarioId: string, token: string) =>
    peticion<Presencia>(`/usuarios/${usuarioId}/presencia`, {}, token),
}

// ─── Contactos ─────────────────────────────────────────────────────────────
export const contactosApi = {
  listar: (token: string) =>
    peticion<Contacto[]>('/contactos', {}, token),

  agregar: (datos: AgregarContactoPayload, token: string) =>
    peticion<{ mensaje: string; contacto: Usuario }>('/contactos', {
      method: 'POST',
      body: JSON.stringify(datos),
    }, token),

  eliminar: (contactoId: string, token: string) =>
    peticion<{ mensaje: string; mensajes_eliminados: number }>(`/contactos/${contactoId}`, {
      method: 'DELETE',
    }, token),
}

// ─── Grupos ────────────────────────────────────────────────────────────────
export const gruposApi = {
  listar: (token: string) =>
    peticion<Grupo[]>('/grupos', {}, token),

  crear: (datos: CrearGrupoPayload, token: string) =>
    peticion<Grupo>('/grupos', { method: 'POST', body: JSON.stringify(datos) }, token),

  detalle: (grupoId: string, token: string) =>
    peticion<Grupo>(`/grupos/${grupoId}`, {}, token),

  agregarMiembro: (grupoId: string, datos: AgregarMiembroPayload, token: string) =>
    peticion<{ mensaje: string }>(`/grupos/${grupoId}/miembros`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }, token),

  eliminar: (grupoId: string, token: string) =>
    peticion<{ mensaje: string }>(`/grupos/${grupoId}`, { method: 'DELETE' }, token),

  salir: (grupoId: string, token: string) =>
    peticion<{ mensaje: string }>(`/grupos/${grupoId}/salir`, { method: 'POST' }, token),
}

// ─── Mensajes ──────────────────────────────────────────────────────────────
export const mensajesApi = {
  historialSala: (token: string, limite = 50, antesDe?: string) =>
    peticion<Mensaje[]>(`/mensajes/sala?limite=${limite}${antesDe ? `&antes_de=${encodeURIComponent(antesDe)}` : ''}`, {}, token),

  historialPrivado: (otroUsuarioId: string, token: string, limite = 50, antesDe?: string) =>
    peticion<Mensaje[]>(`/mensajes/privado/${otroUsuarioId}?limite=${limite}${antesDe ? `&antes_de=${encodeURIComponent(antesDe)}` : ''}`, {}, token),

  historialGrupo: (grupoId: string, token: string, limite = 50, antesDe?: string) =>
    peticion<Mensaje[]>(`/mensajes/grupo/${grupoId}?limite=${limite}${antesDe ? `&antes_de=${encodeURIComponent(antesDe)}` : ''}`, {}, token),

  subirImagen: async (
    archivo: File,
    tipochat: string,
    token: string,
    destinatarioId?: string,
    grupoId?: string,
  ) => {
    const form = new FormData()
    form.append('archivo', archivo)
    form.append('tipo_chat', tipochat)
    if (destinatarioId) form.append('destinatario_id', destinatarioId)
    if (grupoId) form.append('grupo_id', grupoId)
    const res = await fetch(`${API_URL}/mensajes/imagen`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Error desconocido' }))
      throw new Error(err.detail || `Error ${res.status}`)
    }
    return res.json()
  },

  marcarLeidos: (otroUsuarioId: string, token: string) =>
    peticion<{ leidos: number }>(`/mensajes/privado/${otroUsuarioId}/leer`, {
      method: 'POST',
    }, token),

  eliminarChatPrivado: (otroUsuarioId: string, token: string) =>
    peticion<{ mensaje: string; mensajes_eliminados: number }>(`/mensajes/privado/${otroUsuarioId}`, {
      method: 'DELETE',
    }, token),

  editarMensaje: (msgId: string, contenido: string, token: string) =>
    peticion<{ id: string; contenido: string; editado: boolean }>(`/mensajes/${msgId}`, {
      method: 'PATCH',
      body: JSON.stringify({ contenido }),
    }, token),

  eliminarMensajePropio: (msgId: string, token: string) =>
    peticion<{ id: string; eliminado: boolean }>(`/mensajes/${msgId}/propio`, {
      method: 'DELETE',
    }, token),

  resumen: (token: string) =>
    peticion<ResumenConversaciones>('/mensajes/resumen', {}, token),

  subirArchivo: async (
    archivo: File,
    tipochat: string,
    token: string,
    destinatarioId?: string,
    grupoId?: string,
  ) => {
    const form = new FormData()
    form.append('archivo', archivo)
    form.append('tipo_chat', tipochat)
    if (destinatarioId) form.append('destinatario_id', destinatarioId)
    if (grupoId) form.append('grupo_id', grupoId)
    const res = await fetch(`${API_URL}/mensajes/archivo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Error desconocido' }))
      throw new Error(err.detail || `Error ${res.status}`)
    }
    return res.json()
  },
}

// ─── Reacciones ────────────────────────────────────────────────────────────
export const reaccionesApi = {
  toggle: (msgId: string, emoji: string, token: string) =>
    peticion<{ reacciones: Reaccion[] }>(`/reacciones/${msgId}`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }, token),
}

// ─── Encuestas ─────────────────────────────────────────────────────────────
export interface CrearEncuestaPayload {
  pregunta: string
  opciones: string[]
  tipo_chat: string
  destinatario_id?: string
  grupo_id?: string
}

export interface EncuestaCreada {
  id: string
  tipo: string
  subtipo: string
  remitente_id: string
  nombre_remitente: string
  contenido: string
  opciones: OpcionEncuesta[]
  votos: Record<string, number>
  mi_voto: string | null
  created_at: string
  destinatario_id?: string
  grupo_id?: string
}

export const encuestasApi = {
  crear: (payload: CrearEncuestaPayload, token: string) =>
    peticion<EncuestaCreada>('/encuestas', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),

  votar: (msgId: string, opcionId: string, token: string) =>
    peticion<{ votos: Record<string, number>; mi_voto: string | null }>(`/encuestas/${msgId}/votar`, {
      method: 'POST',
      body: JSON.stringify({ opcion_id: opcionId }),
    }, token),
}

// ─── Favoritos ─────────────────────────────────────────────────────────────
export const favoritosApi = {
  listar: (token: string) =>
    peticion<Favorito[]>('/favoritos', {}, token),

  agregar: (chatKey: string, token: string) =>
    peticion<{ chat_key: string }>('/favoritos', {
      method: 'POST',
      body: JSON.stringify({ chat_key: chatKey }),
    }, token),

  quitar: (chatKey: string, token: string) =>
    peticion<{ ok: boolean }>(`/favoritos/${encodeURIComponent(chatKey)}`, { method: 'DELETE' }, token),
}

// ─── Estados ───────────────────────────────────────────────────────────────
export const estadosApi = {
  listar: (token: string) =>
    peticion<Estado[]>('/estados', {}, token),

  subir: async (archivo: File, token: string): Promise<Estado> => {
    const form = new FormData()
    form.append('archivo', archivo)
    const res = await fetch(`${API_URL}/estados`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Error desconocido' }))
      throw new Error(err.detail || `Error ${res.status}`)
    }
    return res.json()
  },

  eliminar: (estadoId: string, token: string) =>
    peticion<{ mensaje: string }>(`/estados/${estadoId}`, { method: 'DELETE' }, token),
}
