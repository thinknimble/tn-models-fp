---
id: exported-from-package
parent: create-ws-api
created: 2026-02-28T17:00:00Z
priority: 1
status: not_started
depends-on: create-ws-api-function
---

# createWSApi and WSClientLike are exported from the package

Both `createWSApi` and `WSClientLike` are importable from the package root.

## Success Criteria

- `import { createWSApi } from "@thinknimble/tn-models"` works
- `import type { WSClientLike } from "@thinknimble/tn-models"` works
- Exports are added to `src/index.ts` and `src/api/index.ts`
- No new sub-package entry points needed
