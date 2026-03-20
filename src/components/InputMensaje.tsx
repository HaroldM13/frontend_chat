/**
 * Input de mensaje con textarea auto-expandible.
 * Enter envía, Shift+Enter hace salto de línea.
 */
import { useState, type KeyboardEvent } from 'react'
import { IconSend } from '@tabler/icons-react'
import { useIdioma } from '../context/IdiomaContext'

interface Props {
  onEnviar: (contenido: string) => void
  deshabilitado?: boolean
}

export function InputMensaje({ onEnviar, deshabilitado = false }: Props) {
  const { t } = useIdioma()
  const [texto, setTexto] = useState('')

  const enviar = () => {
    const contenido = texto.trim()
    if (!contenido || deshabilitado) return
    onEnviar(contenido)
    setTexto('')
  }

  const manejarTecla = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  const puedeEnviar = !!texto.trim() && !deshabilitado

  return (
  <div
    className="flex items-end border-t"
    style={{
      backgroundColor: 'var(--color-bg-secondary)',
      borderColor: 'var(--color-border)',
      boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
      padding: '1.25rem 1.5rem',
      gap: '1rem'
    }}
  >
    <textarea
      value={texto}
      onChange={e => setTexto(e.target.value)}
      onKeyDown={manejarTecla}
      placeholder={t.chat.messagePlaceholder}
      disabled={deshabilitado}
      rows={1}
      className="flex-1 resize-none rounded-2xl outline-none transition-all"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
        border: '2px solid var(--color-border)',
        maxHeight: '140px',
        lineHeight: '1.5',
        padding: '0.875rem 1.125rem',
        fontSize: '0.875rem'
      }}
      onInput={e => {
        const el = e.currentTarget
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 140)}px`
      }}
    />
    <button
      onClick={enviar}
      disabled={!puedeEnviar}
      className="flex-shrink-0 flex items-center justify-center rounded-2xl transition-all"
      style={{
        backgroundColor: puedeEnviar ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
        color: puedeEnviar ? '#fff' : 'var(--color-text-muted)',
        transform: puedeEnviar ? 'scale(1)' : 'scale(0.92)',
        transition: 'all 0.2s ease',
        boxShadow: puedeEnviar ? 'var(--shadow-md)' : 'none',
        width: '3rem',
        height: '3rem'
      }}
      title={t.chat.send}
    >
      <IconSend size={20} />
    </button>
  </div>
)
}
