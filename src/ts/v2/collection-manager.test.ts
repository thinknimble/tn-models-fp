import { faker } from "@faker-js/faker"
import { objectToCamelCase, objectToSnakeCase } from "@thinknimble/tn-utils"
import axios from "axios"
import { beforeEach, describe, expect, it, Mocked, vi } from "vitest"
import { z } from "zod"
import Pagination from "../pagination"
import { createApi } from "./api"
import { createCollectionManager } from "./collection-manager"
import { getPaginatedSnakeCasedZod } from "./utils"

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

const paginatedZod = getPaginatedSnakeCasedZod(entityZodShape)

type PaginatedEntity = z.infer<typeof paginatedZod>

const createFakeUser = () => ({
  age: faker.datatype.number({ min: 16, max: 60 }),
  first_name: faker.name.firstName(),
  last_name: faker.name.lastName(),
  id: faker.datatype.uuid(),
})

const mockedPaginatedEntitySnakeCased: PaginatedEntity = {
  count: 50,
  next: "https://mock.list/?page=2",
  previous: null,
  results: Array.from({ length: 5 }).map<PaginatedEntity["results"][0]>(createFakeUser),
}
const mockedPaginatedEntity = {
  ...mockedPaginatedEntitySnakeCased,
  results: mockedPaginatedEntitySnakeCased.results.map((r) => objectToCamelCase(r)!),
}

describe("collection manager v2 tests", () => {
  const testEndpoint = "users"
  const testApi = createApi({
    client: mockedAxios,
    endpoint: testEndpoint,
    models: {
      create: createZodShape,
      entity: entityZodShape,
      extraFilters: {
        anExtraFilter: z.string(),
      },
    },
  })

  const feedFilters = {
    anExtraFilter: "my extra filter",
  }
  const feedFiltersSnakeCased = objectToSnakeCase(feedFilters)!
  const feedPagination = new Pagination({
    next: "https://mock.list/?page=6",
    page: 5,
    previous: "https://mock.list/?page=4",
    size: 25,
    totalCount: 100,
  })

  const resetCollectionManager = () => {
    return createCollectionManager({
      fetchList: testApi.list,
      list: [
        {
          age: faker.datatype.number({ min: 16, max: 60 }),
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
          id: faker.datatype.uuid(),
        },
      ],
      pagination: feedPagination,
      filters: feedFilters,
    })
  }

  let collectionManager: ReturnType<typeof resetCollectionManager>

  beforeEach(() => {
    mockedAxios.get.mockReset()
    // start each test with a fresh collection manager
    collectionManager = resetCollectionManager()
  })

  describe("update", () => {
    it("appends new data if passing append true", () => {
      //arrange
      const oldListLength = collectionManager.list.length
      const currentList = collectionManager.list
      //act
      collectionManager.update(mockedPaginatedEntity, true)
      //assert
      expect(collectionManager.list.length).not.toEqual(oldListLength)
      expect(collectionManager.list.length).toEqual(oldListLength + mockedPaginatedEntity.results.length)
      expect(collectionManager.list).toEqual([...currentList, ...mockedPaginatedEntity.results])
    })
    it("replaces list with new data if omitting append param", () => {
      //act
      collectionManager.update(mockedPaginatedEntity)
      //assert
      expect(collectionManager.list).toEqual(mockedPaginatedEntity.results)
    })
    it("properly modifies pagination object with new values of pagination results", () => {
      //act
      collectionManager.update(mockedPaginatedEntity)
      //assert
      expect(collectionManager.pagination.next).toEqual(mockedPaginatedEntity.next)
      expect(collectionManager.pagination.totalCount).toEqual(mockedPaginatedEntity.count)
      expect(collectionManager.pagination.previous).toEqual(mockedPaginatedEntity.previous)
    })
  })

  describe("refresh", () => {
    it("calls api with filters and pagination", async () => {
      //arrange
      const getSpy = vi.spyOn(mockedAxios, "get")
      mockedAxios.get.mockResolvedValueOnce({ data: mockedPaginatedEntitySnakeCased })
      //act
      await collectionManager.refresh()
      //assert
      expect(getSpy).toHaveBeenCalledWith(testEndpoint, {
        params: {
          ...feedFiltersSnakeCased,
          page: feedPagination.page.toString(),
          page_size: feedPagination.size.toString(),
        },
      })
    })
    it("sets refreshing true and false during fetch", async () => {
      //arrange
      mockedAxios.get.mockResolvedValueOnce({ data: mockedPaginatedEntitySnakeCased })
      //act
      const promise = collectionManager.refresh()
      expect(collectionManager.refreshing).toEqual(true)
      await promise
      expect(collectionManager.refreshing).toEqual(false)
    })
  })

  describe("pagination", () => {
    it("goes to next page and refreshes (list changes)", async () => {
      //arrange
      const previousPage = feedPagination.page
      const previousList = collectionManager.list
      mockedAxios.get.mockResolvedValueOnce({ data: mockedPaginatedEntitySnakeCased })
      //act
      await collectionManager.nextPage()
      //assert
      expect(collectionManager.pagination.page).toEqual(previousPage + 1)
      expect(collectionManager.list).not.toEqual(previousList)
      // both nextPage and prevPage do a refresh so lists are completely replaced with whatever the return from api is
      expect(collectionManager.list).toEqual(mockedPaginatedEntity.results)
    })
    it("goes to previous page and refreshes (list changes)", async () => {
      //arrange
      const previousPage = feedPagination.page
      const previousList = collectionManager.list
      mockedAxios.get.mockResolvedValueOnce({ data: mockedPaginatedEntitySnakeCased })
      //act
      await collectionManager.prevPage()
      //assert
      expect(collectionManager.pagination.page).toEqual(previousPage - 1)
      expect(collectionManager.list).not.toEqual(previousList)
      expect(collectionManager.list).toEqual(mockedPaginatedEntity.results)
    })
    it("adds next page, calls api and appends new data to list", async () => {
      //arrange
      const currentList = collectionManager.list
      mockedAxios.get.mockResolvedValueOnce({ data: mockedPaginatedEntitySnakeCased })
      //act
      const promise = collectionManager.addNextPage()
      //assert
      expect(collectionManager.loadingNextPage).toEqual(true)
      await promise
      expect(collectionManager.loadingNextPage).toEqual(false)
      expect(collectionManager.pagination.page).toEqual(feedPagination.page + 1)
      expect(collectionManager.list).toEqual([...currentList, ...mockedPaginatedEntity.results])
    })
  })
})
