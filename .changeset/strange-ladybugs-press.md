---
"@thinknimble/tn-models": patch
---

Fix issue on `createCustomServiceCall` where outputShapes with nested ZodBranded fields would cause the types for the resulting service call function to break.
