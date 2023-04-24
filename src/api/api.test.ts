/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { faker } from "@faker-js/faker"
import { SnakeCasedPropertiesDeep } from "@thinknimble/tn-utils"
import axios from "axios"
import { beforeEach, describe, expect, it, Mocked, vi } from "vitest"
import { z } from "zod"
import { createApi } from "./create-api"
import { Pagination } from "../utils"
import { GetInferredFromRaw, Prettify } from "../utils"
import { getPaginatedSnakeCasedZod } from "../utils/pagination"
import { createCustomServiceCall } from "./create-custom-call"
import { createPaginatedServiceCall } from "./create-paginated-call"

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
const testPost = createCustomServiceCall(
  {
    inputShape: {
      anotherInput: z.string(),
    },
    outputShape: {
      justAny: z.any(),
    },
  },
  async ({ client, input, utils, slashEndingBaseUri }) => {
    const toApiInput = utils.toApi(input)
    const res = await client.post(slashEndingBaseUri, toApiInput)
    const parsed = utils.fromApi(res.data)
    return parsed
  }
)
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
      return "output only overload"
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
const testPostPaginatedServiceCall = createPaginatedServiceCall(
  {
    inputShape: {
      dObj: z.object({
        dObj1: z.number(),
      }),
      eString: z.string(),
    },
    outputShape: entityZodShape,
  },
  { uri: "testPostPaginatedServiceCall", httpMethod: "post" }
)

const testSlashEndingUri = createCustomServiceCall(async ({ client, slashEndingBaseUri }) => {
  type TClient = typeof client
  type UriParameter = Parameters<TClient["get"]>[0]
  type tests = [
    Expect<Equals<UriParameter, typeof slashEndingBaseUri>>,
    Expect<Extends<UriParameter, `slashEndinguri/`>>,
    //@ts-expect-error non slash ending uri should error on ts
    Expect<Extends<UriParameter, `nonSlashEnding`>>
  ]
  //@ts-expect-error should error bc we're not ending the url with a slash
  client.get(`${slashEndingBaseUri}/slashEndingUri`)
  client.get(`${slashEndingBaseUri}`)
  client.get(`${slashEndingBaseUri}/ending/`)
})

describe("v2 api tests", async () => {
  const testBaseUri = "users"
  const testApi = createApi(
    {
      client: mockedAxios,
      baseUri: testBaseUri,
      models: {
        create: createZodShape,
        entity: entityZodShape,
        extraFilters: {
          anExtraFilter: z.string(),
        },
      },
    },
    {
      testPost,
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
      testBaseUriParam: createCustomServiceCall({ outputShape: z.string() }, async ({ slashEndingBaseUri }) => {
        return slashEndingBaseUri
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
  const result = testApi.csc.testNoOutputInputObject({ myInput: "" })

  describe("general checks + TS", () => {
    it("does not expose any method if no models were passed", () => {
      type ExpectedReturn = ReturnType<typeof createApi>
      type tests = [
        //@ts-expect-error should not include list method
        ExpectedReturn["list"],
        //@ts-expect-error should not include retrieve method
        ExpectedReturn["retrieve"],
        //@ts-expect-error should not include create method
        ExpectedReturn["create"]
      ]
      const testApiNoModels = createApi({
        baseUri: "",
        client: mockedAxios,
      })
      expect(testApiNoModels).not.toHaveProperty("list")
      expect(testApiNoModels).not.toHaveProperty("retrieve")
      expect(testApiNoModels).not.toHaveProperty("create")
    })
    it("only exposes retrieve and list if only `entity` is passed", () => {
      //@ts-expect-error don't mind this it is hard for TS to determine which overload it should check, on the tests below it is picking up the correct one!
      type ExpectedReturn = ReturnType<typeof createApi<{ entity: typeof entityZodShape }>>
      type tests = [
        ExpectedReturn["list"],
        ExpectedReturn["retrieve"],
        //@ts-expect-error should not include create method
        ExpectedReturn["create"],
        //@ts-expect-error should not include customServiceCalls
        ExpectedReturn["customServiceCalls"],
        //@ts-expect-error should not include  csc
        ExpectedReturn["csc"]
      ]

      const testApiOnlyEntity = createApi({
        baseUri: "",
        client: mockedAxios,
        models: {
          entity: entityZodShape,
        },
      })
      expect(testApiOnlyEntity).not.toHaveProperty("create")
      expect(testApiOnlyEntity).toHaveProperty("list")
      expect(testApiOnlyEntity).toHaveProperty("retrieve")
      expect(testApiOnlyEntity).not.toHaveProperty("csc")
      expect(testApiOnlyEntity).not.toHaveProperty("customServiceCalls")
    })
    it("does not allow to pass only create or only extra filters model", () => {
      //@ts-expect-error should not allow to create this api with just the "create" model (create needs entity)
      type ExpectedReturn = ReturnType<typeof createApi<{ create: typeof entityZodShape }>>
      expect(() => {
        //@ts-expect-error this should error on TS but checking runtime throw here!
        createApi({
          baseUri: "",
          client: mockedAxios,
          models: {
            create: createZodShape,
          },
        })
      }).toThrow()
    })
  })
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
      expect(postSpy).toHaveBeenCalledWith(`${testBaseUri}/`, {
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
      expect(getSpy).toHaveBeenCalledWith(`${testBaseUri}/${randomUuid}/`)
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
      expect(getSpy).toHaveBeenCalledWith(testBaseUri + "/", {
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
      expect(postSpy).toHaveBeenCalledWith(`${testBaseUri}/`, {
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
      expect(postSpy).toHaveBeenCalledWith(`${testBaseUri}/`, {
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
    it("receives baseUri as parameter within the callback and does not have a trailing slash", async () => {
      const res = await testApi.customServiceCalls.testBaseUriParam()
      expect(res).toEqual(`${testBaseUri}/`)
    })
    it("checks output only overload", async () => {
      const res = await testApi.customServiceCalls.testNoInputPlainZodOutput()
      expect(res).toEqual("output only overload")
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
      //customServiceCalls ts tests
      //@ts-expect-error error on nonexisting custom service call method
      testApi.customServiceCalls.nonExisting
      type tests = [
        Expect<Equals<string, Parameters<(typeof testApi)["customServiceCalls"]["testInputOutputPlainZods"]>[0]>>
      ]
    })
    it("works well if no models are passed", async () => {
      //replicating another test just for the sake of this passing with this config
      //arrange
      const baseUri = "testPost"
      const testApiWithoutModels = createApi(
        {
          baseUri: baseUri,
          client: mockedAxios,
        },
        {
          testPost,
        }
      )
      const postSpy = vi.spyOn(mockedAxios, "post")
      mockedAxios.post.mockResolvedValueOnce({
        data: { justAny: "any" },
      })
      const input = { anotherInput: "testing" }
      //act
      await testApiWithoutModels.csc.testPost(input)
      //assert
      expect(postSpy).toHaveBeenCalledWith(`${baseUri}/`, {
        another_input: input.anotherInput,
      })
    })

    describe("standAlone call", () => {
      it("can convert to stand alone call and calls with right parameters: input object output object", async () => {
        //arrange
        const postSpy = vi.spyOn(mockedAxios, "post")
        const mockResult = {
          test_data: "testData",
        }
        mockedAxios.post.mockResolvedValueOnce({
          data: mockResult,
        })
        const callName = "testStandAloneCall"
        const testStandAloneCall = createCustomServiceCall.standAlone({
          client: mockedAxios,
          models: {
            outputShape: {
              testData: z.string(),
            },
            inputShape: {
              testInput: z.number(),
            },
          },
          name: callName,
          cb: async ({ client, utils, input }) => {
            const res = await client.post(`${callName}/`, utils.toApi(input))
            return utils.fromApi(res.data)
          },
        })
        const testNumberInput = faker.datatype.number()
        //act
        const result = await testStandAloneCall({ testInput: testNumberInput })
        //assert
        expect(postSpy).toHaveBeenLastCalledWith(`${callName}/`, { test_input: testNumberInput })
        expect(result).toEqual({ testData: mockResult.test_data })
      })

      it("can convert to stand alone call and calls with right parameters: input object output primitive", async () => {
        //arrange
        const postSpy = vi.spyOn(mockedAxios, "post")
        const mockResult = [faker.datatype.string(), faker.datatype.string()]
        mockedAxios.post.mockResolvedValueOnce({
          data: mockResult,
        })
        const callName = "testStandAloneCall"
        const testStandAloneCall = createCustomServiceCall.standAlone({
          client: mockedAxios,
          models: {
            outputShape: z.string().array(),
            inputShape: {
              testInput: z.number(),
            },
          },
          name: callName,
          cb: async ({ client, utils, input }) => {
            const res = await client.post(`${callName}/`, utils.toApi(input))
            return utils.fromApi(res.data)
          },
        })
        const testNumberInput = faker.datatype.number()
        //act
        const result = await testStandAloneCall({ testInput: testNumberInput })
        //assert
        expect(postSpy).toHaveBeenLastCalledWith(`${callName}/`, { test_input: testNumberInput })
        expect(result).toEqual(mockResult)
      })

      it("can convert to stand alone call and calls with right parameters: input object output void", async () => {
        //arrange
        const postSpy = vi.spyOn(mockedAxios, "post")
        const mockResult = {
          test_data: "testData",
        }
        mockedAxios.post.mockResolvedValueOnce({
          data: mockResult,
        })
        const callName = "testStandAloneCall"
        const testStandAloneCall = createCustomServiceCall.standAlone({
          client: mockedAxios,
          models: {
            inputShape: {
              testInput: z.number(),
            },
          },
          name: callName,
          cb: async ({ client, utils, input }) => {
            await client.post(`${callName}/`, utils.toApi(input))
          },
        })
        const testNumberInput = faker.datatype.number()
        //act
        const result = await testStandAloneCall({ testInput: testNumberInput })
        //assert
        expect(postSpy).toHaveBeenCalledWith(`${callName}/`, { test_input: testNumberInput })
        expect(result).toBeUndefined()
      })

      it("can convert to stand alone call and calls with right parameters: input void output object", async () => {
        //arrange
        const postSpy = vi.spyOn(mockedAxios, "post")
        const mockResult = {
          test_data: "testData",
        }
        mockedAxios.post.mockResolvedValueOnce({
          data: mockResult,
        })
        const callName = "testStandAloneCall"
        const testStandAloneCall = createCustomServiceCall.standAlone({
          client: mockedAxios,
          models: {
            outputShape: {
              testData: z.string(),
            },
          },
          name: callName,
          cb: async ({ client, utils }) => {
            const res = await client.post(`${callName}/`)
            return utils.fromApi(res.data)
          },
        })
        //act
        const result = await testStandAloneCall()
        //assert
        expect(postSpy).toHaveBeenLastCalledWith(`${callName}/`)
        expect(result).toEqual({ testData: mockResult.test_data })
      })

      it("can convert to stand alone call and calls with right parameters: input void output void", async () => {
        //arrange
        const postSpy = vi.spyOn(mockedAxios, "post")
        const mockResult = {
          test_data: "testData",
        }
        mockedAxios.post.mockResolvedValueOnce({
          data: mockResult,
        })
        const callName = "testStandAloneCall"
        const testStandAloneCall = createCustomServiceCall.standAlone({
          client: mockedAxios,
          name: callName,
          cb: async ({ client }) => {
            const res = await client.post(`${callName}/`)
          },
        })
        //act
        const result = await testStandAloneCall()
        //assert
        expect(postSpy).toHaveBeenLastCalledWith(`${callName}/`)
        expect(result).toBeUndefined()
      })

      it("can convert to stand alone call and calls with right parameters: input void output primitive", async () => {
        //arrange
        const postSpy = vi.spyOn(mockedAxios, "post")
        const mockResult = Array.from({ length: 5 })
          .fill(undefined)
          .map(() => {
            return faker.datatype.number()
          })
        mockedAxios.post.mockResolvedValueOnce({
          data: mockResult,
        })
        const callName = "testStandAloneCall"
        const testStandAloneCall = createCustomServiceCall.standAlone({
          client: mockedAxios,
          models: {
            outputShape: z.string().array(),
          },
          name: callName,
          cb: async ({ client }) => {
            const res = await client.post(`${callName}/`)
            return res.data
          },
        })

        //act
        const result = await testStandAloneCall()
        //assert
        expect(postSpy).toHaveBeenLastCalledWith(`${callName}/`)
        expect(result).toEqual(mockResult)
      })

      it("can convert to stand alone call and calls with right parameters: input primitive output object", async () => {
        //arrange
        const postSpy = vi.spyOn(mockedAxios, "post")
        const mockResult = {
          test_data: "testData",
        }
        mockedAxios.post.mockResolvedValueOnce({
          data: mockResult,
        })
        const callName = "testStandAloneCall"
        const testStandAloneCall = createCustomServiceCall.standAlone({
          client: mockedAxios,
          models: {
            outputShape: {
              testData: z.string(),
            },
            inputShape: z.string(),
          },
          name: callName,
          cb: async ({ client, utils, input }) => {
            const res = await client.post(`${callName}/${input}/`)
            return utils.fromApi(res.data)
          },
        })
        const testStrInput = faker.name.firstName()
        //act
        const result = await testStandAloneCall(testStrInput)
        //assert
        expect(postSpy).toHaveBeenLastCalledWith(`${callName}/${testStrInput}/`)
        expect(result).toEqual({ testData: mockResult.test_data })
      })

      it("can convert to stand alone call and calls with right parameters: input primitive output void", async () => {
        //arrange
        const postSpy = vi.spyOn(mockedAxios, "post")
        const mockResult = {
          test_data: "testData",
        }
        mockedAxios.post.mockResolvedValueOnce({
          data: mockResult,
        })
        const callName = "testStandAloneCall"
        const testStandAloneCall = createCustomServiceCall.standAlone({
          client: mockedAxios,
          models: {
            inputShape: z.string(),
          },
          name: callName,
          cb: async ({ client, input }) => {
            await client.post(`${callName}/${input}/`)
          },
        })
        const testStrInput = faker.name.firstName()
        //act
        const result = await testStandAloneCall(testStrInput)
        //assert
        expect(postSpy).toHaveBeenLastCalledWith(`${callName}/${testStrInput}/`)
        expect(result).toBeUndefined()
      })

      it("can convert to stand alone call and calls with right parameters: input primitive output primitive", async () => {
        //arrange
        const postSpy = vi.spyOn(mockedAxios, "post")
        const mockResult = Array.from({ length: 5 })
          .fill(undefined)
          .map(() => {
            return faker.datatype.string()
          })
        mockedAxios.post.mockResolvedValueOnce({
          data: mockResult,
        })
        const callName = "testStandAloneCall"
        const testStandAloneCall = createCustomServiceCall.standAlone({
          client: mockedAxios,
          models: {
            inputShape: z.string(),
            outputShape: z.string().array(),
          },
          name: callName,
          cb: async ({ client, input, utils }) => {
            const res = await client.post(`${callName}/${input}/`)
            //
            return utils.fromApi(res.data)
          },
        })

        const testStrInput = faker.name.firstName()
        //act
        const result = await testStandAloneCall(testStrInput)
        //assert
        expect(postSpy).toHaveBeenLastCalledWith(`${callName}/${testStrInput}/`)
        expect(result).toEqual(mockResult)
      })
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

    it("allows not passing a uri and calls api with the right uri", async () => {
      //arrange
      const postSpy = vi.spyOn(mockedAxios, "post")
      const paginatedServiceCall = createPaginatedServiceCall(
        {
          inputShape: {
            myInput: z.string(),
          },
          outputShape: {
            myOutput: z.string(),
          },
        },
        { httpMethod: "post" }
      )
      mockedAxios.post.mockResolvedValueOnce({
        data: { count: 1, next: null, previous: null, results: [{ my_output: "myOutput" }] },
      })
      const api = createApi({ baseUri: testBaseUri, client: mockedAxios }, { paginatedServiceCall })
      const pagination = new Pagination({ page: 1 })
      const input = { myInput: "myInput" }
      //act
      await api.csc.paginatedServiceCall({ ...input, pagination })
      //assert
      expect(postSpy).toHaveBeenCalledWith(
        `${testBaseUri}/`,
        { my_input: input.myInput },
        {
          params: {
            page: pagination.page.toString(),
            page_size: pagination.size.toString(),
          },
        }
      )
    })
    it("calls api with the right uri even if uri param is empty", async () => {
      //arrange
      const postSpy = vi.spyOn(mockedAxios, "post")
      const paginatedServiceCall = createPaginatedServiceCall(
        {
          inputShape: {
            myInput: z.string(),
          },
          outputShape: {
            myOutput: z.string(),
          },
        },
        { httpMethod: "post", uri: "" }
      )
      mockedAxios.post.mockResolvedValueOnce({
        data: { count: 1, next: null, previous: null, results: [{ my_output: "myOutput" }] },
      })
      const api = createApi({ baseUri: testBaseUri, client: mockedAxios }, { paginatedServiceCall })
      const pagination = new Pagination({ page: 1 })
      const input = { myInput: "myInput" }
      //act
      await api.csc.paginatedServiceCall({ ...input, pagination })
      //assert
      expect(postSpy).toHaveBeenCalledWith(
        `${testBaseUri}/`,
        { my_input: input.myInput },
        {
          params: {
            page: pagination.page.toString(),
            page_size: pagination.size.toString(),
          },
        }
      )
    })
    it("calls api with the right uri", async () => {
      //arrange
      const getSpy = vi.spyOn(mockedAxios, "get")
      mockedAxios.get.mockResolvedValueOnce({
        data: listResponse,
      })
      //act
      await testApi.csc.testSimplePaginatedCall({ pagination: new Pagination({ page: 1 }) })
      expect(getSpy).toHaveBeenCalledWith(`${testBaseUri}/testSimplePaginatedCall/`, {
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
      const body: Omit<GetInferredFromRaw<(typeof testPostPaginatedServiceCall)["inputShape"]>, "pagination"> = {
        dObj: {
          dObj1: 1,
        },
        eString: "eString",
      }
      //act
      await testApi.csc.testPostPaginatedServiceCall({
        ...body,
        pagination: new Pagination({ page: 1 }),
      })
      //assert
      expect(getSpy).not.toHaveBeenCalled()
      expect(postSpy).toHaveBeenCalledOnce()
    })
    it("calls api and posts with the right casing in its body", async () => {
      //arrange
      const postSpy = vi.spyOn(mockedAxios, "post")
      mockedAxios.get.mockResolvedValueOnce({
        data: listResponse,
      })
      mockedAxios.post.mockResolvedValueOnce({
        data: listResponse,
      })
      const body: Omit<GetInferredFromRaw<(typeof testPostPaginatedServiceCall)["inputShape"]>, "pagination"> = {
        dObj: {
          dObj1: 1,
        },
        eString: "eString",
      }
      //act
      await testApi.csc.testPostPaginatedServiceCall({ ...body, pagination: new Pagination({ page: 1 }) })
      //assert
      expect(postSpy).toHaveBeenCalledWith(
        `${testBaseUri}/testPostPaginatedServiceCall/`,
        {
          d_obj: {
            d_obj1: body.dObj.dObj1,
          },
          e_string: body.eString,
        },
        {
          params: {
            page: "1",
            page_size: "25",
          },
        }
      )
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
      expect(getSpy).toHaveBeenCalledWith(`${testBaseUri}/testPagePaginatedServiceCall/`, {
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
      type testType = Awaited<
        ReturnType<(typeof testApi)["csc"]["testPostPaginatedServiceCall"]>
      >["results"][0]["firstName"]
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
    it("Allows calling it without params (and use defaults)", async () => {
      //act + assert -- should not TS error
      const paginatedServiceCall = createPaginatedServiceCall({
        outputShape: {
          testString: z.string(),
        },
      })
    })
    it("calls api with the right filters", async () => {
      //TODO: should probably add a couple more that check the filtering but no time atm
      //arrange
      const testPaginatedCallWithFilters = createPaginatedServiceCall({
        outputShape: entityZodShape,
        filtersShape: {
          myExtraFilter: z.string(),
          anotherExtraFilter: z.number(),
        },
      })
      const api = createApi(
        {
          baseUri: testBaseUri,
          client: mockedAxios,
        },
        {
          testPaginatedCallWithFilters,
        }
      )
      const getSpy = vi.spyOn(mockedAxios, "get")
      mockedAxios.get.mockResolvedValueOnce({
        data: listResponse,
      })
      const pagination = new Pagination({ page: 1, size: 20 })
      const myExtraFilter = "test"
      //act
      await api.csc.testPaginatedCallWithFilters({
        pagination,
        filters: { myExtraFilter },
      })
      //assert
      expect(getSpy).toHaveBeenCalledWith(`${testBaseUri}/`, {
        params: {
          page: pagination.page.toString(),
          page_size: pagination.size.toString(),
          my_extra_filter: myExtraFilter,
        },
      })
    })
  })
})
