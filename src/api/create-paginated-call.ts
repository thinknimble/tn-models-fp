import { objectToCamelCase, objectToSnakeCase } from "@thinknimble/tn-utils"
import { Axios } from "axios"
import { z } from "zod"
import {
  GetInferredFromRaw,
  getPaginatedShape,
  getPaginatedSnakeCasedZod,
  getPaginatedZod,
  Pagination,
  paginationFiltersZod,
  parseResponse,
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

export function createPaginatedServiceCall<
  TOutput extends z.ZodRawShape
  // TFilters extends z.ZodRawShape= never
>(
  models: CustomServiceCallOutputObj<TOutput>,
  opts?: PaginatedServiceCallOptions
): CustomServiceCallOpts<typeof paginationObjShape, ReturnType<typeof getPaginatedZod<TOutput>>["shape"]>
export function createPaginatedServiceCall<
  TOutput extends z.ZodRawShape,
  TInput extends z.ZodRawShape
  // TFilters extends z.ZodRawShape= never
>(
  models: CustomServiceCallInputObj<TInput> & CustomServiceCallOutputObj<TOutput>,
  opts?: PaginatedServiceCallOptions
): CustomServiceCallOpts<TInput & typeof paginationObjShape, ReturnType<typeof getPaginatedZod<TOutput>>["shape"]>

export function createPaginatedServiceCall<TOutput extends z.ZodRawShape, TInput extends z.ZodRawShape>(
  models: object,
  opts: PaginatedServiceCallOptions | undefined
): CustomServiceCallOpts<any, any> {
  const { uri, httpMethod = "get" } = opts ?? {}
  // The output shape should still be the camelCased one so as long as we make sure that we return the same we should be able to cast the result right?. OutputShape will always be camelCased from the user input...
  if (!("outputShape" in models)) {
    throw new Error("You should provide an output shape ")
  }
  const outputShape = models.outputShape as TOutput
  const newOutputShape = getPaginatedShape(outputShape)

  const callback: CustomServiceCallback<
    TInput & typeof paginationObjShape,
    ReturnType<typeof getPaginatedShape<TOutput>>
  > = async ({ client, slashEndingBaseUri, utils, input }) => {
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
    const rawResponse = parseResponse({
      data: res.data,
      identifier: "custom-paginated-call",
      zod: paginatedZod,
    })
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
