import {
  objectToCamelCase,
  objectToSnakeCase,
  SnakeCase,
  SnakeCasedPropertiesDeep,
  toSnakeCase,
} from "@thinknimble/tn-utils"
import { z } from "zod"
import { parseResponse } from "./response"
import { getPaginatedZod } from "./utils/pagination"
import { zodObjectRecursive } from "./utils/zod"

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

type ZodRecursiveShapeSnakeCased<T extends z.ZodRawShape> = {
  [K in keyof T as SnakeCase<K>]: T[K] extends z.ZodRawShape ? ZodRecursiveShapeSnakeCased<T[K]> : T[K]
}

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

export const zodRecursiveShapeToSnakeCase = <T extends z.ZodRawShape>(shape: T): ZodRecursiveShapeSnakeCased<T> => {
  return Object.fromEntries(
    Object.entries(shape).map(([k, v]) => {
      if (v instanceof z.ZodType) {
        return [toSnakeCase(k), v]
      }
      return [toSnakeCase(k), zodRecursiveShapeToSnakeCase(v)]
    })
  ) as ZodRecursiveShapeSnakeCased<T>
}

export const getPaginatedSnakeCasedZod = <T extends z.ZodRawShape>(zodShape: T) => {
  return getPaginatedZod(zodShape)
}

type FromApiUtil<T extends z.ZodRawShape | ZodPrimitives> = {
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
  TOutput extends z.ZodRawShape | ZodPrimitives,
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

const createToApiHandler = <T extends z.ZodRawShape | ZodPrimitives>(inputShape: T) => {
  const isInputZodPrimitive = inputShape instanceof z.ZodSchema
  // Given that this is under our control, we should not do safe parse, if the parsing fails means something is wrong (you're not complying with the schema you defined)
  return isInputZodPrimitive
    ? undefined
    : (((obj: object) => zodObjectRecursive(z.object(inputShape)).parse(objectToSnakeCase(obj))) as ToApiCall<T>)
}

const createFromApiHandler = <T extends z.ZodRawShape | ZodPrimitives>(outputShape: T, callerName: string) => {
  const isOutputZodPrimitive = outputShape instanceof z.ZodSchema
  // since this checks for the api response, which we don't control, we can't strict parse, else we would break the flow. We'd rather safe parse and show a warning if there's a mismatch
  return isOutputZodPrimitive
    ? undefined
    : (((obj: object) =>
        parseResponse({
          identifier: callerName,
          data: objectToCamelCase(obj) ?? {},
          zod: zodObjectRecursive(z.object(outputShape)),
        })) as FromApiCall<T>)
}

export function createApiUtils<
  TInput extends z.ZodRawShape | ZodPrimitives,
  TOutput extends z.ZodRawShape | ZodPrimitives
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
