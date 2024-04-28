---
"@thinknimble/tn-models": major
---

## Migration Guide v2 - v3
### What's new?
- Now all functions accept a single object as parameter. No more secondary parameters.
- Improvements on the type layer ( non perceptible from user perspective). Removed all overloads for functions which were a pain to maintain. Now a single function definition makes the inference for all possibilities.
### How to migrate from v2
For a full fledged example on how to migrate you can check the test file changes on the [v3 PR](https://github.com/thinknimble/tn-models-fp/pull/186).

The summary is as follows:
#### `createCustomServiceCall`
- The callback no longer is in the second parameter. Instead we provide it in the first parameter as a `cb` field

```diff
const testPost = createCustomServiceCall(
{
  inputShape,
  outputShape,
+ cb: async ({ client, input, utils, slashEndingBaseUri }) => {
+     const toApiInput = utils.toApi(input)
+     const res = await client.post(slashEndingBaseUri, toApiInput)
+     const parsed = utils.fromApi(res.data)
+     return parsed
+   },
-async ({ client, input, utils, slashEndingBaseUri }) => {
- const toApiInput = utils.toApi(input)
- const res = await client.post(slashEndingBaseUri, toApiInput)
- const parsed = utils.fromApi(res.data)
- return parsed
-}
})
```
#### createPaginatedServiceCall
- options (`uri` and `httpMethod`) are no longer in the second parameter. Instead we pass them in an `opts` field in the first parameter.

```diff
const paginatedServiceCall = createPaginatedServiceCall(
  {
    outputShape,
    inputShape,
+   opts: {
+      httpMethod: "post"
+   }
  },
-  { httpMethod: "post" }
)
```
#### `createApi`
- If you don't have any custom calls in the `createApi` call then you should be good ✅
- If you do have custom calls, move the second parameter into a `customCalls` field in the first parameter.

```diff
const testApi = createApi(
  {
    baseUri,
    client: mockedAxios,
+   customCalls: {
+     testPost
+   }
  },
-  {
-    testPost,
-  }
)
```
