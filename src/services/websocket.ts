/**
 * Servicio de WebSocket para mensajería en tiempo real.
 * Gestiona la conexión, reconexión y eventos de mensajes entrantes.
 */
import type { MensajeWS } from '../interfaces'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

type CallbackMensaje = (mensaje: MensajeWS) => void
type CallbackEstado = (conectado: boolean) => void

export class WebSocketService {
  private ws: WebSocket | null = null
  private onMensaje: CallbackMensaje
  private onEstado: CallbackEstado
  private sala: string
  private token: string
  private intentosReconexion = 0
  private maxReintentos = 5
  private timeoutReconexion: ReturnType<typeof setTimeout> | null = null
  private cerradoManualmente = false

  constructor(sala: string, token: string, onMensaje: CallbackMensaje, onEstado: CallbackEstado) {
    this.sala = sala
    this.token = token
    this.onMensaje = onMensaje
    this.onEstado = onEstado
  }

  /** Construye la URL del WebSocket según el tipo de sala. */
  private buildUrl(): string {
    return `${WS_URL}/ws/${this.sala}?token=${this.token}`
  }

  /** Inicia la conexión WebSocket. */
  conectar(): void {
    this.cerradoManualmente = false
    this.ws = new WebSocket(this.buildUrl())

    this.ws.onopen = () => {
      this.intentosReconexion = 0
      this.onEstado(true)
    }

    this.ws.onmessage = (evento: MessageEvent) => {
      try {
        const datos = JSON.parse(evento.data as string) as MensajeWS
        this.onMensaje(datos)
      } catch {
        // Ignorar mensajes malformados
      }
    }

    this.ws.onclose = () => {
      this.onEstado(false)
      // Reconectar automáticamente si no fue cierre intencional
      if (!this.cerradoManualmente && this.intentosReconexion < this.maxReintentos) {
        const espera = Math.min(1000 * 2 ** this.intentosReconexion, 30000)
        this.intentosReconexion++
        this.timeoutReconexion = setTimeout(() => this.conectar(), espera)
      }
    }

    this.ws.onerror = () => {
      // El evento onclose se dispara después, allí se maneja la reconexión
    }
  }

  /** Envía un mensaje de texto a través del WebSocket. */
  enviar(contenido: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ contenido }))
    }
  }

  /** Cierra la conexión WebSocket de forma limpia. */
  desconectar(): void {
    this.cerradoManualmente = true
    if (this.timeoutReconexion) {
      clearTimeout(this.timeoutReconexion)
      this.timeoutReconexion = null
    }
    this.ws?.close()
    this.ws = null
  }

  get conectado(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}
