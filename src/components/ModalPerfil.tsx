import { useState, useEffect, useRef } from 'react'
import { IconUser, IconEdit, IconCheck, IconX, IconTrash, IconCamera } from '@tabler/icons-react'
import { useAuth } from '../context/AuthContext'
import { useIdioma } from '../context/IdiomaContext'
import { usuariosApi, API_URL } from '../services/api'

interface Props {
  onEliminarPerfil: () => void
}

export function ModalPerfil({ onEliminarPerfil }: Props) {
  const { nombre, token, fotoUrl, actualizarNombre, actualizarFoto } = useAuth()
  const { t } = useIdioma()
  const inputFotoRef = useRef<HTMLInputElement>(null)

  // ── Nombre ──
  const [editandoNombre, setEditandoNombre] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [guardandoNombre, setGuardandoNombre] = useState(false)
  const [exitoNombre, setExitoNombre] = useState(false)
  const [errorNombre, setErrorNombre] = useState('')

  // ── Descripción ──
  const [descripcion, setDescripcion] = useState<string>('')
  const [editandoDesc, setEditandoDesc] = useState(false)
  const [nuevaDesc, setNuevaDesc] = useState('')
  const [guardandoDesc, setGuardandoDesc] = useState(false)
  const [exitoDesc, setExitoDesc] = useState(false)
  const [errorDesc, setErrorDesc] = useState('')

  // ── Foto ──
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [exitoFoto, setExitoFoto] = useState(false)
  const [errorFoto, setErrorFoto] = useState('')

  // Cargar descripción al abrir
  useEffect(() => {
    if (!token) return
    usuariosApi.perfil(token)
      .then(u => setDescripcion(u.descripcion ?? ''))
      .catch(() => {})
  }, [token])

  // ── Handlers nombre ──
  const iniciarEdicionNombre = () => {
    setNuevoNombre(nombre ?? '')
    setEditandoNombre(true)
    setErrorNombre('')
    setExitoNombre(false)
  }

  const guardarNombre = async () => {
    if (!nuevoNombre.trim() || !token) return
    setGuardandoNombre(true)
    setErrorNombre('')
    try {
      await usuariosApi.editarNombre(nuevoNombre.trim(), token)
      actualizarNombre(nuevoNombre.trim())
      setEditandoNombre(false)
      setExitoNombre(true)
      setTimeout(() => setExitoNombre(false), 2500)
    } catch (e) {
      setErrorNombre(e instanceof Error ? e.message : t.common.error)
    } finally {
      setGuardandoNombre(false)
    }
  }

  // ── Handlers descripción ──
  const iniciarEdicionDesc = () => {
    setNuevaDesc(descripcion)
    setEditandoDesc(true)
    setErrorDesc('')
    setExitoDesc(false)
  }

  const guardarDesc = async () => {
    if (!token) return
    setGuardandoDesc(true)
    setErrorDesc('')
    try {
      await usuariosApi.editarDescripcion(nuevaDesc.trim(), token)
      setDescripcion(nuevaDesc.trim())
      setEditandoDesc(false)
      setExitoDesc(true)
      setTimeout(() => setExitoDesc(false), 2500)
    } catch (e) {
      setErrorDesc(e instanceof Error ? e.message : t.common.error)
    } finally {
      setGuardandoDesc(false)
    }
  }

  // ── Handlers foto ──
  const seleccionarFoto = () => inputFotoRef.current?.click()

  const subirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (!archivo || !token) return
    setSubiendoFoto(true)
    setErrorFoto('')
    try {
      const res = await usuariosApi.subirFoto(archivo, token)
      actualizarFoto(res.foto_url)
      setExitoFoto(true)
      setTimeout(() => setExitoFoto(false), 2500)
    } catch (e) {
      setErrorFoto(e instanceof Error ? e.message : t.common.error)
    } finally {
      setSubiendoFoto(false)
      if (inputFotoRef.current) inputFotoRef.current.value = ''
    }
  }

  const MAX_DESC = 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Avatar + foto ── */}
      <div className="flex flex-col items-center border-b" style={{ borderColor: 'var(--color-border)', paddingBottom: '1.5rem', gap: '1.25rem' }}>
        <div className="relative">
          <button
            onClick={seleccionarFoto}
            disabled={subiendoFoto}
            className="rounded-3xl overflow-hidden flex items-center justify-center font-bold transition-opacity hover:opacity-80"
            style={{
              backgroundColor: 'var(--color-accent-light)',
              color: 'var(--color-accent)',
              boxShadow: 'var(--shadow-lg)',
              width: '7rem',
              height: '7rem',
              fontSize: '2.5rem',
            }}
            title={t.profile.uploadPhoto}
          >
            {fotoUrl ? (
              <img
                src={`${API_URL}${fotoUrl}`}
                alt={nombre ?? ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              nombre?.charAt(0).toUpperCase() ?? <IconUser size={40} />
            )}
          </button>
          <button
            onClick={seleccionarFoto}
            disabled={subiendoFoto}
            className="absolute bottom-0 right-0 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: '#fff',
              width: '2rem',
              height: '2rem',
              boxShadow: 'var(--shadow-md)',
            }}
            title={t.profile.uploadPhoto}
          >
            {subiendoFoto
              ? <div className="rounded-full animate-spin" style={{ width: '0.875rem', height: '0.875rem', border: '2px solid #fff', borderTopColor: 'transparent' }} />
              : <IconCamera size={14} />
            }
          </button>
          <input ref={inputFotoRef} type="file" accept="image/*" className="hidden" onChange={subirFoto} />
        </div>

        {exitoFoto && <p style={{ color: '#22c55e', fontSize: '0.8125rem' }}>{t.profile.photoSuccess}</p>}
        {errorFoto && <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem' }}>{errorFoto}</p>}

        {/* Nombre */}
        {editandoNombre ? (
          <div className="w-full flex" style={{ gap: '0.75rem' }}>
            <input
              type="text"
              value={nuevoNombre}
              onChange={e => setNuevoNombre(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') guardarNombre(); if (e.key === 'Escape') setEditandoNombre(false) }}
              placeholder={t.profile.namePlaceholder}
              autoFocus
              className="flex-1 rounded-xl outline-none"
              style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '2px solid var(--color-accent)', padding: '0.75rem 1rem', fontSize: '0.875rem' }}
            />
            <button onClick={guardarNombre} disabled={guardandoNombre || !nuevoNombre.trim()} className="rounded-xl transition-colors disabled:opacity-40" style={{ backgroundColor: 'var(--color-accent)', color: '#fff', padding: '0.75rem' }}>
              <IconCheck size={20} />
            </button>
            <button onClick={() => setEditandoNombre(false)} className="rounded-xl transition-colors" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)', padding: '0.75rem' }}>
              <IconX size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center" style={{ gap: '0.75rem' }}>
            <span className="font-bold" style={{ color: 'var(--color-text-primary)', fontSize: '1.25rem' }}>{nombre}</span>
            <button onClick={iniciarEdicionNombre} className="rounded-xl transition-colors hover:bg-[var(--color-bg-tertiary)]" style={{ color: 'var(--color-text-muted)', padding: '0.5rem' }} title={t.profile.editName}>
              <IconEdit size={18} />
            </button>
          </div>
        )}
        {errorNombre && <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>{errorNombre}</p>}
        {exitoNombre && <p style={{ color: '#22c55e', fontSize: '0.875rem' }}>{t.profile.editSuccess}</p>}
      </div>

      {/* ── Descripción ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="flex items-center justify-between">
          <span className="font-semibold" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t.profile.description}
          </span>
          {!editandoDesc && (
            <button onClick={iniciarEdicionDesc} className="rounded-xl transition-colors hover:bg-[var(--color-bg-tertiary)]" style={{ color: 'var(--color-text-muted)', padding: '0.375rem' }} title={t.profile.description}>
              <IconEdit size={16} />
            </button>
          )}
        </div>

        {editandoDesc ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <textarea
              value={nuevaDesc}
              onChange={e => setNuevaDesc(e.target.value.slice(0, MAX_DESC))}
              placeholder={t.profile.descriptionPlaceholder}
              autoFocus
              rows={3}
              className="rounded-xl outline-none resize-none"
              style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '2px solid var(--color-accent)', padding: '0.75rem 1rem', fontSize: '0.875rem', lineHeight: '1.5' }}
            />
            <div className="flex items-center justify-between">
              <span style={{ color: nuevaDesc.length >= MAX_DESC ? 'var(--color-danger)' : 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                {nuevaDesc.length}/{MAX_DESC}
              </span>
              <div className="flex" style={{ gap: '0.5rem' }}>
                <button onClick={() => setEditandoDesc(false)} className="rounded-xl transition-colors" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)', padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}>
                  {t.profile.cancel}
                </button>
                <button onClick={guardarDesc} disabled={guardandoDesc} className="rounded-xl font-semibold transition-colors disabled:opacity-40" style={{ backgroundColor: 'var(--color-accent)', color: '#fff', padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}>
                  {guardandoDesc ? t.common.loading : t.common.save}
                </button>
              </div>
            </div>
            {errorDesc && <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem' }}>{errorDesc}</p>}
          </div>
        ) : (
          <p
            onClick={iniciarEdicionDesc}
            className="cursor-pointer rounded-xl transition-colors hover:bg-[var(--color-bg-tertiary)]"
            style={{ color: descripcion ? 'var(--color-text-secondary)' : 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: '1.5', padding: '0.625rem 0.75rem', minHeight: '2.5rem', fontStyle: descripcion ? 'normal' : 'italic' }}
          >
            {descripcion || t.profile.noDescription}
          </p>
        )}
        {exitoDesc && <p style={{ color: '#22c55e', fontSize: '0.8125rem' }}>{t.profile.descriptionSuccess}</p>}
      </div>

      {/* ── Eliminar perfil ── */}
      <button
        onClick={onEliminarPerfil}
        className="w-full flex items-center justify-center font-semibold rounded-xl transition-colors"
        style={{ color: 'var(--color-danger)', border: '2px solid var(--color-danger)', backgroundColor: 'transparent', padding: '0.875rem', gap: '0.5rem', fontSize: '0.875rem' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.1)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
      >
        <IconTrash size={18} />
        {t.profile.delete}
      </button>
    </div>
  )
}
