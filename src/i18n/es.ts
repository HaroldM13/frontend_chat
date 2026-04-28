/**
 * Traducciones en español para JHT Chat.
 */
const es = {
  // Autenticación
  auth: {
    login: 'Iniciar sesión',
    register: 'Registrarse',
    phone: 'Número de teléfono',
    name: 'Nombre completo',
    loginBtn: 'Entrar',
    registerBtn: 'Crear cuenta',
    noAccount: '¿No tienes cuenta?',
    hasAccount: '¿Ya tienes cuenta?',
    phonePlaceholder: 'Ej: 3001234567',
    namePlaceholder: 'Ej: Juan Pérez',
    welcome: 'Bienvenido a JHT Chat',
    subtitle: 'Conecta con tus contactos en tiempo real',
    sendCode: 'Enviar código',
    otpTitle: 'Verifica tu número',
    otpSubtitle: 'Ingresa el código de 6 dígitos que enviamos a',
    otpCode: 'Código de verificación',
    otpPlaceholder: '123456',
    otpVerify: 'Verificar',
    otpResend: 'Reenviar código',
    otpBack: 'Cambiar número',
  },

  // Navegación y menú
  nav: {
    contacts: 'Contactos',
    groups: 'Grupos',
    generalRoom: 'Sala general',
    logout: 'Cerrar sesión',
    deleteProfile: 'Eliminar perfil',
    theme: 'Tema',
    language: 'Idioma',
    lightTheme: 'Claro',
    darkTheme: 'Oscuro',
    search: 'Buscar...',
  },

  // Chat
  chat: {
    messagePlaceholder: 'Escribe un mensaje...',
    send: 'Enviar',
    noMessages: 'No hay mensajes aún',
    startConversation: 'Sé el primero en escribir',
    generalRoom: 'Sala general',
    generalRoomDesc: 'Todos los usuarios conectados',
    privateChat: 'Chat privado',
    selectChat: 'Selecciona una conversación',
    selectChatDesc: 'Elige un contacto, grupo o la sala general para empezar',
    you: 'Tú',
    userOnline: 'En línea',
    userOffline: 'Fuera de línea',
    deleteChat: 'Eliminar conversación',
    deleteChatConfirm: '¿Eliminar la conversación? Se borrará para ambos usuarios.',
    deleteChatBtn: 'Eliminar',
  },

  // Contactos
  contacts: {
    title: 'Contactos',
    add: 'Agregar contacto',
    addPlaceholder: 'Teléfono del contacto',
    addBtn: 'Agregar',
    empty: 'No tienes contactos aún',
    emptyDesc: 'Agrega un contacto por su número de teléfono',
    delete: 'Eliminar',
    chat: 'Chatear',
    search: 'Buscar contacto...',
  },

  // Grupos
  groups: {
    title: 'Grupos',
    create: 'Crear grupo',
    createBtn: 'Crear',
    namePlaceholder: 'Nombre del grupo',
    empty: 'No perteneces a ningún grupo',
    emptyDesc: 'Crea un grupo o pide que te agreguen',
    members: 'miembro(s)',
    addMember: 'Agregar miembro',
    addMemberPlaceholder: 'Teléfono del nuevo miembro',
    leave: 'Salir del grupo',
    delete: 'Eliminar grupo',
    deleteConfirm: '¿Eliminar el grupo? Esta acción no se puede deshacer.',
    leaveConfirm: '¿Salir del grupo?',
    createdBy: 'Creado por',
    you: 'ti',
    membersList: 'Miembros',
  },

  // Perfil
  profile: {
    title: 'Perfil',
    editName: 'Editar nombre',
    namePlaceholder: 'Nuevo nombre',
    editSuccess: 'Nombre actualizado',
    delete: 'Eliminar perfil',
    deleteConfirm: '¿Estás seguro? Esta acción eliminará tu cuenta, mensajes y contactos permanentemente.',
    deleteBtn: 'Sí, eliminar',
    cancel: 'Cancelar',
  },

  // Estados (stories)
  estados: {
    title: 'Estados',
    my: 'Mi estado',
    add: 'Añadir estado',
    noEstados: 'Sin estados activos',
    minLeft: 'min restantes',
    delete: 'Eliminar mi estado',
  },

  // Errores y estados
  common: {
    error: 'Error',
    success: 'Éxito',
    loading: 'Cargando...',
    retry: 'Reintentar',
    close: 'Cerrar',
    save: 'Guardar',
    edit: 'Editar',
    confirm: 'Confirmar',
    back: 'Volver',
    online: 'Conectado',
    connecting: 'Conectando...',
    disconnected: 'Sin conexión',
  },
}

export default es
export type Translations = typeof es
