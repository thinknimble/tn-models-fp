# TN Models - FP approach + TS <!-- omit in toc -->

This package attempts to approach [ tn-models ](https://github.com/thinknimble/tn-models) from a functional paradigm to avoid having issues with types in classes. Thus, preventing doing weird stuff with class static fields which are undiscoverable from TS perspective.

We also prevent runtime obfuscation of fields ( this happened with classes where a field was forgotten to be declared, runtime would have no clue that the field ever was returned from the API). With this in mind, this package warns users that there is a mismatch between what the model declared was vs what the api actually returned.

The package is based in zod to replace models and fields approach from previous version

# Table of contents <!-- omit in toc -->

- [Getting started](#getting-started)
  - [Install this package with your favorite package manager!](#install-this-package-with-your-favorite-package-manager)
  - [Quickstart](#quickstart)
  - [Create your api!](#create-your-api)
  - [Use its built-in methods in your app](#use-its-built-in-methods-in-your-app)
  - [Create your own calls](#create-your-own-calls)
- [API reference](#api-reference)
  - [`createApi`](#createapi)
    - [Built-in methods](#built-in-methods)
      - [`create` - Post request to create a resource](#create---post-request-to-create-a-resource)
      - [`retrieve` - Get request to retrieve a single resource by Id](#retrieve---get-request-to-retrieve-a-single-resource-by-id)
      - [`list` - Get request to obtain a paginated list of the resource](#list---get-request-to-obtain-a-paginated-list-of-the-resource)
      - [`update` - Put/Patch request to update a resource by id](#update---putpatch-request-to-update-a-resource-by-id)
  - [Models (zod-based)](#models-zod-based)
    - [Why shapes and not zods?](#why-shapes-and-not-zods)
    - [Make fields readonly ( only applicable for `entity`)](#make-fields-readonly--only-applicable-for-entity)
  - [`createCustomServiceCall`](#createcustomservicecall)
    - [`standAlone` calls](#standalone-calls)
    - [On the service callback parameters](#on-the-service-callback-parameters)
  - [`createPaginatedServiceCall`](#createpaginatedservicecall)
  - [`createApiUtils`](#createapiutils)
  - [`createCollectionManager`](#createcollectionmanager)
    - [Example use](#example-use)
- [Roadmap](#roadmap)
- [Contribution guide](#contribution-guide)
  - [pnpm](#pnpm)
  - [Tests](#tests)
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

## Quickstart

```typescript

/**
 *
 *  // creating a simple user api with login, registration, update
 *
 */




import axios from 'axios' // it is not required to use axios - pick any client
import {z} from 'zod'
import {GetInferredFromRaw, createCustomServiceCall } from '@thinknimble/tn-models-fp'

/**
 * The entity is the default type to be used in the absence of any other overriding type
 */
const userEntity = {
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  token: z.string()
}

/**
 * Defining a create shape because the registration api expects a different object
 */

const createShape = {
  email:z.string(),
  password:z.string(),
  firstName:z.string(),
  lastName:z.string(),
}
/**
 * Since I know my update method can be partial and wont include all the same fields as a create I create an update shape
 */

const updateShape = {
  firstName: z.string().optional(),
  lastName: z.string().optional()
}

/**
 * login only requires an email and password
 */

const loginShape = {
  email: z.string(),
  password: z.string(),
}

/**
 * Create your api
 * Each api has a create, retrieve, list method by default
 * These methods are accessible through the api directly eg:
 * userApi.create({})
 * userApi.retrieve({})
 * userApi.list()
 *
 */

/**
 * create additional methods using the createCustomServiceCall provider
 * these methods are accesible with the shorthand name for csc
 * e.g userApi.csc.login({})
 */

const update = createCustomServiceCall(
  {
    inputShape: partialUpdateShape,
    outputShape: accountShape,
  },
  async ({ client, slashEndingBaseUri, input, utils: { toApi, fromApi } }) => {
    const { id, ...rest } = toApi(input)
    const res = await client.patch(`${slashEndingBaseUri}${id}/`, rest)
    return fromApi(res.data)
  }
)

const login = createCustomServiceCall(
  {
    inputShape: loginShape,
    outputShape: accountShape,
  },
  async ({ client, slashEndingBaseUri, input, utils: { toApi, fromApi } }) => {
    const data = toApi(input)
    const res = await client.login(`api/login/`, rest)
    return fromApi(res.data)
  }
)
/**
 * There is no need for an output shape in this case
 */
const delete = createCustomServiceCall(
  {
    inputShape: {id:z.string().uuid()}
  },
  async ({ client, slashEndingBaseUri, input, }) => {
    const res = await client.delete(`api/users/${id}/`)
    return
  }
)

const userApi = createApi({
  client: axios.create(), // a client of your choice
  baseUri: "api/users/", // a base URI to be used as a default
  models: {
    /**
     * since my create shape is different than the default AccountEntity
     * I can override it here
     *
     * */

    create: createShape,
    /**
     * if I do not declare any overrides for the three default methods this will be used
     */
    entity: accountShape,
  },
},
{login, update,delete}) // Additional methods are delclared here


/**
 *
 * finally use your api with your favorite wrapper or directly
 *
 */

/**
 * This is a utility from TN-Models-FP that is used to return a TS type from the zod shape
 * The type can be used anywhere in the code and removes the need for creating one manually
 */
type User = GetInferredFromRaw<typeof scheduleRequestInputShape>

let user: User | null = null

try{
  const user = userApi.create({email:"test@test.com",password:"password",firstName:"first",lastName:"last"})
  const res = userApi.csc.login({email:"random@random.com",password:"iamapassword"})
  const userAfterLogin = res.data
}catch(e){
  console.log(e)

}




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
  baseUri: "api/todo",
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

/**
 *
 * Please note the use of TanStack is not required!
 */

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

Second parameter is the actual service call, this callback is powered up with multiple arguments that provide you with all the tools we think you need to make a type-safe call:

```typescript
const updatePartial = createCustomServiceCall(
  {
    inputShape: partialUpdateShape,
    outputShape: entityShape,
  },
  async ({ client, slashEndingBaseUri, input, utils: { toApi, fromApi } }) => {
    const { id, ...rest } = toApi(input)
    const res = await client.patch(`${slashEndingBaseUri}${id}`, rest)
    return fromApi(res.data)
  }
)
```

# API reference

## `createApi`

This is the main entrypoint to tn-models-fp.

An api handler can be created with or without custom service calls. Any custom call is provided with a set of utils accordingly to what they're told what the input-output is. These utils allow to convert camelCase->snake_case (toApi) as well as snake_case->camelCase (fromApi).

The result of the function call is an object that allows to do type-safe calls to the given api. It follows as closely as possible the same api as the class-based version of the library.

### Built-in methods

When passing an `entity` model to `createApi` parameter you get a couple of built-in methods as a result.

#### `create` - Post request to create a resource

If you passed a `create` model you would get the input type resolved from that shape. Otherwise `entity` will be used as a default

Note that if `entity` shape is used to resolve the type of the input, any [readonly fields](#make-fields-readonly--only-applicable-for-entity) and `id` itself will be stripped from that type. So

```typescript
const entityShape = {
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: readonly(z.string()),
}
const api = createApi({
  //...
  models: {
    entity: entityShape,
  },
})
```

Will result in the following call signature for the create method:

```typescript
api.create({
  //id: stripped because it is considered readonly regardless of whether you declared it readonly or not
  firstName: "sample first name",
  lastName: "sample last name",
  //fullName: stripped because it is a readonly-declared field
})
```

#### `retrieve` - Get request to retrieve a single resource by Id

Returns the resolved type of `entity` from given models.

#### `list` - Get request to obtain a paginated list of the resource

Note: Please check that your backend implements a `${baseUri}/list/` endpoint, otherwise this method will not be useful for you (you can still [ create a paginated call ](#createpaginatedservicecall) )
Returns a paginated version of the resolved type of `entity` from given models.

#### `update` - Put/Patch request to update a resource by id

This method takes as parameter the resolved type of the `entity` from given models minus the [declared readonly fields](#make-fields-readonly--only-applicable-for-entity) which are stripped to keep you from sending them in the request.

There are a couple of flavors of this method to your convenience:

- `update(partialResource)` does a patch request with a partial body
- `update.replace(fullResource)` does a put request with a full body
- `update.replace.asPartial(partialResource)` does a put request with a partial body

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

### Make fields readonly ( only applicable for `entity`)

You can mark fields as readonly with the `readonly` function from the library. This will create a brand for your field which will allow the library to identify it as a readonly field, thus preventing those fields to be included in models for creation and update.

```ts
const entityShape = {
  firstName: z.string(),
  lastName: z.string(),
  fullName: readonly(z.string()),
}
```

## `createCustomServiceCall`

This function is used as a complement to `createApi` and allows us to create custom service calls attached to the api.

We provided multiple overloads for it to be fully type-safe and properly infer the parameters for you.

Without this function, you cannot add custom service calls. This was designed as to enforce the type safety of the custom calls. If you're looking for a way to self-host one of these calls please check [`standAlone` calls](#standalone-calls)

Example:

```ts
// from tn-models-client sample repo
const deleteTodo = createCustomServiceCall(
  {
    inputShape: z.number(), //define your input shape (in this case is a ZodPrimitive)
  },
  async ({ input, client, slashEndingBaseUri }) => {
    //you get your parsed input, the axios client and the base uri you defined in `createApi`
    await client.delete(`${slashEndingBaseUri}${input}`)
  }
)

const updatePartial = createCustomServiceCall(
  {
    inputShape: partialUpdateZodRaw, //you can also pass `ZodRawShape`s
    outputShape: entityZodRaw,
  },
  async ({ client, slashEndingBaseUri, input, utils: { toApi, fromApi } }) => {
    // we provide util methods to convert from and to api within your custom call so have you them in handy to use here.
    const { id, ...rest } = toApi(input)
    const res = await client.patch(`${slashEndingBaseUri}${id}`, rest)
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
    baseUri,
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

### `standAlone` calls

There could be situations where you don't want to attach a call to an api. Probably a one-off request or an rpc-like request which is not attached to a specific resource.

For this case we can use `createCustomServiceCall.standAlone` which is a function that gets fed a `client` and is a self-contained version of regular custom service calls.

The parameter to create these calls is slightly different than for dependant custom calls. Here's an example

```typescript
const standAloneCall = createCustomServiceCall.standAlone({
  client: axios,
  models: {
    outputShape: {
      testData: z.string(),
    },
    inputShape: {
      testInput: z.number(),
    },
  },
  name: "standAlone",
  // here is where the difference is, this is not a second parameter but instead it is a `cb` field!
  cb: async ({
    client,
    utils,
    input,
    //!! You don't have the uri available here since this is self hosted there's no other context than this, you'll have to provide the full uri in your api request
    // slashEndingBaseUri,
  }) => {
    const res = await client.post("/api/my-endpoint/", utils.toApi(input))
    return utils.fromApi(res.data)
  },
})
```

### On the service callback parameters

We provide a set of parameters in the custom service callback:

- `client`: a type-wrapped axios instance that makes sure you call the apis with slash ending uris.

For this client to consume your uri strings you should either cast them `as const` or define them as template strings directly in the call

```typescript
  client.get(`${slashEndingBaseUri}`) // slashEndingBaseUri is an `as const` variable
  client.get(`${slashEndingBaseUri}/ending/`) // ✅ define the template string directly in the function call

  const uriSampleOutsideOfCall =`${slashEndingBaseUri}my-uri/not-const/`
  client.get(uriSample)// ❌ this does not check, you'll get error, template string is already evaluated outside so it is considered `string`

  const uriSampleOutsideOfCallAsConst = `${slashEndingBaseUri}my-uri/not-const/` as const
  client get(uriSampleOutsideOfCallAsConst)//✅ was cast as const outside of the call
```

- `slashEndingBaseUri`: gives you a reference to the base uri you passed when you created the api so you can use it within the callback
- `input`:the parsed input based on the `inputShape` you passed
- `utils`: set of utilities to convert from and to api models (handles object casing)
  - `fromApi`: convert a response object from the api (coming in snake casing) to its camelCase version
  - `toApi`: convert an input into an snake_cased object so that you can feed it to the api.
- `parsedFilters`: only available if you provided a `filtersShape` when constructing the custom call. This yields the filters ready-to-go(parsed to string and snake cased!) into the `params` field of the opts parameter of axios

## `createPaginatedServiceCall`

Allows users to create paginated calls that are not directly related with the `list` endpoint of their resource. Such as when an endpoint retrieves a paginated list of things that are not exactly the resource ig: a search. You can also use this if you did not define a resource service the same way as this library expects (to have a `/list` endpoint).

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

Before using this please see [`createCustomServiceCall.standAlone`](#createcustomservicecall)

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

Check out the [ Issues tab ](https://github.com/thinknimble/tn-models-fp/issues) for incoming features and feature/request.

Submit your own if you feel there's something we're missing!

# Contribution guide

## pnpm

We're using pnpm while developing this library. You can easily get setup with it by doing

```shell
npm i -g pnpm
```

## Tests

We always make sure that our PRs pass all current tests and it is highly recommended to at least add a set of tests that are related with the work of the given PR so that we get a minimum level of confidence that things are working fine.

To run tests we have a dev command which will scan the whole repo and run the tests it finds.

```shell
pnpm test:dev
```

We can also isolate tests so that we tackle one at a time by adding `.only` calls to the test suite (`describe`) and/or the test itself (`it`). There's also the chance to run a single file as test

Run a single test file

```shell
pnpm test:dev ./src/api/tests/create-api.test.ts
```

Isolate a test suite/test with `only`:

```typescript
//some.test.ts
describe.only("some test suite", () => {
  it.only("tests some functionality", () => {
    //...
  })
  //...
})
```

## Publishing new version of the package.

To make our life easier with package versioning and releases we're using [changeset](https://github.com/changesets/changesets/tree/main).

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
