---
"@thinknimble/tn-models-fp": minor
---

Allow passing filters to `createPaginatedServiceCall`. For this there's a new `models` field that can be used to pass the filters shape: `filtersShape`. You'll then get a `filters` optional key when using the service call which will allow you to pass the filters you declared
