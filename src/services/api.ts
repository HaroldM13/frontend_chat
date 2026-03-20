import type {
  AuthResponse, LoginPayload, RegistroPayload,
  Contacto, AgregarContactoPayload,
  Grupo, CrearGrupoPayload, AgregarMiembroPayload,
  Mensaje, Usuario, Presencia,
} from '../interfaces'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
  registro: (datos: RegistroPayload) =>
    peticion<AuthResponse>('/auth/registro', { method: 'POST', body: JSON.stringify(datos) }),
  login: (datos: LoginPayload) =>
    peticion<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(datos) }),
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
  historialSala: (token: string, limite = 50) =>
    peticion<Mensaje[]>(`/mensajes/sala?limite=${limite}`, {}, token),

  historialPrivado: (otroUsuarioId: string, token: string, limite = 50) =>
    peticion<Mensaje[]>(`/mensajes/privado/${otroUsuarioId}?limite=${limite}`, {}, token),

  historialGrupo: (grupoId: string, token: string, limite = 50) =>
    peticion<Mensaje[]>(`/mensajes/grupo/${grupoId}?limite=${limite}`, {}, token),

  marcarLeidos: (otroUsuarioId: string, token: string) =>
    peticion<{ leidos: number }>(`/mensajes/privado/${otroUsuarioId}/leer`, {
      method: 'POST',
    }, token),

  eliminarChatPrivado: (otroUsuarioId: string, token: string) =>
    peticion<{ mensaje: string; mensajes_eliminados: number }>(`/mensajes/privado/${otroUsuarioId}`, {
      method: 'DELETE',
    }, token),
}
