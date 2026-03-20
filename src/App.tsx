/**
 * Componente raíz de JHT Chat.
 * Configura los providers globales y decide qué página renderizar
 * según el estado de autenticación.
 */
import { AuthProvider, useAuth } from './context/AuthContext'
import { TemaProvider } from './context/TemaContext'
import { IdiomaProvider } from './context/IdiomaContext'
import { LoginPage } from './pages/LoginPage'
import { ChatPage } from './pages/ChatPage'

/** Selector de página según autenticación */
function AppContent() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <ChatPage /> : <LoginPage />
}

function App() {
  return (
    <TemaProvider>
      <IdiomaProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </IdiomaProvider>
    </TemaProvider>
  )
}

export default App
