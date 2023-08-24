---
"@thinknimble/tn-models-fp": minor
---

Prevent obfuscation of extra fields coming from responses. Now these fields will be available in the response (just won't be type-discoverable). Paginated calls will receive them as camelCased, whereas regular calls will receive them as they come from the raw response.
