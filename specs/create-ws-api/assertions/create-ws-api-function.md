---
id: create-ws-api-function
parent: create-ws-api
created: 2026-02-28T17:00:00Z
priority: 1
status: done
depends-on: ws-client-like-type
branch: feature/create-ws-api
---

# createWSApi function exists in src/api/

A `createWSApi` function is exported from `src/api/` that accepts:

- `channel: string` - the channel/namespace name
- `client: WSClientLike` - the injected WebSocket client
- `operations.send` - a record of named operations, each with an `inputShape` (Zod raw shape)
- `operations.receive` - a record of named operations, each with an `outputShape` (Zod raw shape)

The function returns an object with:

- `send` - typed methods for each send operation that validate input against the Zod shape, convert to snake_case, and call `client.send`
- `on` - typed methods for each receive operation that register a handler receiving validated, camelCased data
- `off` - typed methods for each receive operation that unregister a handler

## Success Criteria

- `createWSApi` is defined in `src/api/create-ws-api.ts`
- Function is exported from `src/api/index.ts` and `src/index.ts`
- Accepts `channel`, `client`, and `operations` with `send` and `receive` records
- Returns object with `send`, `on`, and `off` properties
- TypeScript infers correct types from Zod shapes - send methods accept the inferred input type, on handlers receive the inferred output type
- Operations with no payload (empty shape `{}`) are supported
- `operations.send` and `operations.receive` are both optional (a listen-only or send-only API is valid)
