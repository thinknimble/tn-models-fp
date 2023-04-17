import { objectToCamelCase, objectToSnakeCase } from "@thinknimble/tn-utils"
import { Axios } from "axios"
import { z } from "zod"
import {
  filtersZod,
  GetInferredFromRaw,
  getPaginatedShape,
  getPaginatedSnakeCasedZod,
  getPaginatedZod,
  Pagination,
  paginationFiltersZod,
  IsNever,
  UnknownIfNever,
  PartializeShape,
} from "../utils"
import {
  CustomServiceCallback,
  CustomServiceCallInputObj,
  CustomServiceCallOpts,
  CustomServiceCallOutputObj,
} from "./types"

type PaginatedServiceCallOptions = {
  uri?: string
  httpMethod?: keyof Pick<Axios, "get" | "post">
}

const paginationObjShape = {
  pagination: z.instanceof(Pagination),
}

type ResolveFilters<T extends z.ZodRawShape = never> = IsNever<T> extends true
  ? unknown
  : T extends z.ZodRawShape
  ? { filtersShape: T }
  : unknown

export function createPaginatedServiceCall<TOutput extends z.ZodRawShape, TFilters extends z.ZodRawShape = never>(
  models: CustomServiceCallOutputObj<TOutput> & ResolveFilters<TFilters>,
  opts?: PaginatedServiceCallOptions
): CustomServiceCallOpts<
  typeof paginationObjShape &
    UnknownIfNever<TFilters, { filters: z.ZodOptional<z.ZodObject<PartializeShape<TFilters>>> }>,
  ReturnType<typeof getPaginatedZod<TOutput>>["shape"]
>
export function createPaginatedServiceCall<
  TOutput extends z.ZodRawShape,
  TFilters extends z.ZodRawShape = never,
  TInput extends z.ZodRawShape = never
>(
  models: CustomServiceCallInputObj<TInput> & CustomServiceCallOutputObj<TOutput> & ResolveFilters<TFilters>,
  opts?: PaginatedServiceCallOptions
): CustomServiceCallOpts<
  UnknownIfNever<TInput> &
    typeof paginationObjShape &
    UnknownIfNever<TFilters, { filters: z.ZodOptional<z.ZodObject<PartializeShape<TFilters>>> }>,
  ReturnType<typeof getPaginatedZod<TOutput>>["shape"]
>

export function createPaginatedServiceCall<
  TOutput extends z.ZodRawShape,
  TFilters extends z.ZodRawShape = never,
  TInput extends z.ZodRawShape = never
>(models: object, opts: PaginatedServiceCallOptions | undefined): CustomServiceCallOpts<any, any> {
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
    typeof paginationObjShape &
      UnknownIfNever<TInput> &
      (IsNever<TFilters> extends true ? unknown : { filters: GetInferredFromRaw<TFilters> }),
    ReturnType<typeof getPaginatedShape<TOutput>>
  > = async ({ client, slashEndingBaseUri, utils, input }) => {
    const filters = "filters" in input ? (input.filters as TFilters) : undefined
    const allFilters = {
      ...(filters ?? {}),
      ...(input.pagination ? { page: input.pagination.page, pageSize: input.pagination.size } : {}),
    }
    const filtersParsed = (
      filtersShape
        ? z.object(filtersShape).partial().and(filtersZod).and(paginationFiltersZod)
        : filtersZod.and(paginationFiltersZod)
    ).parse(allFilters)
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
    const slashEndingUri = uri ? (uri[uri.length - 1] === "/" ? uri : uri + "/") : ""
    const fullUri = `${slashEndingBaseUri}${slashEndingUri}` as `${string}/`
    if (httpMethod === "get") {
      res = await client.get(fullUri, {
        params: snakedCleanParsedFilters,
      })
    } else {
      const { pagination, ...body } = utils.toApi(input) ?? {}
      const validBody = Object.keys(body).length !== 0 ? body : undefined
      res = await client.post(fullUri, validBody, {
        params: snakedCleanParsedFilters,
      })
    }
    const paginatedZod = getPaginatedSnakeCasedZod(outputShape)
    const rawResponse = paginatedZod.parse(res.data)
    //! although this claims not to be of the same type than our converted TOutput, it actually is, but all the added type complexity with camel casing util makes TS to think it is something different. It should be safe to cast this, we should definitely check this at runtime with tests
    const result: unknown = { ...rawResponse, results: rawResponse.results.map((r) => objectToCamelCase(r)) }
    return result as GetInferredFromRaw<ReturnType<typeof getPaginatedShape<TOutput>>>
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
