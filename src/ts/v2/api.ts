import {
  objectToCamelCase,
  objectToSnakeCase,
  SnakeCase,
  SnakeCasedPropertiesDeep,
  toSnakeCase,
} from "@thinknimble/tn-utils"
import { AxiosInstance } from "axios"
import { z } from "zod"
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

type CustomServiceCallInputOutputs<
  TInput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined,
  TOutput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined
> = {
  inputShape: TInput
  outputShape: TOutput
}

type CustomServiceCallback<
  TInput extends z.ZodRawShape | ZodPrimitives = z.ZodVoid,
  TOutput extends z.ZodRawShape | ZodPrimitives = z.ZodVoid
> = (
  params: { client: AxiosInstance } & (TInput extends z.ZodVoid
    ? TOutput extends z.ZodVoid
      ? unknown
      : {
          utils: {
            fromApi: (
              obj: object
            ) => TOutput extends z.ZodRawShape
              ? GetZodInferredTypeFromRaw<TOutput>
              : TOutput extends z.ZodTypeAny
              ? z.infer<TOutput>
              : never
          }
        }
    : TOutput extends z.ZodVoid
    ? {
        utils: {
          toApi: (
            obj: object
          ) => TInput extends z.ZodRawShape
            ? SnakeCasedPropertiesDeep<GetZodInferredTypeFromRaw<TInput>>
            : TInput extends z.ZodTypeAny
            ? z.infer<TInput>
            : never
        }
      }
    : {
        input: TInput extends z.ZodRawShape
          ? GetZodInferredTypeFromRaw<TInput>
          : TInput extends z.ZodTypeAny
          ? z.infer<TInput>
          : never
        utils: {
          fromApi: (
            obj: object
          ) => TOutput extends z.ZodRawShape
            ? GetZodInferredTypeFromRaw<TOutput>
            : TOutput extends z.ZodTypeAny
            ? z.infer<TOutput>
            : never
          toApi: (
            obj: object
          ) => TInput extends z.ZodRawShape
            ? SnakeCasedPropertiesDeep<GetZodInferredTypeFromRaw<TInput>>
            : TInput extends z.ZodTypeAny
            ? z.infer<TInput>
            : never
        }
      })
) => Promise<
  TOutput extends z.ZodRawShape
    ? GetZodInferredTypeFromRaw<TOutput>
    : TOutput extends z.ZodTypeAny
    ? z.infer<TOutput>
    : never
>

type CustomServiceCallOpts<
  TInput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined,
  TOutput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined
> = CustomServiceCallInputOutputs<TInput, TOutput> & { callback: CustomServiceCallback<TInput, TOutput> }

type ZodPrimitives = z.ZodString | z.ZodNumber | z.ZodDate | z.ZodBigInt | z.ZodBoolean | z.ZodUndefined | z.ZodVoid

//! The order of overloads MATTER. This was quite a foot-gun-ish thing to discover. Lesson is: declare overloads from more num of params > less num of params. It kind of makes sense to go narrowing down the parameter possibilities
/**
 * Use this method to get the right type inference when creating a custom service call
 */
export function createCustomServiceCall<
  TInput extends z.ZodRawShape | ZodPrimitives,
  TOutput extends z.ZodRawShape | ZodPrimitives
>(
  models: CustomServiceCallInputOutputs<TInput, TOutput>,
  cb: CustomServiceCallback<TInput, TOutput>
): CustomServiceCallOpts<TInput, TOutput>
export function createCustomServiceCall<TInput extends z.ZodRawShape | ZodPrimitives>(
  models: { inputShape: TInput },
  cb: CustomServiceCallback<TInput, z.ZodVoid>
): CustomServiceCallOpts<TInput, z.ZodVoid>
export function createCustomServiceCall<TOutput extends z.ZodRawShape | ZodPrimitives>(
  models: { outputShape: TOutput },
  cb: CustomServiceCallback<z.ZodVoid, TOutput>
): CustomServiceCallOpts<z.ZodVoid, TOutput>
export function createCustomServiceCall(
  cb: CustomServiceCallback<z.ZodVoid, z.ZodVoid>
): CustomServiceCallOpts<z.ZodVoid, z.ZodVoid>

export function createCustomServiceCall(...args) {
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

type CustomServiceCallPlaceholder = {
  inputShape
  outputShape
  callback: (params: {
    client: AxiosInstance
    input
    utils: { fromApi: (obj: object) => never; toApi: (obj: object) => never }
  }) => Promise<unknown>
}

type CustomServiceCall<TOpts extends object> = TOpts extends Record<string, CustomServiceCallPlaceholder>
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

type ZodRawShapeSnakeCased<T extends z.ZodRawShape> = {
  [TKey in keyof T as SnakeCase<TKey>]: T[TKey]
}

const getSnakeCasedZodRawShape = <T extends z.ZodRawShape>(zodShape: T) => {
  const unknownSnakeCasedZod: unknown = Object.fromEntries(
    Object.entries(zodShape).map(([k, v]) => {
      return [toSnakeCase(k), v]
    })
  )
  return unknownSnakeCasedZod as ZodRawShapeSnakeCased<T>
}
export const getPaginatedSnakeCasedZod = <T extends z.ZodRawShape>(zodShape: T) => {
  return getPaginatedZod(getSnakeCasedZodRawShape(zodShape))
}

export type GetZodInferredTypeFromRaw<T extends z.ZodRawShape> = z.infer<ReturnType<typeof z.object<T>>>

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
  customServiceCalls: CustomServiceCall<TCustomServiceCalls>
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
  endpoint: string
  /**
   * The axios instance created for the app.
   */
  client: AxiosInstance
}

export function createApi<
  TApiEntity extends z.ZodRawShape,
  TApiCreate extends z.ZodRawShape,
  TCustomServiceCalls extends Record<string, CustomServiceCallPlaceholder>,
  TExtraFilters extends z.ZodRawShape = never
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

//! doing overloads to improve UX is a bit of a double-edged sword here. We are risking the type safety within this method! We'd still get errors if we don't match the declared input-outputs from overloads so that's something.
export function createApi({ models, client, endpoint }, customServiceCalls = undefined) {
  const axiosClient: AxiosInstance = client

  const createCustomServiceCallHandler = (serviceCallOpts) => async (inputs: unknown) => {
    const isInputZod = serviceCallOpts.inputShape instanceof z.ZodSchema
    const isOutputZod = serviceCallOpts.outputShape instanceof z.ZodSchema
    const fromApi = (obj: object) =>
      isOutputZod
        ? serviceCallOpts.outputShape.parse(obj)
        : z.object(serviceCallOpts.outputShape).parse(objectToCamelCase(obj))
    const toApi = (obj: object) =>
      isInputZod
        ? serviceCallOpts.inputShape.parse(obj)
        : z.object(getSnakeCasedZodRawShape(serviceCallOpts.inputShape)).parse(objectToSnakeCase(obj))

    return serviceCallOpts.callback({ client, input: inputs, utils: { fromApi, toApi } })
  }

  const modifiedCustomServiceCalls = customServiceCalls
    ? Object.fromEntries(Object.entries(customServiceCalls).map(([k, v]) => [k, createCustomServiceCallHandler(v)]))
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
