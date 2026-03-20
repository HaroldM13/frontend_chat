/**
 * Página de login y registro.
 * Permite al usuario iniciar sesión (solo teléfono) o registrarse (nombre + teléfono).
 */
import { useState } from 'react'
import { IconMessageCircle, IconSun, IconMoon } from '@tabler/icons-react'
import { authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useTema } from '../context/TemaContext'
import { useIdioma } from '../context/IdiomaContext'
import type { Idioma } from '../interfaces'

export function LoginPage() {
  const { login } = useAuth()
  const { tema, toggleTema } = useTema()
  const { t, idioma, cambiarIdioma } = useIdioma()

  const [modo, setModo] = useState<'login' | 'registro'>('login')
  const [telefono, setTelefono] = useState('')
  const [nombre, setNombre] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      let respuesta
      if (modo === 'login') {
        respuesta = await authApi.login({ telefono: telefono.trim() })
      } else {
        respuesta = await authApi.registro({
          nombre: nombre.trim(),
          telefono: telefono.trim(),
        })
      }
      login(respuesta.access_token, respuesta.usuario_id, respuesta.nombre)
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Controles de tema e idioma */}
      <div className="fixed top-4 right-4 flex items-center gap-2">
        <select
          value={idioma}
          onChange={e => cambiarIdioma(e.target.value as Idioma)}
          className="text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <option value="es">ES</option>
          <option value="en">EN</option>
        </select>
        <button
          onClick={toggleTema}
          className="p-2 rounded-lg"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          {tema === 'light' ? <IconMoon size={16} /> : <IconSun size={16} />}
        </button>
      </div>

      {/* Card de autenticación */}
      <div
        className="w-full max-w-sm rounded-2xl shadow-md p-8"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        {/* Logo y título */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            <IconMessageCircle size={36} color="#fff" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {t.auth.welcome}
          </h1>
          <p className="text-sm text-center mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t.auth.subtitle}
          </p>
        </div>

        {/* Tabs login / registro */}
        <div
          className="flex rounded-xl p-1 mb-6"
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
        >
          {(['login', 'registro'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setModo(m); setError('') }}
              className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
              style={{
                backgroundColor: modo === m ? 'var(--color-accent)' : 'transparent',
                color: modo === m ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {m === 'login' ? t.auth.login : t.auth.register}
            </button>
          ))}
        </div>

        {/* Formulario */}
        <form onSubmit={manejarSubmit} className="space-y-4">
          {/* Campo nombre (solo registro) */}
          {modo === 'registro' && (
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {t.auth.name}
              </label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder={t.auth.namePlaceholder}
                required
                minLength={2}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              />
            </div>
          )}

          {/* Campo teléfono */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {t.auth.phone}
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              placeholder={t.auth.phonePlaceholder}
              required
              minLength={7}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <p
              className="text-xs px-3 py-2 rounded-lg"
              style={{ backgroundColor: 'rgba(229,62,62,0.1)', color: 'var(--color-danger)' }}
            >
              {error}
            </p>
          )}

          {/* Botón de submit */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
          >
            {cargando
              ? t.common.loading
              : modo === 'login'
                ? t.auth.loginBtn
                : t.auth.registerBtn}
          </button>
        </form>

        {/* Cambiar modo */}
        <p className="text-center text-xs mt-4" style={{ color: 'var(--color-text-muted)' }}>
          {modo === 'login' ? t.auth.noAccount : t.auth.hasAccount}{' '}
          <button
            onClick={() => { setModo(modo === 'login' ? 'registro' : 'login'); setError('') }}
            className="font-semibold"
            style={{ color: 'var(--color-accent)' }}
          >
            {modo === 'login' ? t.auth.register : t.auth.login}
          </button>
        </p>
      </div>
    </div>
  )
}
