---
"@thinknimble/tn-models-fp": minor
---

Add filters to the main methods of the library. `createCustomServiceCall` `createCustomServiceCall.standAlone` and `createPaginatedServiceCall` allow `filterShape` which yields a `parsedFilters` parameter in the callback for you to get snake cased parsed filters and pass them as parameters to your axios calls. Adding filters modify current input arguament so beware that you'll need an object with `input` and `filters?`
