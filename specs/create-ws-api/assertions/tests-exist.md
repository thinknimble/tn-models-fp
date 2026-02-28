---
id: tests-exist
parent: create-ws-api
created: 2026-02-28T17:00:00Z
priority: 1
status: not_started
depends-on: create-ws-api-function
branch: feature/create-ws-api
---

# createWSApi has comprehensive tests

Tests exist in `src/api/tests/` covering all `createWSApi` behavior.

## Success Criteria

- Test file exists at `src/api/tests/create-ws-api.test.ts`
- Tests use a mock `WSClientLike` implementation (not a real WebSocket)
- Tests cover:
  - Send operations call `client.send` with correct event name and snake_cased data
  - Receive handlers are registered via `client.on` with correct event name
  - Receive handlers deliver camelCased, typed data to callbacks
  - `off` unregisters handlers via `client.off`
  - Zod validation errors on invalid send data
  - Warning (not error) on mismatched receive data
  - Operations with no payload work
  - Send-only and receive-only APIs work
  - TypeScript types are correct (compile-time verification)
