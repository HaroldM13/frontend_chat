# JHT Chat — Frontend

Interfaz de usuario de la aplicación de mensajería en tiempo real, construida con **React 18**, **TypeScript** y **Vite**. Implementa autenticación sin contraseña, chat en tiempo real via WebSocket, envío de imágenes, estados (stories) y soporte multiidioma con tema claro/oscuro.

---

## Tabla de contenidos

1. [Descripción general](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Stack tecnológico](#stack-tecnológico)
4. [Estructura del proyecto](#estructura-del-proyecto)
5. [Componentes](#componentes)
6. [Contextos y estado global](#contextos-y-estado-global)
7. [Servicios](#servicios)
8. [WebSocket en el cliente](#websocket-en-el-cliente)
9. [Theming y estilos](#theming-y-estilos)
10. [Internacionalización (i18n)](#internacionalización-i18n)
11. [Variables de entorno](#variables-de-entorno)
12. [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
13. [Build y despliegue](#build-y-despliegue)
14. [Decisiones técnicas importantes](#decisiones-técnicas-importantes)

---

## Descripción general

JHT Chat es una SPA (Single Page Application) que provee:

- **Autenticación** por número de teléfono, sin contraseña. Registro con OTP opcional via SMS.
- **Mensajería en tiempo real** en sala general, chats privados y grupos, usando WebSocket.
- **Confirmaciones de lectura** (✓ enviado / ✓✓ azul leído) en chats privados.
- **Presencia en línea/fuera de línea** con polling cada 30 segundos.
- **Envío de imágenes** en cualquier tipo de chat.
- **Estados/Stories** con duración de 5 minutos en sistema y visor de 15 segundos.
- **Tema claro/oscuro** y soporte en español e inglés.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                        React App                        │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ AuthContext  │  │  TemaContext │  │IdiomaContext │  │
│  │ (JWT, user)  │  │ (light/dark) │  │  (ES / EN)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │                    ChatPage                        │ │
│  │  ┌─────────────┐          ┌──────────────────────┐ │ │
│  │  │ BarraLateral│          │  Área de Chat        │ │ │
│  │  │ (sidebar)   │          │  ┌────────────────┐  │ │ │
│  │  │ BarraEstados│          │  │  CabeceraChat  │  │ │ │
│  │  │ Contactos   │          │  ├────────────────┤  │ │ │
│  │  │ Grupos      │          │  │  AreaMensajes  │  │ │ │
│  │  └─────────────┘          │  ├────────────────┤  │ │ │
│  │                           │  │  InputMensaje  │  │ │ │
│  │                           │  └────────────────┘  │ │ │
│  │                           └──────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────┐    ┌──────────────────────────┐  │
│  │    api.ts         │    │   useWebSocket.ts        │  │
│  │  (fetch HTTP)     │    │  (WebSocket RT)          │  │
│  └────────┬──────────┘    └────────────┬─────────────┘  │
│           │                            │                 │
└───────────┼────────────────────────────┼─────────────────┘
            │ REST API                   │ WebSocket
            ▼                            ▼
     Backend FastAPI (:8000)      Backend FastAPI (:8000)
```

### Estrategia de mensajes: HTTP + WebSocket combinados

El historial de mensajes se carga via HTTP al abrir un chat. Los mensajes en tiempo real llegan por WebSocket. Ambas listas se combinan en `ChatPage` usando `useMemo` con deduplicación por ID, evitando duplicados si un mensaje llega por WS antes de que el historial HTTP termine de cargar.

```
ChatPage
  ├── mensajesHistorial (HTTP)   → GET /mensajes/privado/{id}
  ├── mensajesRT (WebSocket)     → useWebSocket hook
  └── mensajesCombinados = useMemo → deduplica por msg.id
```

---

## Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| React | 18 | UI con hooks funcionales |
| TypeScript | 5.x (strict) | Tipado estático, sin `any` |
| Vite | 6.x | Bundler y servidor de desarrollo |
| Tailwind CSS | 4.x | Utilidades de estilo |
| @tabler/icons-react | — | Iconografía |
| CSS Variables | — | Sistema de theming claro/oscuro |

No se usan librerías de estado global (Redux, Zustand) ni de i18n (i18next). Todo está implementado con React Context y módulos TypeScript nativos.

---

## Estructura del proyecto

```
frontend_chat/
├── index.html
├── vite.config.ts
├── tsconfig.app.json
├── package.json
├── .env                           # Variables de entorno (NO subir a git)
├── .env.example                   # Plantilla de variables de entorno
└── src/
    ├── main.tsx                   # Entry point: monta la app con los contextos
    ├── App.tsx                    # Router: LoginPage o ChatPage según autenticación
    ├── interfaces/
    │   └── index.ts               # Todos los tipos TypeScript del proyecto
    ├── i18n/
    │   ├── es.ts                  # Traducciones en español (fuente de verdad para tipos)
    │   └── en.ts                  # Traducciones en inglés
    ├── context/
    │   ├── AuthContext.tsx        # Token JWT, usuarioId, nombre. login() / logout()
    │   ├── TemaContext.tsx        # Tema light/dark. toggleTema(). CSS vars en <html>
    │   └── IdiomaContext.tsx      # Idioma activo + función t() para traducciones
    ├── hooks/
    │   └── useWebSocket.ts        # Conexión WS, mensajes RT, evento mensajes_leidos
    ├── services/
    │   ├── api.ts                 # authApi, usuariosApi, contactosApi, gruposApi, mensajesApi, estadosApi
    │   └── websocket.ts           # Clase WebSocketService (reconexión automática)
    ├── pages/
    │   ├── LoginPage.tsx          # Formulario de login/registro con toggle OTP
    │   └── ChatPage.tsx           # Página principal del chat
    └── components/
        ├── AreaMensajes.tsx       # Lista de mensajes con auto-scroll
        ├── BarraEstados.tsx       # Tira de estados/stories (scroll horizontal)
        ├── BarraLateral.tsx       # Sidebar: estados, búsqueda, sala, contactos, grupos
        ├── BurbujaMensaje.tsx     # Burbuja: texto o imagen, checkmarks de lectura
        ├── CabeceraChat.tsx       # Header del chat: nombre, presencia, menú acciones
        ├── InputMensaje.tsx       # Campo de texto + botón de imagen
        ├── Modal.tsx              # Contenedor modal genérico (overlay + cierre con ESC)
        ├── ModalPerfil.tsx        # Ver perfil, editar nombre, eliminar cuenta
        ├── ModalVisorEstado.tsx   # Visor fullscreen de estados con barra de progreso 15s
        ├── PanelContactos.tsx     # CRUD de contactos
        └── PanelGrupos.tsx        # CRUD de grupos
```

---

## Componentes

### `LoginPage`

Formulario de autenticación con dos modos: **login** y **registro**.

- **Login**: solo número de teléfono → acceso directo sin OTP.
- **Registro**: nombre + teléfono. Toggle opcional "Verificar número con SMS":
  - OFF (default) → registro directo, sin Twilio.
  - ON → flujo de dos pasos: enviar OTP → verificar código → registrar.
- Controles en la esquina superior: selector de idioma (ES/EN) y toggle de tema.

### `ChatPage`

Página principal. Orquesta todos los componentes y gestiona el estado de la aplicación:

- Carga historial HTTP al cambiar de sala/contacto/grupo.
- Combina historial + mensajes RT con `useMemo` (deduplicado por ID).
- Polling de presencia cada 30s.
- Polling de estados cada 60s.
- Maneja envío de texto e imágenes.
- Controla visibilidad de modales (perfil, contactos, grupos, visor de estado).

### `BarraLateral`

Sidebar visible en tablet y desktop (oculto en móvil con Tailwind `md:`):

- `BarraEstados`: tira horizontal de stories.
- Búsqueda de chat activo.
- Sala General.
- Lista de contactos con badge de mensajes no leídos.
- Lista de grupos.
- Botón de perfil y logout.

### `BarraEstados`

Tira de círculos scrollable horizontalmente:

- Círculo propio con `+`: abre selector de archivo para subir estado.
- Círculos de contactos: al hacer click abre `ModalVisorEstado`.
- Scrollbar oculto (webkit + Firefox).

### `ModalVisorEstado`

Visor fullscreen de estados:

- Barra de progreso que se agota en **15 segundos** (independiente de la expiración del sistema).
- Muestra el tiempo restante del sistema (cuánto tiempo queda antes de que el estado expire).
- Botón de eliminar para estados propios.
- Se cierra con ESC, click fuera o al agotarse el tiempo.

### `BurbujaMensaje`

Burbuja de mensaje que soporta dos subtipos:

- **texto**: renderiza el contenido como texto plano.
- **imagen**: renderiza `<img>` con la URL del servidor. Click abre la imagen en nueva pestaña.
- Checkmarks de lectura (solo chats privados): ✓ gris (enviado) / ✓✓ azul (leído).
- Alineación: burbuja propia a la derecha, burbuja del otro a la izquierda.

### `InputMensaje`

Campo de texto + acciones de envío:

- Envío de texto con Enter o botón.
- Botón de foto: abre selector de archivo, llama a `onEnviarImagen` con el File.
- Input nativo oculto con `accept="image/*"`.

### `CabeceraChat`

Header del chat activo:

- Nombre del contacto/grupo/sala.
- Indicador de presencia en línea (punto verde / "en línea" / "fuera de línea").
- Menú de acciones contextual (eliminar chat, salir/eliminar grupo).

---

## Contextos y estado global

### `AuthContext`

```typescript
const { token, usuarioId, nombre, login, logout, actualizarNombre } = useAuth()
```

- Persiste `token`, `usuarioId` y `nombre` en `localStorage`.
- `login(token, usuarioId, nombre)` — guarda credenciales y redirige al chat.
- `logout()` — llama `POST /auth/logout`, limpia localStorage, redirige al login.

### `TemaContext`

```typescript
const { tema, toggleTema } = useTema()
```

- Guarda el tema en `localStorage`.
- Aplica `data-theme="dark"` o `data-theme="light"` al elemento `<html>`.
- Todas las variables de color se definen en CSS: `--color-bg-primary`, `--color-accent`, etc.

### `IdiomaContext`

```typescript
const { t, idioma, cambiarIdioma } = useIdioma()
```

- `t` es el objeto de traducciones del idioma activo (`es.ts` o `en.ts`).
- El idioma se persiste en `localStorage`.
- Sin librerías externas: el objeto `t` tipado directamente desde TypeScript.

---

## Servicios

### `api.ts`

Centraliza todas las llamadas HTTP al backend. Función base `peticion<T>()` que:
- Agrega el header `Authorization: Bearer {token}` cuando se provee.
- Lanza `Error(detail)` con el mensaje del backend si la respuesta no es OK.
- Maneja respuestas 204 (sin body).

```typescript
// Módulos exportados
authApi      // enviarOtp, registro, login, logout
usuariosApi  // perfil, editarNombre, eliminarPerfil, buscar, presencia
contactosApi // listar, agregar, eliminar
gruposApi    // listar, crear, detalle, agregarMiembro, eliminar, salir
mensajesApi  // historialSala, historialPrivado, historialGrupo, subirImagen, marcarLeidos, eliminarChatPrivado
estadosApi   // listar, subir, eliminar
```

### `websocket.ts`

Clase `WebSocketService` que encapsula la conexión:

- Reconexión automática con backoff exponencial.
- Métodos `conectar(url)`, `desconectar()`, `enviar(datos)`.
- Callback `onMensaje` para recibir eventos del servidor.

---

## WebSocket en el cliente

### `useWebSocket.ts`

Hook que gestiona la conexión WebSocket para el chat activo:

```typescript
const { mensajes, enviarMensaje } = useWebSocket({
  sala,
  token,
  onMensajesLeidos,
})
```

- Conecta al endpoint correcto según el tipo de sala (`/ws/sala`, `/ws/privado/{id}`, `/ws/grupo/{id}`).
- Recibe mensajes de texto e imagen en tiempo real.
- Detecta el evento `{ tipo: "mensajes_leidos" }` y notifica a `ChatPage`.
- Al cambiar de sala, desconecta la conexión anterior y abre una nueva.

> **Nota importante**: el hook solo gestiona mensajes en tiempo real. El historial se carga por separado via HTTP en `ChatPage` y se combina con `useMemo`.

---

## Theming y estilos

El sistema de colores usa CSS Variables definidas en `index.css`:

```css
:root {                               /* Tema claro (default) */
  --color-bg-primary: #f8fafc;
  --color-bg-secondary: #ffffff;
  --color-bg-tertiary: #f1f5f9;
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-border: #e2e8f0;
  --color-accent: #3b82f6;
}

[data-theme="dark"] {                  /* Tema oscuro */
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-bg-tertiary: #334155;
  --color-text-primary: #f8fafc;
  --color-text-secondary: #cbd5e1;
  --color-text-muted: #64748b;
  --color-border: #334155;
  --color-accent: #3b82f6;
}
```

Los componentes usan `style={{ backgroundColor: "var(--color-bg-secondary)" }}` directamente, combinando con clases de Tailwind para layout y responsividad.

---

## Internacionalización (i18n)

Las traducciones están en `src/i18n/es.ts` y `src/i18n/en.ts`. El tipo del objeto de traducciones se infiere automáticamente de `es.ts` (fuente de verdad):

```typescript
// es.ts (extracto)
export const es = {
  auth: {
    welcome: "Bienvenido a JHT Chat",
    login: "Iniciar sesión",
    register: "Registrarse",
    sendCode: "Enviar código",
    // ...
  },
  estados: {
    title: "Estados",
    my: "Mi estado",
    add: "Agregar estado",
    minLeft: "min restantes",
    // ...
  },
  common: {
    loading: "Cargando...",
    error: "Ha ocurrido un error",
  }
}
```

Para usar en cualquier componente:
```typescript
const { t } = useIdioma()
// t.auth.welcome → "Bienvenido a JHT Chat" (ES) o "Welcome to JHT Chat" (EN)
```

---

## Variables de entorno

Crear `.env` en la raíz de `frontend_chat/`:

```env
# URL base de la API del backend (HTTP)
VITE_API_URL=http://localhost:8000

# URL base del WebSocket del backend
VITE_WS_URL=ws://localhost:8000
```

En producción:
```env
VITE_API_URL=https://api.tudominio.com
VITE_WS_URL=wss://api.tudominio.com
```

> Todas las variables deben empezar con `VITE_` para que Vite las exponga al bundle.

---

## Instalación y puesta en marcha

### Requisitos previos

- Node.js 20+ (recomendado via nvm)
- Backend corriendo en `http://localhost:8000`

### Pasos

```bash
# 1. Entrar al directorio del frontend
cd project_chat/frontend_chat

# 2. Instalar Node.js (si usas nvm)
source ~/.nvm/nvm.sh
nvm use 20

# 3. Instalar dependencias
npm install

# 4. Configurar variables de entorno
cp .env.example .env
# El .env por defecto apunta a localhost:8000, no necesita cambios para desarrollo local

# 5. Arrancar el servidor de desarrollo
npm run dev -- --host
```

La aplicación estará disponible en: `http://localhost:5173`

El flag `--host` expone el servidor en la red local, útil para probar desde el celular en la misma red.

---

## Build y despliegue

### Generar el build de producción

```bash
npm run build
```

Genera la carpeta `dist/` con los archivos estáticos optimizados.

### Opción A — Nginx sirve los estáticos (recomendado)

```nginx
server {
    listen 80;
    server_name tudominio.com;

    root /ruta/al/frontend_chat/dist;
    index index.html;

    # SPA: redirigir todas las rutas a index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Opción B — PM2 con `serve`

```bash
npm install -g serve
pm2 start serve --name "jht-frontend" -- -s dist -l 5173
pm2 save
```

### Certificado SSL con Certbot

```bash
sudo certbot --nginx -d tudominio.com
sudo systemctl reload nginx
```

---

## Decisiones técnicas importantes

### Mensajes: HTTP + WebSocket deduplicados

El historial se carga via HTTP y los mensajes nuevos llegan por WebSocket. Se combinan con `useMemo` deduplicando por `msg.id`:

```typescript
const mensajesCombinados = useMemo(() => {
  const ids = new Set(mensajesRT.map(m => m.id))
  return [
    ...mensajesHistorial.filter(m => !ids.has(m.id)),
    ...mensajesRT,
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}, [mensajesHistorial, mensajesRT])
```

> **Por qué es necesario**: sin esto, si el historial HTTP tarda en cargar y el WS ya recibió un mensaje, ese mensaje aparecería duplicado.

### Fechas UTC con sufijo `Z`

El backend serializa las fechas con sufijo `Z` (ej. `"2024-01-15T10:00:00Z"`). Sin este sufijo, JavaScript interpreta las fechas como hora local en vez de UTC, causando que los contadores de tiempo (como en los estados) muestren valores incorrectos.

### OTP opcional via toggle en la UI

En lugar de controlar el OTP con una variable de entorno del backend, el toggle está en la interfaz. El backend detecta automáticamente: si el campo `codigo` llega vacío → registro directo; si llega con valor → verifica OTP. Esto permite que cada usuario decida si quiere verificar su número sin cambiar configuración del servidor.

### Theming sin librería

El tema claro/oscuro se implementa con CSS Variables y el atributo `data-theme` en `<html>`. No se usa ninguna librería de theming. El contexto `TemaContext` solo cambia ese atributo y guarda la preferencia en `localStorage`.

### Errores comunes

| Error | Causa | Solución |
|---|---|---|
| Página en blanco al abrir | `VITE_API_URL` incorrecto | Verificar `.env` y que el backend esté corriendo |
| `CORS error` en consola | Origin no permitido en backend | Agregar `http://localhost:5173` a `ALLOWED_ORIGINS` en el `.env` del backend |
| WebSocket no conecta | Backend no corriendo o URL incorrecta | Verificar `VITE_WS_URL` en `.env` |
| Imágenes no cargan | Backend no sirve `uploads/` | Verificar que FastAPI tenga montado `StaticFiles` en `/uploads` |
| `npm install` falla con node-gyp | Faltan build tools | `sudo apt install build-essential` (Linux/WSL) |
