import { AxiosInstance } from "axios"
import { z } from "zod"
import {
  FiltersShape,
  GetInferredFromRaw,
  GetInferredFromRawWithStripReadonly,
  IPagination,
  IsNever,
  StripZodReadonly,
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
  id: z.ZodString | z.ZodNumber | z.ZodReadonly<z.ZodString> | z.ZodReadonly<z.ZodNumber>
}

type ApiService<
  TEntity extends EntityShape = never,
  TCreate extends z.ZodRawShape = never,
  TExtraFilters extends FiltersShape = never,
  //extending from record makes it so that if you try to access anything it would not error, we want to actually error if there is no key in TCustomServiceCalls that does not belong to it
  TCustomServiceCalls extends object = never,
> = BareApiService<TEntity, TCreate, TExtraFilters> &
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
      : { pagination?: IPagination; filters?: Partial<GetInferredFromRaw<TExtraFilters>> },
  ) => Promise<z.infer<ReturnType<typeof getPaginatedZod<TEntity>>>>
}
type CreateCallObj<TEntity extends EntityShape, TCreate extends z.ZodRawShape = never> = {
  create: (
    inputs: IsNever<TCreate> extends true
      ? Omit<GetInferredFromRawWithStripReadonly<TEntity>, "id">
      : GetInferredFromRawWithStripReadonly<TCreate>,
  ) => Promise<GetInferredFromRaw<TEntity>>
}
type ErrorEntityShapeMustHaveAnIdField = '[TypeError] Your entity should have an "id" field'
type UpdateCallObj<
  TEntity extends EntityShape,
  TInferredEntityWithoutReadonlyFields = GetInferredFromRawWithStripReadonly<TEntity>,
  TInferredIdObj = TInferredEntityWithoutReadonlyFields extends { id: infer TId }
    ? { id: TId }
    : ErrorEntityShapeMustHaveAnIdField,
> = {
  update: {
    /**
     * Perform a patch request with a partial body
     */
    (
      inputs: Omit<Partial<TInferredEntityWithoutReadonlyFields>, "id"> & TInferredIdObj,
    ): Promise<GetInferredFromRaw<TEntity>>
    /**
     * Perform a put request with a full body
     */
    replace: {
      (inputs: TInferredEntityWithoutReadonlyFields): Promise<GetInferredFromRaw<TEntity>>
      /**
       * Perform a put request with a full body
       */
      asPartial: (
        inputs: Omit<Partial<TInferredEntityWithoutReadonlyFields>, "id"> & TInferredIdObj,
      ) => Promise<GetInferredFromRaw<TEntity>>
    }
  }
}

type UpsertCallObj<
  TEntity extends EntityShape,
  TCreate extends z.ZodRawShape = never,
  TInferredEntityWithoutReadonlyFields = GetInferredFromRaw<TEntity>,
  TInferredIdObj = TInferredEntityWithoutReadonlyFields extends { id: infer TId }
    ? { id: TId }
    : ErrorEntityShapeMustHaveAnIdField,
> = {
  upsert(
    /**
     * Perform a patch request with a partial body
     */
    inputs:
      | (IsNever<TCreate> extends true ? Omit<GetInferredFromRaw<TEntity>, "id"> : GetInferredFromRaw<TCreate>)
      | (Omit<Partial<TInferredEntityWithoutReadonlyFields>, "id"> & TInferredIdObj),
  ): Promise<GetInferredFromRaw<TEntity>>
}

type WithCreateModelCall<TEntity extends EntityShape = never, TCreate extends z.ZodRawShape = never> =
  IsNever<TEntity> extends true
    ? unknown
    : IsNever<TCreate> extends true
      ? CreateCallObj<TEntity>
      : CreateCallObj<TEntity, TCreate>

type WithEntityModelCall<TEntity extends EntityShape = never> =
  IsNever<TEntity> extends true ? unknown : RetrieveCallObj<TEntity>
type WithExtraFiltersModelCall<TEntity extends EntityShape = never, TExtraFilters extends FiltersShape = never> =
  IsNever<TEntity> extends true
    ? unknown
    : IsNever<TExtraFilters> extends true
      ? ListCallObj<TEntity>
      : ListCallObj<TEntity, TExtraFilters>
type WithRemoveModelCall<TEntity extends EntityShape = never> =
  IsNever<TEntity> extends true ? unknown : { remove: (id: GetInferredFromRaw<TEntity>["id"]) => Promise<void> }
type WithUpdateModelCall<TEntity extends EntityShape = never> =
  IsNever<TEntity> extends true ? unknown : UpdateCallObj<TEntity>
type WithUpsertModelCall<TEntity extends EntityShape = never, TCreate extends z.ZodRawShape = never> =
  IsNever<TEntity> extends true
    ? unknown
    : IsNever<TCreate> extends true
      ? UpsertCallObj<TEntity>
      : UpsertCallObj<TEntity, TCreate>

type BaseApiCalls<
  TEntity extends EntityShape = never,
  TCreate extends z.ZodRawShape = never,
  TExtraFilters extends FiltersShape = never,
> = WithCreateModelCall<TEntity, TCreate> &
  WithEntityModelCall<TEntity> &
  WithExtraFiltersModelCall<TEntity, TExtraFilters> &
  WithRemoveModelCall<TEntity> &
  WithUpdateModelCall<TEntity> &
  WithUpsertModelCall<TEntity, TCreate>

type BareApiService<
  TEntity extends EntityShape = never,
  TCreate extends z.ZodRawShape = never,
  TExtraFilters extends FiltersShape = never,
> =
  IsNever<TEntity> extends false
    ? {
        client: AxiosLike
      } & BaseApiCalls<TEntity, TCreate, TExtraFilters>
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
  TCreate extends z.ZodRawShape = never,
  TExtraFilters extends FiltersShape = never,
  TCustomServiceCalls extends Record<string, CustomServiceCallPlaceholder> = never,
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
    disableWarningLogging?: boolean
  }
}): ApiService<TEntity, TCreate, TExtraFilters, TCustomServiceCalls> => {
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
        ]),
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
    return { client: axiosLikeClient } as ApiService<TEntity, TCreate, TExtraFilters, TCustomServiceCalls>
  }
  const entityShapeWithoutReadonlyFields = removeReadonlyFields(models.entity as EntityShape, ["id"])
  //TODO: revisit why we did this
  type TApiEntityShape = TEntity extends z.ZodRawShape ? TEntity : z.ZodRawShape

  /**
   * Placeholder to include or not the create method in the return based on models
   */
  type TApiCreateShape = TCreate extends z.ZodRawShape ? TCreate : z.ZodRawShape
  type TApiCreate = GetInferredFromRaw<StripZodReadonly<TApiCreateShape>>
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
      onError: args.options?.disableWarningLogging ? null : undefined,
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
      ? Omit<Partial<GetInferredFromRaw<typeof entityShapeWithoutReadonlyFields>>, "id">
      : GetInferredFromRaw<typeof entityShapeWithoutReadonlyFields>) & {
      id: GetInferredFromRaw<TApiEntityShape>["id"]
    }
  }) => {
    if (!("id" in newValue)) {
      console.error("The update body needs an id to use this method")
      return
    }
    const entityWithoutReadonlyFieldsZod = z.object(entityShapeWithoutReadonlyFields)
    const finalEntityZod =
      type === "partial" ? entityWithoutReadonlyFieldsZod.partial() : entityWithoutReadonlyFieldsZod
    try {
      const parsedInput = finalEntityZod.parse(newValue)
      const updateCall = createCustomServiceCall.standAlone({
        client,
        models: {
          inputShape: finalEntityZod.shape,
          outputShape: models.entity,
        },
        cb: async ({ client, input, utils }) => {
          const { id, ...body } = utils.toApi(input)
          const result = await client[httpMethod](`${slashEndingBaseUri}${id}${parsedEndingSlash}`, body)
          //@ts-expect-error The generic aspect of this function seems not to be able to make out that utils should yield fromApi
          return utils.fromApi(result?.data)
        },
      })
      //@ts-expect-error we can ignore this since we're actually doing a hard parse
      return updateCall(parsedInput)
    } catch (e) {
      console.error(`${updateBase.name} - error`, e)
      throw e
    }
  }

  //! this is a bit painful to look at but I feel it is a good UX so that we don't make Users go through updateBase params
  const update = async (
    args: Partial<GetInferredFromRaw<typeof entityShapeWithoutReadonlyFields>> & { id: string },
  ) => {
    return updateBase({ newValue: args, httpMethod: "patch", type: "partial" })
  }
  defineProperty(
    update,
    "replace",
    async (args: GetInferredFromRaw<typeof entityShapeWithoutReadonlyFields> & { id: string }) =>
      updateBase({ newValue: args, httpMethod: "put", type: "total" }),
  )
  defineProperty(update.replace, "asPartial", (inputs: Partial<GetInferredFromRaw<TApiEntityShape>> & { id: string }) =>
    updateBase({ newValue: inputs, httpMethod: "put", type: "partial" }),
  )

  const upsert = async (
    args: TApiCreate | (Partial<GetInferredFromRaw<typeof entityShapeWithoutReadonlyFields>> & { id: string }),
  ) => {
    if ("id" in args && args.id) {
      return updateBase({
        newValue: args as Partial<GetInferredFromRaw<typeof entityShapeWithoutReadonlyFields>> & {
          id: string
        },
      })
    } else {
      return create(args as TApiCreate)
    }
  }

  const baseReturn = { client: axiosLikeClient, retrieve, list, remove, update, create, upsert }

  //TODO: fix any
  if (!modifiedCustomServiceCalls) return baseReturn as any

  //TODO: fix any
  return {
    ...baseReturn,
    customServiceCalls: modifiedCustomServiceCalls,
    csc: modifiedCustomServiceCalls,
  } as any
}
