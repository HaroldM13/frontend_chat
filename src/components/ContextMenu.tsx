import { useEffect, useRef } from 'react'

export interface ContextMenuItem {
  label: string
  icon: React.ReactNode
  onClick: () => void
  danger?: boolean
}

interface Props {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // Adjust so menu doesn't overflow viewport
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const { right, bottom } = el.getBoundingClientRect()
    if (right > window.innerWidth) el.style.left = `${window.innerWidth - el.offsetWidth - 8}px`
    if (bottom > window.innerHeight) el.style.top = `${window.innerHeight - el.offsetHeight - 8}px`
  }, [])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 9999,
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '0.875rem',
        boxShadow: 'var(--shadow-lg)',
        padding: '0.375rem',
        minWidth: '190px',
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.onClick(); onClose() }}
          className="w-full flex items-center rounded-xl transition-colors"
          style={{
            gap: '0.625rem',
            padding: '0.625rem 0.875rem',
            color: item.danger ? 'var(--color-danger)' : 'var(--color-text-secondary)',
            fontSize: '0.8125rem',
            fontWeight: '500',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = item.danger
              ? 'rgba(239,68,68,0.08)'
              : 'var(--color-bg-tertiary)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
          }}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  )
}
