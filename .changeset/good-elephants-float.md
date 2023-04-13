---
"@thinknimble/tn-models-fp": patch
---

Fix `createPaginatedServiceCall` erroring when not passing opts param. Now it should allow you to skip the second parameter and thus use its built-in defaults ( uri = '' , httpMethod = 'get' )
