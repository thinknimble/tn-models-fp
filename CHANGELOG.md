# @thinknimble/tn-models-fp

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
