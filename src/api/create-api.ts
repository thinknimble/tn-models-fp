import { AxiosInstance } from "axios"
import { z } from "zod"
import {
  FiltersShape,
  GetInferredFromRaw,
  GetInferredFromRawWithBrand,
  GetInferredWithoutReadonlyBrands,
  IPagination,
  IsNever,
  ReadonlyTag,
  UnwrapBranded,
  createApiUtils,
  createCustomServiceCallHandler,
  defineProperty,
  getPaginatedSnakeCasedZod,
  getPaginatedZod,
  objectToCamelCaseArr,
  paginationFiltersZodShape,
  parseFilters,
  parseResponse,
  removeReadonlyFields,
} from "../utils"
import { createCustomServiceCall } from "./create-custom-call"
import { AxiosLike, CustomServiceCallPlaceholder, CustomServiceCallsRecord } from "./types"

type EntityShape = z.ZodRawShape & {
  id: z.ZodString | z.ZodNumber | z.ZodBranded<z.ZodString, ReadonlyTag> | z.ZodBranded<z.ZodNumber, ReadonlyTag>
}

type BaseModelsPlaceholder<
  TEntity extends EntityShape = EntityShape,
  TCreate extends z.ZodRawShape = z.ZodRawShape,
  TBuiltInFilters extends FiltersShape = FiltersShape
> = TEntity extends EntityShape
  ?
      | (EntityModelObj<TEntity> & ExtraFiltersObj<TBuiltInFilters>)
      | (EntityModelObj<TEntity> & ExtraFiltersObj<TBuiltInFilters> & CreateModelObj<TCreate>)
  : "If you include models entity should be a present shape"

type RetrieveCallObj<TEntity extends EntityShape> = {
  /**
   * Get resource by id
   * @param id resource id
   * @returns
   */
  retrieve: (id: GetInferredFromRaw<TEntity>["id"]) => Promise<GetInferredFromRaw<TEntity>>
}
type ListCallObj<TEntity extends EntityShape, TExtraFilters extends FiltersShape = never> = {
  /**
   * This calls the `{baseUri}/list` endpoint. Note that this has to be available in the api you're consuming for this method to actually work
   */
  list: (
    params?: IsNever<TExtraFilters> extends true
      ? {
          pagination?: IPagination
        }
      : { pagination?: IPagination; filters?: GetInferredFromRawWithBrand<TExtraFilters> }
  ) => Promise<z.infer<ReturnType<typeof getPaginatedZod<UnwrapBranded<TEntity, ReadonlyTag>>>>>
}
type CreateCallObj<TEntity extends EntityShape, TCreate extends z.ZodRawShape = never> = {
  create: (
    inputs: IsNever<TCreate> extends true
      ? Omit<GetInferredWithoutReadonlyBrands<TEntity>, "id">
      : GetInferredWithoutReadonlyBrands<TCreate>
  ) => Promise<GetInferredFromRaw<TEntity>>
}
type ErrorEntityShapeMustHaveAnIdField = '[TypeError] Your entity should have an "id" field'
type UpdateCallObj<
  TEntity extends EntityShape,
  TInferredEntityWithoutReadonlyFields = GetInferredWithoutReadonlyBrands<TEntity>,
  TInferredIdObj = TInferredEntityWithoutReadonlyFields extends { id: infer TId }
    ? { id: TId }
    : ErrorEntityShapeMustHaveAnIdField
> = {
  update: {
    /**
     * Perform a patch request with a partial body
     */
    (inputs: Omit<Partial<TInferredEntityWithoutReadonlyFields>, "id"> & TInferredIdObj): Promise<
      GetInferredFromRaw<TEntity>
    >
    /**
     * Perform a put request with a full body
     */
    replace: {
      (inputs: TInferredEntityWithoutReadonlyFields): Promise<GetInferredFromRaw<TEntity>>
      /**
       * Perform a put request with a full body
       */
      asPartial: (
        inputs: Omit<Partial<TInferredEntityWithoutReadonlyFields>, "id"> & TInferredIdObj
      ) => Promise<GetInferredFromRaw<TEntity>>
    }
  }
}

type WithCreateModelCall<TModels extends BaseModelsPlaceholder> = TModels extends EntityModelObj<infer TE>
  ? TModels extends CreateModelObj<infer TC>
    ? CreateCallObj<TE, TC>
    : CreateCallObj<TE>
  : unknown
type WithEntityModelCall<TModels extends BaseModelsPlaceholder> = TModels extends EntityModelObj<infer TE>
  ? RetrieveCallObj<TE>
  : unknown
type WithExtraFiltersModelCall<TModels extends BaseModelsPlaceholder> = TModels extends EntityModelObj<infer TE>
  ? TModels extends ExtraFiltersObj<infer TEx>
    ? ListCallObj<TE, TEx>
    : ListCallObj<TE>
  : unknown
type WithRemoveModelCall<TModels extends BaseModelsPlaceholder> = TModels extends EntityModelObj<infer TEntityShape>
  ? { remove: (id: GetInferredFromRaw<TEntityShape>["id"]) => Promise<void> }
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

type EntityModelObj<TApiEntity extends EntityShape> = {
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
   * The base uri for te api to hit. We append this to request's uris for built-in methods as provide a slash-ended version for custom calls
   * @example
   * baseUri='/api/todos'
   */
  readonly baseUri: string
  /**
   * The axios instance created for the app.
   */
  client: AxiosInstance
  disableTrailingSlash?: boolean
}

type CheckEntityIntegrity<TModels> = TModels extends { entity: any }
  ? TModels extends { entity: { id: any } }
    ? true
    : "An `id` field in `entity` is required"
  : "`entity` field is required"

type ValidModelKeys = keyof { entity: unknown; create?: unknown; extraFilters?: unknown }
type CheckModelsValidKeysPerKey<TModels> = {
  [K in keyof TModels]: K extends ValidModelKeys ? TModels[K] : "Invalid Key"
}
type CheckModels<TModels> = CheckEntityIntegrity<TModels> extends true
  ? CheckModelsValidKeysPerKey<TModels> extends BaseModelsPlaceholder
    ? CheckModelsValidKeysPerKey<TModels>
    : "You should not pass `create` model without an `entity` model"
  : CheckEntityIntegrity<TModels>

export function createApi<
  TModels extends BaseModelsPlaceholder,
  TCustomServiceCalls extends Record<string, CustomServiceCallPlaceholder>
>(
  base: BaseApiParams & {
    models?: CheckModels<TModels>
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
export function createApi<TModels extends BaseModelsPlaceholder | unknown = unknown>(
  base: BaseApiParams & {
    models?: CheckModels<TModels>
  }
): BareApiService<TModels>

export function createApi<
  TModels extends BaseModelsPlaceholder,
  TCustomServiceCalls extends Record<string, CustomServiceCallPlaceholder> = never
>(
  { models, client, baseUri, disableTrailingSlash }: BaseApiParams & { models?: TModels },
  customServiceCalls: TCustomServiceCalls | undefined = undefined
) {
  if (models && "create" in models && !("entity" in models)) {
    throw new Error("You should not pass `create` model without an `entity` model")
  }
  //standardize the uri
  const parsedEndingSlash = (disableTrailingSlash ? "" : "/") as `${string}/`
  const slashEndingBaseUri = (baseUri[baseUri.length - 1] === "/" ? baseUri : baseUri + "/") as `${string}/`
  const parsedBaseUri = (
    disableTrailingSlash ? slashEndingBaseUri.substring(0, slashEndingBaseUri.length - 1) : slashEndingBaseUri
  ) as `${string}/`
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
  const entityShapeWithoutReadonlyFields = removeReadonlyFields(models.entity, ["id"])
  type TApiEntityShape = TModels extends EntityModelObj<infer TE> ? TE : z.ZodRawShape

  /**
   * Placeholder to include or not the create method in the return based on models
   */
  type TApiCreateShape = TModels extends CreateCallObj<TApiEntityShape, infer TC> ? TC : z.ZodRawShape
  type TApiCreate = GetInferredFromRawWithBrand<TApiCreateShape>
  const create = async (inputs: TApiCreate) => {
    const { id: _, ...entityShapeWithoutReadonlyFieldsNorId } = entityShapeWithoutReadonlyFields
    const inputShape = "create" in models ? removeReadonlyFields(models.create) : entityShapeWithoutReadonlyFieldsNorId
    const { utils } = createApiUtils({
      inputShape,
      name: create.name,
      outputShape: models.entity,
    })
    const res = await axiosLikeClient.post(parsedBaseUri, utils.toApi(inputs))
    return utils.fromApi(res.data)
  }

  const retrieve = async (id: GetInferredFromRaw<TApiEntityShape>["id"]) => {
    const { utils } = createApiUtils({
      name: retrieve.name,
      outputShape: models.entity,
    })
    const res = await axiosLikeClient.get(`${slashEndingBaseUri}${id}${parsedEndingSlash}`)
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

    const res = await axiosLikeClient.get(parsedBaseUri, {
      params: allFilters,
    })
    const rawResponse = parseResponse({
      identifier: list.name,
      data: res.data,
      zod: paginatedZod,
    })

    return { ...rawResponse, results: rawResponse.results.map((r) => objectToCamelCaseArr(r)) }
  }

  const remove = (id: GetInferredFromRaw<TApiEntityShape>["id"]) => {
    return client.delete(`${slashEndingBaseUri}${id}${parsedEndingSlash}`)
  }

  const updateBase = async <TType extends "partial" | "total" = "partial">({
    httpMethod = "patch",
    type = "partial",
    newValue,
  }: {
    type?: "partial" | "total"
    httpMethod?: "put" | "patch"
    newValue: (TType extends "partial"
      ? Omit<Partial<GetInferredFromRawWithBrand<typeof entityShapeWithoutReadonlyFields>>, "id">
      : GetInferredFromRawWithBrand<typeof entityShapeWithoutReadonlyFields>) & {
      id: GetInferredFromRawWithBrand<TApiEntityShape>["id"]
    }
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
      cb: async ({ client, input, utils }) => {
        const { id, ...body } = utils.toApi(input)
        const result = await client[httpMethod](`${slashEndingBaseUri}${id}${parsedEndingSlash}`, body)
        return utils.fromApi(result?.data)
      },
    })
    return updateCall(parsedInput)
  }

  //! this is a bit painful to look at but I feel it is a good UX so that we don't make Users go through updateBase params
  const update = async (
    args: Partial<GetInferredFromRawWithBrand<typeof entityShapeWithoutReadonlyFields>> & { id: string }
  ) => {
    return updateBase({ newValue: args, httpMethod: "patch", type: "partial" })
  }
  defineProperty(
    update,
    "replace",
    async (args: GetInferredFromRawWithBrand<typeof entityShapeWithoutReadonlyFields> & { id: string }) =>
      updateBase({ newValue: args, httpMethod: "put", type: "total" })
  )
  defineProperty(
    update.replace,
    "asPartial",
    (inputs: Partial<GetInferredWithoutReadonlyBrands<TApiEntityShape>> & { id: string }) =>
      updateBase({ newValue: inputs, httpMethod: "put", type: "partial" })
  )

  const baseReturn = { client: axiosLikeClient, retrieve, list, remove, update, create }

  if (!modifiedCustomServiceCalls) return baseReturn

  return {
    ...baseReturn,
    customServiceCalls: modifiedCustomServiceCalls,
    csc: modifiedCustomServiceCalls,
  }
}
