---
id: event-naming-convention
parent: create-ws-api
created: 2026-02-28T17:00:00Z
priority: 2
status: not_started
depends-on: create-ws-api-function
branch: feature/create-ws-api
---

# Events are namespaced as channel:operationName

When `createWSApi` sends or subscribes to events via the client, event names are formatted as `{channel}:{operationName}`.

## Success Criteria

- A send operation `newMessage` on channel `chat` sends to event `chat:newMessage`
- A receive operation `messageReceived` on channel `chat` listens on event `chat:messageReceived`
- The channel prefix and separator are consistent across all operations
- The operation name portion is not case-converted (stays as defined)
