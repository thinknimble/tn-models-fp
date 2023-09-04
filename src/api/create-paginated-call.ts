import { Axios } from "axios"
import { z } from "zod"
import {
  FiltersShape,
  GetInferredFromRawWithBrand,
  Pagination,
  UnknownIfNever,
  UnwrapBrandedRecursive,
  getPaginatedShape,
  getPaginatedSnakeCasedZod,
  getPaginatedZod,
  objectToCamelCaseArr,
  paginationFiltersZodShape,
  parseFilters,
  parseResponse,
} from "../utils"
import {
  CustomServiceCallFiltersObj,
  CustomServiceCallInputObj,
  CustomServiceCallOpts,
  CustomServiceCallOutputObj,
  CustomServiceCallback,
} from "./types"

type PaginatedServiceCallOptions<
  TInput extends (z.ZodRawShape & { urlParams?: z.ZodObject<any> }) | z.ZodVoid = z.ZodVoid
> = {
  uri?: TInput extends { urlParams: z.ZodObject<any> } ? (input: z.infer<TInput["urlParams"]>) => string : string
  httpMethod?: keyof Pick<Axios, "get" | "post">
}

const paginationObjShape = {
  pagination: z.instanceof(Pagination),
}

type ResolvedCreatePaginatedServiceCallParameters<
  TOutput extends z.ZodRawShape,
  TFilters extends FiltersShape | z.ZodVoid = z.ZodVoid,
  TInput extends (z.ZodRawShape & { urlParams?: z.ZodObject<any> }) | z.ZodVoid = z.ZodVoid
> = [
  models: CustomServiceCallInputObj<TInput> &
    CustomServiceCallOutputObj<TOutput> &
    CustomServiceCallFiltersObj<TFilters, TOutput>,
  ...opts: TInput extends { urlParams: z.ZodObject<any> }
    ? [{ uri: (input: z.infer<TInput["urlParams"]>) => string; httpMethod?: keyof Pick<Axios, "get" | "post"> }]
    : [{ uri?: string; httpMethod?: keyof Pick<Axios, "get" | "post"> } | undefined]
]
export function createPaginatedServiceCall<
  TOutput extends z.ZodRawShape,
  TFilters extends FiltersShape | z.ZodVoid = z.ZodVoid,
  TInput extends (z.ZodRawShape & { urlParams?: z.ZodObject<any> }) | z.ZodVoid = z.ZodVoid
>(
  ...args: ResolvedCreatePaginatedServiceCallParameters<TOutput, TFilters, TInput>
): CustomServiceCallOpts<
  UnknownIfNever<TInput> & typeof paginationObjShape,
  // TODO: test this callback return type
  ReturnType<typeof getPaginatedZod<UnwrapBrandedRecursive<TOutput>>>["shape"],
  TFilters
>

export function createPaginatedServiceCall<
  TOutput extends z.ZodRawShape,
  TFilters extends FiltersShape | z.ZodVoid = z.ZodVoid
>(
  models: CustomServiceCallOutputObj<TOutput> & CustomServiceCallFiltersObj<TFilters, TOutput>,
  opts?: PaginatedServiceCallOptions
): CustomServiceCallOpts<
  typeof paginationObjShape,
  ReturnType<typeof getPaginatedZod<UnwrapBrandedRecursive<TOutput>>>["shape"],
  TFilters
>

export function createPaginatedServiceCall<
  TOutput extends z.ZodRawShape,
  TFilters extends FiltersShape = never,
  TInput extends z.ZodRawShape & { urlParams?: z.ZodObject<any> } = never
>(models: object, opts: PaginatedServiceCallOptions<TInput> | undefined): CustomServiceCallOpts<any, any, any> {
  const uri = opts?.uri as ((input: unknown) => string) | undefined | string
  const httpMethod = opts?.httpMethod ?? "get"
  const filtersShape =
    "filtersShape" in models && Object.keys(models.filtersShape as TFilters).length
      ? (models.filtersShape as TFilters)
      : undefined
  // The output shape should still be the camelCased one so as long as we make sure that we return the same we should be able to cast the result right?. OutputShape will always be camelCased from the user input...
  if (!("outputShape" in models)) {
    throw new Error("You should provide an output shape ")
  }
  if (
    "inputShape" in models &&
    typeof models.inputShape === "object" &&
    models.inputShape !== null &&
    "urlParams" in models.inputShape &&
    typeof opts?.uri !== "function"
  ) {
    throw new Error("If you provide url params you should pass an uri builder function in opts.uri")
  }
  const outputShape = models.outputShape as TOutput
  const newOutputShape = getPaginatedShape(outputShape)

  const callback: CustomServiceCallback<
    typeof paginationObjShape & UnknownIfNever<TInput>,
    ReturnType<typeof getPaginatedShape<TOutput>>,
    TFilters
  > = async ({ client, slashEndingBaseUri, utils, input, parsedFilters }) => {
    const paginationFilters = input.pagination
      ? { page: input.pagination.page, pageSize: input.pagination.size }
      : undefined
    const parsedPaginationFilters = parseFilters(paginationFiltersZodShape, paginationFilters) ?? {}
    const snakedCleanParsedFilters = { ...parsedPaginationFilters, ...(parsedFilters ?? {}) }
    let res
    let parsedInput = input
    let parsedUrlParams
    if ("urlParams" in input) {
      const { urlParams, ...rest } = input
      parsedUrlParams = urlParams
      parsedInput = rest
    }
    const resolvedUri =
      parsedUrlParams && typeof uri === "function" ? uri(parsedUrlParams) : typeof uri !== "function" ? uri ?? "" : ""

    const makeSlashEnding = (str: string) => {
      return str ? (str[str.length - 1] === "/" ? str : str + "/") : ""
    }
    const slashEndingUri = makeSlashEnding(resolvedUri)
    const fullUri = `${slashEndingBaseUri}${slashEndingUri}` as `${string}/`
    if (httpMethod === "get") {
      res = await client.get(fullUri, {
        params: snakedCleanParsedFilters,
      })
    } else {
      const { pagination: _, ...body } = utils.toApi(parsedInput) ?? {}
      const validBody = Object.keys(body).length !== 0 ? body : undefined
      res = await client.post(fullUri, validBody, {
        params: snakedCleanParsedFilters,
      })
    }
    const paginatedZod = getPaginatedSnakeCasedZod(outputShape)
    const rawResponse = parseResponse({
      data: res.data,
      identifier: "custom-paginated-call",
      zod: paginatedZod,
    })
    //! although this claims not to be of the same type than our converted TOutput, it actually is, but all the added type complexity with camel casing util makes TS to think it is something different. It should be safe to cast this, we should definitely check this at runtime with tests
    const result: unknown = { ...rawResponse, results: rawResponse.results.map((r) => objectToCamelCaseArr(r)) }
    return result as GetInferredFromRawWithBrand<ReturnType<typeof getPaginatedShape<TOutput>>>
  }
  if ("inputShape" in models) {
    return {
      callback: callback as CustomServiceCallback<any, any, any>,
      inputShape: models.inputShape,
      outputShape: newOutputShape,
      filtersShape: filtersShape ?? z.void(),
    }
  }
  return {
    callback: callback as CustomServiceCallback<any, any, any>,
    inputShape: z.void(),
    outputShape: newOutputShape,
    filtersShape: filtersShape ?? z.void(),
  }
}
