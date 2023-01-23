import {
  CamelCasedPropertiesDeep,
  objectToCamelCase,
  objectToSnakeCase,
  SnakeCase,
  SnakeCasedPropertiesDeep,
  toSnakeCase,
} from "@thinknimble/tn-utils"
import { AxiosInstance } from "axios"
import { z, ZodRawShape, ZodTypeAny } from "zod"
import { IPagination } from "../pagination"
import { getPaginatedZod } from "./pagination"
import { parseResponse } from "./utils"

const paginationFiltersZod = z
  .object({
    page: z.number(),
    pageSize: z.number(),
  })
  .partial()
  .optional()

export type PaginationFilters = z.infer<typeof paginationFiltersZod>

const filtersZod = z
  .object({
    //TODO: (help wanted) add filter fields that are always available on TN backend's for listing entities -- Need Python guys here to chime in
    ordering: z.string(),
  })
  .partial()
  .optional()

const uuidZod = z.string().uuid()

type CustomServiceCallOpts<TInput extends ZodRawShape, TOutput extends ZodRawShape> = {
  inputShape: TInput
  outputShape: TOutput
  callback: (params: {
    client: AxiosInstance
    input: GetZodInferredTypeFromRaw<TInput>
    utils: {
      fromApi: (obj: object) => GetZodInferredTypeFromRaw<TOutput>
      toApi: (obj: object) => SnakeCasedPropertiesDeep<GetZodInferredTypeFromRaw<TInput>>
    }
  }) => Promise<GetZodInferredTypeFromRaw<TOutput>>
}

//! Needing this guy has a bitter taste. This is only for type inference sake. I could not type a Record so that it would properly infer the callback's input from the inputShape and the outputShape so this is a type-safe entrypoint to create customServiceCalls.
/**
 * Use this method to get the right type inference when creating a customApiCall
 */
export const createCustomServiceCall = <TInput extends ZodRawShape, TOutput extends ZodRawShape>(
  opts: CustomServiceCallOpts<TInput, TOutput>
) => {
  return opts
}

type CustomServiceCall<TOpts extends object> = TOpts extends Record<string, CustomServiceCallOpts<any, any>>
  ? {
      [TKey in keyof TOpts]: (
        inputs: GetZodInferredTypeFromRaw<TOpts[TKey]["inputShape"]>
      ) => Promise<GetZodInferredTypeFromRaw<TOpts[TKey]["outputShape"]>>
    }
  : never

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
export const getPaginatedSnakeCasedZod = <T extends ZodRawShape>(zodShape: T) => {
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
    pagination?: IPagination
  }): Promise<z.infer<ReturnType<typeof getPaginatedZod<TEntity>>>>
}
type ApiService<
  TEntity extends ZodRawShape,
  TCreate extends ZodRawShape,
  //extending from record makes it so that if you try to access anything it would not error, we want to actually error if there is no key in TCustomServiceCalls that does not belong to it
  TCustomServiceCalls extends object,
  TExtraFilters extends ZodRawShape = never
> = BareApiService<TEntity, TCreate, TExtraFilters> & {
  customServiceCalls: CustomServiceCall<TCustomServiceCalls>
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
  TCustomServiceCalls extends Record<string, CustomServiceCallOpts<any, any>>,
  TExtraFilters extends ZodRawShape = never
>(
  base: ApiBaseParams<TApiEntity, TApiCreate, TApiUpdate, TExtraFilters>,
  /**
   * Create your own custom service calls to use with this API. Tools for case conversion are provided.
   */
  customServiceCalls: TCustomServiceCalls
): ApiService<TApiEntity, TApiCreate, TCustomServiceCalls, TExtraFilters>

export function createApi<
  TApiEntity extends ZodRawShape,
  TApiCreate extends ZodRawShape,
  TApiUpdate extends ZodRawShape,
  TExtraFilters extends ZodRawShape = never
>(
  base: ApiBaseParams<TApiEntity, TApiCreate, TApiUpdate, TExtraFilters>
): BareApiService<TApiEntity, TApiCreate, TExtraFilters>

//! doing overloads to improve UX is a bit of a double-edged sword here. We are risking the type safety within this method! We'd still get errors if we don't match the declared input-outputs from overloads so that's something.
export function createApi({ models, client, endpoint }, customServiceCalls = undefined) {
  const axiosClient: AxiosInstance = client

  const createCustomServiceCallHandler = (serviceCallOpts: CustomServiceCallOpts<any, any>) => async (inputs: any) => {
    const fromApi = (obj: object) => z.object(serviceCallOpts.outputShape).parse(objectToCamelCase(obj))
    const toApi = (obj: object) =>
      z.object(getSnakeCasedZodRawShape(serviceCallOpts.inputShape)).parse(objectToSnakeCase(obj))

    return serviceCallOpts.callback({ client, input: inputs, utils: { fromApi, toApi } })
  }

  const modifiedCustomServiceCalls = customServiceCalls
    ? Object.fromEntries(
        Object.entries(customServiceCalls as Record<string, CustomServiceCallOpts<any, any>>).map(([k, v]) => [
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
    const parsed = parseResponse({
      uri: endpoint,
      data: res.data,
      zod: z.object(snakedEntityShape),
    })
    return objectToCamelCase(parsed)
  }

  const list = async (params) => {
    const filters = params ? params.filters : undefined
    const pagination = params ? params.pagination : undefined
    // Filters parsing, throws if the fields do not comply with the zod schema
    const allFilters = {
      ...(filters ?? {}),
      ...(pagination ? { page: pagination.page, pageSize: pagination.size } : {}),
    }
    const filtersParsed = models.extraFilters
      ? z.object(models.extraFilters).partial().and(filtersZod).and(paginationFiltersZod).parse(allFilters)
      : filtersZod.and(paginationFiltersZod).parse(allFilters)
    const snakedFilters = filtersParsed ? objectToSnakeCase(filtersParsed) : undefined
    const snakedCleanParsedFilters = snakedFilters
      ? Object.fromEntries(
          Object.entries(snakedFilters).flatMap(([k, v]) => {
            if (typeof v === "number") return [[k, v.toString()]]
            if (!v) return []
            return [[k, v]]
          })
        )
      : undefined

    const paginatedZod = getPaginatedSnakeCasedZod(models.entity)

    const res = await axiosClient.get(endpoint, {
      params: snakedCleanParsedFilters,
    })
    const rawResponse = paginatedZod.parse(res.data)
    return { ...rawResponse, results: rawResponse.results.map((r) => objectToCamelCase(r)) }
  }

  const baseReturn = { client, retrieve, create, list }

  if (!modifiedCustomServiceCalls) return baseReturn

  return {
    ...baseReturn,
    customServiceCalls: modifiedCustomServiceCalls,
  }
}
