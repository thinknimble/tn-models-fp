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

type ZodRecursiveShapeSnakeCased<T extends ZodRecursiveShape> = {
  [K in keyof T as SnakeCase<K>]: T[K] extends ZodRecursiveShape<infer Res> ? ZodRecursiveShapeSnakeCased<Res> : T[K]
}

export type ToApiCall<TInput extends ZodRecursiveShape | z.ZodTypeAny> = (
  obj: object
) => TInput extends ZodRecursiveShape
  ? SnakeCasedPropertiesDeep<GetInferredRecursiveShape<TInput>>
  : TInput extends z.ZodType
  ? z.infer<TInput>
  : never

export type FromApiCall<TOutput extends ZodRecursiveShape | z.ZodTypeAny> = (
  obj: object
) => TOutput extends ZodRecursiveShape
  ? GetInferredRecursiveShape<TOutput>
  : TOutput extends z.ZodType
  ? z.infer<TOutput>
  : never

export const zodRecursiveShapeToSnakeCase = <T extends ZodRecursiveShape>(
  zodRecursiveShape: T
): ZodRecursiveShapeSnakeCased<T> => {
  return Object.fromEntries(
    Object.entries(zodRecursiveShape).map(([k, v]) => {
      if (v instanceof z.ZodType) {
        return [toSnakeCase(k), v]
      }
      return [toSnakeCase(k), zodRecursiveShapeToSnakeCase(v)]
    })
  ) as ZodRecursiveShapeSnakeCased<T>
}

export const getPaginatedSnakeCasedZod = <T extends ZodRecursiveShape>(zodShape: T) => {
  return getPaginatedZod(recursiveShapeToValidZodRawShape(zodRecursiveShapeToSnakeCase(zodShape)))
}

type FromApiUtil<T extends ZodRecursiveShape | ZodPrimitives> = {
  /**
   * Given an object, parses the response based on outputShape, it turns the result keys into camelCase. It also shows a warning if the outputShape does not match the passed object
   */
  fromApi: FromApiCall<T>
}
type ToApiUtil<T extends ZodRecursiveShape | ZodPrimitives> = {
  /**
   * Given an object, parses the input and turns its keys into snake_case
   */
  toApi: ToApiCall<T>
}

export type CallbackUtils<
  TInput extends ZodRecursiveShape | ZodPrimitives,
  TOutput extends ZodRecursiveShape | ZodPrimitives,
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

const createToApiHandler = <T extends ZodRecursiveShape | ZodPrimitives>(inputShape: T) => {
  const isInputZodPrimitive = inputShape instanceof z.ZodSchema
  // Given that this is under our control, we should not do safe parse, if the parsing fails means something is wrong (you're not complying with the schema you defined)
  return isInputZodPrimitive
    ? undefined
    : (((obj: object) =>
        z
          .object(recursiveShapeToValidZodRawShape(zodRecursiveShapeToSnakeCase(inputShape)))
          .parse(objectToSnakeCase(obj))) as ToApiCall<T>)
}

const createFromApiHandler = <T extends ZodRecursiveShape | ZodPrimitives>(outputShape: T, callerName: string) => {
  const isOutputZodPrimitive = outputShape instanceof z.ZodSchema
  // since this checks for the api response, which we don't control, we can't strict parse, else we would break the flow. We'd rather safe parse and show a warning if there's a mismatch
  return isOutputZodPrimitive
    ? undefined
    : (((obj: object) =>
        parseResponse({
          identifier: callerName,
          data: objectToCamelCase(obj) ?? {},
          zod: z.object(recursiveShapeToValidZodRawShape(outputShape)),
        })) as FromApiCall<T>)
}

export function createApiUtils<
  TInput extends ZodRecursiveShape | ZodPrimitives,
  TOutput extends ZodRecursiveShape | ZodPrimitives
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

export type ZodRecursiveShape<T extends object = object> = {
  [K in keyof T]: T[K] extends z.ZodType
    ? T[K]
    : T[K] extends z.ZodRawShape
    ? T[K]
    : T[K] extends ZodRecursiveShape<infer Res>
    ? ZodRecursiveShape<Res>
    : never
}

export type GetInferredRecursiveShape<T extends ZodRecursiveShape> = Prettify<{
  [K in keyof T]: T[K] extends z.ZodType
    ? z.infer<T[K]>
    : T[K] extends z.ZodRawShape
    ? GetInferredFromRaw<T[K]>
    : T[K] extends ZodRecursiveShape
    ? GetInferredRecursiveShape<T[K]>
    : never
}>

export type GetRecursiveZodShape<T extends ZodRecursiveShape> = {
  [K in keyof T]: T[K] extends z.ZodTypeAny
    ? T[K]
    : T[K] extends z.ZodRawShape
    ? GetZodObjectType<T[K]>
    : T[K] extends Prettify<ZodRecursiveShape<infer Res>>
    ? GetZodObjectType<GetRecursiveZodShape<ZodRecursiveShape<Res>>>
    : never
}

const isShape = (input: object): input is z.ZodRawShape => {
  return Object.values(input).every((item) => item instanceof z.ZodType)
}

/**
 * Given a recursive shape, convert it to a valid ZodRawShape by recursively calling z.object on each ZodRawShape found.
 */
export const recursiveShapeToValidZodRawShape = <T extends ZodRecursiveShape>(
  input: T
): Prettify<GetRecursiveZodShape<T>> => {
  const entries = Object.entries(input)
  return Object.fromEntries(
    entries.map(([k, v]) => {
      if (typeof v !== "object" || !v)
        throw new Error("Failed to parse shape. Any zod shape apex should be an instance of ZodType or a ZodRawShape")
      if (isShape(v)) {
        return [k, z.object(v)] as const
      }
      if (v instanceof z.ZodType) {
        return [k, v] as const
      }
      return [k, z.object(recursiveShapeToValidZodRawShape(v))] as const
    })
  ) as GetRecursiveZodShape<T>
}
