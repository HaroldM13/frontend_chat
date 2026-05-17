import { useState, useEffect, useRef, useCallback } from 'react'
import { WebSocketService } from '../services/websocket'
import type { MensajeWS } from '../interfaces'

export interface UsuarioEscribiendo {
  usuario_id: string
  nombre: string
}

interface UseWebSocketResult {
  mensajesRT: MensajeWS[]
  conectado: boolean
  enviar: (contenido: string) => void
  enviarEvento: (evento: Record<string, unknown>) => void
  escribiendo: UsuarioEscribiendo[]
}

const TYPING_TIMEOUT_MS = 3000

export function useWebSocket(sala: string | null, token: string | null): UseWebSocketResult {
  const [mensajesRT, setMensajesRT] = useState<MensajeWS[]>([])
  const [conectado, setConectado] = useState(false)
  const [escribiendo, setEscribiendo] = useState<UsuarioEscribiendo[]>([])
  const servicioRef = useRef<WebSocketService | null>(null)
  // Timers para auto-remover indicadores de escritura
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const limpiarTimerEscribiendo = useCallback((usuarioId: string) => {
    const timer = typingTimersRef.current.get(usuarioId)
    if (timer) {
      clearTimeout(timer)
      typingTimersRef.current.delete(usuarioId)
    }
  }, [])

  useEffect(() => {
    setMensajesRT([])
    setConectado(false)
    setEscribiendo([])
    // Limpiar todos los timers de escritura al cambiar de sala
    typingTimersRef.current.forEach(t => clearTimeout(t))
    typingTimersRef.current.clear()

    if (!sala || !token) return

    servicioRef.current?.desconectar()

    const servicio = new WebSocketService(
      sala,
      token,
      (msg: MensajeWS) => {
        // ── Evento: el otro usuario leyó mis mensajes ──
        if (msg.tipo === 'mensajes_leidos') {
          setMensajesRT(prev =>
            prev.map(m =>
              m.remitente_id === msg.remitente_id ? { ...m, leido: true } : m
            )
          )
          return
        }

        // ── Evento: indicador de escritura ──
        if (msg.tipo === 'escribiendo') {
          const uid = msg.usuario_id ?? msg.remitente_id
          const nombre = msg.nombre_remitente ?? ''
          setEscribiendo(prev => {
            if (prev.some(u => u.usuario_id === uid)) return prev
            return [...prev, { usuario_id: uid, nombre }]
          })
          // Auto-remover tras 3 s sin actualización
          limpiarTimerEscribiendo(uid)
          const timer = setTimeout(() => {
            setEscribiendo(prev => prev.filter(u => u.usuario_id !== uid))
            typingTimersRef.current.delete(uid)
          }, TYPING_TIMEOUT_MS)
          typingTimersRef.current.set(uid, timer)
          return
        }

        // ── Evento: dejó de escribir ──
        if (msg.tipo === 'dejo_escribir') {
          const uid = msg.usuario_id ?? msg.remitente_id
          limpiarTimerEscribiendo(uid)
          setEscribiendo(prev => prev.filter(u => u.usuario_id !== uid))
          return
        }

        // ── Evento: mensaje editado ──
        if (msg.tipo === 'mensaje_editado') {
          setMensajesRT(prev =>
            prev.map(m =>
              m.id === msg.id ? { ...m, contenido: msg.contenido, editado: true } : m
            )
          )
          return
        }

        // ── Evento: mensaje eliminado ──
        if (msg.tipo === 'mensaje_eliminado') {
          setMensajesRT(prev =>
            prev.map(m =>
              m.id === msg.id ? { ...m, eliminado: true, contenido: '' } : m
            )
          )
          return
        }

        // ── Evento: reacción actualizada ──
        if (msg.tipo === 'reaccion') {
          setMensajesRT(prev =>
            prev.map(m =>
              m.id === msg.mensaje_id ? { ...m, reacciones: msg.reacciones } : m
            )
          )
          return
        }

        // ── Evento: voto en encuesta ──
        if (msg.tipo === 'voto_encuesta') {
          setMensajesRT(prev =>
            prev.map(m =>
              m.id === msg.mensaje_id ? { ...m, votos: msg.votos } : m
            )
          )
          return
        }

        // ── Mensaje normal ──
        setMensajesRT(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      },
      (estaConectado: boolean) => setConectado(estaConectado)
    )

    servicio.conectar()
    servicioRef.current = servicio
    return () => servicio.desconectar()
  }, [sala, token, limpiarTimerEscribiendo])

  const enviar = useCallback((contenido: string) => {
    servicioRef.current?.enviar(contenido)
  }, [])

  const enviarEvento = useCallback((evento: Record<string, unknown>) => {
    servicioRef.current?.enviarEvento(evento)
  }, [])

  return { mensajesRT, conectado, enviar, enviarEvento, escribiendo }
}
