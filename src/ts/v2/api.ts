import {
  CamelCasedPropertiesDeep,
  objectToCamelCase,
  objectToSnakeCase,
  SnakeCase,
  toSnakeCase,
} from "@thinknimble/tn-utils"
import { AxiosInstance } from "axios"
import { z, ZodRawShape } from "zod"
import { getPaginatedZod } from "./pagination"
import { parseResponse } from "./utils"

const paginationFiltersZod = z
  .object({
    page: z.number(),
    pageSize: z.number(),
  })
  .partial()
  .strict()
  .optional()

export type PaginationFilters = z.infer<typeof paginationFiltersZod>

const filtersZod = z
  .object({
    //TODO: add the ones that are always available on TN backend's for listing entities
    ordering: z.string(),
  })
  .partial()
  //prevent over passing values
  .strict()
  .optional()

const uuidZod = z.string().uuid()

export type CustomServiceCall = (inputs: any) => Promise<unknown>

type ExtractCamelCaseValue<T extends object> = T extends undefined
  ? never
  : {
      [TKey in keyof T]: T[TKey] extends () => Promise<infer TResult>
        ? () => Promise<CamelCasedPropertiesDeep<TResult>>
        : T[TKey] extends (input: infer TInput) => Promise<infer TResult>
        ? (input: TInput) => Promise<CamelCasedPropertiesDeep<TResult>>
        : never
    }

type ZodRawShapeSnakeCased<T extends ZodRawShape> = {
  [TKey in keyof T as SnakeCase<TKey>]: T[TKey]
}

const getSnakeCasedZodRawShape = <T extends ZodRawShape>(zodShape: T) => {
  const unknownSnakeCasedZod: unknown = Object.fromEntries(
    Object.entries(zodShape).map(([k, v]) => {
      return [toSnakeCase(k), v]
    })
  )
  return unknownSnakeCasedZod as ZodRawShapeSnakeCased<T>
}
const getPaginatedSnakeCasedZod = <T extends ZodRawShape>(zodShape: T) => {
  return getPaginatedZod(getSnakeCasedZodRawShape(zodShape))
}

export type GetZodInferredTypeFromRaw<T extends ZodRawShape> = z.infer<ReturnType<typeof z.object<T>>>

type BareApiService<
  TEntity extends ZodRawShape,
  TCreate extends ZodRawShape,
  TExtraFilters extends ZodRawShape = never
> = {
  client: AxiosInstance
  retrieve(id: string): Promise<GetZodInferredTypeFromRaw<TEntity>>
  create(inputs: GetZodInferredTypeFromRaw<TCreate>): Promise<GetZodInferredTypeFromRaw<TEntity>>
  list(params?: {
    filters?: GetZodInferredTypeFromRaw<TExtraFilters> & z.infer<typeof filtersZod>
    pagination?: z.infer<typeof paginationFiltersZod>
  }): Promise<z.infer<ReturnType<typeof getPaginatedZod<TEntity>>>>
}
type ApiService<
  TEntity extends ZodRawShape,
  TCreate extends ZodRawShape,
  //extending from record makes it so that if you try to access anything it would not error, we want to actually error if there is no key in TCustomEndpoints that does not belong to it
  TCustomEndpoints extends object,
  TExtraFilters extends ZodRawShape = never
> = BareApiService<TEntity, TCreate, TExtraFilters> & {
  customEndpoints: ExtractCamelCaseValue<TCustomEndpoints>
}

type ApiBaseParams<
  TApiEntity extends ZodRawShape,
  TApiCreate extends ZodRawShape,
  TApiUpdate extends ZodRawShape,
  TExtraFilters extends ZodRawShape = never
> = {
  /**
   * Zod raw shapes to use as models. All these should be the frontend camelCased version
   */
  models: {
    /**
     * Zod raw shape of the equivalent camel-cased version of the entity in backend
     *
     * Example
     * ```ts
     * type BackendModel = {
     *  my_model:string
     * }
     * type TApiEntity = {
     *  myModel: z.string()
     * }
     * ```
     */
    entity: TApiEntity
    /**
     * Zod raw shape of the input for creating an entity
     */
    create: TApiCreate
    //TODO: not being used nor I'm sure whether we need this since it is not included in old api
    /**
     * Zod raw shape of input for updating an entity
     */
    update: TApiUpdate
    /**
     * Zod raw shape of extra filters if any
     */
    extraFilters?: TExtraFilters
  }
  /**
   * The base endpoint for te api to hit. We append this to request's uris for listing, retrieving and creating
   */
  endpoint: string
  /**
   * The axios instance created for the app.
   */
  client: AxiosInstance
}

export function createApi<
  TApiEntity extends ZodRawShape,
  TApiCreate extends ZodRawShape,
  TApiUpdate extends ZodRawShape,
  TCustomEndpoints extends Record<string, CustomServiceCall>,
  TExtraFilters extends ZodRawShape = never
>(
  base: ApiBaseParams<TApiEntity, TApiCreate, TApiUpdate, TExtraFilters>,
  /**
   * Create your own custom endpoints to use with this API. We take care of camel and snake casing on the way in and out.
   * You will need to handle errors and reuse the same client passed in previous parameter as well as append the endpoint.
   */
  customEndpoints: TCustomEndpoints
): ApiService<TApiEntity, TApiCreate, TCustomEndpoints, TExtraFilters>

export function createApi<
  TApiEntity extends ZodRawShape,
  TApiCreate extends ZodRawShape,
  TApiUpdate extends ZodRawShape,
  TExtraFilters extends ZodRawShape = never
>(
  base: ApiBaseParams<TApiEntity, TApiCreate, TApiUpdate, TExtraFilters>
): BareApiService<TApiEntity, TApiCreate, TExtraFilters>

//! doing overloads to improve UX is a bit of a double-edged sword here. We are risking the type safety within this method! We'd still get errors if we don't match the declared input-outputs from overloads so that's something.
export function createApi({ models, client, endpoint }, customEndpoints = undefined) {
  const axiosClient: AxiosInstance = client
  const createCustomServiceCallHandler = (serviceCall: CustomServiceCall) => async (inputs: unknown) => {
    const snaked = typeof inputs !== "object" || !inputs ? inputs : objectToSnakeCase(inputs)
    const result = await serviceCall(snaked)
    if (Array.isArray(result) || typeof result !== "object" || result === null) return result
    return objectToCamelCase(result)
  }

  const modifiedCustomServiceCalls = customEndpoints
    ? Object.fromEntries(
        Object.entries(customEndpoints as Record<string, CustomServiceCall>).map(([k, v]) => [
          k,
          createCustomServiceCallHandler(v),
        ])
      )
    : undefined

  const retrieve = async (id: string) => {
    if (uuidZod.safeParse(id).success) {
      console.warn("The passed id is not a valid UUID, check your input")
    }
    const uri = `${endpoint}/${id}`
    const res = await axiosClient.get(uri)
    const parsed = parseResponse({
      uri,
      data: res.data,
      zod: z.object(getSnakeCasedZodRawShape(models.entity)),
    })
    return objectToCamelCase(parsed)
  }

  const create = async (inputs) => {
    const snaked = objectToSnakeCase(inputs)
    const res = await axiosClient.post(endpoint, snaked)
    const snakedEntityShape = getSnakeCasedZodRawShape(models.entity)
    return objectToCamelCase(
      parseResponse({
        uri: endpoint,
        data: res.data,
        zod: z.object(snakedEntityShape),
      })
    )
  }

  const list = async (params) => {
    const filters = params ? params.filters : undefined
    const pagination = params ? params.pagination : undefined
    // Filters parsing, throws if the fields do not comply with the zod schema
    const allFilters = {
      ...(filters ?? {}),
      ...(pagination ? { page: pagination.page, pageSize: pagination.size } : {}),
    }
    const parsed = models.extraFilters
      ? z.object(models.extraFilters).and(filtersZod).and(paginationFiltersZod).parse(allFilters)
      : filtersZod.and(paginationFiltersZod).parse(allFilters)
    const snaked = parsed ? objectToSnakeCase(parsed) : undefined
    const snakedCleanParsed = snaked
      ? Object.fromEntries(
          Object.entries(snaked).flatMap(([k, v]) => {
            if (typeof v === "number") return [[k, v.toString()]]
            if (!v) return []
            return [[k, v]]
          })
        )
      : undefined
    const apiFilters = snakedCleanParsed ? new URLSearchParams(snakedCleanParsed) : undefined

    const paginatedZod = getPaginatedSnakeCasedZod(models.entity)
    //TODO: check whether this needs the slash or we just append the params
    const res = await axiosClient.get(`${endpoint}${apiFilters ? "/?" + apiFilters.toString() : "/"}`)
    const rawResponse = paginatedZod.parse(res)
    return { ...rawResponse, results: rawResponse.results.map((r) => objectToCamelCase(r)) }
  }

  const baseReturn = { client, retrieve, create, list }

  if (!modifiedCustomServiceCalls) return baseReturn

  return {
    ...baseReturn,
    customEndpoints: modifiedCustomServiceCalls,
  }
}
