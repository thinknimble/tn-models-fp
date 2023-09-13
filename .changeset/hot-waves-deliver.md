---
"@thinknimble/tn-models": minor
---

- Fix issue with `instanceof` operator not working as expected in different nodeJS environments.
- Replaced with a naive but more reliable implementation which uses `typeName` from `zod` to be able to tell apart zod instance types.
