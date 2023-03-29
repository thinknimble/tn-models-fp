import { objectToCamelCase, objectToSnakeCase } from "@thinknimble/tn-utils"
import { AxiosInstance } from "axios"
import { z } from "zod"
import {
  createApiUtils,
  filtersZod,
  GetInferredFromRaw,
  getPaginatedSnakeCasedZod,
  getPaginatedZod,
  IPagination,
  paginationFiltersZod,
  parseResponse,
  zodObjectRecursive,
} from "../utils"

const uuidZod = z.string().uuid()

type BaseModelsPlaceholder<
  TE extends z.ZodRawShape = z.ZodRawShape,
  TC extends z.ZodRawShape = z.ZodRawShape,
  TEx extends z.ZodRawShape = z.ZodRawShape
> = TE extends z.ZodRawShape
  ? (EntityModelObj<TE> & ExtraFiltersObj<TEx>) | (EntityModelObj<TE> & ExtraFiltersObj<TEx> & CreateModelObj<TC>)
  : unknown

/**
 * Base type for custom service calls which serves as a placeholder to later take advantage of inference
 */
type FromApiPlaceholder = { fromApi: (obj: object) => any }
type ToApiPlaceholder = { toApi: (obj: object) => any }
type CustomServiceCallPlaceholder = {
  inputShape: object
  outputShape: object
  callback: (params: {
    slashEndingBaseUri: string
    client: AxiosInstance
    input: any
    utils: FromApiPlaceholder & ToApiPlaceholder
  }) => Promise<unknown>
}

/**
 * Get resulting custom service call from `createApi`
 */
type CustomServiceCallsRecord<TOpts extends object> = TOpts extends Record<string, CustomServiceCallPlaceholder>
  ? {
      [TKey in keyof TOpts]: (
        inputs: TOpts[TKey]["inputShape"] extends z.ZodRawShape
          ? GetInferredFromRaw<TOpts[TKey]["inputShape"]>
          : TOpts[TKey]["inputShape"] extends z.ZodTypeAny
          ? z.infer<TOpts[TKey]["inputShape"]>
          : never
      ) => Promise<
        TOpts[TKey]["outputShape"] extends z.ZodRawShape
          ? GetInferredFromRaw<TOpts[TKey]["outputShape"]>
          : TOpts[TKey]["outputShape"] extends z.ZodTypeAny
          ? z.infer<TOpts[TKey]["outputShape"]>
          : never
      >
    }
  : never
type RetrieveCallObj<TEntity extends z.ZodRawShape> = { retrieve: (id: string) => Promise<GetInferredFromRaw<TEntity>> }
type ListCallObj<TEntity extends z.ZodRawShape, TExtraFilters extends z.ZodRawShape = never> = {
  list: (params?: {
    filters?: GetInferredFromRaw<TExtraFilters> & z.infer<typeof filtersZod>
    pagination?: IPagination
  }) => Promise<z.infer<ReturnType<typeof getPaginatedZod<TEntity>>>>
}
type CreateCallObj<TEntity extends z.ZodRawShape, TCreate extends z.ZodRawShape> = {
  create: (inputs: GetInferredFromRaw<TCreate>) => Promise<GetInferredFromRaw<TEntity>>
}

type WithCreateModelCall<TModels extends BaseModelsPlaceholder> = TModels extends EntityModelObj<infer TE>
  ? TModels extends CreateModelObj<infer TC>
    ? CreateCallObj<TE, TC>
    : unknown
  : unknown
type WithEntityModelCall<TModels extends BaseModelsPlaceholder> = TModels extends EntityModelObj<infer TE>
  ? RetrieveCallObj<TE>
  : unknown
type WithExtraFiltersModelCall<TModels extends BaseModelsPlaceholder> = TModels extends EntityModelObj<infer TE>
  ? TModels extends ExtraFiltersObj<infer TEx>
    ? ListCallObj<TE, TEx>
    : ListCallObj<TE>
  : unknown

type BaseApiCalls<TModels extends BaseModelsPlaceholder> = WithCreateModelCall<TModels> &
  WithEntityModelCall<TModels> &
  WithExtraFiltersModelCall<TModels>

type BareApiService<TModels extends BaseModelsPlaceholder | unknown> = TModels extends BaseModelsPlaceholder
  ? {
      client: AxiosInstance
    } & BaseApiCalls<TModels>
  : { client: AxiosInstance }

type ApiService<
  TModels extends BaseModelsPlaceholder | unknown,
  //extending from record makes it so that if you try to access anything it would not error, we want to actually error if there is no key in TCustomServiceCalls that does not belong to it
  TCustomServiceCalls extends object
> = BareApiService<TModels> & {
  /**
   * The custom calls you declared as input but as plain functions and wrapped for type safety
   */
  customServiceCalls: CustomServiceCallsRecord<TCustomServiceCalls>
  /**
   * Alias for customServiceCalls
   */
  csc: CustomServiceCallsRecord<TCustomServiceCalls>
}
type CreateModelObj<TApiCreate extends z.ZodRawShape> = {
  /**
   * Zod raw shape of the input for creating an entity
   */
  create: TApiCreate
}
type ExtraFiltersObj<TExtraFilters extends z.ZodRawShape> = {
  /**
   * Zod raw shape of extra filters if any
   */
  extraFilters?: TExtraFilters
}

type EntityModelObj<TApiEntity extends z.ZodRawShape> = {
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
}

type BaseApiParams = {
  /**
   * The base uri for te api to hit. We append this to request's uris for listing, retrieving and creating
   */
  readonly baseUri: string
  /**
   * The axios instance created for the app.
   */
  client: AxiosInstance
}

export function createApi<
  TModels extends BaseModelsPlaceholder,
  TCustomServiceCalls extends Record<string, CustomServiceCallPlaceholder>
>(
  base: BaseApiParams & {
    models: TModels
  },
  /**
   * Create your own custom service calls to use with this API. Tools for case conversion are provided.
   */
  customServiceCalls: TCustomServiceCalls
): ApiService<TModels, TCustomServiceCalls>

export function createApi<TCustomServiceCalls extends Record<string, CustomServiceCallPlaceholder> = never>(
  base: BaseApiParams,
  /**
   * Create your own custom service calls to use with this API. Tools for case conversion are provided.
   */
  customServiceCalls: TCustomServiceCalls
): ApiService<unknown, TCustomServiceCalls>

export function createApi<TModels extends BaseModelsPlaceholder>(
  base: BaseApiParams & { models: TModels }
): BareApiService<TModels>

export function createApi(base: BaseApiParams): BareApiService<unknown>

export function createApi<
  TModels extends BaseModelsPlaceholder,
  TCustomServiceCalls extends Record<string, CustomServiceCallPlaceholder> = never
>(
  { models, client, baseUri }: BaseApiParams & { models?: TModels },
  customServiceCalls: TCustomServiceCalls | undefined = undefined
) {
  if (models && "create" in models && !("entity" in models)) {
    throw new Error("You should not pass `create` model without an `entity` model")
  }
  //standardize the uri
  const slashEndingBaseUri = baseUri[baseUri.length - 1] === "/" ? baseUri : baseUri + "/"

  const createCustomServiceCallHandler =
    (
      serviceCallOpts: any,
      /**
       * This name allow us to keep record of which method it is, so that we can identify in case of output mismatch
       */
      name: string
    ) =>
    async (input: unknown) => {
      const utilsResult = createApiUtils({
        name,
        inputShape: serviceCallOpts.inputShape,
        outputShape: serviceCallOpts.outputShape,
      })
      const inputResult = input ? { input } : {}
      return serviceCallOpts.callback({
        client,
        slashEndingBaseUri,
        ...inputResult,
        ...(utilsResult ? utilsResult : {}),
      })
    }

  const modifiedCustomServiceCalls = customServiceCalls
    ? (Object.fromEntries(
        Object.entries(customServiceCalls).map(([k, v]) => [k, createCustomServiceCallHandler(v, k)])
      ) as CustomServiceCallsRecord<TCustomServiceCalls>)
    : undefined

  //if there are no models at all don't even bother creating the unused methods
  if (!models && modifiedCustomServiceCalls) {
    return {
      client,
      customServiceCalls: modifiedCustomServiceCalls,
      csc: modifiedCustomServiceCalls,
    }
  }
  if (!models || !models.entity) {
    return { client }
  }
  type TApiEntityShape = TModels extends EntityModelObj<infer TE> ? TE : z.ZodRawShape

  /**
   * Placeholder to include or not the create method in the return based on models
   */
  let createObj: object = {}
  if ("create" in models) {
    type TApiCreateShape = TModels extends CreateCallObj<TApiEntityShape, infer TC> ? TC : z.ZodRawShape
    type TApiCreate = GetInferredFromRaw<TApiCreateShape>
    const create = async (inputs: TApiCreate) => {
      const snaked = objectToSnakeCase(inputs)
      const res = await client.post(slashEndingBaseUri, snaked)
      const snakedEntityShape = zodObjectRecursive(z.object(models.entity))
      const parsed = parseResponse({
        identifier: `${create.name} ${baseUri}`,
        data: res.data,
        zod: snakedEntityShape,
      })
      return objectToCamelCase(parsed)
    }
    createObj = { create }
  }
  const retrieve = async (id: string) => {
    //TODO: should we allow the user to set their own id zod schema?
    if (!uuidZod.safeParse(id).success) {
      console.warn("The passed id is not a valid UUID, check your input")
    }
    const uri = `${slashEndingBaseUri}${id}/`
    const res = await client.get(uri)
    const parsed = parseResponse({
      identifier: `${retrieve.name} ${uri}`,
      data: res.data,
      zod: zodObjectRecursive(z.object(models.entity)),
    })
    return objectToCamelCase(parsed)
  }

  const list = async (params: Parameters<BareApiService<TModels>["list"]>[0]) => {
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

    const res = await client.get(slashEndingBaseUri, {
      params: snakedCleanParsedFilters,
    })
    const rawResponse = paginatedZod.parse(res.data)
    return { ...rawResponse, results: rawResponse.results.map((r) => objectToCamelCase(r)) }
  }

  const baseReturn = { client, retrieve, list, ...createObj }

  if (!modifiedCustomServiceCalls) return baseReturn

  return {
    ...baseReturn,
    customServiceCalls: modifiedCustomServiceCalls,
    csc: modifiedCustomServiceCalls,
  }
}
