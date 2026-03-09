---
id: ws-client-like-type
parent: create-ws-api
created: 2026-02-28T17:00:00Z
priority: 1
status: done
branch: feature/create-ws-api
---

# WSClientLike type exists in src/api/

A `WSClientLike` type is exported from `src/api/types.ts` that defines the minimal interface any WebSocket client must satisfy:

- `send(event: string, data: unknown): void`
- `on(event: string, handler: (data: unknown) => void): void`
- `off(event: string, handler?: (data: unknown) => void): void`

## Success Criteria

- `WSClientLike` type is defined in `src/api/types.ts`
- Type is exported from `src/api/index.ts` and `src/index.ts`
- Native WebSocket wrappers, Socket.IO clients, and Phoenix Channel clients can all satisfy this interface
- No transport-specific logic (no pings, pongs, reconnection, heartbeats)
