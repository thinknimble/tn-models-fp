---
id: receive-response-parsing
parent: create-ws-api
created: 2026-02-28T17:00:00Z
priority: 2
status: not_started
depends-on: create-ws-api-function
branch: feature/create-ws-api
---

# Receive handlers validate incoming data against Zod shape

Incoming message data is parsed against the `outputShape` using the same warning-based approach as `createApi`'s `parseResponse` - mismatches log warnings but do not throw, keeping the connection alive.

## Success Criteria

- Incoming data that matches the outputShape is passed to the handler as the inferred type
- Incoming data that doesn't match logs a warning (reuses `parseResponse` pattern from `src/utils/response.ts`)
- Mismatches do not throw or disconnect - the handler still receives the data
- Readonly fields in the outputShape are included in the handler's received type
