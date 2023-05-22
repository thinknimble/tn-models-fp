//TODO: refactor built-in methods to all be custom service call specific cases
import { objectToCamelCase } from "@thinknimble/tn-utils"
import { AxiosInstance } from "axios"
import { z } from "zod"
import {
  FiltersShape,
  GetInferredFromRaw,
  IPagination,
  StripReadonlyBrand,
  createApiUtils,
  createCustomServiceCallHandler,
  getPaginatedSnakeCasedZod,
  getPaginatedZod,
  paginationFiltersZodShape,
  parseFilters,
  parseResponse,
  removeReadonlyFields,
  defineProperty,
} from "../utils"
import { createCustomServiceCall } from "./create-custom-call"
import { AxiosLike, CustomServiceCallPlaceholder, CustomServiceCallsRecord } from "./types"

const uuidZod = z.string().uuid()

type BaseModelsPlaceholder<
  TE extends z.ZodRawShape = z.ZodRawShape,
  TC extends z.ZodRawShape = z.ZodRawShape,
  TEx extends FiltersShape = FiltersShape
> = TE extends z.ZodRawShape
  ? (EntityModelObj<TE> & ExtraFiltersObj<TEx>) | (EntityModelObj<TE> & ExtraFiltersObj<TEx> & CreateModelObj<TC>)
  : unknown

type RetrieveCallObj<TEntity extends z.ZodRawShape> = {
  /**
   * Get resource by id
   * @param id resource id
   * @returns
   */
  retrieve: (id: string) => Promise<GetInferredFromRaw<TEntity>>
}
type ListCallObj<TEntity extends z.ZodRawShape, TExtraFilters extends FiltersShape = never> = {
  /**
   * This calls the `{baseUri}/list` endpoint. Note that this has to be available in the api you're consuming for this method to actually work
   */
  list: (params?: {
    filters?: GetInferredFromRaw<TExtraFilters>
    pagination?: IPagination
  }) => Promise<z.infer<ReturnType<typeof getPaginatedZod<TEntity>>>>
}
type CreateCallObj<TEntity extends z.ZodRawShape, TCreate extends z.ZodRawShape> = {
  create: (inputs: GetInferredFromRaw<TCreate>) => Promise<GetInferredFromRaw<TEntity>>
}
type UpdateCallObj<TEntity extends z.ZodRawShape> = {
  update: {
    /**
     * Perform a patch request with a partial body
     */
    (inputs: Partial<GetInferredFromRaw<StripReadonlyBrand<TEntity>>> & { id: string }): Promise<
      GetInferredFromRaw<TEntity>
    >
    /**
     * Perform a put request with a full body
     */
    replace: {
      (inputs: GetInferredFromRaw<StripReadonlyBrand<TEntity>> & { id: string }): Promise<GetInferredFromRaw<TEntity>>
      /**
       * Perform a put request with a full body
       */
      asPartial: (
        inputs: Partial<GetInferredFromRaw<StripReadonlyBrand<TEntity>>> & { id: string }
      ) => Promise<GetInferredFromRaw<TEntity>>
    }
  }
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
type WithRemoveModelCall<TModels extends BaseModelsPlaceholder> = TModels extends EntityModelObj<any>
  ? { remove: (id: string) => void }
  : unknown
type WithUpdateModelCall<TModels extends BaseModelsPlaceholder> = TModels extends EntityModelObj<infer TE>
  ? UpdateCallObj<TE>
  : unknown

type BaseApiCalls<TModels extends BaseModelsPlaceholder> = WithCreateModelCall<TModels> &
  WithEntityModelCall<TModels> &
  WithExtraFiltersModelCall<TModels> &
  WithRemoveModelCall<TModels> &
  WithUpdateModelCall<TModels>

type BareApiService<TModels extends BaseModelsPlaceholder | unknown> = TModels extends BaseModelsPlaceholder
  ? {
      client: AxiosLike
    } & BaseApiCalls<TModels>
  : { client: AxiosLike }

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
type ExtraFiltersObj<TExtraFilters extends FiltersShape> = {
  /**
   * Zod raw shape of extra filters if any
   */
  extraFilters?: TExtraFilters
}

type EntityModelObj<TApiEntity extends z.ZodRawShape> = {
  /**
   * Zod raw shape of the equivalent camel-cased version of the entity in backend
   *
   * @example
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
    models?: TModels
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
  base: BaseApiParams & { models?: TModels }
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
  const slashEndingBaseUri = (baseUri[baseUri.length - 1] === "/" ? baseUri : baseUri + "/") as `${string}/`
  const axiosLikeClient = client as AxiosLike

  const modifiedCustomServiceCalls = customServiceCalls
    ? (Object.fromEntries(
        Object.entries(customServiceCalls).map(([k, v]) => [
          k,
          createCustomServiceCallHandler({
            client: axiosLikeClient,
            serviceCallOpts: v,
            baseUri: slashEndingBaseUri,
            name: k,
          }),
        ])
      ) as CustomServiceCallsRecord<TCustomServiceCalls>)
    : undefined

  //if there are no models at all don't even bother creating the unused methods
  if (!models && modifiedCustomServiceCalls) {
    return {
      client: axiosLikeClient,
      customServiceCalls: modifiedCustomServiceCalls,
      csc: modifiedCustomServiceCalls,
    }
  }
  if (!models || !models.entity) {
    return { client: axiosLikeClient }
  }
  const entityShapeWithoutReadonlyFields = removeReadonlyFields(models.entity)
  type TApiEntityShape = TModels extends EntityModelObj<infer TE> ? TE : z.ZodRawShape

  /**
   * Placeholder to include or not the create method in the return based on models
   */
  //TODO: I will likely stop requiring really the create method at all, since we probably just want the same entity shape without id and readonly fields...
  let createObj: object = {}
  if ("create" in models) {
    type TApiCreateShape = TModels extends CreateCallObj<TApiEntityShape, infer TC> ? TC : z.ZodRawShape
    type TApiCreate = GetInferredFromRaw<TApiCreateShape>
    const create = async (inputs: TApiCreate) => {
      const { utils } = createApiUtils({
        inputShape: models.create,
        name: create.name,
        outputShape: models.entity,
      })
      const res = await axiosLikeClient.post(slashEndingBaseUri, utils.toApi(inputs))
      return utils.fromApi(res.data)
    }
    createObj = { create }
  }
  const retrieve = async (id: string) => {
    if (!uuidZod.safeParse(id).success) {
      console.warn("The passed id is not a valid UUID, check your input")
    }
    const { utils } = createApiUtils({
      name: retrieve.name,
      outputShape: models.entity,
    })
    const res = await axiosLikeClient.get(`${slashEndingBaseUri}${id}/`)
    return utils.fromApi(res.data)
  }

  const list = async (params: Parameters<BareApiService<TModels>["list"]>[0]) => {
    const filters = params ? params.filters : undefined
    const pagination = params ? params.pagination : undefined
    // Filters parsing, throws if the fields do not comply with the zod schema

    const filtersParsed = parseFilters(models.extraFilters, filters)
    const paginationFilters = parseFilters(
      paginationFiltersZodShape,
      pagination ? { page: pagination.page, pageSize: pagination.size } : undefined
    )
    const allFilters =
      filtersParsed || paginationFilters ? { ...(filtersParsed ?? {}), ...(paginationFilters ?? {}) } : undefined

    const paginatedZod = getPaginatedSnakeCasedZod(models.entity)

    const res = await axiosLikeClient.get(slashEndingBaseUri, {
      params: allFilters,
    })
    const rawResponse = parseResponse({
      identifier: list.name,
      data: res.data,
      zod: paginatedZod,
    })

    return { ...rawResponse, results: rawResponse.results.map((r) => objectToCamelCase(r)) }
  }

  const remove = (id: string) => {
    return client.delete(`${slashEndingBaseUri}${id}/`)
  }

  const updateBase = async <TType extends "partial" | "total" = "partial">({
    httpMethod = "patch",
    type = "partial",
    newValue,
  }: {
    type?: "partial" | "total"
    httpMethod?: "put" | "patch"
    newValue: (TType extends "partial"
      ? Partial<GetInferredFromRaw<typeof entityShapeWithoutReadonlyFields>>
      : GetInferredFromRaw<typeof entityShapeWithoutReadonlyFields>) & { id: string }
  }) => {
    if (!("id" in newValue)) {
      console.error("The update body needs an id to use this method")
      return
    }
    const entityWithoutReadonlyFieldsZod = z.object(entityShapeWithoutReadonlyFields)
    const finalEntityShape =
      type === "partial" ? entityWithoutReadonlyFieldsZod.partial() : entityWithoutReadonlyFieldsZod

    const parsedInput = finalEntityShape.parse(newValue)
    const updateCall = createCustomServiceCall.standAlone({
      client,
      models: {
        inputShape: finalEntityShape.shape,
        outputShape: models.entity,
      },
      cb: ({ client, input, utils }) => {
        const { id, ...body } = utils.toApi(input)
        return client[httpMethod](`${slashEndingBaseUri}${id}/`, body)
      },
    })
    return updateCall(parsedInput)
  }

  //! this is a bit painful to look at but I feel it is a good UX so that we don't make Users go through updateBase params
  const update = async (
    args: Partial<GetInferredFromRaw<typeof entityShapeWithoutReadonlyFields>> & { id: string }
  ) => {
    return updateBase({ newValue: args, httpMethod: "patch", type: "partial" })
  }
  defineProperty(
    update,
    "replace",
    async (args: GetInferredFromRaw<typeof entityShapeWithoutReadonlyFields> & { id: string }) =>
      updateBase({ newValue: args, httpMethod: "put", type: "total" })
  )
  defineProperty(
    update.replace,
    "asPartial",
    (inputs: Partial<GetInferredFromRaw<StripReadonlyBrand<TApiEntityShape>>> & { id: string }) =>
      updateBase({ newValue: inputs, httpMethod: "put", type: "partial" })
  )

  const baseReturn = { client: axiosLikeClient, retrieve, list, remove, update, ...createObj }

  if (!modifiedCustomServiceCalls) return baseReturn

  return {
    ...baseReturn,
    customServiceCalls: modifiedCustomServiceCalls,
    csc: modifiedCustomServiceCalls,
  }
}
