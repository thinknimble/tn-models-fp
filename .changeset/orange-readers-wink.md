---
"@thinknimble/tn-models-fp": patch
---

Fix paginated requests doing strict parse of responses instead of safe parse. Remove use of `parse` in `list` and `createPaginatedServiceCall`
