---
"@thinknimble/tn-models-fp": minor
---

createPaginatedServiceCall allow url params to be passed to paginated call so that we can build our own uri with a function. Now if a `urlParams` is passed down to the inputShape we will take that as a uri parameter which will require to pass a function in second parameter
