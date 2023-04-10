import {
  CamelCasedPropertiesDeep,
  objectToCamelCase,
  objectToSnakeCase,
  SnakeCasedPropertiesDeep,
  toCamelCase,
  toSnakeCase,
} from "@thinknimble/tn-utils"
import { z } from "zod"
import { parseResponse } from "./response"
import { zodObjectRecursive } from "./zod"

export type Prettify<T> = {
  [K in keyof T]: T[K]
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {}

export type ZodPrimitives =
  | z.ZodString
  | z.ZodNumber
  | z.ZodDate
  | z.ZodBigInt
  | z.ZodBoolean
  | z.ZodUndefined
  | z.ZodVoid

type GetZodObjectType<T extends z.ZodRawShape> = ReturnType<typeof z.object<T>>

/**
 * Get the resulting inferred type from a zod shape
 */
export type GetInferredFromRaw<T extends z.ZodRawShape> = z.infer<GetZodObjectType<T>>

export type ToApiCall<TInput extends z.ZodRawShape | z.ZodTypeAny> = (
  obj: object
) => TInput extends z.ZodRawShape
  ? SnakeCasedPropertiesDeep<GetInferredFromRaw<TInput>>
  : TInput extends z.ZodType
  ? z.infer<TInput>
  : never

export type FromApiCall<TOutput extends z.ZodRawShape | z.ZodTypeAny> = (
  obj: object
) => TOutput extends z.ZodRawShape ? GetInferredFromRaw<TOutput> : TOutput extends z.ZodType ? z.infer<TOutput> : never

type FromApiUtil<T extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>> = {
  /**
   * Given an object, parses the response based on outputShape, it turns the result keys into camelCase. It also shows a warning if the outputShape does not match the passed object
   */
  fromApi: FromApiCall<T>
}
type ToApiUtil<T extends z.ZodRawShape | ZodPrimitives> = {
  /**
   * Given an object, parses the input and turns its keys into snake_case
   */
  toApi: ToApiCall<T>
}

export type CallbackUtils<
  TInput extends z.ZodRawShape | ZodPrimitives,
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>,
  TInputIsPrimitive extends boolean = TInput extends ZodPrimitives ? true : false,
  TOutputIsPrimitive extends boolean = TOutput extends ZodPrimitives ? true : false
> = TInput extends z.ZodVoid
  ? TOutput extends z.ZodVoid
    ? unknown
    : TOutputIsPrimitive extends true
    ? unknown
    : { utils: FromApiUtil<TOutput> }
  : TOutput extends z.ZodVoid
  ? TInputIsPrimitive extends true
    ? unknown
    : {
        utils: ToApiUtil<TInput>
      }
  : (TInputIsPrimitive extends true ? unknown : { utils: ToApiUtil<TInput> }) &
      (TOutputIsPrimitive extends true
        ? unknown
        : {
            utils: FromApiUtil<TOutput>
          })

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

const createToApiHandler = <T extends z.ZodRawShape | ZodPrimitives>(inputShape: T) => {
  const isInputZodPrimitive = inputShape instanceof z.ZodSchema
  // Given that this is under our control, we should not do safe parse, if the parsing fails means something is wrong (you're not complying with the schema you defined)
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
    return (obj: object[]) =>
      parseResponse({
        identifier: callerName,
        data: obj.map((o) => objectToCamelCase(o)),
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
  TInput extends z.ZodRawShape | ZodPrimitives,
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
