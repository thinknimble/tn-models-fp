import { objectToCamelCase, objectToSnakeCase } from "@thinknimble/tn-utils"
import { AxiosInstance, Axios } from "axios"
import { z } from "zod"
import { IPagination } from "./pagination"
import { parseResponse } from "./response"
import {
  CallbackUtils,
  createApiUtils,
  GetInferredFromRaw,
  GetInferredRecursiveShape,
  getPaginatedSnakeCasedZod,
  Prettify,
  recursiveShapeToValidZodRawShape,
  ZodPrimitives,
  ZodRecursiveShape,
  zodRecursiveShapeToSnakeCase,
} from "./utils"
import { getPaginatedShape, getPaginatedZod } from "./utils/pagination"
import { Pagination } from "./pagination"

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

type InferCallbackInput<TInput extends ZodRecursiveShape | z.ZodType> = TInput extends z.ZodRawShape
  ? GetInferredFromRaw<TInput>
  : TInput extends ZodRecursiveShape<infer Res>
  ? GetInferredRecursiveShape<TInput>
  : TInput extends z.ZodType
  ? z.infer<TInput>
  : never

type CallbackInput<TInput extends ZodRecursiveShape | ZodPrimitives> = TInput extends z.ZodVoid
  ? unknown
  : {
      input: InferCallbackInput<TInput>
    }

type CustomServiceCallback<
  TInput extends ZodRecursiveShape | ZodPrimitives = z.ZodVoid,
  TOutput extends ZodRecursiveShape | ZodPrimitives = z.ZodVoid
> = (
  params: {
    client: AxiosInstance
    /**
     * This uri has a trailing slash. Regardless of whether you added it on createApi call or not.
     */
    endpoint: string
  } & CallbackUtils<TInput, TOutput> &
    CallbackInput<TInput>
) => Promise<
  TOutput extends ZodRecursiveShape<infer Res>
    ? GetInferredRecursiveShape<Res>
    : TOutput extends z.ZodTypeAny
    ? z.infer<TOutput>
    : never
>

type CustomServiceCallInputObj<TInput extends ZodRecursiveShape | ZodPrimitives = z.ZodUndefined> = {
  inputShape: TInput
}
type CustomServiceCallOutputObj<TOutput extends ZodRecursiveShape | ZodPrimitives = z.ZodUndefined> = {
  outputShape: TOutput
}

type CustomServiceCallOpts<
  TInput extends ZodRecursiveShape | ZodPrimitives = z.ZodUndefined,
  TOutput extends ZodRecursiveShape | ZodPrimitives = z.ZodUndefined
> = CustomServiceCallInputObj<TInput> &
  CustomServiceCallOutputObj<TOutput> & { callback: CustomServiceCallback<TInput, TOutput> }

//! The order of overloads MATTER. This was quite a foot-gun-ish thing to discover. Lesson is: declare overloads from most generic > most narrowed. It kind of makes sense to go narrowing down the parameter possibilities. Seems like the first overload that matches is the one that is used.
/**
 * Create a custom type-inferred service call with both input and output
 */
export function createCustomServiceCall<
  TInput extends ZodRecursiveShape | ZodPrimitives,
  TOutput extends ZodRecursiveShape | ZodPrimitives
>(
  models: CustomServiceCallInputObj<TInput> & CustomServiceCallOutputObj<TOutput>,
  cb: CustomServiceCallback<TInput, TOutput>
): CustomServiceCallOpts<TInput, TOutput>
/**
 * Create a custom type-inferred service call with input only
 */
export function createCustomServiceCall<TInput extends ZodRecursiveShape | ZodPrimitives>(
  models: CustomServiceCallInputObj<TInput>,
  cb: CustomServiceCallback<TInput, z.ZodVoid>
): CustomServiceCallOpts<TInput, z.ZodVoid>
/**
 * Create a custom type-inferred service call with output only
 */
export function createCustomServiceCall<TOutput extends ZodRecursiveShape | ZodPrimitives>(
  models: CustomServiceCallOutputObj<TOutput>,
  cb: CustomServiceCallback<z.ZodVoid, TOutput>
): CustomServiceCallOpts<z.ZodVoid, TOutput>
/**
 * Create a custom type-inferred service call with neither input nor output
 */
export function createCustomServiceCall(
  cb: CustomServiceCallback<z.ZodVoid, z.ZodVoid>
): CustomServiceCallOpts<z.ZodVoid, z.ZodVoid>

export function createCustomServiceCall(...args: any[]): CustomServiceCallOpts<any, any> {
  const [first, second] = args
  if (typeof first === "function") {
    return { callback: first, inputShape: z.void(), outputShape: z.void() }
  }
  if ("inputShape" in first && "outputShape" in first) {
    return {
      inputShape: first.inputShape,
      outputShape: first.outputShape,
      callback: second,
    }
  }
  if ("inputShape" in first) {
    return {
      inputShape: first.inputShape,
      outputShape: z.void(),
      callback: second,
    }
  }

  // only output
  return {
    inputShape: z.void(),
    outputShape: first.outputShape,
    callback: second,
  }
}

/**
 * Base type for custom service calls which serves as a placeholder to later take advantage of inference
 */
type FromApiPlaceholder = { fromApi: (obj: object) => any }
type ToApiPlaceholder = { toApi: (obj: object) => any }
type CustomServiceCallPlaceholder = {
  inputShape: object
  outputShape: object
  callback: (params: {
    endpoint: string
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
        inputs: TOpts[TKey]["inputShape"] extends ZodRecursiveShape<infer TInputShape>
          ? GetInferredRecursiveShape<TInputShape>
          : TOpts[TKey]["inputShape"] extends z.ZodTypeAny
          ? z.infer<TOpts[TKey]["inputShape"]>
          : never
      ) => Promise<
        TOpts[TKey]["outputShape"] extends ZodRecursiveShape<infer TOutputShape>
          ? GetInferredRecursiveShape<TOutputShape>
          : TOpts[TKey]["outputShape"] extends z.ZodTypeAny
          ? z.infer<TOpts[TKey]["outputShape"]>
          : never
      >
    }
  : never

type BareApiService<
  TEntity extends ZodRecursiveShape,
  TCreate extends ZodRecursiveShape,
  TExtraFilters extends z.ZodRawShape = never
> = {
  client: AxiosInstance
  retrieve(id: string): Promise<GetInferredRecursiveShape<TEntity>>
  create(inputs: GetInferredRecursiveShape<TCreate>): Promise<GetInferredRecursiveShape<TEntity>>
  list(params?: {
    filters?: GetInferredFromRaw<TExtraFilters> & z.infer<typeof filtersZod>
    pagination?: IPagination
  }): Promise<z.infer<ReturnType<typeof getPaginatedZod<TEntity>>>>
}
type ApiService<
  TEntity extends ZodRecursiveShape,
  TCreate extends ZodRecursiveShape,
  //extending from record makes it so that if you try to access anything it would not error, we want to actually error if there is no key in TCustomServiceCalls that does not belong to it
  TCustomServiceCalls extends object,
  TExtraFilters extends z.ZodRawShape = never
> = BareApiService<TEntity, TCreate, TExtraFilters> & {
  /**
   * The custom calls you declared as input but as plain functions and wrapped for type safety
   */
  customServiceCalls: CustomServiceCallsRecord<TCustomServiceCalls>
  /**
   * Alias for customServiceCalls
   */
  csc: CustomServiceCallsRecord<TCustomServiceCalls>
}

type ApiBaseParams<
  TApiEntity extends ZodRecursiveShape,
  TApiCreate extends ZodRecursiveShape,
  TExtraFilters extends z.ZodRawShape = never
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
    /**
     * Zod raw shape of extra filters if any
     */
    extraFilters?: TExtraFilters
  }
  /**
   * The base endpoint for te api to hit. We append this to request's uris for listing, retrieving and creating
   */
  readonly endpoint: string
  /**
   * The axios instance created for the app.
   */
  client: AxiosInstance
}

export function createApi<
  TApiEntity extends ZodRecursiveShape,
  TApiCreate extends ZodRecursiveShape,
  TExtraFilters extends z.ZodRawShape = never,
  TCustomServiceCalls extends Record<string, CustomServiceCallPlaceholder> = never
>(
  base: ApiBaseParams<TApiEntity, TApiCreate, TExtraFilters>,
  /**
   * Create your own custom service calls to use with this API. Tools for case conversion are provided.
   */
  customServiceCalls: TCustomServiceCalls
): ApiService<TApiEntity, TApiCreate, TCustomServiceCalls, TExtraFilters>

export function createApi<
  TApiEntity extends ZodRecursiveShape,
  TApiCreate extends ZodRecursiveShape,
  TExtraFilters extends z.ZodRawShape = never
>(base: ApiBaseParams<TApiEntity, TApiCreate, TExtraFilters>): BareApiService<TApiEntity, TApiCreate, TExtraFilters>

export function createApi<
  TApiEntity extends ZodRecursiveShape,
  TApiCreate extends ZodRecursiveShape,
  TExtraFilters extends z.ZodRawShape = never,
  TCustomServiceCalls extends Record<string, CustomServiceCallPlaceholder> = never
>(
  {
    models,
    client,
    endpoint,
  }: ApiBaseParams<
    TApiEntity,
    TApiCreate,
    //? I don't get why I did this? --
    TCustomServiceCalls extends z.ZodRawShape ? TCustomServiceCalls : TExtraFilters
  >,
  customServiceCalls: TCustomServiceCalls | undefined = undefined
) {
  const slashEndingEndpoint = endpoint[endpoint.length - 1] === "/" ? endpoint : endpoint + "/"
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
        endpoint: slashEndingEndpoint,
        ...inputResult,
        ...(utilsResult ? utilsResult : {}),
      })
    }

  const modifiedCustomServiceCalls = customServiceCalls
    ? (Object.fromEntries(
        Object.entries(customServiceCalls).map(([k, v]) => [k, createCustomServiceCallHandler(v, k)])
      ) as CustomServiceCallsRecord<TCustomServiceCalls>)
    : undefined

  const retrieve = async (id: string) => {
    //TODO: should we allow the user to set their own id zod schema?
    if (!uuidZod.safeParse(id).success) {
      console.warn("The passed id is not a valid UUID, check your input")
    }
    const uri = `${slashEndingEndpoint}${id}/`
    const res = await client.get(uri)
    const parsed = parseResponse({
      identifier: `${retrieve.name} ${uri}`,
      data: res.data,
      zod: z.object(recursiveShapeToValidZodRawShape(zodRecursiveShapeToSnakeCase(models.entity))),
    })
    return objectToCamelCase(parsed)
  }

  const create = async (inputs: TApiCreate) => {
    const snaked = objectToSnakeCase(inputs)
    const res = await client.post(slashEndingEndpoint, snaked)
    const snakedEntityShape = recursiveShapeToValidZodRawShape(zodRecursiveShapeToSnakeCase(models.entity))
    const parsed = parseResponse({
      identifier: `${create.name} ${endpoint}`,
      data: res.data,
      zod: z.object(snakedEntityShape),
    })
    return objectToCamelCase(parsed)
  }

  const list = async (params: Parameters<BareApiService<TApiEntity, TApiCreate, TExtraFilters>["list"]>[0]) => {
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

    const res = await client.get(slashEndingEndpoint, {
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
    csc: modifiedCustomServiceCalls,
  }
}

type PaginatedServiceCallOptions = {
  uri: string
  httpMethod?: keyof Pick<Axios, "get" | "post">
}

const paginationObjShape = {
  pagination: z.instanceof(Pagination),
}

export function createPaginatedServiceCall<
  TOutput extends ZodRecursiveShape
  // TFilters extends z.ZodRawShape= never
>(
  models: CustomServiceCallOutputObj<TOutput>,
  opts: PaginatedServiceCallOptions
): CustomServiceCallOpts<typeof paginationObjShape, ReturnType<typeof getPaginatedShape<TOutput>>>
export function createPaginatedServiceCall<
  TOutput extends ZodRecursiveShape,
  TInput extends ZodRecursiveShape
  // TFilters extends z.ZodRawShape= never
>(
  models: CustomServiceCallInputObj<TInput> & CustomServiceCallOutputObj<TOutput>,
  opts: PaginatedServiceCallOptions
): CustomServiceCallOpts<TInput & typeof paginationObjShape, ReturnType<typeof getPaginatedShape<TOutput>>>

export function createPaginatedServiceCall<TOutput extends ZodRecursiveShape, TInput extends ZodRecursiveShape>(
  models: object,
  { uri, httpMethod = "get" }: PaginatedServiceCallOptions
): CustomServiceCallOpts<any, any> {
  // The output shape should still be the camelCased one so as long as we make sure that we return the same we should be able to cast the result right?. OutputShape will always be camelCased from the user input...
  if (!("outputShape" in models)) {
    throw new Error("You should provide an output shape ")
  }
  const outputShape = models.outputShape as TOutput
  const newOutputShape = getPaginatedShape(outputShape)
  const inputShape =
    "inputShape" in models && models.inputShape
      ? { ...models.inputShape, pagination: z.instanceof(Pagination) }
      : undefined
  const callback: CustomServiceCallback<
    TInput & typeof paginationObjShape,
    ReturnType<typeof getPaginatedShape<TOutput>>
  > = async ({ client, endpoint, utils, input }) => {
    const allFilters = {
      ...(input.pagination ? { page: input.pagination.page, pageSize: input.pagination.size } : {}),
    }
    const filtersParsed = paginationFiltersZod.parse(allFilters)
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

    let res
    const fullUri = `${endpoint}${uri}`
    if (httpMethod === "get") {
      res = await client.get(fullUri, {
        params: snakedCleanParsedFilters,
      })
    } else {
      const { pagination, ...body } = input ?? {}
      const validBody = Object.keys(body).length !== 0 ? body : undefined
      res = await client.post(fullUri, validBody, {
        params: snakedCleanParsedFilters,
      })
    }
    const paginatedZod = getPaginatedSnakeCasedZod(outputShape)
    const rawResponse = paginatedZod.parse(res.data)
    //! although this claims not to be of the same type than our converted TOutput, it actually is, but all the added type complexity with camel casing util makes TS to think it is something different. It should be safe to cast this, we should definitely check this at runtime with tests
    const result: unknown = { ...rawResponse, results: rawResponse.results.map((r) => objectToCamelCase(r)) }
    return result as GetInferredRecursiveShape<ReturnType<typeof getPaginatedShape<TOutput>>>
  }
  if ("inputShape" in models) {
    return {
      callback: callback as CustomServiceCallback<z.ZodVoid, any>,
      inputShape: models.inputShape,
      outputShape: newOutputShape,
    }
  }
  return {
    callback: callback as CustomServiceCallback<any, any>,
    inputShape: z.void(),
    outputShape: newOutputShape,
  }
}
