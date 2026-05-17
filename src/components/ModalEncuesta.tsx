/**
 * Modal para crear encuestas (polls) en el chat.
 * Permite ingresar una pregunta y entre 2 y 4 opciones.
 */
import { useState } from 'react'
import { IconX, IconPlus, IconMinus } from '@tabler/icons-react'
import { useIdioma } from '../context/IdiomaContext'

interface Props {
  visible: boolean
  onCerrar: () => void
  onCrear: (pregunta: string, opciones: string[]) => void
}

export function ModalEncuesta({ visible, onCerrar, onCrear }: Props) {
  const { t } = useIdioma()
  const [pregunta, setPregunta] = useState('')
  const [opciones, setOpciones] = useState<string[]>(['', ''])
  const [cargando, setCargando] = useState(false)

  if (!visible) return null

  const agregarOpcion = () => {
    if (opciones.length < 4) setOpciones(prev => [...prev, ''])
  }

  const quitarOpcion = (idx: number) => {
    if (opciones.length > 2) {
      setOpciones(prev => prev.filter((_, i) => i !== idx))
    }
  }

  const actualizarOpcion = (idx: number, valor: string) => {
    setOpciones(prev => prev.map((o, i) => i === idx ? valor : o))
  }

  const puedeEnviar = pregunta.trim().length > 0 && opciones.filter(o => o.trim()).length >= 2

  const handleCrear = async () => {
    if (!puedeEnviar || cargando) return
    setCargando(true)
    try {
      await onCrear(pregunta.trim(), opciones.filter(o => o.trim()))
      setPregunta('')
      setOpciones(['', ''])
      onCerrar()
    } finally {
      setCargando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div
        className="rounded-3xl shadow-2xl w-full mx-4"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          maxWidth: '440px',
          padding: '1.75rem',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
          <h2 className="font-bold" style={{ color: 'var(--color-text-primary)', fontSize: '1.125rem' }}>
            {t.polls.create}
          </h2>
          <button
            onClick={onCerrar}
            className="rounded-xl flex items-center justify-center"
            style={{
              width: '2rem',
              height: '2rem',
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-muted)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Pregunta */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label
            className="font-medium"
            style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', display: 'block', marginBottom: '0.5rem' }}
          >
            {t.polls.question}
          </label>
          <textarea
            value={pregunta}
            onChange={e => setPregunta(e.target.value)}
            placeholder={t.polls.questionPlaceholder}
            rows={2}
            maxLength={200}
            className="w-full rounded-2xl resize-none outline-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
              border: '2px solid var(--color-border)',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              lineHeight: '1.5',
            }}
          />
        </div>

        {/* Opciones */}
        <div style={{ marginBottom: '1.25rem' }}>
          {opciones.map((opcion, idx) => (
            <div key={idx} className="flex items-center" style={{ gap: '0.5rem', marginBottom: '0.625rem' }}>
              <input
                type="text"
                value={opcion}
                onChange={e => actualizarOpcion(idx, e.target.value)}
                placeholder={`${t.polls.option} ${idx + 1}`}
                maxLength={80}
                className="flex-1 rounded-2xl outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  border: '2px solid var(--color-border)',
                  padding: '0.625rem 0.875rem',
                  fontSize: '0.875rem',
                }}
              />
              {opciones.length > 2 && (
                <button
                  onClick={() => quitarOpcion(idx)}
                  className="rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    width: '2rem',
                    height: '2rem',
                    backgroundColor: 'var(--color-bg-tertiary)',
                    color: 'var(--color-danger)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                  }}
                  title={t.polls.removeOption}
                >
                  <IconMinus size={14} />
                </button>
              )}
            </div>
          ))}

          {opciones.length < 4 && (
            <button
              onClick={agregarOpcion}
              className="flex items-center rounded-2xl font-medium"
              style={{
                gap: '0.375rem',
                color: 'var(--color-accent)',
                backgroundColor: 'transparent',
                border: 'none',
                padding: '0.375rem 0',
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              <IconPlus size={14} />
              {t.polls.addOption}
            </button>
          )}
        </div>

        {/* Botón crear */}
        <button
          onClick={handleCrear}
          disabled={!puedeEnviar || cargando}
          className="w-full rounded-2xl font-semibold transition-all disabled:opacity-50"
          style={{
            backgroundColor: puedeEnviar ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
            color: puedeEnviar ? '#fff' : 'var(--color-text-muted)',
            padding: '0.875rem 1.25rem',
            fontSize: '0.9375rem',
            border: 'none',
            cursor: puedeEnviar ? 'pointer' : 'not-allowed',
          }}
        >
          {cargando ? t.common.loading : t.polls.createBtn}
        </button>
      </div>
    </div>
  )
}
