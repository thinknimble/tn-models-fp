/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { faker } from "@faker-js/faker"
import { SnakeCasedPropertiesDeep } from "@thinknimble/tn-utils"
import axios from "axios"
import { beforeEach, describe, expect, it, Mocked, vi } from "vitest"
import { z } from "zod"
import { createApi, createCustomServiceCall, createPaginatedServiceCall } from "./api"
import { Pagination } from "./pagination"
import { GetInferredFromRaw, Prettify } from "./utils"
import { getPaginatedSnakeCasedZod } from "./utils/pagination"

vi.mock("axios")

const mockedAxios = axios as Mocked<typeof axios>

const createZodShape = {
  firstName: z.string(),
  lastName: z.string(),
  age: z.number(),
}
const entityZodShape = {
  ...createZodShape,
  id: z.string().uuid(),
}

// testApi custom calls + createCustomServiceCall TS tests!
const testInputOutputObjects = (() => {
  const inputShape = { myInput: z.string() }
  const outputShape = {
    givenInput: z.string(),
    inputLength: z.number(),
  }
  return createCustomServiceCall(
    {
      inputShape,
      outputShape,
    },
    async ({ input, utils }) => {
      type tests = [
        Expect<Equals<typeof input, GetInferredFromRaw<typeof inputShape>>>,
        Expect<Equals<(typeof utils)["fromApi"], (obj: object) => GetInferredFromRaw<typeof outputShape>>>,
        Expect<
          Equals<
            (typeof utils)["toApi"],
            (obj: object) => SnakeCasedPropertiesDeep<GetInferredFromRaw<typeof inputShape>>
          >
        >
      ]
      return {
        givenInput: input.myInput,
        inputLength: input.myInput.length,
      }
    }
  )
})()
type test = Prettify<ReturnType<(typeof testInputOutputObjects)["callback"]>>
const testInputOutputPlainZods = (() => {
  const inputShape = z.string()
  const outputShape = z.number()
  return createCustomServiceCall(
    {
      inputShape,
      outputShape,
    },
    async ({
      input,
      //@ts-expect-error no utils fns since both input and output are primitives
      utils,
    }) => {
      type tests = [Expect<Equals<typeof input, z.infer<typeof inputShape>>>]
      return 10
    }
  )
})()

const testNoInputPlainZodOutput = (() => {
  const outputShape = z.string()
  return createCustomServiceCall(
    {
      outputShape,
    },
    async ({
      //@ts-expect-error no utils fns since outputShape is primitive
      utils,
      //@ts-expect-error no input if there is no inputShape
      input,
    }) => {
      return "overloads ftw"
    }
  )
})()

const testNoOutputPlainZodInput = (() => {
  const inputShape = z.number()
  return createCustomServiceCall(
    {
      inputShape,
    },
    async ({
      input,
      //@ts-expect-error no utils fn since inputShape is primitive
      utils,
    }) => {
      type tests = [Expect<Equals<typeof input, z.infer<typeof inputShape>>>]
      return
    }
  )
})()

const testNoOutputInputObject = (() => {
  const inputShape = { myInput: z.string() }
  return createCustomServiceCall(
    {
      inputShape,
    },
    async ({
      input,
      utils: {
        toApi,
        //@ts-expect-error no fromApi if there is no outputShape
        fromApi,
      },
    }) => {
      type tests = [
        Expect<Equals<typeof input, GetInferredFromRaw<typeof inputShape>>>,
        Expect<Equals<typeof toApi, (obj: object) => SnakeCasedPropertiesDeep<GetInferredFromRaw<typeof inputShape>>>>
      ]
    }
  )
})()

const testNoInputOutputObject = (() => {
  const outputShape = {
    myOutput: z.number(),
  }
  return createCustomServiceCall(
    {
      outputShape,
    },
    async ({
      utils: {
        fromApi,
        //@ts-expect-error no toApi if there is no input
        toApi,
      },
      //@ts-expect-error no input available
      input,
    }) => {
      type test = Expect<Equals<typeof fromApi, (obj: object) => GetInferredFromRaw<typeof outputShape>>>
      return { myOutput: 10 }
    }
  )
})()

const testInputPlainZodOutputObject = (() => {
  const inputShape = z.string()
  const outputShape = {
    myOutput: z.number(),
  }

  return createCustomServiceCall(
    {
      inputShape,
      outputShape,
    },
    async ({
      input,
      utils: {
        fromApi,
        //@ts-expect-error no toApi util since input is primitive
        toApi,
      },
    }) => {
      type tests = [
        Expect<Equals<typeof input, z.infer<typeof inputShape>>>,
        Expect<Equals<typeof fromApi, (obj: object) => GetInferredFromRaw<typeof outputShape>>>
      ]
      return { myOutput: 10 }
    }
  )
})()

const testInputObjectOutputPlainZod = (() => {
  const inputShape = {
    myInput: z.string(),
  }
  const outputShape = z.number()

  return createCustomServiceCall(
    {
      inputShape,
      outputShape,
    },
    async ({ input, utils: { toApi } }) => {
      type tests = [
        Expect<Equals<typeof input, GetInferredFromRaw<typeof inputShape>>>,
        Expect<Equals<typeof toApi, (obj: object) => SnakeCasedPropertiesDeep<GetInferredFromRaw<typeof inputShape>>>>
      ]

      return 10
    }
  )
})()

const testSimplePaginatedCall = (() => {
  return createPaginatedServiceCall(
    {
      outputShape: entityZodShape,
    },
    {
      uri: "testSimplePaginatedCall",
    }
  )
})()
type result = (typeof testSimplePaginatedCall)["callback"]
const testPagePaginatedServiceCall = (() => {
  return createPaginatedServiceCall(
    {
      outputShape: entityZodShape,
    },
    { uri: "testPagePaginatedServiceCall" }
  )
})()
const testPostPaginatedServiceCall = (() => {
  return createPaginatedServiceCall(
    {
      inputShape: {
        d: z.object({
          d1: z.number(),
        }),
        e: z.string(),
      },
      outputShape: entityZodShape,
    },
    { uri: "testPostPaginatedServiceCall", httpMethod: "post" }
  )
})()

describe("v2 api tests", async () => {
  const testEndpoint = "users"
  const testApi = createApi(
    {
      client: mockedAxios,
      endpoint: testEndpoint,
      models: {
        create: createZodShape,
        entity: entityZodShape,
        extraFilters: {
          anExtraFilter: z.string(),
        },
      },
    },
    {
      testPost: createCustomServiceCall(
        {
          inputShape: {
            anotherInput: z.string(),
          },
          outputShape: {
            justAny: z.any(),
          },
        },
        async ({ client, input, utils }) => {
          const toApiInput = utils.toApi(input)
          const res = await client.post(testEndpoint, toApiInput)
          const parsed = utils.fromApi(res.data)
          return parsed
        }
      ),
      testNoInputNorOutput: createCustomServiceCall(
        async ({
          //@ts-expect-error no input available
          input,
          //@ts-expect-error no utils available
          utils,
        }) => {
          return
        }
      ),
      testEndpointParam: createCustomServiceCall({ outputShape: z.string() }, async ({ endpoint }) => {
        return endpoint
      }),
      // custom calls that include type tests
      testInputOutputObjects,
      testInputOutputPlainZods,
      testNoInputPlainZodOutput,
      testNoOutputPlainZodInput,
      testNoOutputInputObject,
      testNoInputOutputObject,
      testInputPlainZodOutputObject,
      testInputObjectOutputPlainZod,
      testSimplePaginatedCall,
      testPagePaginatedServiceCall,
      testPostPaginatedServiceCall,
    }
  )

  describe("create", () => {
    beforeEach(() => {
      mockedAxios.post.mockReset()
    })

    const createInput: GetInferredFromRaw<typeof createZodShape> = {
      age: 19,
      lastName: "Doe",
      firstName: "Jane",
    }
    const randomId: string = faker.datatype.uuid()
    const createResponse: SnakeCasedPropertiesDeep<GetInferredFromRaw<typeof entityZodShape>> = {
      age: createInput.age,
      last_name: createInput.lastName,
      first_name: createInput.firstName,
      id: randomId,
    }

    it("calls api with snake_case", async () => {
      //arrange
      const postSpy = vi.spyOn(mockedAxios, "post")
      mockedAxios.post.mockResolvedValueOnce({ data: createResponse })
      //act
      await testApi.create(createInput)
      //assert
      expect(postSpy).toHaveBeenCalledWith(`${testEndpoint}/`, {
        age: createInput.age,
        last_name: createInput.lastName,
        first_name: createInput.firstName,
      })
    })
    it("returns camelCased response", async () => {
      //arrange
      mockedAxios.post.mockResolvedValueOnce({ data: createResponse })
      //act
      const response = await testApi.create(createInput)
      //assert
      expect(response).toEqual({ ...createInput, id: randomId })
    })
  })

  describe("retrieve", () => {
    beforeEach(() => {
      mockedAxios.post.mockReset()
    })

    it("returns camelCased entity", async () => {
      //arrange
      const randomUuid = faker.datatype.uuid()
      const entityResponse: SnakeCasedPropertiesDeep<GetInferredFromRaw<typeof entityZodShape>> = {
        age: 18,
        first_name: "John",
        last_name: "Doe",
        id: randomUuid,
      }
      mockedAxios.get.mockResolvedValue({ data: entityResponse })
      const getSpy = vi.spyOn(mockedAxios, "get")
      //act
      const response = await testApi.retrieve(randomUuid)
      //assert
      expect(getSpy).toHaveBeenCalledWith(`${testEndpoint}/${randomUuid}/`)
      expect(response).toEqual({
        age: entityResponse.age,
        firstName: entityResponse.first_name,
        lastName: entityResponse.last_name,
        id: randomUuid,
      })
    })
  })

  describe("list", () => {
    beforeEach(() => {
      mockedAxios.get.mockReset()
    })
    const josephId = faker.datatype.uuid()
    const jotaroId = faker.datatype.uuid()
    const listResponse: z.infer<ReturnType<typeof getPaginatedSnakeCasedZod<typeof entityZodShape>>> = {
      count: 10,
      next: null,
      previous: null,
      results: [
        { age: 68, first_name: "Joseph", last_name: "Joestar", id: josephId },
        {
          age: 17,
          first_name: "Jotaro",
          last_name: "Kujo",
          id: jotaroId,
        },
      ],
    }
    const [joseph, jotaro] = listResponse.results
    it("returns camelCased paginated result", async () => {
      //arrange
      mockedAxios.get.mockResolvedValueOnce({ data: listResponse })
      //act
      const response = await testApi.list()
      //assert
      expect(response).toBeTruthy()
      expect(response.results).toHaveLength(2)
      expect(response).toEqual({
        ...listResponse,
        results: [
          {
            age: joseph!.age,
            firstName: joseph!.first_name,
            lastName: joseph!.last_name,
            id: joseph!.id,
          },
          {
            age: jotaro!.age,
            firstName: jotaro!.first_name,
            lastName: jotaro!.last_name,
            id: jotaro!.id,
          },
        ],
      })
    })
    it("uses snake case for sending filters to api", async () => {
      //arrange
      const filters = {
        anExtraFilter: "extra-filter",
      }
      const pagination = new Pagination({ page: 5, size: 8 })
      mockedAxios.get.mockResolvedValueOnce({ data: listResponse })
      const getSpy = vi.spyOn(mockedAxios, "get")
      //act
      await testApi.list({
        filters,
        pagination,
      })
      //assert
      expect(getSpy).toHaveBeenCalledWith(testEndpoint + "/", {
        params: {
          an_extra_filter: filters.anExtraFilter,
          page: pagination.page.toString(),
          page_size: pagination.size.toString(),
        },
      })
    })
    it("verifies these ts tests", async () => {
      try {
        //use existing filter
        await testApi.list({ filters: { anExtraFilter: "no ts errors" } })
        //call with no filters/pagination
        await testApi.list()
        await testApi.list({
          filters: {
            //@ts-expect-error Do not allow passing any key as filter
            nonExistent: "error",
          },
        })
      } catch {
        //ignore
      }
    })
  })

  describe("createCustomServiceCall", () => {
    it("calls api with snake case", async () => {
      //arrange
      const postSpy = vi.spyOn(mockedAxios, "post")
      mockedAxios.post.mockResolvedValueOnce({
        data: { justAny: "any" },
      })
      const input = { anotherInput: "testing" }
      //act
      await testApi.customServiceCalls.testPost(input)
      //assert
      expect(postSpy).toHaveBeenCalledWith(testEndpoint, {
        another_input: input.anotherInput,
      })
    })
    it("calls api with snake case using csc alias", async () => {
      //arrange
      const postSpy = vi.spyOn(mockedAxios, "post")
      mockedAxios.post.mockResolvedValueOnce({
        data: { justAny: "any" },
      })
      const input = { anotherInput: "testing" }
      //act
      await testApi.csc.testPost(input)
      //assert
      expect(postSpy).toHaveBeenCalledWith(testEndpoint, {
        another_input: input.anotherInput,
      })
    })
    it("returns camel cased response", async () => {
      //arrange
      const myInput = "Hello there"
      const expected: Awaited<ReturnType<typeof testApi.customServiceCalls.testInputOutputObjects>> = {
        givenInput: myInput,
        inputLength: myInput.length,
      }
      //act
      const res = await testApi.customServiceCalls.testInputOutputObjects({
        myInput,
      })
      //assert
      expect(res).toEqual(expected)
    })
    it("receives endpoint as parameter within the callback and has a trailing slash", async () => {
      const res = await testApi.customServiceCalls.testEndpointParam()
      expect(res).toEqual(`${testEndpoint}/`)
    })
    it("checks output only overload", async () => {
      const res = await testApi.customServiceCalls.testNoInputPlainZodOutput()
      expect(res).toEqual("overloads ftw")
    })
    it("checks input only overload", async () => {
      const res = await testApi.customServiceCalls.testNoOutputPlainZodInput(10)
      expect(res).toBeUndefined()
    })
    it("checks no input no output overload", async () => {
      const res = await testApi.customServiceCalls.testNoInputNorOutput()
      expect(res).toBeUndefined()
    })
    it("verifies these ts tests", async () => {
      //customEndpoints ts tests
      try {
        //@ts-expect-error when passing string rather than number
        await testApi.customServiceCalls.testInputOutputPlainZods(5)
        //@ts-expect-error error on nonexisting custom service call method
        await testApi.customServiceCalls.nonExisting()
      } catch {
        //ignore
      }
    })
  })

  describe("createPaginatedServiceCall", () => {
    const josephId = faker.datatype.uuid()
    const jotaroId = faker.datatype.uuid()
    const listResponse: z.infer<ReturnType<typeof getPaginatedSnakeCasedZod<typeof entityZodShape>>> = {
      count: 10,
      next: null,
      previous: null,
      results: [
        { age: 68, first_name: "Joseph", last_name: "Joestar", id: josephId },
        {
          age: 17,
          first_name: "Jotaro",
          last_name: "Kujo",
          id: jotaroId,
        },
      ],
    }
    const [joseph, jotaro] = listResponse.results
    it("calls api with the right uri", async () => {
      //arrange
      const getSpy = vi.spyOn(mockedAxios, "get")
      mockedAxios.get.mockResolvedValueOnce({
        data: listResponse,
      })
      //act
      await testApi.csc.testSimplePaginatedCall({ pagination: new Pagination({ page: 1 }) })
      expect(getSpy).toHaveBeenCalledWith(`${testEndpoint}/testSimplePaginatedCall`, {
        params: {
          page: "1",
          page_size: "25",
        },
      })
    })
    it("calls api with the selected method: post", async () => {
      //arrange
      const getSpy = vi.spyOn(mockedAxios, "get")
      const postSpy = vi.spyOn(mockedAxios, "post")
      mockedAxios.get.mockResolvedValueOnce({
        data: listResponse,
      })
      mockedAxios.post.mockResolvedValueOnce({
        data: listResponse,
      })
      const body = {
        d: {
          d1: 1,
        },
        e: "e",
      }
      //act
      await testApi.csc.testPostPaginatedServiceCall({ ...body, pagination: new Pagination({ page: 1 }) })
      //assert
      expect(getSpy).not.toHaveBeenCalled()
      expect(postSpy).toHaveBeenCalledWith(`${testEndpoint}/testPostPaginatedServiceCall`, body, {
        params: {
          page: "1",
          page_size: "25",
        },
      })
    })
    it("calls api with right pagination params", async () => {
      //arrange
      const getSpy = vi.spyOn(mockedAxios, "get")
      mockedAxios.get.mockResolvedValueOnce({
        data: listResponse,
      })
      const body = {
        d: {
          d1: 1,
        },
        e: "e",
      }
      //act
      await testApi.csc.testPagePaginatedServiceCall({ pagination: new Pagination({ page: 10, size: 100 }) })
      //assert
      expect(getSpy).toHaveBeenCalledWith(`${testEndpoint}/testPagePaginatedServiceCall`, {
        params: {
          page: "10",
          page_size: "100",
        },
      })
    })
    it("Returns with the expected shape", async () => {
      //arrange
      mockedAxios.get.mockResolvedValueOnce({
        data: listResponse,
      })
      //act
      const response = await testApi.csc.testSimplePaginatedCall({ pagination: new Pagination({ page: 1 }) })
      //assert
      expect(response).toBeTruthy()
      expect(response.results).toHaveLength(2)
      expect(response).toEqual({
        ...listResponse,
        results: [
          {
            age: joseph!.age,
            firstName: joseph!.first_name,
            lastName: joseph!.last_name,
            id: joseph!.id,
          },
          {
            age: jotaro!.age,
            firstName: jotaro!.first_name,
            lastName: jotaro!.last_name,
            id: jotaro!.id,
          },
        ],
      })
    })
  })
})
