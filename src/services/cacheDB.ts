/**
 * IndexedDB offline cache for chat messages.
 * Gracefully degrades if IndexedDB is unavailable (private browsing, etc.).
 * chatKey format: "sala" | "privado:{contactoId}" | "grupo:{grupoId}"
 */
import type { Mensaje } from '../interfaces'

const DB_NAME = 'jht_chat_v1'
const STORE = 'mensajes'
const MAX_PER_CHAT = 50

function abrirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export const cacheDB = {
  /**
   * Guarda los últimos MAX_PER_CHAT mensajes bajo la clave dada.
   */
  async guardar(chatKey: string, mensajes: Mensaje[]): Promise<void> {
    try {
      const db = await abrirDB()
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(mensajes.slice(-MAX_PER_CHAT), chatKey)
      db.close()
    } catch {
      // Silently fail — offline cache is optional
    }
  },

  /**
   * Recupera los mensajes cacheados para la clave dada.
   * Retorna [] si no hay cache o si IndexedDB falla.
   */
  async obtener(chatKey: string): Promise<Mensaje[]> {
    try {
      const db = await abrirDB()
      return await new Promise<Mensaje[]>((resolve) => {
        const tx = db.transaction(STORE, 'readonly')
        const req = tx.objectStore(STORE).get(chatKey)
        req.onsuccess = () => {
          resolve((req.result as Mensaje[] | undefined) ?? [])
          db.close()
        }
        req.onerror = () => {
          resolve([])
          db.close()
        }
      })
    } catch {
      return []
    }
  },

  /**
   * Elimina la entrada de cache para la clave dada.
   */
  async limpiar(chatKey: string): Promise<void> {
    try {
      const db = await abrirDB()
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(chatKey)
      db.close()
    } catch {
      // Silently fail
    }
  },
}
