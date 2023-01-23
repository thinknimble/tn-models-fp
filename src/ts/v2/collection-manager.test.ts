import { describe, it, vi, expect, Mocked, beforeEach } from "vitest"
import axios from "axios"
import { z } from "zod"
import { createApi, getPaginatedSnakeCasedZod, GetZodInferredTypeFromRaw } from "./api"
import { createCollectionManager } from "./collection-manager"
import { getPaginatedZod } from "./pagination"
import { faker } from "@faker-js/faker"
import { objectToCamelCase, objectToSnakeCase } from "@thinknimble/tn-utils"
import Pagination from "../pagination"

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
type PaginatedEntityitem = PaginatedEntity["results"]

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
      update: createZodShape,
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
      entityZodShape,
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
      //assess
      collectionManager.update(mockedPaginatedEntity, true)
      //assert
      expect(collectionManager.list.length).not.toEqual(oldListLength)
      expect(collectionManager.list.length).toEqual(oldListLength + mockedPaginatedEntity.results.length)
      expect(collectionManager.list).toEqual([...currentList, ...mockedPaginatedEntity.results])
    })
    it("replaces list with new data if omitting append param", () => {
      //assess
      collectionManager.update(mockedPaginatedEntity)
      //assert
      expect(collectionManager.list).toEqual(mockedPaginatedEntity.results)
    })
    it("properly modifies pagination object with new values of pagination results", () => {
      //assess
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
      //assess
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
      //assess
      const promise = collectionManager.refresh()
      expect(collectionManager.refreshing).toEqual(true)
      await promise
      expect(collectionManager.refreshing).toEqual(false)
    })
  })

  describe("pagination", () => {
    it("goes to next page", () => {
      //TODO:
    })
    it("goes to previous page", () => {
      //TODO:
    })
    it("adds next page", () => {
      //TODO:
    })
  })
})
