---
id: type-inference-from-zod
parent: create-ws-api
created: 2026-02-28T17:00:00Z
priority: 1
status: not_started
depends-on: create-ws-api-function
branch: feature/create-ws-api
---

# Full TypeScript inference from Zod shapes

Type inference works the same way as `createApi` - types are inferred from Zod shapes, not manually declared.

## Success Criteria

- Send methods infer their argument type from `inputShape` using `GetInferredFromRaw`
- Receive handlers infer their callback data type from `outputShape` using `GetInferredFromRaw`
- Readonly fields in outputShape are preserved in the inferred type
- Readonly fields in inputShape are stripped (using `GetInferredFromRawWithStripReadonly`)
- Autocomplete works in IDEs for both send arguments and receive handler data
- Passing incorrect types to send methods produces a compile-time TypeScript error
- Operations not defined in send cannot be called on `chatWs.send` (compile error)
- Operations not defined in receive cannot be called on `chatWs.on` or `chatWs.off` (compile error)
