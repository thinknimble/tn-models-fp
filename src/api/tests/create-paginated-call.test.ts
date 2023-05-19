/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { GetInferredFromRaw, Pagination } from "../../utils"
import { createApi } from "../create-api"
import { createPaginatedServiceCall } from "../create-paginated-call"
import { entityZodShape, listResponse, mockEntity1, mockEntity2, mockedAxios } from "./mocks"

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
    const paginatedServiceCall = createPaginatedServiceCall({ outputShape, inputShape }, { httpMethod: "post" })

    mockedAxios.post.mockResolvedValueOnce({
      data: { count: 1, next: null, previous: null, results: [{ my_output: "myOutput" }] },
    })
    const baseUri = "passNoUri"
    const api = createApi({ baseUri, client: mockedAxios }, { paginatedServiceCall })
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
    const baseUri = "uriParamEmpty"
    const api = createApi({ baseUri, client: mockedAxios }, { paginatedServiceCall })
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
      return createPaginatedServiceCall(
        {
          outputShape: entityZodShape,
        },
        {
          uri: "testSimplePaginatedCall",
        }
      )
    })()
    const baseUri = "pagination"
    const api = createApi({ baseUri, client: mockedAxios }, { testSimplePaginatedCall })

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
    const baseUri = "callsApiWithPostMethod"
    const api = createApi(
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
    const body: Omit<GetInferredFromRaw<(typeof testPostPaginatedServiceCall)["inputShape"]>, "pagination"> = {
      dObj: {
        dObj1: 1,
      },
      eString: "eString",
    }
    const baseUri = "callsApiWithPostAndHasRightCasing"
    const api = createApi(
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
      return createPaginatedServiceCall(
        {
          outputShape: entityZodShape,
        },
        { uri: "testPagePaginatedServiceCall" }
      )
    })()
    const baseUri = "callsApiWithPaginationParams"
    const api = createApi(
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
    const baseUri = "callsApiWithRightFilters"
    const api = createApi(
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
})