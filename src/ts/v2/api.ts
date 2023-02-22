import { objectToCamelCase, objectToSnakeCase } from "@thinknimble/tn-utils"
import { AxiosInstance } from "axios"
import { z } from "zod"
import { IPagination } from "../pagination"
import { getPaginatedZod } from "./pagination"
import { parseResponse } from "./response"
import {
  CallbackUtils,
  createApiUtils,
  getPaginatedSnakeCasedZod,
  getSnakeCasedZodRawShape,
  GetZodInferredTypeFromRaw,
  ZodPrimitives,
} from "./utils"

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

type InferCallbackInput<TInput extends z.ZodRawShape | z.ZodTypeAny> = TInput extends z.ZodRawShape
  ? GetZodInferredTypeFromRaw<TInput>
  : TInput extends z.ZodTypeAny
  ? z.infer<TInput>
  : never

type CallbackInput<TInput extends z.ZodRawShape | ZodPrimitives> = TInput extends z.ZodVoid
  ? unknown
  : {
      input: InferCallbackInput<TInput>
    }

type CustomServiceCallback<
  TInput extends z.ZodRawShape | ZodPrimitives = z.ZodVoid,
  TOutput extends z.ZodRawShape | ZodPrimitives = z.ZodVoid
> = (
  params: {
    client: AxiosInstance
    /**
     * Note this endpoint is the same as defined on api creation. So you must address its trailing slash on client call if required
     */
    endpoint: string
  } & CallbackUtils<TInput, TOutput> &
    CallbackInput<TInput>
) => Promise<
  TOutput extends z.ZodRawShape
    ? GetZodInferredTypeFromRaw<TOutput>
    : TOutput extends z.ZodTypeAny
    ? z.infer<TOutput>
    : never
>

type CustomServiceCallInputObj<TInput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined> = {
  inputShape: TInput
}
type CustomServiceCallOutputObj<TOutput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined> = {
  outputShape: TOutput
}

type CustomServiceCallOpts<
  TInput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined,
  TOutput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined
> = CustomServiceCallInputObj<TInput> &
  CustomServiceCallOutputObj<TOutput> & { callback: CustomServiceCallback<TInput, TOutput> }

//! The order of overloads MATTER. This was quite a foot-gun-ish thing to discover. Lesson is: declare overloads from most generic > most narrowed. It kind of makes sense to go narrowing down the parameter possibilities. Seems like the first overload that matches is the one that is used.
/**
 * Create a custom type-inferred service call with both input and output
 */
export function createCustomServiceCall<
  TInput extends z.ZodRawShape | ZodPrimitives,
  TOutput extends z.ZodRawShape | ZodPrimitives
>(
  models: CustomServiceCallInputObj<TInput> & CustomServiceCallOutputObj<TOutput>,
  cb: CustomServiceCallback<TInput, TOutput>
): CustomServiceCallOpts<TInput, TOutput>
/**
 * Create a custom type-inferred service call with input only
 */
export function createCustomServiceCall<TInput extends z.ZodRawShape | ZodPrimitives>(
  models: CustomServiceCallInputObj<TInput>,
  cb: CustomServiceCallback<TInput, z.ZodVoid>
): CustomServiceCallOpts<TInput, z.ZodVoid>
/**
 * Create a custom type-inferred service call with output only
 */
export function createCustomServiceCall<TOutput extends z.ZodRawShape | ZodPrimitives>(
  models: CustomServiceCallOutputObj<TOutput>,
  cb: CustomServiceCallback<z.ZodVoid, TOutput>
): CustomServiceCallOpts<z.ZodVoid, TOutput>
/**
 * Create a custom type-inferred service call with neither input nor output
 */
export function createCustomServiceCall(
  cb: CustomServiceCallback<z.ZodVoid, z.ZodVoid>
): CustomServiceCallOpts<z.ZodVoid, z.ZodVoid>

export function createCustomServiceCall(...args): CustomServiceCallOpts<any, any> {
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
type CustomServiceCallPlaceholder = {
  inputShape
  outputShape
  callback: (params: {
    endpoint: string
    client: AxiosInstance
    input
    utils: { fromApi: (obj: object) => never; toApi: (obj: object) => never }
  }) => Promise<unknown>
}

/**
 * Get resulting custom service call from `createApi`
 */
type CustomServiceCallsRecord<TOpts extends object> = TOpts extends Record<string, CustomServiceCallPlaceholder>
  ? {
      [TKey in keyof TOpts]: (
        inputs: TOpts[TKey]["inputShape"] extends z.ZodRawShape
          ? GetZodInferredTypeFromRaw<TOpts[TKey]["inputShape"]>
          : TOpts[TKey]["inputShape"] extends z.ZodTypeAny
          ? z.infer<TOpts[TKey]["inputShape"]>
          : never
      ) => Promise<
        TOpts[TKey]["outputShape"] extends z.ZodRawShape
          ? GetZodInferredTypeFromRaw<TOpts[TKey]["outputShape"]>
          : TOpts[TKey]["outputShape"] extends z.ZodTypeAny
          ? z.infer<TOpts[TKey]["outputShape"]>
          : never
      >
    }
  : never

type BareApiService<
  TEntity extends z.ZodRawShape,
  TCreate extends z.ZodRawShape,
  TExtraFilters extends z.ZodRawShape = never
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
  TEntity extends z.ZodRawShape,
  TCreate extends z.ZodRawShape,
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
  TApiEntity extends z.ZodRawShape,
  TApiCreate extends z.ZodRawShape,
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
  TApiEntity extends z.ZodRawShape,
  TApiCreate extends z.ZodRawShape,
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
  TApiEntity extends z.ZodRawShape,
  TApiCreate extends z.ZodRawShape,
  TExtraFilters extends z.ZodRawShape = never
>(base: ApiBaseParams<TApiEntity, TApiCreate, TExtraFilters>): BareApiService<TApiEntity, TApiCreate, TExtraFilters>

export function createApi<
  TApiEntity extends z.ZodRawShape,
  TApiCreate extends z.ZodRawShape,
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
    TCustomServiceCalls extends z.ZodRawShape ? TCustomServiceCalls : TExtraFilters
  >,
  customServiceCalls: TCustomServiceCalls | undefined = undefined
) {
  const slashEndingEndpoint = endpoint.at(-1) === "/" ? endpoint : endpoint + "/"
  const createCustomServiceCallHandler =
    (
      serviceCallOpts,
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
        endpoint,
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
      zod: z.object(getSnakeCasedZodRawShape(models.entity)),
    })
    return objectToCamelCase(parsed)
  }

  const create = async (inputs: TApiCreate) => {
    const snaked = objectToSnakeCase(inputs)
    const res = await client.post(endpoint, snaked)
    const snakedEntityShape = getSnakeCasedZodRawShape(models.entity)
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
