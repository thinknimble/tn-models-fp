import { describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { createWSApi } from "../create-ws-api"
import { WSClientLike } from "../types"

function createMockClient(): WSClientLike & {
  handlers: Map<string, Set<(data: unknown) => void>>
} {
  const handlers = new Map<string, Set<(data: unknown) => void>>()
  return {
    handlers,
    send: vi.fn(),
    on: vi.fn((event: string, handler: (data: unknown) => void) => {
      if (!handlers.has(event)) handlers.set(event, new Set())
      handlers.get(event)!.add(handler)
    }),
    off: vi.fn((event: string, handler?: (data: unknown) => void) => {
      if (handler && handlers.has(event)) {
        handlers.get(event)!.delete(handler)
      }
    }),
  }
}

describe("createWSApi", () => {
  it("returns send methods that call client.send with namespaced event", () => {
    const client = createMockClient()
    const api = createWSApi({
      channel: "chat",
      client,
      operations: {
        send: {
          newMessage: { inputShape: { text: z.string(), roomId: z.string() } },
        },
      },
    })

    api.send.newMessage({ text: "hello", roomId: "abc" })

    expect(client.send).toHaveBeenCalledWith("chat:newMessage", {
      text: "hello",
      room_id: "abc",
    })
  })

  it("returns on/off methods that call client.on/off with namespaced event", () => {
    const client = createMockClient()
    const api = createWSApi({
      channel: "chat",
      client,
      operations: {
        receive: {
          messageReceived: {
            outputShape: { id: z.string(), text: z.string(), userId: z.string() },
          },
        },
      },
    })

    const handler = vi.fn()
    api.on.messageReceived(handler)

    expect(client.on).toHaveBeenCalledWith("chat:messageReceived", expect.any(Function))

    api.off.messageReceived(handler)

    expect(client.off).toHaveBeenCalled()
  })

  it("supports send-only APIs (no receive operations)", () => {
    const client = createMockClient()
    const api = createWSApi({
      channel: "notifications",
      client,
      operations: {
        send: {
          ping: { inputShape: {} },
        },
      },
    })

    api.send.ping()
    expect(client.send).toHaveBeenCalledWith("notifications:ping", {})
  })

  it("supports receive-only APIs (no send operations)", () => {
    const client = createMockClient()
    const api = createWSApi({
      channel: "events",
      client,
      operations: {
        receive: {
          userJoined: { outputShape: { userId: z.string() } },
        },
      },
    })

    const handler = vi.fn()
    api.on.userJoined(handler)
    expect(client.on).toHaveBeenCalledWith("events:userJoined", expect.any(Function))
  })

  it("supports empty input shapes (no payload)", () => {
    const client = createMockClient()
    const api = createWSApi({
      channel: "chat",
      client,
      operations: {
        send: {
          typing: { inputShape: {} },
        },
      },
    })

    api.send.typing()
    expect(client.send).toHaveBeenCalledWith("chat:typing", {})
  })

  it("converts send payloads to snake_case", () => {
    const client = createMockClient()
    const api = createWSApi({
      channel: "chat",
      client,
      operations: {
        send: {
          newMessage: { inputShape: { roomId: z.string(), userName: z.string() } },
        },
      },
    })

    api.send.newMessage({ roomId: "abc", userName: "John" })

    expect(client.send).toHaveBeenCalledWith("chat:newMessage", {
      room_id: "abc",
      user_name: "John",
    })
  })

  it("converts received payloads to camelCase", () => {
    const client = createMockClient()
    const api = createWSApi({
      channel: "chat",
      client,
      operations: {
        receive: {
          messageReceived: {
            outputShape: { userId: z.string(), roomId: z.string() },
          },
        },
      },
    })

    const handler = vi.fn()
    api.on.messageReceived(handler)

    // Simulate server sending snake_case data
    const wrappedHandler = (client.on as any).mock.calls[0][1]
    wrappedHandler({ user_id: "123", room_id: "abc" })

    expect(handler).toHaveBeenCalledWith({ userId: "123", roomId: "abc" })
  })

  it("validates send input against Zod shape", () => {
    const client = createMockClient()
    const api = createWSApi({
      channel: "chat",
      client,
      operations: {
        send: {
          newMessage: { inputShape: { text: z.string() } },
        },
      },
    })

    expect(() => {
      // @ts-expect-error - intentionally passing wrong type
      api.send.newMessage({ text: 123 })
    }).toThrow()
  })

  it("supports both send and receive together", () => {
    const client = createMockClient()
    const api = createWSApi({
      channel: "chat",
      client,
      operations: {
        send: {
          newMessage: { inputShape: { text: z.string() } },
        },
        receive: {
          messageReceived: { outputShape: { id: z.string(), text: z.string() } },
        },
      },
    })

    expect(api.send.newMessage).toBeDefined()
    expect(api.on.messageReceived).toBeDefined()
    expect(api.off.messageReceived).toBeDefined()
  })
})
