// ─── Autenticación ─────────────────────────────────────────────────────────
export interface LoginPayload { telefono: string }
export interface RegistroPayload { nombre: string; telefono: string; codigo: string }
export interface AuthResponse { access_token: string; token_type: string; usuario_id: string; nombre: string }
export interface AuthState { token: string | null; usuarioId: string | null; nombre: string | null; isAuthenticated: boolean }

// ─── Usuarios ──────────────────────────────────────────────────────────────
export interface Usuario { id: string; nombre: string; telefono: string; created_at: string }

// ─── Contactos ─────────────────────────────────────────────────────────────
export interface Contacto { contacto_id: string; nombre: string; telefono: string; created_at: string }
export interface AgregarContactoPayload { telefono: string }

// ─── Grupos ────────────────────────────────────────────────────────────────
export interface MiembroGrupo { id: string; nombre: string; telefono: string }
export interface Grupo { id: string; nombre: string; creador_id: string; miembros: MiembroGrupo[]; created_at: string }
export interface CrearGrupoPayload { nombre: string }
export interface AgregarMiembroPayload { telefono: string }

// ─── Mensajes ──────────────────────────────────────────────────────────────
export type TipoMensaje = 'sala' | 'privado' | 'grupo'

export interface Mensaje {
  id: string
  tipo: TipoMensaje
  subtipo?: 'imagen'
  remitente_id: string
  nombre_remitente: string
  contenido: string
  destinatario_id?: string
  grupo_id?: string
  leido?: boolean | null
  created_at: string
}

export interface MensajeWS {
  id: string
  tipo: TipoMensaje | 'mensajes_leidos'
  subtipo?: 'imagen'
  remitente_id: string
  nombre_remitente: string
  contenido: string
  destinatario_id?: string
  grupo_id?: string
  leido?: boolean
  // Campos del evento mensajes_leidos
  lector_id?: string
  created_at: string
}

// ─── Chat activo ───────────────────────────────────────────────────────────
export type TipoChat = 'sala' | 'privado' | 'grupo'
export interface ChatActivo { tipo: TipoChat; id?: string; nombre: string }

// ─── Estados (stories) ─────────────────────────────────────────────────────
export interface Estado {
  id: string
  usuario_id: string
  nombre_usuario: string
  url_imagen: string
  created_at: string
  expira_at: string
}

// ─── Tema, idioma, presencia ───────────────────────────────────────────────
export type Tema = 'light' | 'dark'
export type Idioma = 'es' | 'en'
export interface Presencia { conectado: boolean; usuario_id: string }

// ─── API genérico ──────────────────────────────────────────────────────────
export interface ApiError { detail: string }
