---
id: zod-validation-on-send
parent: create-ws-api
created: 2026-02-28T17:00:00Z
priority: 2
status: not_started
depends-on: create-ws-api-function
branch: feature/create-ws-api
---

# Send operations validate input against Zod shape

Before sending, the input is parsed against the Zod shape defined in `inputShape`. Invalid data produces a Zod error at runtime (in addition to the compile-time TypeScript error).

## Success Criteria

- Calling a send method with data that doesn't match the inputShape throws a ZodError
- Valid data passes through and is sent
- Validation happens before snake_case conversion
