# TN Models - FP approach + TS <!-- omit in toc -->

This package attempts to approach [ tn-models ](https://github.com/thinknimble/tn-models) from a functional paradigm to avoid having issues with types in classes. Thus, preventing doing weird stuff with class static fields which are undiscoverable from TS perspective.

We also prevent runtime obfuscation of fields ( this happened with classes where a field was forgotten to be declared, runtime would have no clue that the field ever was returned from the API). With this in mind, this package warns users that there is a mismatch between what the model declared was vs what the api actually returned.

The package is based in zod to replace models and fields approach from previous version

# Table of contents <!-- omit in toc -->

- [Getting started](#getting-started)
  - [Install this package with your favorite package manager!](#install-this-package-with-your-favorite-package-manager)
  - [Create your api!](#create-your-api)
  - [Use its built-in methods in your app](#use-its-built-in-methods-in-your-app)
  - [Create your own calls](#create-your-own-calls)
- [API reference](#api-reference)
  - [`createApi`](#createapi)
    - [Example use](#example-use)
  - [Models (zod-based)](#models-zod-based)
    - [Why shapes and not zods?](#why-shapes-and-not-zods)
  - [`createCustomServiceCall` or `csc`](#createcustomservicecall-or-csc)
  - [`createPaginatedServiceCall`](#createpaginatedservicecall)
  - [`createApiUtils`](#createapiutils)
  - [`createCollectionManager`](#createcollectionmanager)
    - [Example use](#example-use-1)
- [Roadmap](#roadmap)
  - [Custom api calls](#custom-api-calls)
- [Contribution guide](#contribution-guide)
  - [Publishing new version of the package.](#publishing-new-version-of-the-package)

# Getting started

## Install this package with your favorite package manager!

```bash
npm i @thinknimble/tn-models-fp
```

```bash
yarn add @thinknimble/tn-models-fp
```

```bash
pnpm i @thinknimble/tn-models-fp
```

## Create your api!

You need a couple of things:

- An `AxiosInstance`. Either create it on the fly or provide an existing one
- A base uri for your api ( don't worry about trailing slashes we take care of that)
- Model for resource creation
- Model for resource entity (what you know the api will return)

IG:

```typescript
import axios from "axios"
import { z } from "zod"

const createShape = {
  completed: z.boolean().default(false),
  content: z.string().min(1),
  completedDate: z.string().datetime().nullable(),
}

export const todoApi = createApi({
  client: axios.create(),
  endpoint: "api/todo",
  models: {
    create: createShape,
    entity: { id: z.string().uuid(), ...createShape },
  },
})
```

## Use its built-in methods in your app

```typescript
import {todoApi} from './services'
import {useMutation} from '@tanstack/react-query'
import {useState} from 'react'
import { Pagination } from '@thinknimble/tn-models-fp'

const TodoManager = () => {
  const [selectedTodoId,setSelectedTodoId] = useState()

  const {data: selectedTodo} = useQuery({
    queryKey: ['todo',selectedTodoId],
    queryFn: () => todoApi.retrieve( selectedTodoId )
  })

  const {mutateAsync:create} = useMutation({
    mutationFn: todoApi.create
  })

  const [pagination, setPagination] = useState( new Pagination({ page:1 }) )
  const { data:currentList } = useQuery({
    queryKey: ['todo-list',page],
    queryFn: () => todoApi.list( { pagination } )
  })

  return (
    //...
  )
}

```

## Create your own calls

A second parameter to `createApi` can be passed so you can create your own calls.
To do this you pass an object with the service callbacks. These should be created with `createCustomServiceCall` method:

First parameter are the models for your input and output shapes of the call.

Second parameter is the actual service call, this callback is powered up with multiple arguments that provide you with all the tools we think you need to make a type-safe call.

```typescript
const updatePartial = createCustomServiceCall(
  {
    inputShape: partialUpdateShape,
    outputShape: entityShape,
  },
  async ({ client, endpoint, input, utils: { toApi, fromApi } }) => {
    const { id, ...rest } = toApi(input)
    const res = await client.patch(`${endpoint}/${id}`, rest)
    return fromApi(res.data)
  }
)
```

# API reference

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

What we're using in this approach (and what we would require users to use) are zod raw shapes. Which in plain words are objects which values are

- `ZodTypeAny` : pretty much anything that you can create with zod's `z`

Sample models:

```ts
import { z } from "zod"

const createShape = {
  //ZodRawShape
  completed: z.boolean().default(false), //ZodBoolean
  content: z.string().min(1), // ZodString
  completedDate: z.string().datetime().nullable(), // ZodString
  extraInformation: z.object({
    // ZodObject
    developerUserId: z.string().uuid(), //...
    reviewerUserId: z.string().uuid(),
    qaUserId: z.string().uuid(),
    prDetails: z.object({
      url: z.string().url(),
    }),
  }),
}

const entityShape = { ...createZodRaw, id: z.number() }
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

## `createPaginatedServiceCall`

Allows users to create paginated calls that are not directly related with the `list` endpoint of their resource. Such as when an endpoint retrieves a paginated list of things that are not exactly the resource ig: a search. You can also use this if you did not define a resource service the same way as this library expects (to have a `/list` endpoint).

This returns the paginated response. As of now (2.0.0) we don't have support for filter params but will soon! [#15](https://github.com/thinknimble/tn-models-fp/issues/15) [#32](https://github.com/thinknimble/tn-models-fp/issues/32)

IG

```typescript
const getMatches = createPaginatedServiceCall(
  {
    // inputShape: someInputShape (optional)
    outputShape: entityZodShape,
  },
  {
    uri: "get-matches",
    // httpMethod: 'post' (optional, default get)
  }
)

const api = createApi(
  //...models
  ,
  {
    //... other custom calls,
    getMatches
  }
)
```

## `createApiUtils`

This util allows to create the utils independently without the need of creating the api.

This is useful especially for creating remote procedure calls where no resource is strictly attached and an action is being triggered ig: call to send an email

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

# Roadmap

## Custom api calls

- [ ] Detach api inputs from call input.

<details>
<summary>
More info
</summary>
We could be interested in passing certain input to our call and constructing the input to the api within our method rather than passing it whole in as the custom service call parameter. Probably we could split custom service call inputs vs api call inputs. IG of custom service call input diff with api call input

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

</details>

# Contribution guide

## Publishing new version of the package.

To make our life easier with versioning and releasing new versions of the packages we're using [changeset](https://github.com/changesets/changesets/tree/main).

If a PR for a feature conveys a release with it OR you want to release a version after some PRs have been merged.

From the root of the project you have to

```
pnpm changeset
```

Follow the prompts:

- Give it a patch/minor/major depending on the release you mean to publish.
- Add a description of what the release contains.

Commit those changes into the PR or create a PR for it and merge it.

What this will do is create a Version release PR that will allow you to confirm the release. Once that PR is merged, the github action will reach out to npm and publish the package for you.
