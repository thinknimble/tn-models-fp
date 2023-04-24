import { Mocked, describe, it, vi, expect } from "vitest"
import axios from "axios"
import { createCustomServiceCall } from "../create-custom-call"
import { createApi } from "../create-api"
import { z } from "zod"
import { GetInferredFromRaw } from "../../utils"
import { SnakeCasedPropertiesDeep } from "@thinknimble/tn-utils"
import { faker } from "@faker-js/faker"

vi.mock("axios")

const mockedAxios = axios as Mocked<typeof axios>

describe("createCustomServiceCall", () => {
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
  it("calls api with snake case", async () => {
    //arrange
    const baseUri = "callsApiWithSnakeCase"
    const testApi = createApi(
      {
        baseUri,
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
    await testApi.customServiceCalls.testPost(input)
    //assert
    expect(postSpy).toHaveBeenCalledWith(`${baseUri}/`, {
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
    const baseUri = "callsApiWithSnakeCaseCscAlias"
    const testApi = createApi(
      {
        baseUri,
        client: mockedAxios,
      },
      {
        testPost,
      }
    )
    //act
    await testApi.csc.testPost(input)
    //assert
    expect(postSpy).toHaveBeenCalledWith(`${baseUri}/`, {
      another_input: input.anotherInput,
    })
  })
  it("returns camel cased response", async () => {
    //arrange
    const myInput = "Hello there"
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

    const baseUri = "returnsCamelCasedResponse"
    const testApi = createApi(
      {
        baseUri,
        client: mockedAxios,
      },
      {
        testInputOutputObjects,
      }
    )
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
  it("receives baseUri as parameter within the callback and has a trailing slash", async () => {
    const testBaseUriParam = createCustomServiceCall({ outputShape: z.string() }, async ({ slashEndingBaseUri }) => {
      return slashEndingBaseUri
    })
    const baseUri = "returnsCamelCasedResponse"
    const testApi = createApi(
      {
        baseUri,
        client: mockedAxios,
      },
      {
        testBaseUriParam,
      }
    )
    const res = await testApi.customServiceCalls.testBaseUriParam()
    expect(res).toEqual(`${baseUri}/`)
  })
  it("checks output only overload", async () => {
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
    const baseUri = "returnsCamelCasedResponse"
    const testApi = createApi(
      {
        baseUri,
        client: mockedAxios,
      },
      {
        testNoInputPlainZodOutput,
      }
    )
    const res = await testApi.customServiceCalls.testNoInputPlainZodOutput()
    expect(res).toEqual("output only overload")
  })
  it("checks input only overload", async () => {
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
    const baseUri = "inputOnlyOverload"
    const testApi = createApi(
      {
        baseUri,
        client: mockedAxios,
      },
      {
        testNoOutputPlainZodInput,
      }
    )
    const res = await testApi.customServiceCalls.testNoOutputPlainZodInput(10)
    expect(res).toBeUndefined()
  })
  it("checks no input no output overload", async () => {
    const testNoInputNorOutput = createCustomServiceCall(
      async ({
        //@ts-expect-error no input available
        input,
        //@ts-expect-error no utils available
        utils,
      }) => {
        return
      }
    )
    const baseUri = "noInputNorOutputOverload"
    const testApi = createApi(
      {
        baseUri,
        client: mockedAxios,
      },
      {
        testNoInputNorOutput,
      }
    )
    const res = await testApi.customServiceCalls.testNoInputNorOutput()
    expect(res).toBeUndefined()
  })
  it("verifies these ts tests", async () => {
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

    const baseUri = "tsTests"
    const testApi = createApi(
      {
        baseUri,
        client: mockedAxios,
      },
      {
        testInputOutputPlainZods,
      }
    )
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
