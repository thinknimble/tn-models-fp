/* eslint-disable @typescript-eslint/no-unused-vars */
import { faker } from "@faker-js/faker"
import { SnakeCasedPropertiesDeep, objectToSnakeCase } from "@thinknimble/tn-utils"
import { describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { GetInferredFromRaw } from "../../utils"
import { createApi } from "../create-api"
import { createCustomServiceCall } from "../create-custom-call"
import { mockedAxios } from "./mocks"
import { CustomServiceCallPlaceholder } from "../types"

describe("createCustomServiceCall", () => {
  const inputShape = {
    anotherInput: z.string(),
  }
  const outputShape = {
    justAny: z.any(),
  }
  const testPost = createCustomServiceCall(
    {
      inputShape,
      outputShape,
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
    type testNoInputNorOutput = typeof testNoInputNorOutput
    type tste = CustomServiceCallPlaceholder<z.ZodVoid, z.ZodVoid, z.ZodVoid>
    //^?
    type result = testNoInputNorOutput extends CustomServiceCallPlaceholder<infer TInput, infer TOutput, infer TFilters>
      ? [TInput, TOutput, TFilters]
      : false
    //    ^?
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
  it("passes the right filters to callback: input and output", async () => {
    //arrange
    const getSpy = vi.spyOn(mockedAxios, "get")
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        test_output: "test",
      },
    })
    const callWithFilter = createCustomServiceCall(
      {
        inputShape: {
          testInput: z.string(),
        },
        outputShape: {
          testOutput: z.string(),
        },
        filtersShape: {
          testFilter: z.string(),
        },
      },
      async ({ client, slashEndingBaseUri, parsedFilters }) => {
        const result = await client.get(slashEndingBaseUri, { params: parsedFilters })
        return result.data
      }
    )
    const baseUri = "filters"
    const filters = {
      testFilter: "myFilter",
    }
    const api = createApi(
      {
        client: mockedAxios,
        baseUri,
      },
      {
        callWithFilter,
      }
    )
    //act
    await api.csc.callWithFilter({
      input: { testInput: "testInput" },
      filters,
    })
    //assert
    expect(getSpy).toHaveBeenCalledWith(`${baseUri}/`, {
      params: objectToSnakeCase(filters),
    })
  })
  it("passes the right filters to callback: only output", async () => {
    //arrange
    const getSpy = vi.spyOn(mockedAxios, "get")
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        test_output: "test",
      },
    })
    const callWithFilter = createCustomServiceCall(
      {
        outputShape: {
          testOutput: z.string(),
        },
        filtersShape: {
          testFilter: z.string(),
        },
      },
      async ({ client, slashEndingBaseUri, parsedFilters }) => {
        const result = await client.get(slashEndingBaseUri, { params: parsedFilters })
        return result.data
      }
    )
    const baseUri = "filters"
    const filters = {
      testFilter: "myFilter",
    }
    const api = createApi(
      {
        client: mockedAxios,
        baseUri,
      },
      {
        callWithFilter,
      }
    )
    //act
    await api.csc.callWithFilter({
      filters,
    })
    //assert
    expect(getSpy).toHaveBeenCalledWith(`${baseUri}/`, {
      params: objectToSnakeCase(filters),
    })
  })
  it("does not error on not passing filters", async () => {
    //arrange
    const getSpy = vi.spyOn(mockedAxios, "get")
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        test_output: "test",
      },
    })
    const callWithFilter = createCustomServiceCall(
      {
        outputShape: {
          testOutput: z.string(),
        },
        filtersShape: {
          testFilter: z.string(),
        },
      },
      async ({ client, slashEndingBaseUri, parsedFilters }) => {
        const result = await client.get(slashEndingBaseUri, { params: parsedFilters })
        return result.data
      }
    )
    const baseUri = "filters"
    const api = createApi(
      {
        client: mockedAxios,
        baseUri,
      },
      {
        callWithFilter,
      }
    )
    //act
    await api.csc.callWithFilter()
    //assert
    expect(getSpy).toHaveBeenCalledWith(`${baseUri}/`, {
      params: undefined,
    })
  })
  it("should TS error if user passes filtersShape but no output", async () => {
    //arrange
    const getSpy = vi.spyOn(mockedAxios, "get")
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        test_output: "test",
      },
    })
    const callWithFilter = createCustomServiceCall(
      {
        //@ts-expect-error cannot pass filter shape if there is no output shape
        filtersShape: {
          testFilter: z.string(),
        },
      },
      async () => {
        //no-op
      }
    )
  })
  it("Should not allow filters if there is no output (just input)", async () => {
    //arrange
    const getSpy = vi.spyOn(mockedAxios, "get")
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        test_output: "test",
      },
    })
    //@ts-expect-error should not allow to create with filter and no outputshape
    const callWithFilter = createCustomServiceCall(
      {
        inputShape: {
          testInput: z.string(),
        },
        filtersShape: {
          testFilter: z.string(),
        },
      },
      async ({ client, slashEndingBaseUri }) => {
        //no-op
      }
    )
  })

  describe("standAlone call", () => {
    it("calls with right parameters: input object output object", async () => {
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

    it("calls with right parameters: input object output primitive", async () => {
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

    it("calls with right parameters: input object output void", async () => {
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

    it("calls with right parameters: input void output object", async () => {
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

    it("calls with right parameters: input void output void", async () => {
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

    it("calls with right parameters: input void output primitive", async () => {
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

    it("calls with right parameters: input primitive output object", async () => {
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

    it("calls with right parameters: input primitive output void", async () => {
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

    it("calls with right parameters: input primitive output primitive", async () => {
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

    // //-----
    it("calls with right parameters and filters: input object output object", async () => {
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
          filtersShape: {
            testFilter: z.string(),
          },
        },
        name: callName,
        cb: async ({ client, utils, input, slashEndingBaseUri, parsedFilters }) => {
          const res = await client.post(`${callName}/`, utils.toApi(input), {
            params: parsedFilters,
          })
          return utils.fromApi(res.data)
        },
      })
      const testNumberInput = faker.datatype.number()
      const testFilter = faker.datatype.string(5)
      //act
      const result = await testStandAloneCall({
        input: { testInput: testNumberInput },
        filters: { testFilter: testFilter },
      })
      //assert
      expect(postSpy).toHaveBeenLastCalledWith(
        `${callName}/`,
        { test_input: testNumberInput },
        {
          params: {
            test_filter: testFilter,
          },
        }
      )
      expect(result).toEqual({ testData: mockResult.test_data })
    })

    it("calls with right parameters and filters: input object output primitive", async () => {
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
          filtersShape: {
            testFilter: z.string(),
          },
        },
        name: callName,
        cb: async ({ client, utils, input, parsedFilters }) => {
          const res = await client.post(`${callName}/`, utils.toApi(input), { params: parsedFilters })
          return utils.fromApi(res.data)
        },
      })
      const testNumberInput = faker.datatype.number()
      const testFilter = faker.datatype.string()
      //act
      const result = await testStandAloneCall({ input: { testInput: testNumberInput }, filters: { testFilter } })
      //assert
      expect(postSpy).toHaveBeenLastCalledWith(
        `${callName}/`,
        { test_input: testNumberInput },
        { params: { test_filter: testFilter } }
      )
      expect(result).toEqual(mockResult)
    })

    it("calls with right parameters and filters: input void output object", async () => {
      //arrange
      const postSpy = vi.spyOn(mockedAxios, "post")
      const mockResult = {
        test_data: "testData",
      }
      mockedAxios.post.mockResolvedValue({
        data: mockResult,
      })
      const callName = "testStandAloneCall"
      const testStandAloneCall = createCustomServiceCall.standAlone({
        client: mockedAxios,
        models: {
          outputShape: {
            testData: z.string(),
          },
          filtersShape: {
            testFilter: z.string(),
          },
        },
        name: callName,
        cb: async ({ client, utils, parsedFilters }) => {
          const res = await client.post(`${callName}/`, undefined, { params: parsedFilters })
          return utils.fromApi(res.data)
        },
      })
      const testFilter = faker.datatype.string(5)
      //act
      const result = await testStandAloneCall({ filters: { testFilter: testFilter } })
      //assert
      expect(postSpy).toHaveBeenLastCalledWith(`${callName}/`, undefined, {
        params: {
          test_filter: testFilter,
        },
      })
      expect(result).toEqual({ testData: mockResult.test_data })
      mockedAxios.post.mockClear()
    })

    it("calls with right parameters and filters: input void output primitive", async () => {
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
          filtersShape: {
            testFilter: z.string(),
          },
        },
        name: callName,
        cb: async ({ client, parsedFilters }) => {
          const res = await client.post(`${callName}/`, undefined, { params: parsedFilters })
          return res.data
        },
      })
      const testFilter = faker.datatype.string()
      //act
      const result = await testStandAloneCall({ filters: { testFilter: testFilter } })
      //assert
      expect(postSpy).toHaveBeenLastCalledWith(`${callName}/`, undefined, { params: { test_filter: testFilter } })
      expect(result).toEqual(mockResult)
    })

    it("calls with right parameters and filters: input primitive output object", async () => {
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
          filtersShape: {
            testFilter: z.string(),
          },
        },
        name: callName,
        cb: async ({ client, utils, input, parsedFilters }) => {
          const res = await client.post(`${callName}/${input}/`, undefined, { params: parsedFilters })
          return utils.fromApi(res.data)
        },
      })
      const testStrInput = faker.name.firstName()
      const testFilter = faker.datatype.string(5)
      //act
      const result = await testStandAloneCall({ input: testStrInput, filters: { testFilter } })
      //assert
      expect(postSpy).toHaveBeenLastCalledWith(`${callName}/${testStrInput}/`, undefined, {
        params: {
          test_filter: testFilter,
        },
      })
      expect(result).toEqual({ testData: mockResult.test_data })
    })

    it("calls with right parameters and filters: input primitive output primitive", async () => {
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
          filtersShape: { testFilter: z.string() },
        },
        name: callName,
        cb: async ({ client, input, utils, parsedFilters }) => {
          const res = await client.post(`${callName}/${input}/`, undefined, { params: parsedFilters })
          //
          return utils.fromApi(res.data)
        },
      })
      const testStrInput = faker.name.firstName()
      const testFilter = faker.datatype.string()
      //act
      const result = await testStandAloneCall({ input: testStrInput, filters: { testFilter } })
      //assert
      expect(postSpy).toHaveBeenLastCalledWith(`${callName}/${testStrInput}/`, undefined, {
        params: { test_filter: testFilter },
      })
      expect(result).toEqual(mockResult)
    })
  })
})
