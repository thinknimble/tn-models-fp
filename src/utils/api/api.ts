import { CamelCasedPropertiesDeep, SnakeCasedPropertiesDeep, toCamelCase, toSnakeCase } from "@thinknimble/tn-utils"
import { AxiosInstance } from "axios"
import { z } from "zod"
import { AxiosLike } from "../../api/types"
import { parseFilters } from "../filters"
import { Pagination } from "../pagination"
import { parseResponse } from "../response"
import {
  StripReadonlyBrand,
  ZodPrimitives,
  isZodArray,
  isZodPrimitive,
  isZodReadonly,
  isZodVoid,
  resolveRecursiveZod,
  zodObjectToSnakeRecursive,
} from "../zod"
import { CallbackUtils, FromApiCall, ToApiCall } from "./types"

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
export const objectToSnakeCaseArr = <T extends object>(obj: T): SnakeCasedPropertiesDeep<T> => {
  if (typeof obj !== "object" || obj === null) return obj
  if (Array.isArray(obj)) return obj.map((o) => objectToSnakeCaseArr(o)) as SnakeCasedPropertiesDeep<T>
  const entries = Object.entries(obj)
  const newEntries = []
  for (const [k, v] of entries) {
    newEntries.push([toSnakeCase(k), objectToSnakeCaseArr(v)])
  }
  return Object.fromEntries(newEntries)
}

const createToApiHandler = <T extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>>(inputShape: T) => {
  // Given that this is under our control, we should not do safe parse, if the parsing fails means something is wrong (you're not complying with the schema you defined)
  if (isZodArray(inputShape)) {
    return (arr: unknown[]) =>
      (typeof arr?.[0] === "object"
        ? resolveRecursiveZod(inputShape).parse(arr.map((i) => objectToSnakeCaseArr(i as object)))
        : arr) as ToApiCall<T>
  }
  if (isZodPrimitive(inputShape)) return
  return ((obj: object) => {
    return zodObjectToSnakeRecursive(z.object(inputShape)).parse(objectToSnakeCaseArr(obj))
  }) as ToApiCall<T>
}

const createFromApiHandler = <T extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>>(
  outputShape: T,
  callerName: string
) => {
  const isOutputZodArray = isZodArray(outputShape)
  const isOutputZodPrimitive = isZodPrimitive(outputShape)

  // since this checks for the api response, which we don't control, we can't strict parse, else we would break the flow. We'd rather safe parse and show a warning if there's a mismatch
  if (isOutputZodArray) {
    return (obj: unknown[]) =>
      parseResponse({
        identifier: callerName,
        data: typeof obj?.[0] === "object" && obj ? obj.map((o) => objectToCamelCaseArr(o as object)) : obj,
        zod: outputShape,
      })
  }
  //! This would send all other things that are not shapes (and not primitives) such as unions and intersections down the drain since we don't have support for those in outputShapes.
  if (isOutputZodPrimitive) return
  // Then it is a shape
  return ((obj: object) => {
    return parseResponse({
      identifier: callerName,
      data: objectToCamelCaseArr(obj) ?? {},
      zod: z.object(outputShape),
    })
  }) as FromApiCall<T>
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
      : {}
  ) as CallbackUtils<TInput, TOutput>
}

//TODO: improve types #95
/**
 * Core method of custom calls.
 */
export const createCustomServiceCallHandler =
  ({
    client,
    serviceCallOpts,
    baseUri,
    name,
  }: {
    serviceCallOpts: any
    client: AxiosInstance | AxiosLike
    /**
     * This name allow us to keep record of which method it is, so that we can identify in case of output mismatch
     */
    name?: string
    baseUri?: string
  }) =>
  async (args: unknown) => {
    console.log("🚀 ~ file: api.ts:129 ~ args:", args)
    const expectsInput = !isZodVoid(serviceCallOpts.inputShape)
    const hasPagination = (
      argCheck: unknown
    ): argCheck is { pagination: Pagination } | { input: { pagination: Pagination } } =>
      Boolean(
        typeof argCheck === "object" &&
          argCheck &&
          ("pagination" in argCheck ||
            ("input" in argCheck &&
              typeof argCheck.input === "object" &&
              argCheck.input &&
              "pagination" in argCheck.input))
      )
    const expectsFilters = !isZodVoid(serviceCallOpts.filtersShape)
    console.log("🚀 ~ file: api.ts:144 ~ expectsFilters:", expectsFilters)
    const utils = createApiUtils({
      name: name ?? "No-Name call",
      inputShape: serviceCallOpts.inputShape,
      outputShape: serviceCallOpts.outputShape,
    }) as object

    const baseArgs = {
      client,
      slashEndingBaseUri: baseUri,
      ...utils,
    }
    console.log("🚀 ~ file: api.ts:156 ~ baseArgs:", baseArgs)
    if (expectsFilters) {
      console.log("🚀 ~ file: api.ts:156 ~ baseArgs:", {
        baseArgs,
        expectsInput,
      })
      const callbackArgs = {
        ...baseArgs,
        ...(expectsInput || hasPagination(args)
          ? {
              input:
                args && typeof args === "object" && "input" in args
                  ? args.input
                  : // TODO: probably can improve these below with two different type guards
                  hasPagination(args) && !expectsInput && "pagination" in args
                  ? { input: args.pagination }
                  : hasPagination(args) && "input" in args
                  ? { input: args.input }
                  : undefined,
            }
          : {}),
        parsedFilters:
          args && typeof args === "object" && "filters" in args
            ? parseFilters(serviceCallOpts.filtersShape, args.filters)
            : undefined,
      }
      console.log("🚀 ~ file: api.ts:160 ~ callbackArgs:", callbackArgs, {
        whatIsArgs: args,
        result: args && typeof args === "object" && "input" in args,
        hasPagination: hasPagination(args),
        doesNotExpectInput: !expectsInput,
      })
      return serviceCallOpts.callback(callbackArgs)
    }
    const callbackInputs = {
      ...baseArgs,
      ...(expectsInput || hasPagination(args) ? { input: args } : {}),
    }
    console.log("🚀 ~ file: api.ts:177 ~ callbackInputs:", callbackInputs)
    return serviceCallOpts.callback(callbackInputs)
  }

export const removeReadonlyFields = <T extends z.ZodRawShape, TUnwrap extends (keyof T)[] = []>(
  shape: T,
  unwrap?: TUnwrap
) => {
  const nonReadonlyEntries: [key: string, value: z.ZodTypeAny][] = []
  const allEntries = Object.entries(shape)
  for (const [k, v] of allEntries) {
    if (isZodReadonly(v)) {
      if (unwrap && unwrap.includes(k)) {
        nonReadonlyEntries.push([k, v.unwrap()])
        continue
      }
      continue
    }
    nonReadonlyEntries.push([k, v])
  }
  return Object.fromEntries(nonReadonlyEntries) as StripReadonlyBrand<T, TUnwrap>
}
