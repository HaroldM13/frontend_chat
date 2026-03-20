import { useState, useEffect, useRef, useCallback } from 'react'
import { WebSocketService } from '../services/websocket'
import type { MensajeWS } from '../interfaces'

interface UseWebSocketResult {
  mensajesRT: MensajeWS[]
  conectado: boolean
  enviar: (contenido: string) => void
}

export function useWebSocket(sala: string | null, token: string | null): UseWebSocketResult {
  const [mensajesRT, setMensajesRT] = useState<MensajeWS[]>([])
  const [conectado, setConectado] = useState(false)
  const servicioRef = useRef<WebSocketService | null>(null)

  useEffect(() => {
    setMensajesRT([])
    setConectado(false)
    if (!sala || !token) return

    servicioRef.current?.desconectar()

    const servicio = new WebSocketService(
      sala,
      token,
      (msg: MensajeWS) => {
        // Evento especial: el otro usuario leyó mis mensajes → marcar como leídos en RT
        if (msg.tipo === 'mensajes_leidos') {
          setMensajesRT(prev =>
            prev.map(m =>
              m.remitente_id === msg.remitente_id ? { ...m, leido: true } : m
            )
          )
          return
        }
        // Mensaje normal
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
  }, [sala, token])

  const enviar = useCallback((contenido: string) => {
    servicioRef.current?.enviar(contenido)
  }, [])

  return { mensajesRT, conectado, enviar }
}
