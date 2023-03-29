---
"@thinknimble/tn-models-fp": minor
---

Allow users to skip including models in their api creation. Models now is completely optional and types are properly inferred based on which models are passed. `create` model is not allowed to be passed alone, same for `extraFilters`.
