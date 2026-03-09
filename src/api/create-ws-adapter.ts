import { WSClientLike } from "./types"

/**
 * Minimal interface for a raw WebSocket-like object (e.g. the `ws` package).
 * Only the subset needed by the adapter — no dependency on any specific library.
 */
export type RawWSLike = {
  send: (data: string) => void
  on: (event: string, handler: (...args: unknown[]) => void) => void
  readyState: number
  OPEN: number
}

/**
 * Wraps a raw WebSocket (generic `send(data)` / `on('message', handler)`) into a
 * `WSClientLike` with named-event routing (`send(event, data)`, `on(event, handler)`, `off`).
 *
 * Wire format: `{ event, data }` JSON — your server must send and expect the same format.
 *
 * @example
 * ```ts
 * import WebSocket from "ws"
 * import { createWSAdapter, createWSApi } from "@thinknimble/tn-models"
 *
 * const ws = new WebSocket("wss://example.com")
 * const client = createWSAdapter(ws)
 *
 * const api = createWSApi({ channel: "chat", client, operations: { ... } })
 * ```
 */
export const createWSAdapter = (ws: RawWSLike): WSClientLike => {
  const handlers = new Map<string, Set<(data: unknown) => void>>()

  ws.on("message", (raw: unknown) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(String(raw))
    } catch {
      return
    }
    if (typeof parsed !== "object" || parsed === null) return
    const { event, data } = parsed as { event?: string; data?: unknown }
    if (!event) return

    const set = handlers.get(event)
    if (set) {
      for (const fn of set) fn(data)
    }
  })

  return {
    send(event: string, data: unknown) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ event, data }))
      }
    },
    on(event: string, handler: (data: unknown) => void) {
      let set = handlers.get(event)
      if (!set) {
        set = new Set()
        handlers.set(event, set)
      }
      set.add(handler)
    },
    off(event: string, handler?: (data: unknown) => void) {
      if (!handler) {
        handlers.delete(event)
        return
      }
      const set = handlers.get(event)
      if (set) {
        set.delete(handler)
        if (set.size === 0) handlers.delete(event)
      }
    },
  }
}
