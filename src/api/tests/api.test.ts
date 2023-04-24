/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { faker } from "@faker-js/faker"
import { SnakeCasedPropertiesDeep } from "@thinknimble/tn-utils"
import axios from "axios"
import { beforeEach, describe, expect, it, Mocked, vi } from "vitest"
import { z } from "zod"
import { createApi } from "../create-api"
import { Pagination } from "../../utils"
import { GetInferredFromRaw, Prettify } from "../../utils"
import { getPaginatedSnakeCasedZod } from "../../utils/pagination"
import { createCustomServiceCall } from "../create-custom-call"
import { createPaginatedServiceCall } from "../create-paginated-call"

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

//TS-test slash ending urls
createCustomServiceCall(async ({ client, slashEndingBaseUri }) => {
  type TClient = typeof client
  type UriParameter = Parameters<TClient["get"]>[0]
  type tests = [
    Expect<Equals<UriParameter, typeof slashEndingBaseUri>>,
    Expect<Extends<UriParameter, `slashEndingUri/`>>,
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
    }
  )

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
})
