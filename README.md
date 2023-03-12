# TN Models - FP approach + TS

This package attempts to approach [ tn-models ](https://github.com/thinknimble/tn-models) from a functional paradigm to avoid having issues with types in classes. Thus, preventing doing weird stuff with class static fields which are undiscoverable from TS perspective.

We also prevent runtime obfuscation of fields ( this happened with classes where a field was forgotten to be declared, runtime would have no clue that the field ever was returned from the API). With this in mind, this package warns users that there is a mismatch between what the model declared was vs what the api actually returned.

The package is based in zod to replace models and fields approach from previous version

# Docs

## `createApi`

This is the main entrypoint to tn-models-fp.

An api handler can be created with or without custom service calls. Any custom call is provided with a set of utils accordingly to what they're told what the input-output is. These utils allow to convert camelCase->snake_case (toApi) as well as snake_case->camelCase (fromApi).

The result of the function call is an object that allows to do type-safe calls to the given api. It follows as closely as possible the same api as the class-based version of the library.

### Example use

Sample react app: https://github.com/lakardion/ts-models-client

Snippet:

```typescript
export const todoApi = createApi({
  client, // AxiosInstance
  endpoint, //string base endpoint
  models: {
    create: createZodRaw, // ZodRawShape
    entity: entityZodRaw, // ZodRawShape
  },
})
```

## Models (zod-based)

[`zod`](https://zod.dev/) works as a validation library but it also provides a good set of type utilities that can be used to narrow, infer or define typescript types.

I see zod as a library that bridges the gap between typescript world and javascript world. In other words, compile-time and run-time. For this reason I thought it would fit perfectly for fulfilling the role of models in this functional approach.

Zod is going to be used both as the core tool for our type inference and as a validator parser (for snake_casing requests and camelCasing responses as well as checking whether the type received from api is the same as expected).

What we're using in this approach (and what we would require users to use) are[ `ZodRawShape`](https://github.com/colinhacks/zod/blob/42984bf92b93b468666f64d536016b1439f8bf9e/src/types.ts#L48)s which in plain words are records which values are `ZodType` (pretty much anything that you can create with zod's `z`).

Sample models:

```ts
import { z } from "zod"

const createZodRaw = {
  completed: z.boolean().default(false),
  content: z.string().min(1),
  completedDate: z.string().datetime().nullable(),
}

const entityZodRaw = { ...createZodRaw, id: z.number() }
```

### Why shapes and not zods?

Usually when using zod we directly create a zod schema (in any of their forms) but here we would like to be a step before the schema itself.

The reason for this decision was based on the fact that we're going to need to convert our schemas from/to camel/snake case. If we were to create a zod schema (object) we would render the shape inaccessible which would deter us from being able to swap its keys to another casing style.

IG:

```ts
const myZodObject = z.object({
  // zod schema
  dateOfBirth: z.string().datetime(),
  email: z.string(),
  age: z.number(),
}) // after declaration, the shape cannot be retrieved

const myZodShape = {
  //zod shape
  dateOfBirth: z.string().datetime(),
  email: z.string(),
  age: z.number(),
} // asking for the shape allow us to do what we please with its keys and later simply call `z.object` internally when we need the zod schema
```

## `createCustomServiceCall` or `csc`

This function is used as a complement to `createApi` and allows us to create custom service calls attached to the api.

We provided multiple overloads for it to be fully type-safe and properly infer the parameters for you.

Without this function, you cannot add custom service calls. This was designed as to enforce the type safety of the custom calls.

```ts
// from tn-models-client sample repo
const deleteTodo = createCustomServiceCall(
  {
    inputShape: z.number(), //define your input shape (in this case is a ZodPrimitive)
  },
  async ({ input, client, endpoint }) => {
    //you get your parsed input, the axios client and the base endpoint you defined in `createApi`
    await client.delete(`${endpoint}/${input}`)
  }
)

const updatePartial = createCustomServiceCall(
  {
    inputShape: partialUpdateZodRaw, //you can also pass `ZodRawShape`s
    outputShape: entityZodRaw,
  },
  async ({ client, endpoint, input, utils: { toApi, fromApi } }) => {
    // we provide util methods to convert from and to api within your custom call so have you them in handy to use here.
    const { id, ...rest } = toApi(input)
    const res = await client.patch(`${endpoint}/${id}`, rest)
    return fromApi(res.data)
  }
)
```

To add these custom calls to your created api you simply pass them as object to the second parameter in `createApi`

IG: (same as first createApi example but with custom calls)

```ts
export const todoApi = createApi(
  {
    client,
    endpoint,
    models: {
      create: createZodRaw,
      entity: entityZodRaw,
    },
  },
  {
    // object with declared custom service calls
    deleteTodo,
    updatePartial,
  }
)
```

We also added a `csc` alias in case you feel `customServiceCall` is too long.

## `createApiUtils`

This util allows to create the utils independently without the need of creating the api.

This is useful especially for creating remote procedure calls where no resource is strictly attached and an action is being triggered (such as sending an email)

## `createCollectionManager`

Creates a collection manager (intended to be) equivalent to the existing class `CollectionManager` util.
The only required parameter is the `fetchList` field, which expects a reference from your `list` function in the created api.

### Example use

```typescript
const api = createApi({
  //...
})
const collectionManager = createCollectionManager({
  fetchList: api.list,
  list: [], // your feed list, type-inferred from api.list
  pagination: feedPagination, // your pagination object
  filters: feedFilters, // inferred from api.list
})
```

# TODO - Roadmap

## Custom api calls

- [ ] Detach api inputs from call input. (?)
      (?) We could be interested in passing certain input to our call and constructing the input to the api within our method rather than passing it whole in as the custom service call parameter. Probably we could split custom service call inputs vs api call inputs. IG of custom service call input diff with api call input

```typescript
//...
{
  myCustomServiceCall: createCustomServiceCall({
    inputShape:z.string()
    outputShape:z.number()
    callback: async( {client, input, utils} ) =>{
      const res = await client.post(endpoint,utils.toApi( { myCustomInput: input } )
      return utils.fromApi(res.data)
}
```

for `toApi` to work properly we need to define the shape of the api call input, which in this case differs from the one that we are declaring in the inputShape.
Internally `toApi` parses into snake case with `inputShape` in mind. So we would probably want to separate these two shapes in case we don't want them to be the same