import axios, { AxiosInstance } from "axios"
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
import { AxiosLike, CustomServiceCallPlaceholder, CustomServiceCallsRecord } from "./types"
import { createCustomServiceCallV2 } from "./v2"

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

type ApiService<
  TModels extends BaseModelsPlaceholder | unknown,
  //extending from record makes it so that if you try to access anything it would not error, we want to actually error if there is no key in TCustomServiceCalls that does not belong to it
  TCustomServiceCalls extends object = never
> = BareApiService<TModels> &
  (IsNever<TCustomServiceCalls> extends true
    ? unknown
    : {
        /**
         * The custom calls you declared as input but as plain functions and wrapped for type safety
         */
        customServiceCalls: CustomServiceCallsRecord<TCustomServiceCalls>
        /**
         * Alias for customServiceCalls
         */
        csc: CustomServiceCallsRecord<TCustomServiceCalls>
      })

//TODO: why can't we just check for never on Entity and return unknown since this is going to compose the api calls. The intersection is actually going to null out the unknown type.
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

type UpsertCallObj<
  TEntity extends EntityShape,
  TCreate extends z.ZodRawShape = never,
  TInferredEntityWithoutReadonlyFields = GetInferredWithoutReadonlyBrands<TEntity>,
  TInferredIdObj = TInferredEntityWithoutReadonlyFields extends { id: infer TId }
    ? { id: TId }
    : ErrorEntityShapeMustHaveAnIdField
> = {
  upsert(
    /**
     * Perform a patch request with a partial body
     */
    inputs:
      | (IsNever<TCreate> extends true
          ? Omit<GetInferredWithoutReadonlyBrands<TEntity>, "id">
          : GetInferredWithoutReadonlyBrands<TCreate>)
      | (Omit<Partial<TInferredEntityWithoutReadonlyFields>, "id"> & TInferredIdObj)
  ): Promise<GetInferredFromRaw<TEntity>>
}

type WithCreateModelCall<TModels extends BaseModelsPlaceholder> = TModels extends EntityModelObj<infer TE>
  ? IsNever<TE> extends true
    ? unknown
    : TModels extends CreateModelObj<infer TC>
    ? IsNever<TC> extends true
      ? CreateCallObj<TE>
      : CreateCallObj<TE, TC>
    : unknown
  : unknown

type WithEntityModelCall<TModels extends BaseModelsPlaceholder> = TModels extends EntityModelObj<infer TE>
  ? IsNever<TE> extends true
    ? unknown
    : RetrieveCallObj<TE>
  : unknown
type WithExtraFiltersModelCall<TModels extends BaseModelsPlaceholder> = TModels extends EntityModelObj<infer TE>
  ? IsNever<TE> extends true
    ? unknown
    : TModels extends ExtraFiltersObj<infer TEx>
    ? IsNever<TEx> extends true
      ? ListCallObj<TE>
      : ListCallObj<TE, TEx>
    : unknown
  : unknown
type WithRemoveModelCall<TModels extends BaseModelsPlaceholder> = TModels extends EntityModelObj<infer TE>
  ? IsNever<TE> extends true
    ? unknown
    : { remove: (id: GetInferredFromRaw<TE>["id"]) => Promise<void> }
  : unknown
type WithUpdateModelCall<TModels extends BaseModelsPlaceholder> = TModels extends EntityModelObj<infer TE>
  ? IsNever<TE> extends true
    ? unknown
    : UpdateCallObj<TE>
  : unknown
type WithUpsertModelCall<TModels extends BaseModelsPlaceholder> = TModels extends EntityModelObj<infer TE>
  ? IsNever<TE> extends true
    ? unknown
    : TModels extends CreateModelObj<infer TC>
    ? IsNever<TC> extends true
      ? UpsertCallObj<TE>
      : UpsertCallObj<TE, TC>
    : unknown
  : unknown

type BaseApiCalls<TModels extends BaseModelsPlaceholder> = WithCreateModelCall<TModels> &
  WithEntityModelCall<TModels> &
  WithExtraFiltersModelCall<TModels> &
  WithRemoveModelCall<TModels> &
  WithUpdateModelCall<TModels> &
  WithUpsertModelCall<TModels>

type BareApiService<TModels extends BaseModelsPlaceholder | unknown> = TModels extends BaseModelsPlaceholder
  ? {
      client: AxiosLike
    } & BaseApiCalls<TModels>
  : { client: AxiosLike }

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

export const createApi = <
  TEntity extends EntityShape = never,
  //TODO: nice-to-have make TCreate default to entity without readonly fields
  TCreate extends z.ZodRawShape = never,
  TExtraFilters extends FiltersShape = never,
  TCustomServiceCalls extends Record<string, CustomServiceCallPlaceholder> = never
>(args: {
  baseUri: string
  client: AxiosInstance
  customCalls?: TCustomServiceCalls
  models?: {
    entity: TEntity
    create?: TCreate
    extraFilters?: TExtraFilters
  }
  options?: {
    disableTrailingSlash?: boolean
  }
  //TODO: need to make this work with custom calls as well
}): ApiService<{ entity: TEntity; create?: TCreate; extraFilters?: TExtraFilters }, TCustomServiceCalls> => {
  const { baseUri, client, customCalls, models, options } = args
  if (models && "create" in models && !("entity" in models)) {
    throw new Error("You should not pass `create` model without an `entity` model")
  }
  //standardize the uri
  const parsedEndingSlash = (options?.disableTrailingSlash ? "" : "/") as `${string}/`
  const slashEndingBaseUri = (baseUri[baseUri.length - 1] === "/" ? baseUri : baseUri + "/") as `${string}/`
  const parsedBaseUri = (
    args.options?.disableTrailingSlash
      ? slashEndingBaseUri.substring(0, slashEndingBaseUri.length - 1)
      : slashEndingBaseUri
  ) as `${string}/`
  const axiosLikeClient = client as AxiosLike

  const modifiedCustomServiceCalls = customCalls
    ? (Object.fromEntries(
        Object.entries(customCalls).map(([k, v]) => [
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
      //TODO: remove any
    } as any
  }
  if (!models || !models.entity) {
    //TODO: remove any
    return { client: axiosLikeClient } as ApiService<
      { entity: TEntity; create?: TCreate; extraFilters?: TExtraFilters },
      TCustomServiceCalls
    >
  }
  const entityShapeWithoutReadonlyFields = removeReadonlyFields(models.entity as EntityShape, ["id"])
  //TODO: revisit why we did this
  type TApiEntityShape = TEntity extends z.ZodRawShape ? TEntity : z.ZodRawShape

  /**
   * Placeholder to include or not the create method in the return based on models
   */
  type TApiCreateShape = TCreate extends z.ZodRawShape ? TCreate : z.ZodRawShape
  type TApiCreate = GetInferredFromRawWithBrand<TApiCreateShape>
  const create = async (inputs: TApiCreate) => {
    //if there's an id:
    let entityShapeWithoutReadonlyFieldsNorId: z.ZodRawShape = entityShapeWithoutReadonlyFields
    if ("id" in entityShapeWithoutReadonlyFields) {
      const { id: _, ...rest } = entityShapeWithoutReadonlyFields
      entityShapeWithoutReadonlyFieldsNorId = rest
    }
    // const { id: _, ...entityShapeWithoutReadonlyFieldsNorId } = entityShapeWithoutReadonlyFields
    const inputShape =
      "create" in models && models.create ? removeReadonlyFields(models.create) : entityShapeWithoutReadonlyFieldsNorId
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

  // type test = BareApiService<TEntity, TCreate, TExtraFilters>["list"] // error on list not existing or resulting in a too complex structure for typescript to resolve
  //TODO: check if we can fix this params type
  const list = async (params: any) => {
    const filters = params ? params.filters : undefined
    const pagination = params ? params.pagination : undefined
    // Filters parsing, throws if the fields do not comply with the zod schema

    const filtersParsed = models.extraFilters ? parseFilters({ shape: models.extraFilters, filters }) : undefined
    const paginationFilters = parseFilters({
      shape: paginationFiltersZodShape,
      filters: pagination ? { page: pagination.page, pageSize: pagination.size } : undefined,
    })
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
    const finalEntityZod =
      type === "partial" ? entityWithoutReadonlyFieldsZod.partial() : entityWithoutReadonlyFieldsZod
    type result = typeof finalEntityZod.shape

    const parsedInput = finalEntityZod.parse(newValue)
    const updateCall = createCustomServiceCallV2.standAlone({
      client,
      models: {
        inputShape: finalEntityZod.shape,
        outputShape: models.entity,
      },
      //@ts-expect-error TODO: need to revisit this since it is not picking up the return type properly. Maybe we need to improve createCustomServiceCallV2.standAlone types. (remove overloads)
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

  const upsert = async (
    args: TApiCreate | (Partial<GetInferredFromRawWithBrand<typeof entityShapeWithoutReadonlyFields>> & { id: string })
  ) => {
    if ("id" in args && args.id) {
      return updateBase({
        newValue: args as Partial<GetInferredFromRawWithBrand<typeof entityShapeWithoutReadonlyFields>> & {
          id: string
        },
      })
    } else {
      return create(args as TApiCreate)
    }
  }

  const baseReturn = { client: axiosLikeClient, retrieve, list, remove, update, create, upsert }

  type test2 = BareApiService<{ entity: EntityShape; create: TCreate; extraFilters: TExtraFilters }>

  //TODO: fix any
  if (!modifiedCustomServiceCalls) return baseReturn as any

  //TODO: fix any
  return {
    ...baseReturn,
    customServiceCalls: modifiedCustomServiceCalls,
    csc: modifiedCustomServiceCalls,
  } as any
}
