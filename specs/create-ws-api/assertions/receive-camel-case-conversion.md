---
id: receive-camel-case-conversion
parent: create-ws-api
created: 2026-02-28T17:00:00Z
priority: 1
status: not_started
depends-on: create-ws-api-function
---

# Receive handlers convert payloads to camelCase

When a receive handler fires, the incoming data is converted from snake_case to camelCase before being passed to the user's callback, reusing the existing `objectToCamelCaseArr` utility.

## Success Criteria

- Server sends `{ user_id: "123", room_id: "abc" }`, handler receives `{ userId: "123", roomId: "abc" }`
- Nested objects are recursively converted
- Arrays of objects are recursively converted
- Conversion reuses `objectToCamelCaseArr` from `src/utils/`
