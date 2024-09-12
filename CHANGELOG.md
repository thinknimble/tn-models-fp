# @thinknimble/tn-models-fp

## 3.1.1

### Patch Changes

- 35fb8f8: Add boolean to accepted types for filters

## 3.1.0

### Minor Changes

- 986108e: - Allow disabling warning logs with `disableLoggingWarning` option
  - Try-catch all `parse` calls so that users don't just get the intelligible zod error in console.

## 3.0.0

### Major Changes

- 2f61919: ## Migration Guide v2 - v3

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

## 2.5.0

### Minor Changes

- b4e81ed: Rollback changes made to filter parsing, it users can use their own axios client to do the serializing of parameters. tn-models will not take part on that

## 2.4.0

### Minor Changes

- cdb5ea6: Make filters in built-in method `list` to be partial

## 2.3.0

### Minor Changes

- 54e7707: Add upsert built-in method. This method merges both create and update into a single one. if an ID property is passed an update is performed, otherwise a create is called.

## 2.2.1

### Patch Changes

- 5678bcd: - Fix issue where using shapes with `readonly` fields in custom service calls would break `createApi` resulting custom call type.

## 2.2.0

### Minor Changes

- c8fa1f2: Add default parsing for array query params to be a joined comma separated string

## 2.1.5

### Patch Changes

- 650e5b8: Fix issue with `update` not properly camel casing the return object

## 2.1.4

### Patch Changes

- a7eec87: Fix issue with type exposing an enpty object typed filter when no extra filters were passed to models

## 2.1.3

### Patch Changes

- 545bcf4: Fix: add missing exports which were causing some type inference issues

## 2.1.2

### Patch Changes

- Fix issue where zod names were not properly resolved in some environments, thus internal zod checks were failing unnoticeably

## 2.1.1

### Patch Changes

- c9f65b6: Allow to pass array of strings or numbers to filters

## 2.1.0

### Minor Changes

- 1821769: - Fix issue with `instanceof` operator not working as expected in different nodeJS environments.
  - Replaced with a naive but more reliable implementation which uses `typeName` from `zod` to be able to tell apart zod instance types.

## 2.0.1

### Patch Changes

- 0363678: - Fix paginated response returning brand in its type.
  - Fix wrong type error when trying to add models without entity or without an id field

## 2.0.0

### Major Changes

- 482601b: Release tn-models from tn-models-fp.

  This is a major update and the api was completely changed in favor of a better type layer support for typescript users.

  Please read the docs at [our repo](https://github.com/thinknimble/tn-models-fp) for more information as to how can this new version be used.

## 2.14.0

### Minor Changes

- 71c1cc8: Prevent obfuscation of extra fields coming from responses. Now these fields will be available in the response (just won't be type-discoverable). Paginated calls will receive them as camelCased, whereas regular calls will receive them as they come from the raw response.

## 2.13.0

### Minor Changes

- 1aa2f85: Add chance to call built in methods without a trailing slash. TODO: type level remove restriction of axios

## 2.12.3

### Patch Changes

- 98b8519: Fix issue with `readonly` not properly working on Vue and other JS environments. Changed the way ZodBrand is being checked.

## 2.12.2

### Patch Changes

- 77705b2: Fix readonly fields not working properly on create model override. Now readonly fields should be completely ignored for create model override. Allowing you to re-use your entity models that have readonly fields in case you want to.

## 2.12.1

### Patch Changes

- b051a97: `createPaginatedServiceCall` fix not properly camel casing nested array fields

## 2.12.0

### Minor Changes

- a2c44a0: createPaginatedServiceCall allow url params to be passed to paginated call so that we can build our own uri with a function. Now if a `urlParams` is passed down to the inputShape we will take that as a uri parameter which will require to pass a function in second parameter

## 2.11.7

### Patch Changes

- 89f68e2: Fix `readonly` function being exported as type

## 2.11.6

### Patch Changes

- 5ebb3b2: createCustomServiceCall - allow output shape to be of type ZodArray

## 2.11.5

### Patch Changes

- bb2a6eb: custom calls - allow input and output shape to be native enums

## 2.11.4

### Patch Changes

- fd42759: Fix `GetInferredFromRaw` inferring readonly brands

## 2.11.3

### Patch Changes

- fcd3a2e: `createApi` show error when users try to pass things into `models` that are not valid

## 2.11.2

### Patch Changes

- ddad1f6: Fix `createApi` resulting type breaking if not passing any models to it

## 2.11.1

### Patch Changes

- a13361d: Fix `create` built-in method requiring readonly fields as input.

## 2.11.0

### Minor Changes

- 566582f: Make `create` method to always exist if there's a declared entity shape from `models`. This makes it so that if you want to use your own `create` shape in `models` you can, but that's now optional. If resolved from `entity` shape then the resulting callback signature is going to strip all readonly fields and `id` from the entity shape and use that resolved type as the input.

## 2.10.1

### Patch Changes

- 5dacdf6: Fix issue with return type of remove

## 2.10.0

### Minor Changes

- 8af767a: Allow ids to be of type string or number and infer them properly in the corresponding inputs from built-in methods. Improve branded types resolution of return types from built-in methods.

## 2.9.0

### Minor Changes

- f976657: Add chance to declare readonly fields at root level of entity shapes. Introduce `update` and `delete` built-in methods for the api. `update` has a couple of variants which allow users to pick the right behaviour for their update calls

## 2.8.1

### Patch Changes

- b1392c9: Fix standAlone calls including base uri when it would always be undefined

## 2.8.0

### Minor Changes

- 33a6eb5: Add filters to the main methods of the library. `createCustomServiceCall` `createCustomServiceCall.standAlone` and `createPaginatedServiceCall` allow `filterShape` which yields a `parsedFilters` parameter in the callback for you to get snake cased parsed filters and pass them as parameters to your axios calls. Adding filters modify current input arguament so beware that you'll need an object with `input` and `filters?`

## 2.7.0

### Minor Changes

- d17171e: Add `standAlone` function to `createCustomServiceCall`. This fn allows users to create a service call that does not need to be attached to any api, it can work on its own. The only extra requirement for this call is the axios client.

## 2.6.1

### Patch Changes

- ddecbf6: Fix paginated requests doing strict parse of responses instead of safe parse. Remove use of `parse` in `list` and `createPaginatedServiceCall`

## 2.6.0

### Minor Changes

- e64ed54: Allow passing filters to `createPaginatedServiceCall`. For this there's a new `models` field that can be used to pass the filters shape: `filtersShape`. You'll then get a `filters` optional key when using the service call which will allow you to pass the filters you declared

## 2.5.5

### Patch Changes

- 9679bd2: Fix missing argument in `Pagination.hasNextPage`

## 2.5.4

### Patch Changes

- b7f9346: Fix `createPaginatedServiceCall` erroring when not passing opts param. Now it should allow you to skip the second parameter and thus use its built-in defaults ( uri = '' , httpMethod = 'get' )

## 2.5.3

### Patch Changes

- dc5421e: Fix issue with nulls being considered of type object in js. Mischeck was crashing library on null values

## 2.5.2

### Patch Changes

- c31e928: `createPaginatedServiceCall` uri parameter now is optional, and it is now also properly handled if it is an empty string

## 2.5.1

### Patch Changes

- 8270dfe: Fix `createPaginatedServiceCall` not snake casing the request properly. @paribaker

## 2.5.0

### Minor Changes

- 25b3716: Fix issue where object fields of arrays were not properly cased

## 2.4.0

### Minor Changes

- 6f39fad: createCustomServiceCall: allow output shapes to be arrays. Improve createApiUtils so that output shpaes can also be arrays and manage them properly.

## 2.3.0

### Minor Changes

- 9c97033: Add type-wrapper to axios client provided in `createCustomServiceCall` argument so that we make sure users pass a slash ending uri rather than any string. This has some caveats that have been updated in our README

## 2.2.0

### Minor Changes

- c6e3f47: Allow users to skip including models in their api creation. Models now is completely optional and types are properly inferred based on which models are passed. `create` model is not allowed to be passed alone, same for `extraFilters`.

## 2.1.0

### Minor Changes

- bc4193f: Change `endpoint` for `baseUri`. Update custom service calls baseUri parameter to have a better name and hint users they should consider that baseUri to contain a trailing slash

## 2.0.2

### Patch Changes

- 9404505: Fix fromApi not using the right zod to compare

## 2.0.1

### Patch Changes

- b5dbef0: Fix issue with createPaginatedServiceCall not properly inferring return type of entity lit

## 2.0.0

### Major Changes

- 1af70d0: Re-add zod shapes as main way of validating input and outputs. Add support for zod operators: optional, nullable, nullish, or/union, and/intersection

## 1.2.0

### Minor Changes

- 3cd5224: Change createPaginatedServiceCall to ask for pagination parameter on return callback

## 1.1.0

### Minor Changes

- 553cf31: Add createPaginatedServiceCall util to add better paginated requests

## 1.0.3

### Patch Changes

- cc42056: Add export for recursiveShapeToValidZodRawShape and add extra documentation around this method as well (will probably remove this export in the future)

## 1.0.2

### Patch Changes

- 43c3973: Move `Prettify` util to an actual ts file instead of `global.d.ts`

## 1.0.1

### Patch Changes

- f0de186: Add missing type exports for recursive shapes

## 1.0.0

### Major Changes

- 8940172: - Breaking: Allow recursive shapes to be used as input shapes
  - Breaking: Remove the need for users to call z.object on their shapes' objects (we now do that on our end)

## 0.0.4

### Patch Changes

- 773bb15: Update readme for contribution guide

## 0.0.3

### Patch Changes

- a6fa7a8: Publish 0.0.3

## 0.0.2

### Patch Changes

- 1817cc3: First version of the tn-models-fp package
