import { z } from "zod"
import {
  IsNever,
  FiltersShape,
  GetInferredFromRawWithBrand,
  Pagination,
  UnknownIfNever,
  UnwrapBrandedRecursive,
  ZodPrimitives,
  getPaginatedShape,
  getPaginatedSnakeCasedZod,
  getPaginatedZod,
  objectToCamelCaseArr,
  paginationFiltersZodShape,
  parseFilters,
  parseResponse,
} from "../utils"
import { CustomServiceCallback, ResolveCustomServiceCallOpts } from "./types"

const paginationObjShape = {
  pagination: z.instanceof(Pagination),
}

export const createPaginatedServiceCall = <
  TOutput extends z.ZodRawShape = z.ZodRawShape,
  TFilters extends FiltersShape = never,
  //things that are optional are better off being  never so that we can decided later whether we want to void them or not to exclude them from things
  TInput extends z.ZodRawShape | ZodPrimitives = never,
  TReturnType extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = ReturnType<
    typeof getPaginatedZod<UnwrapBrandedRecursive<TOutput>>
  >["shape"],
>({
  inputShape,
  outputShape,
  filtersShape,
  opts,
}: {
  outputShape: TOutput
  inputShape?: TInput
  filtersShape?: TFilters
  opts?: {
    /**
     * Disable the logging of errors if the response type doesn't match the one expected from the library
     */
    disableLoggingWarning?: boolean
    /**
     * Choose the http method you want this call to be executed as
     */
    httpMethod?: "post" | "get"
    /**
     * Optionally point to another uri different than the original
     */
    uri?: IsNever<TInput> extends true
      ? string
      : TInput extends { urlParams: z.ZodObject<any> }
        ? (input: z.infer<TInput["urlParams"]>) => string
        : string
  }
}): ResolveCustomServiceCallOpts<UnknownIfNever<TInput> & typeof paginationObjShape, TReturnType, TFilters> => {
  const uri = opts?.uri as ((input: unknown) => string) | undefined | string
  const httpMethod = opts?.httpMethod ?? "get"
  const filtersShapeResolved = filtersShape && Object.keys(filtersShape).length ? filtersShape : undefined
  // The output shape should still be the camelCased one so as long as we make sure that we return the same we should be able to cast the result right?. OutputShape will always be camelCased from the user input...
  if (!outputShape) {
    throw new Error("You should provide an output shape ")
  }
  if (inputShape && "urlParams" in inputShape && typeof opts?.uri !== "function") {
    throw new Error("If you provide url params you should pass an uri builder function in opts.uri")
  }

  const newOutputShape = getPaginatedShape(outputShape)

  const callback: CustomServiceCallback<
    typeof paginationObjShape & UnknownIfNever<TInput>,
    ReturnType<typeof getPaginatedShape<TOutput>>,
    TFilters
  > = async ({ client, slashEndingBaseUri, utils, input, parsedFilters }) => {
    const paginationFilters = input.pagination
      ? { page: input.pagination.page, pageSize: input.pagination.size }
      : undefined
    const parsedPaginationFilters = parseFilters({ shape: paginationFiltersZodShape, filters: paginationFilters }) ?? {}
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
      onError: opts?.disableLoggingWarning ? null : undefined,
    })
    //! although this claims not to be of the same type than our converted TOutput, it actually is, but all the added type complexity with camel casing util makes TS to think it is something different. It should be safe to cast this, we should definitely check this at runtime with tests
    const result: unknown = { ...rawResponse, results: rawResponse.results.map((r) => objectToCamelCaseArr(r)) }
    return result as GetInferredFromRawWithBrand<ReturnType<typeof getPaginatedShape<TOutput>>>
  }
  if (inputShape) {
    return {
      callback: callback as CustomServiceCallback<any, any, any>,
      inputShape,
      outputShape: newOutputShape,
      filtersShape: filtersShapeResolved ?? z.void(),
    } as unknown as ResolveCustomServiceCallOpts<
      UnknownIfNever<TInput> & typeof paginationObjShape,
      // TODO: test this callback return type
      TReturnType,
      TFilters
    >
  }
  return {
    callback: callback as CustomServiceCallback<any, any, any>,
    inputShape: z.void(),
    outputShape: newOutputShape,
    filtersShape: filtersShapeResolved ?? z.void(),
  } as unknown as ResolveCustomServiceCallOpts<
    UnknownIfNever<TInput> & typeof paginationObjShape,
    // TODO: test this callback return type
    TReturnType,
    TFilters
  >
}
