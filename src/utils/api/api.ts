import { CamelCasedPropertiesDeep, objectToCamelCase, objectToSnakeCase, toCamelCase } from "@thinknimble/tn-utils"
import { z } from "zod"
import { parseResponse } from "../response"
import { isZod, isZodArray, resolveRecursiveZod, zodObjectRecursive, ZodPrimitives } from "../zod"
import { CallbackUtils, FromApiCall, ToApiCall } from "./types"
import { AxiosInstance } from "axios"
import { AxiosLike } from "../../api/types"
import { parseFilters } from "../filters"

//TODO: this should probably move to tn-utils but will keep it here for a quick release
export const objectToCamelCaseArr = <T extends object>(obj: T): CamelCasedPropertiesDeep<T> => {
  if (typeof obj !== "object" || obj === null) return obj
  if (Array.isArray(obj)) return obj.map((o) => objectToCamelCaseArr(o)) as CamelCasedPropertiesDeep<T>
  const entries = Object.entries(obj)
  const newEntries = []
  for (const [k, v] of entries) {
    newEntries.push([toCamelCase(k), objectToCamelCaseArr(v)])
  }
  return Object.fromEntries(newEntries)
}

const createToApiHandler = <T extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>>(inputShape: T) => {
  const isInputZodPrimitive = inputShape instanceof z.ZodSchema
  // Given that this is under our control, we should not do safe parse, if the parsing fails means something is wrong (you're not complying with the schema you defined)
  if (isZod(inputShape) && isZodArray(inputShape)) {
    if (inputShape.element)
      return (arr: unknown[]) =>
        (typeof arr?.[0] === "object"
          ? resolveRecursiveZod(inputShape).parse(arr.map((i) => objectToSnakeCase(i as object)))
          : arr) as ToApiCall<T>
  }
  if (isInputZodPrimitive) return
  return isInputZodPrimitive
    ? undefined
    : (((obj: object) => zodObjectRecursive(z.object(inputShape)).parse(objectToSnakeCase(obj))) as ToApiCall<T>)
}

const createFromApiHandler = <T extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>>(
  outputShape: T,
  callerName: string
) => {
  const isOutputZodArray = outputShape instanceof z.ZodArray
  const isOutputZodPrimitive = outputShape instanceof z.ZodSchema

  // since this checks for the api response, which we don't control, we can't strict parse, else we would break the flow. We'd rather safe parse and show a warning if there's a mismatch
  if (isOutputZodArray) {
    return (obj: unknown[]) =>
      parseResponse({
        identifier: callerName,
        data: typeof obj?.[0] === "object" && obj ? obj.map((o) => objectToCamelCase(o as object)) : obj,
        zod: outputShape,
      })
  }
  return isOutputZodPrimitive
    ? undefined
    : (((obj: object) => {
        return parseResponse({
          identifier: callerName,
          data: objectToCamelCaseArr(obj) ?? {},
          zod: z.object(outputShape),
        })
      }) as FromApiCall<T>)
}

export function createApiUtils<
  TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>,
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>
>(
  args: { name: string } & (
    | { inputShape: TInput; outputShape: TOutput }
    | { inputShape: TInput }
    | { outputShape: TOutput }
  )
) {
  if (!("inputShape" in args || "outputShape" in args)) return {} as CallbackUtils<TInput, TOutput>
  const fromApi = "outputShape" in args ? createFromApiHandler(args.outputShape, args.name) : undefined
  const toApi = "inputShape" in args ? createToApiHandler(args.inputShape) : undefined
  return (
    fromApi || toApi
      ? {
          utils: {
            ...(fromApi ? { fromApi } : {}),
            ...(toApi ? { toApi } : {}),
          },
        }
      : null
  ) as CallbackUtils<TInput, TOutput>
}

//TODO: improve types
export const createCustomServiceCallHandler =
  ({
    client,
    serviceCallOpts,
    baseUri,
    name,
  }: {
    serviceCallOpts: any
    /**
     * This name allow us to keep record of which method it is, so that we can identify in case of output mismatch
     */
    client: AxiosInstance | AxiosLike
    name?: string
    baseUri?: string
  }) =>
  async (args: { input?: unknown; filters?: unknown }) => {
    const utils = createApiUtils({
      name: name ?? "No-Name call",
      inputShape: serviceCallOpts.inputShape,
      outputShape: serviceCallOpts.outputShape,
    })
    const utilsResult = utils ?? {}
    const parsedFilters = parseFilters(serviceCallOpts.filtersShape, args?.filters)
    const filtersResult = parsedFilters ? { filters: parsedFilters } : {}
    const inputResult = args?.input ? { input: args.input } : {}

    const resultArgs = {
      client,
      slashEndingBaseUri: baseUri,
      ...inputResult,
      ...utilsResult,
      ...filtersResult,
    }
    return serviceCallOpts.callback(resultArgs)
  }
