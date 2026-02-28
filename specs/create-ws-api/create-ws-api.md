---
id: create-ws-api
created: 2026-02-28T17:00:00Z
priority: 1
---

# createWSApi

A type-safe WebSocket API definition layer that mirrors `createApi`'s pattern for event-driven APIs. Defines message shapes with Zod, provides typed send/receive operations, and maps 1:1 to AsyncAPI schema.

## Design Principles

- **Schema layer, not transport layer** - does not manage connections, pings, pongs, reconnection, or heartbeats. The injected `client` handles transport, just like Axios handles HTTP for `createApi`.
- **Zod-first** - all message payloads defined as Zod shapes with the same `z.ZodRawShape` pattern used in `createApi`.
- **Snake/camel conversion** - outgoing messages converted to snake_case, incoming messages converted to camelCase, reusing existing `objectToSnakeCaseArr` and `objectToCamelCaseArr` utilities.
- **AsyncAPI 1:1 mapping** - the `operations.send` and `operations.receive` split maps directly to AsyncAPI operations with `action: send` and `action: receive`. Schema generation is trivial.
- **No built-in operations** - unlike `createApi` which auto-generates CRUD, WebSocket has no universal pattern. All operations are user-defined. No need for `customCalls`.
- **Transport-agnostic** - a minimal `WSClientLike` interface allows native WebSocket, Socket.IO, Phoenix Channels, or any wrapper to be injected.

## API Shape

```typescript
const chatWs = createWSApi({
  channel: "chat",
  client: wsClient,
  operations: {
    send: {
      newMessage: { inputShape: { text: z.string(), roomId: z.string() } },
      typing:     { inputShape: { roomId: z.string() } },
    },
    receive: {
      messageReceived: { outputShape: { id: z.string(), text: z.string(), userId: z.string() } },
      userJoined:      { outputShape: { userId: z.string(), roomId: z.string() } },
    },
  },
})

// Send - type-safe, auto snake_case
chatWs.send.newMessage({ text: "hello", roomId: "abc" })
chatWs.send.typing({ roomId: "abc" })

// Receive - typed, auto camelCase
chatWs.on.messageReceived((data) => {
  // data: { id: string, text: string, userId: string }
})

// Unsubscribe
chatWs.off.messageReceived(handler)
```

## Client Interface

```typescript
type WSClientLike = {
  send: (event: string, data: unknown) => void
  on: (event: string, handler: (data: unknown) => void) => void
  off: (event: string, handler?: (data: unknown) => void) => void
}
```

## Scope

- `createWSApi` function with full TypeScript inference
- `WSClientLike` type for transport abstraction
- Zod shape validation on send and receive
- Snake/camel case conversion reusing existing utilities
- Type inference from Zod shapes (same `GetInferredFromRaw` pattern)
- Readonly field support on receive shapes
- Events with no payload (empty shape) supported
- Exported from package index alongside `createApi`
