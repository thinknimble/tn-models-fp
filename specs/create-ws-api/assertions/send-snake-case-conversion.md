---
id: send-snake-case-conversion
parent: create-ws-api
created: 2026-02-28T17:00:00Z
priority: 1
status: not_started
depends-on: create-ws-api-function
---

# Send operations convert payloads to snake_case

When a send method is called, the input data is converted from camelCase to snake_case before being passed to `client.send`, reusing the existing `objectToSnakeCaseArr` utility.

## Success Criteria

- `chatWs.send.newMessage({ roomId: "abc" })` calls `client.send("chat:newMessage", { room_id: "abc" })`
- Nested objects are recursively converted
- Arrays of objects are recursively converted
- Conversion reuses `objectToSnakeCaseArr` from `src/utils/`
