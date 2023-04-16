# @thinknimble/tn-models-fp

## 2.6.0

### Minor Changes

- fe0ab48: Fix missing argument in `Pagination.hasNextPage`

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
