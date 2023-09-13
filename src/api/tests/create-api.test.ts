/* eslint-disable @typescript-eslint/no-unused-vars */
import { faker } from "@faker-js/faker"
import { SnakeCasedPropertiesDeep } from "@thinknimble/tn-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import {
  GetInferredFromRaw,
  GetInferredFromRawWithBrand,
  InferShapeOrZod,
  Pagination,
  objectToCamelCaseArr,
  objectToSnakeCaseArr,
  readonly,
} from "../../utils"
import { createApi } from "../create-api"
import { createCustomServiceCall } from "../create-custom-call"
import { CustomServiceCallsRecord, ServiceCallFn } from "../types"
import {
  createZodShape,
  entityZodShape,
  entityZodShapeWithIdNumber,
  listResponse,
  mockEntity1,
  mockEntity1Snaked,
  mockEntity2,
  mockedAxios,
} from "./mocks"

describe("createApi", async () => {
  const testBaseUri = "users"
  const testApi = createApi({
    client: mockedAxios,
    baseUri: testBaseUri,
    models: {
      create: createZodShape,
      entity: entityZodShape,
      extraFilters: {
        anExtraFilter: z.string(),
      },
    },
  })

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
    it("only exposes retrieve, list, update if `entity` is passed, no custom calls", () => {
      //@ts-expect-error don't mind this it is hard for TS to determine which overload it should check, on the tests below it is picking up the correct one!
      type ExpectedReturn = ReturnType<typeof createApi<{ entity: typeof entityZodShape }>>
      type tests = [
        ExpectedReturn["list"],
        ExpectedReturn["retrieve"],
        ExpectedReturn["update"],
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
      expect(testApiOnlyEntity).toHaveProperty("create")
      expect(testApiOnlyEntity).toHaveProperty("list")
      expect(testApiOnlyEntity).toHaveProperty("retrieve")
      expect(testApiOnlyEntity).toHaveProperty("update")
      expect(testApiOnlyEntity).not.toHaveProperty("csc")
      expect(testApiOnlyEntity).not.toHaveProperty("customServiceCalls")
    })
    it("does not allow to pass only create or only extra filters model", () => {
      //@ts-expect-error should not allow to create this api with just the "create" model (create needs entity)
      type ExpectedReturn = ReturnType<typeof createApi<{ create: typeof entityZodShape }>>
      expect(() => {
        createApi({
          baseUri: "",
          client: mockedAxios,
          // @ts-expect-error this should error on TS but checking runtime throw here!
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

    const createInput: GetInferredFromRawWithBrand<typeof createZodShape> = {
      age: 19,
      lastName: "Doe",
      firstName: "Jane",
    }
    const randomId: string = faker.datatype.uuid()
    const createResponse: SnakeCasedPropertiesDeep<GetInferredFromRaw<typeof entityZodShape>> = {
      age: createInput.age,
      last_name: createInput.lastName,
      first_name: createInput.firstName,
      full_name: `${createInput.lastName} ${createInput.lastName}`,
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
      const testApi = createApi({
        client: mockedAxios,
        baseUri: "create-camel-case",
        models: {
          create: {
            //nonsensical but just want to test that the input could be anything and that's what is going to be used to call the api
            testInput: z.string(),
          },
          entity: entityZodShape,
          extraFilters: {
            anExtraFilter: z.string(),
          },
        },
      })
      //act
      const response = await testApi.create({
        testInput: "test",
      })
      //assert
      expect(response).toEqual(objectToCamelCaseArr(createResponse))
    })
    it("uses entity response if no create shape was passed", async () => {
      const baseUri = "create"
      const testApi = createApi({
        client: mockedAxios,
        baseUri,
        models: {
          entity: entityZodShape,
        },
      })
      //arrange
      mockedAxios.post.mockResolvedValueOnce({ data: mockEntity1Snaked })
      const { id, fullName, ...input } = mockEntity1
      //act
      const response = await testApi.create(input)
      //assert
      expect(response).toEqual(mockEntity1)
    })
    it("It properly works with create model and readonly id", async () => {
      //arrange
      const baseShape = {
        id: readonly(z.string().uuid()),
        datetimeCreated: readonly(z.string().datetime().optional()),
        lastEdited: readonly(z.string().datetime().optional()),
      }
      const entityShape = {
        ...baseShape,
        email: z.string().email(),
        firstName: z.string(),
        lastName: z.string(),
        token: readonly(z.string().nullable().optional()),
      }
      const createShape = {
        ...entityShape,
        password: z.string(),
      }
      const testApi = createApi({
        client: mockedAxios,
        baseUri: testBaseUri,
        models: {
          entity: entityShape,
          create: createShape,
        },
      })
      const postSpy = vi.spyOn(mockedAxios, "post")
      const testCreate = {
        email: faker.internet.email(),
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        password: faker.internet.password(),
      }
      const expected = {
        data: {
          id: randomId,
          datetime_created: new Date().toISOString(),
          last_edited: new Date().toISOString(),
          email: testCreate.email,
          first_name: testCreate.firstName,
          last_name: testCreate.lastName,
          token: faker.datatype.uuid(),
        },
      }
      mockedAxios.post.mockResolvedValueOnce(expected)
      const res = await testApi.create({
        ...testCreate,
      })
      expect(res).toStrictEqual(objectToCamelCaseArr(expected.data))
    })
    it("Works with nested fields", async () => {
      //arrange
      const postSpy = vi.spyOn(mockedAxios, "post")
      const arrayElementShape = {
        id: z.string().uuid(),
        textElement: z.string(),
      }
      const baseModelShape = {
        id: z.string().uuid(),
        datetimeCreated: readonly(z.string().datetime().optional()),
        lastEdited: readonly(z.string().datetime().optional()),
      }
      const subEntityShape = {
        firstName: z.string(),
        lastName: z.string(),
      }
      const nestedObjectShape = {
        ...baseModelShape,
        ...subEntityShape,
      }
      const entityShape = {
        ...baseModelShape,
        nestedObject: z.object(nestedObjectShape),
      }
      const createShape = {
        nestedObject: z.object(subEntityShape),
        nestedArray: z.array(z.object(arrayElementShape)).optional().nullable(),
      }
      const testApi = createApi({
        client: mockedAxios,
        baseUri: testBaseUri,
        models: {
          entity: entityShape,
          create: createShape,
        },
      })
      const testCreate = {
        nestedObject: {
          firstName: faker.datatype.string(),
          lastName: faker.datatype.string(),
        },
        nestedArray: [{ id: faker.datatype.uuid(), textElement: faker.datatype.string() }],
      }
      const expected = {
        data: {
          id: faker.datatype.uuid(),
          datetime_created: faker.datatype.datetime().toISOString(),
          last_edited: faker.datatype.datetime().toISOString(),
          nested_object: {
            id: faker.datatype.uuid(),
            datetime_created: faker.datatype.datetime().toISOString(),
            last_edited: faker.datatype.datetime().toISOString(),
            first_name: faker.datatype.string(),
            last_name: faker.datatype.string(),
          },
        },
      }
      mockedAxios.post.mockResolvedValueOnce(expected)
      // act
      const res = await testApi.create(testCreate)
      // assert
      expect(res).toStrictEqual(objectToCamelCaseArr(expected.data))
    })
  })

  describe("retrieve", () => {
    beforeEach(() => {
      mockedAxios.post.mockReset()
    })

    it("returns camelCased entity", async () => {
      //arrange
      mockedAxios.get.mockResolvedValue({ data: mockEntity1Snaked })
      const getSpy = vi.spyOn(mockedAxios, "get")
      //act
      const response = await testApi.retrieve(mockEntity1Snaked.id)
      //assert
      expect(getSpy).toHaveBeenCalledWith(`${testBaseUri}/${mockEntity1Snaked.id}/`)
      expect(response).toEqual({
        age: mockEntity1Snaked.age,
        firstName: mockEntity1Snaked.first_name,
        lastName: mockEntity1Snaked.last_name,
        fullName: mockEntity1Snaked.full_name,
        id: mockEntity1Snaked.id,
      })
    })
  })

  describe("list", () => {
    beforeEach(() => {
      mockedAxios.get.mockReset()
    })
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
        results: [mockEntity1, mockEntity2],
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
    it("should not obfuscate response fields even if they're not in the model", async () => {
      //arrange
      const extraField = faker.datatype.string()
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          count: 10,
          next: null,
          previous: null,
          results: [
            {
              ...mockEntity1,
              first_name: mockEntity1.firstName,
              last_name: mockEntity1.lastName,
              full_name: mockEntity1.fullName,
              extra_field: extraField,
            },
            {
              ...mockEntity2,
              first_name: mockEntity2.firstName,
              last_name: mockEntity2.lastName,
              full_name: mockEntity2.fullName,
              extra_field: extraField,
            },
          ],
        },
      })
      //act
      const result = await testApi.list()
      //assert
      expect(result.results[0]).toHaveProperty("extraField")
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

  describe("slash ending url", () => {
    it("calls api with slash ending by default", async () => {
      //arrange
      mockedAxios.get.mockResolvedValue({ data: mockEntity1Snaked })
      const getSpy = vi.spyOn(mockedAxios, "get")
      const baseUri = "slashDefault"
      const testApi = createApi({
        baseUri,
        client: mockedAxios,
        models: {
          entity: entityZodShape,
        },
      })
      //act
      await testApi.retrieve(mockEntity1Snaked.id)
      //assert
      expect(getSpy).toHaveBeenCalledWith(`${baseUri}/${mockEntity1Snaked.id}/`)
    })
    it("allows disabling slash ending uris", async () => {
      //arrange
      mockedAxios.get.mockResolvedValue({ data: mockEntity1Snaked })
      const getSpy = vi.spyOn(mockedAxios, "get")
      const baseUri = "disableSlash"
      const testApi = createApi({
        baseUri,
        client: mockedAxios,
        models: {
          entity: entityZodShape,
        },
        disableTrailingSlash: true,
      })
      //act
      await testApi.retrieve(mockEntity1Snaked.id)
      //assert
      expect(getSpy).toHaveBeenCalledWith(`${baseUri}/${mockEntity1Snaked.id}`)
    })
    it("passes these TS tests", () => {
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
    })
  })

  describe("delete", () => {
    it("calls delete with the right id", async () => {
      // arrange
      const deleteSpy = vi.spyOn(mockedAxios, "delete")
      const baseUri = "delete"
      const api = createApi({
        baseUri,
        client: mockedAxios,
        models: {
          entity: entityZodShape,
        },
      })
      const testId = faker.datatype.uuid()
      //act
      await api.remove(testId)
      //assert
      expect(deleteSpy).toHaveBeenCalledWith(`${baseUri}/${testId}/`)
    })
    it("calls delete with number id instead of string", async () => {
      // arrange
      const deleteSpy = vi.spyOn(mockedAxios, "delete")
      const baseUri = "delete"
      const api = createApi({
        baseUri,
        client: mockedAxios,
        models: {
          entity: entityZodShapeWithIdNumber,
        },
      })
      const testId = faker.datatype.number()
      //act
      await api.remove(testId)
      //assert
      expect(deleteSpy).toHaveBeenCalledWith(`${baseUri}/${testId}/`)
    })
  })

  describe("update", () => {
    const baseUri = "update"
    const api = createApi({
      baseUri,
      client: mockedAxios,
      models: {
        entity: entityZodShape,
      },
    })
    it("calls update with partial and patch: default", async () => {
      //arrange
      mockedAxios.patch.mockResolvedValueOnce({
        data: mockEntity1Snaked,
      })
      const patchSpy = vi.spyOn(mockedAxios, "patch")
      const { id, ...body } = {
        id: mockEntity1.id,
        age: mockEntity1.age,
      }
      //act
      await api.update({
        id,
        ...body,
      })
      expect(patchSpy).toHaveBeenCalledWith(`${baseUri}/${id}/`, objectToSnakeCaseArr(body))
    })
    it("calls update with partial and put", async () => {
      //arrange
      const putSpy = vi.spyOn(mockedAxios, "put")
      const { id, ...body } = {
        id: mockEntity1.id,
        age: mockEntity1.age,
      }
      //act
      await api.update.replace.asPartial({
        id,
        ...body,
      })
      expect(putSpy).toHaveBeenCalledWith(`${baseUri}/${id}/`, objectToSnakeCaseArr(body))
    })
    it("calls update with total and put", async () => {
      //arrange
      const putSpy = vi.spyOn(mockedAxios, "put")
      // fullName is readonly so won't be sent as parameter!
      const { id, fullName, ...body } = mockEntity1
      //act
      await api.update.replace(mockEntity1)
      expect(putSpy).toHaveBeenCalledWith(`${baseUri}/${id}/`, objectToSnakeCaseArr(body))
    })
  })
})

describe("TS Tests", () => {
  it("CustomServiceCallRecordTest ts tests", () => {
    type tInputShape = { testInput: z.ZodString }
    type tOutputShape = { testOutput: z.ZodNumber }
    type tFiltersShape = { testFilter: z.ZodString }
    type tFiltersShapeVoid = z.ZodVoid
    type myCustomServiceCallRecord = {
      customService: {
        inputShape: tInputShape
        outputShape: tOutputShape
        filtersShape: tFiltersShape
        callback: (params: any) => Promise<GetInferredFromRawWithBrand<tOutputShape>>
      }
      noFiltersService: {
        inputShape: tInputShape
        outputShape: tOutputShape
        filtersShape: tFiltersShapeVoid
        callback: (params: any) => Promise<GetInferredFromRawWithBrand<tOutputShape>>
      }
      noInputWithFilterService: {
        inputShape: z.ZodVoid
        outputShape: tOutputShape
        filtersShape: tFiltersShape
        callback: (params: any) => Promise<GetInferredFromRawWithBrand<tOutputShape>>
      }
      justCallback: {
        inputShape: z.ZodVoid
        outputShape: z.ZodVoid
        filtersShape: z.ZodVoid
        callback: (params: any) => Promise<void>
      }
    }
    type result = CustomServiceCallsRecord<myCustomServiceCallRecord>
    type whatIsThis = result["noInputWithFilterService"]

    type tests = [
      Expect<
        Equals<
          result["customService"],
          (
            params: {
              input: InferShapeOrZod<tInputShape>
            } & {
              filters?: Partial<InferShapeOrZod<tFiltersShape>> | undefined
            }
          ) => Promise<InferShapeOrZod<tOutputShape>>
        >
      >,
      Expect<
        Equals<
          result["noFiltersService"],
          (input: InferShapeOrZod<tInputShape>) => Promise<InferShapeOrZod<tOutputShape>>
        >
      >,
      Expect<
        Equals<
          result["noInputWithFilterService"],
          (
            ...args: [{ filters?: Partial<GetInferredFromRawWithBrand<tFiltersShape>> }] | []
          ) => Promise<InferShapeOrZod<tOutputShape>>
        >
      >,
      Expect<Equals<result["justCallback"], () => Promise<void>>>
    ]
  })

  it("ServiceCallFn ts tests", () => {
    // Test suite for ServiceCallFn
    type inputShapeMock = { testInput: z.ZodString }
    type outputShapeMock = { testOutput: z.ZodNumber }
    type filtersShapeMock = { testFilter: z.ZodString }
    type tests = [
      Expect<
        Equals<
          ServiceCallFn<inputShapeMock, outputShapeMock>,
          (args: InferShapeOrZod<inputShapeMock>) => Promise<InferShapeOrZod<outputShapeMock>>
        >
      >,
      Expect<Equals<ServiceCallFn<inputShapeMock>, (args: InferShapeOrZod<inputShapeMock>) => Promise<void>>>,
      Expect<Equals<ServiceCallFn<z.ZodVoid, outputShapeMock>, () => Promise<InferShapeOrZod<outputShapeMock>>>>,
      Expect<Equals<ServiceCallFn, () => Promise<void>>>,
      Expect<
        Equals<
          ServiceCallFn<inputShapeMock, outputShapeMock, filtersShapeMock>,
          (
            args: {
              input: InferShapeOrZod<inputShapeMock>
            } & { filters?: Partial<InferShapeOrZod<filtersShapeMock>> }
          ) => Promise<InferShapeOrZod<outputShapeMock>>
        >
      >
    ]
  })

  it("infers the id with the type declared in the entity shape", () => {
    const entityShapeStrId = {
      id: readonly(z.string()),
      name: z.string(),
    }
    const entityShapeNumId = {
      id: readonly(z.number()),
      name: z.string(),
    }
    const apiStrId = createApi({
      baseUri: "inferId",
      client: mockedAxios,
      models: {
        entity: entityShapeStrId,
      },
    })
    const apiNumId = createApi({
      baseUri: "inferId",
      client: mockedAxios,
      models: {
        entity: entityShapeNumId,
      },
    })
    type apiStrId = typeof apiStrId
    type apiNumId = typeof apiNumId
    type tests = [
      Expect<Equals<Parameters<apiStrId["remove"]>[0], string>>,
      Expect<Equals<Parameters<apiNumId["remove"]>[0], number>>,
      Expect<Equals<Parameters<apiStrId["retrieve"]>[0], string>>,
      Expect<Equals<Parameters<apiNumId["retrieve"]>[0], number>>
    ]
  })

  it("yields right types when using readonly fields", () => {
    const entityShape = {
      id: readonly(z.string()),
      name: z.string(),
      lastName: z.string(),
      fullName: readonly(z.string()),
    }
    const api = createApi({
      baseUri: "readonly",
      client: mockedAxios,
      models: {
        entity: entityShape,
        //@ts-expect-error keys that are not expected should be rejected by typescript
        shenaninganCheck: {
          invalidKey: z.string(),
        },
      },
    })
    type api = typeof api
    type unwrappedReadonlyBrands = GetInferredFromRaw<typeof entityShape>
    type tests = [
      Expect<Equals<Awaited<ReturnType<api["retrieve"]>>, unwrappedReadonlyBrands>>,
      Expect<Equals<Awaited<ReturnType<api["create"]>>, unwrappedReadonlyBrands>>,
      Expect<Equals<Awaited<ReturnType<api["update"]>>, unwrappedReadonlyBrands>>,
      Expect<Equals<Awaited<ReturnType<api["update"]["replace"]>>, unwrappedReadonlyBrands>>,
      Expect<Equals<Awaited<ReturnType<api["update"]["replace"]["asPartial"]>>, unwrappedReadonlyBrands>>
    ]
  })
  it("should not show up any built-in method if there is no `models` passed", () => {
    const entityShape = {
      id: readonly(z.string()),
      name: z.string(),
      lastName: z.string(),
      fullName: readonly(z.string()),
    }
    const api = createApi({
      baseUri: "readonly",
      client: mockedAxios,
    })
    type api = typeof api

    //@ts-expect-error should not expose any of these methods
    const { create, list, retrieve, remove, update } = api
  })
  describe("Test", () => {
    it("TS - errors on createApi for entity", () => {
      //ts assert
      createApi({
        baseUri: "something",
        client: mockedAxios,
        //@ts-expect-error Call out on entity not being passed to models
        models: {},
      })
      createApi({
        baseUri: "something",
        client: mockedAxios,
        //@ts-expect-error Call out on entity not being properly formatted - should include id
        models: {
          entity: { nonIdField: z.string() },
        },
      })
    })
  })
})
