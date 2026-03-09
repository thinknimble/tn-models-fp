import { describe, expect, it, vi } from "vitest"
import { createWSAdapter, RawWSLike } from "../create-ws-adapter"

function createMockRawWS(): RawWSLike & {
  _listeners: Map<string, Set<(...args: unknown[]) => void>>
  _simulateMessage: (data: string) => void
} {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>()
  return {
    readyState: 1,
    OPEN: 1,
    send: vi.fn(),
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(handler)
    }),
    _listeners: listeners,
    _simulateMessage(data: string) {
      const set = listeners.get("message")
      if (set) {
        for (const fn of set) fn(data)
      }
    },
  }
}

describe("createWSAdapter", () => {
  it("sends JSON { event, data } via ws.send", () => {
    const ws = createMockRawWS()
    const adapter = createWSAdapter(ws)

    adapter.send("chat:newMessage", { room_id: "abc", text: "hello" })

    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({ event: "chat:newMessage", data: { room_id: "abc", text: "hello" } }),
    )
  })

  it("does not send when readyState !== OPEN", () => {
    const ws = createMockRawWS()
    ws.readyState = 0 // CONNECTING
    const adapter = createWSAdapter(ws)

    adapter.send("chat:newMessage", { text: "hello" })

    expect(ws.send).not.toHaveBeenCalled()
  })

  it("routes incoming messages to correct handlers by event name", () => {
    const ws = createMockRawWS()
    const adapter = createWSAdapter(ws)

    const handlerA = vi.fn()
    const handlerB = vi.fn()
    adapter.on("chat:messageReceived", handlerA)
    adapter.on("chat:userJoined", handlerB)

    ws._simulateMessage(JSON.stringify({ event: "chat:messageReceived", data: { text: "hi" } }))

    expect(handlerA).toHaveBeenCalledWith({ text: "hi" })
    expect(handlerB).not.toHaveBeenCalled()
  })

  it("off() with handler removes only that handler", () => {
    const ws = createMockRawWS()
    const adapter = createWSAdapter(ws)

    const handler1 = vi.fn()
    const handler2 = vi.fn()
    adapter.on("chat:msg", handler1)
    adapter.on("chat:msg", handler2)

    adapter.off("chat:msg", handler1)

    ws._simulateMessage(JSON.stringify({ event: "chat:msg", data: "test" }))

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).toHaveBeenCalledWith("test")
  })

  it("off() without handler removes all handlers for that event", () => {
    const ws = createMockRawWS()
    const adapter = createWSAdapter(ws)

    const handler1 = vi.fn()
    const handler2 = vi.fn()
    adapter.on("chat:msg", handler1)
    adapter.on("chat:msg", handler2)

    adapter.off("chat:msg")

    ws._simulateMessage(JSON.stringify({ event: "chat:msg", data: "test" }))

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).not.toHaveBeenCalled()
  })

  it("ignores non-JSON messages", () => {
    const ws = createMockRawWS()
    const adapter = createWSAdapter(ws)

    const handler = vi.fn()
    adapter.on("chat:msg", handler)

    ws._simulateMessage("not json at all")

    expect(handler).not.toHaveBeenCalled()
  })

  it("ignores messages without an event field", () => {
    const ws = createMockRawWS()
    const adapter = createWSAdapter(ws)

    const handler = vi.fn()
    adapter.on("chat:msg", handler)

    ws._simulateMessage(JSON.stringify({ data: "no event field" }))

    expect(handler).not.toHaveBeenCalled()
  })

  it("passes data through without case conversion (snake_case passthrough)", () => {
    const ws = createMockRawWS()
    const adapter = createWSAdapter(ws)

    const handler = vi.fn()
    adapter.on("chat:msg", handler)

    ws._simulateMessage(JSON.stringify({ event: "chat:msg", data: { user_name: "alice", room_id: "r1" } }))

    expect(handler).toHaveBeenCalledWith({ user_name: "alice", room_id: "r1" })
  })
})
