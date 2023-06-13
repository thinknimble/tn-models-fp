import { objectToCamelCase } from "@thinknimble/tn-utils"
import { Axios } from "axios"
import { z } from "zod"
import {
  FiltersShape,
  GetInferredFromRawWithBrand,
  Pagination,
  UnknownIfNever,
  getPaginatedShape,
  getPaginatedSnakeCasedZod,
  getPaginatedZod,
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

type PaginatedServiceCallOptions = {
  uri?: string
  httpMethod?: keyof Pick<Axios, "get" | "post">
}

const paginationObjShape = {
  pagination: z.instanceof(Pagination),
}

export function createPaginatedServiceCall<
  TOutput extends z.ZodRawShape,
  TFilters extends FiltersShape | z.ZodVoid = z.ZodVoid,
  TInput extends z.ZodRawShape | z.ZodVoid = z.ZodVoid
>(
  models: CustomServiceCallInputObj<TInput> &
    CustomServiceCallOutputObj<TOutput> &
    CustomServiceCallFiltersObj<TFilters, TOutput>,
  opts?: PaginatedServiceCallOptions
): CustomServiceCallOpts<
  UnknownIfNever<TInput> & typeof paginationObjShape,
  ReturnType<typeof getPaginatedZod<TOutput>>["shape"],
  TFilters
>

export function createPaginatedServiceCall<
  TOutput extends z.ZodRawShape,
  TFilters extends FiltersShape | z.ZodVoid = z.ZodVoid
>(
  models: CustomServiceCallOutputObj<TOutput> & CustomServiceCallFiltersObj<TFilters, TOutput>,
  opts?: PaginatedServiceCallOptions
): CustomServiceCallOpts<typeof paginationObjShape, ReturnType<typeof getPaginatedZod<TOutput>>["shape"], TFilters>

export function createPaginatedServiceCall<
  TOutput extends z.ZodRawShape,
  TFilters extends FiltersShape = never,
  TInput extends z.ZodRawShape = never
>(models: object, opts: PaginatedServiceCallOptions | undefined): CustomServiceCallOpts<any, any, any> {
  const uri = opts?.uri
  const httpMethod = opts?.httpMethod ?? "get"
  const filtersShape =
    "filtersShape" in models && Object.keys(models.filtersShape as TFilters).length
      ? (models.filtersShape as TFilters)
      : undefined
  // The output shape should still be the camelCased one so as long as we make sure that we return the same we should be able to cast the result right?. OutputShape will always be camelCased from the user input...
  if (!("outputShape" in models)) {
    throw new Error("You should provide an output shape ")
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
    const slashEndingUri = uri ? (uri[uri.length - 1] === "/" ? uri : uri + "/") : ""
    const fullUri = `${slashEndingBaseUri}${slashEndingUri}` as `${string}/`
    if (httpMethod === "get") {
      res = await client.get(fullUri, {
        params: snakedCleanParsedFilters,
      })
    } else {
      const { pagination: _, ...body } = utils.toApi(input) ?? {}
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
    const result: unknown = { ...rawResponse, results: rawResponse.results.map((r) => objectToCamelCase(r)) }
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
