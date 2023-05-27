---
"@thinknimble/tn-models-fp": minor
---

Make `create` method to always exist if there's a declared entity shape from `models`. This makes it so that if you want to use your own `create` shape in `models` you can, but that's now optional. If resolved from `entity` shape then the resulting callback signature is going to strip all readonly fields and `id` from the entity shape and use that resolved type as the input.
