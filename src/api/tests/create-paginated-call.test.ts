import { faker } from "@faker-js/faker"
import { describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { GetInferredFromRawWithBrand, Pagination, readonly } from "../../utils"
import { entityZodShape, listResponse, mockEntity1, mockEntity2, mockedAxios } from "./mocks"
import { createPaginatedServiceCallV2 } from "../v2"
import { createApiV2 } from "../v2"

describe("createPaginatedServiceCall", () => {
  it("allows not passing a uri and calls api with the right uri", async () => {
    //arrange
    const postSpy = vi.spyOn(mockedAxios, "post")
    const inputShape = {
      myInput: z.string(),
    }
    const outputShape = {
      myOutput: z.string(),
    }
    const paginatedServiceCall = createPaginatedServiceCallV2({ outputShape, inputShape }, { httpMethod: "post" })

    mockedAxios.post.mockResolvedValueOnce({
      data: { count: 1, next: null, previous: null, results: [{ my_output: "myOutput" }] },
    })
    const baseUri = "passNoUri"
    const api = createApiV2(
      { baseUri, client: mockedAxios },
      {
        paginatedServiceCall,
      }
    )
    const pagination = new Pagination({ page: 1 })
    const input = { myInput: "myInput" }
    //act
    await api.csc.paginatedServiceCall({ ...input, pagination })
    //assert
    expect(postSpy).toHaveBeenCalledWith(
      `${baseUri}/`,
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
    const paginatedServiceCall = createPaginatedServiceCallV2(
      {
        outputShape: {
          myOutput: z.string(),
        },
        inputShape: {
          myInput: z.string(),
        },
      },
      {
        httpMethod: "post",
      }
    )
    mockedAxios.post.mockResolvedValueOnce({
      data: { count: 1, next: null, previous: null, results: [{ my_output: "myOutput" }] },
    })
    const baseUri = "uriParamEmpty"
    const api = createApiV2({ baseUri, client: mockedAxios }, { paginatedServiceCall })
    const pagination = new Pagination({ page: 1 })
    const input = { myInput: "myInput" }
    //act
    await api.csc.paginatedServiceCall({ ...input, pagination })
    //assert
    expect(postSpy).toHaveBeenCalledWith(
      `${baseUri}/`,
      { my_input: input.myInput },
      {
        params: {
          page: pagination.page.toString(),
          page_size: pagination.size.toString(),
        },
      }
    )
  })

  describe("testSimplePaginatedCall", () => {
    //arrange
    const testSimplePaginatedCall = (() => {
      return createPaginatedServiceCallV2(
        {
          outputShape: entityZodShape,
        },
        {
          uri: "testSimplePaginatedCall",
        }
      )
    })()
    const baseUri = "pagination"
    const api = createApiV2({ baseUri, client: mockedAxios }, { testSimplePaginatedCall })

    it("calls api with the right uri", async () => {
      //arrange
      const getSpy = vi.spyOn(mockedAxios, "get")
      mockedAxios.get.mockResolvedValueOnce({
        data: listResponse,
      })
      //act
      await api.csc.testSimplePaginatedCall({ pagination: new Pagination({ page: 1 }) })
      expect(getSpy).toHaveBeenCalledWith(`${baseUri}/testSimplePaginatedCall/`, {
        params: {
          page: "1",
          page_size: "25",
        },
      })
    })

    it("Returns with the expected shape", async () => {
      //arrange
      mockedAxios.get.mockResolvedValueOnce({
        data: listResponse,
      })
      //act
      const response = await api.csc.testSimplePaginatedCall({ pagination: new Pagination({ page: 1 }) })
      type testType = Awaited<ReturnType<(typeof api)["csc"]["testSimplePaginatedCall"]>>["results"][0]["firstName"]
      //assert
      expect(response).toBeTruthy()
      expect(response.results).toHaveLength(2)
      expect(response).toEqual({
        ...listResponse,
        results: [mockEntity1, mockEntity2],
      })
    })
  })

  const testPostPaginatedServiceCall = createPaginatedServiceCallV2(
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
    const body: Omit<GetInferredFromRawWithBrand<(typeof testPostPaginatedServiceCall)["inputShape"]>, "pagination"> = {
      dObj: {
        dObj1: 1,
      },
      eString: "eString",
    }
    const baseUri = "callsApiWithPostMethod"
    const api = createApiV2(
      {
        baseUri,
        client: mockedAxios,
      },
      {
        testPostPaginatedServiceCall,
      }
    )
    //act
    await api.csc.testPostPaginatedServiceCall({
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
    const body: Omit<GetInferredFromRawWithBrand<(typeof testPostPaginatedServiceCall)["inputShape"]>, "pagination"> = {
      dObj: {
        dObj1: 1,
      },
      eString: "eString",
    }
    const baseUri = "callsApiWithPostAndHasRightCasing"
    const api = createApiV2(
      {
        baseUri,
        client: mockedAxios,
      },
      {
        testPostPaginatedServiceCall,
      }
    )
    //act
    await api.csc.testPostPaginatedServiceCall({ ...body, pagination: new Pagination({ page: 1 }) })
    //assert
    expect(postSpy).toHaveBeenCalledWith(
      `${baseUri}/testPostPaginatedServiceCall/`,
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
    const testPagePaginatedServiceCall = (() => {
      return createPaginatedServiceCallV2(
        {
          outputShape: entityZodShape,
        },
        { uri: "testPagePaginatedServiceCall" }
      )
    })()
    const baseUri = "callsApiWithPaginationParams"
    const api = createApiV2(
      {
        baseUri,
        client: mockedAxios,
      },
      {
        testPagePaginatedServiceCall,
      }
    )
    //act
    await api.csc.testPagePaginatedServiceCall({ pagination: new Pagination({ page: 10, size: 100 }) })
    //assert
    expect(getSpy).toHaveBeenCalledWith(`${baseUri}/testPagePaginatedServiceCall/`, {
      params: {
        page: "10",
        page_size: "100",
      },
    })
  })

  it("Allows calling it without params (and use defaults)", async () => {
    //act + assert -- should not TS error
    const paginatedServiceCall = createPaginatedServiceCallV2({
      outputShape: {
        testString: z.string(),
      },
    })
  })
  it("calls api with the right filters - no input", async () => {
    //arrange
    const testPaginatedCallWithFilters = createPaginatedServiceCallV2({
      outputShape: entityZodShape,
      filtersShape: {
        myExtraFilter: z.string(),
        anotherExtraFilter: z.number(),
      },
    })
    const baseUri = "callsApiWithRightFilters"
    const api = createApiV2(
      {
        baseUri,
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
    type testing = Parameters<typeof api.csc.testPaginatedCallWithFilters>
    await api.csc.testPaginatedCallWithFilters({
      input: {
        pagination,
      },
      filters: {
        myExtraFilter,
      },
    })
    //assert
    expect(getSpy).toHaveBeenCalledWith(`${baseUri}/`, {
      params: {
        page: pagination.page.toString(),
        page_size: pagination.size.toString(),
        my_extra_filter: myExtraFilter,
      },
    })
  })

  it("Allows passing url params with a builder uri function", async () => {
    // arrange
    const getSpy = vi.spyOn(mockedAxios, "get")
    mockedAxios.get.mockResolvedValueOnce({
      data: listResponse,
    })
    const uriBuilder = (input: { someId: string }) => `myUriWithInput/${input.someId}`
    const callWithUrlParams = createPaginatedServiceCallV2(
      {
        inputShape: {
          urlParams: z.object({
            someId: z.string(),
          }),
        },
        outputShape: entityZodShape,
      },
      {
        uri: uriBuilder,
      }
    )
    const baseUri = "urlParams"
    const api = createApiV2(
      {
        baseUri,
        client: mockedAxios,
      },
      {
        callWithUrlParams,
      }
    )
    const pagination = new Pagination({ page: 1, size: 20 })
    const randomId = faker.datatype.uuid()
    //act
    await api.csc.callWithUrlParams({ pagination, urlParams: { someId: randomId } })
    //assert
    expect(getSpy).toHaveBeenCalledWith(`${baseUri}/${uriBuilder({ someId: randomId })}/`, {
      params: {
        page: pagination.page.toString(),
        page_size: pagination.size.toString(),
      },
    })
  })
  it("Allows passing url params with a builder uri function and filters", async () => {
    // arrange
    const getSpy = vi.spyOn(mockedAxios, "get")
    mockedAxios.get.mockResolvedValueOnce({
      data: listResponse,
    })
    const uriBuilder = (input: { someId: string }) => `myUriWithInput/${input.someId}`
    const myExtraFilter = "test"
    const callWithUrlParamsWithFilter = createPaginatedServiceCallV2(
      {
        inputShape: {
          urlParams: z.object({
            someId: z.string(),
          }),
        },
        outputShape: entityZodShape,
        filtersShape: {
          myExtraFilter: z.string(),
          anotherExtraFilter: z.number(),
        },
      },
      {
        uri: uriBuilder,
      }
    )
    const baseUri = "urlParamsWithFilters"
    const api = createApiV2(
      {
        baseUri,
        client: mockedAxios,
      },
      {
        callWithUrlParamsWithFilter,
      }
    )
    const pagination = new Pagination({ page: 1, size: 20 })
    const randomId = faker.datatype.uuid()
    //act
    await api.csc.callWithUrlParamsWithFilter({
      input: {
        pagination,
        urlParams: { someId: randomId },
      },
      filters: { myExtraFilter },
    })
    //assert
    expect(getSpy).toHaveBeenCalledWith(`${baseUri}/${uriBuilder({ someId: randomId })}/`, {
      params: {
        page: pagination.page.toString(),
        page_size: pagination.size.toString(),
        my_extra_filter: myExtraFilter,
      },
    })
  })
  it("Camel cases nested array in output shape", async () => {
    //arrange
    const testPaginatedCallWithFilters = createPaginatedServiceCallV2({
      outputShape: {
        id: z.string().uuid(),
        nestedArray: z
          .object({
            nestedField: z.string(),
          })
          .array(),
      },
      filtersShape: {
        myExtraFilter: z.string(),
      },
    })
    const baseUri = "camelCaseNestedArray"
    const api = createApiV2(
      {
        baseUri,
        client: mockedAxios,
      },
      {
        testPaginatedCallWithFilters,
      }
    )
    const mockValue = { id: faker.datatype.uuid(), nested_array: [{ nested_field: faker.datatype.string() }] }

    const getSpy = vi.spyOn(mockedAxios, "get")
    mockedAxios.get.mockResolvedValueOnce({
      data: { next: null, previous: null, count: 10, results: [mockValue] },
    })
    const pagination = new Pagination({ page: 1, size: 20 })
    const myExtraFilter = "test"
    //act
    type testing = Parameters<typeof api.csc.testPaginatedCallWithFilters>
    const result = await api.csc.testPaginatedCallWithFilters({
      input: {
        pagination,
      },
      filters: {
        myExtraFilter,
      },
    })
    //assert
    expect(getSpy).toHaveBeenCalledWith(`${baseUri}/`, {
      params: {
        page: pagination.page.toString(),
        page_size: pagination.size.toString(),
        my_extra_filter: myExtraFilter,
      },
    })
    expect(result.results).toEqual([
      { id: mockValue.id, nestedArray: [{ nestedField: mockValue.nested_array[0]?.nested_field }] },
    ])
  })
  it("should not obfuscate extra keys coming from response", async () => {
    //arrange
    const testTrivialPaginatedCall = createPaginatedServiceCallV2({
      outputShape: {
        id: z.string().uuid(),
        //not declaring extraField, it will just come unannounced from the response
      },
    })
    const baseUri = "noObfuscatedFields"
    const api = createApiV2(
      {
        baseUri,
        client: mockedAxios,
      },
      {
        testTrivialPaginatedCall,
      }
    )
    const mockValue = { id: faker.datatype.uuid(), extra_field: faker.datatype.string() }

    mockedAxios.get.mockResolvedValueOnce({
      data: { next: null, previous: null, count: 10, results: [mockValue] },
    })
    //act
    const result = await api.csc.testTrivialPaginatedCall({ pagination: new Pagination() })
    //assert
    expect(result.results).toEqual([{ id: mockValue.id, extraField: mockValue.extra_field }])
  })
  it("Does not return a brand in the response if there's one in the shape", async () => {
    //arrange
    const testTrivialPaginatedCall = createPaginatedServiceCallV2({
      outputShape: {
        id: z.string().uuid(),
        brandedField: readonly(z.string()),
      },
    })
    const baseUri = "checkBrands"
    const api = createApiV2(
      {
        baseUri,
        client: mockedAxios,
      },
      {
        testTrivialPaginatedCall,
      }
    )
    type callbackResult = (typeof api)["customServiceCalls"]["testTrivialPaginatedCall"]
    type result = Awaited<ReturnType<callbackResult>>["results"]
    type tests = [Expect<result extends { brandedField: z.BRAND<"ReadonlyField"> }[] ? false : true>]
  })
})
