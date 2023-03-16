import {
  objectToCamelCase,
  objectToSnakeCase,
  SnakeCase,
  SnakeCasedPropertiesDeep,
  toSnakeCase,
} from "@thinknimble/tn-utils"
import { z } from "zod"
import { getPaginatedZod } from "./utils/pagination"
import { parseResponse } from "./response"

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

type ZodRecurseShapeSnakeCased<T extends ZodRawShapeRecurse> = {
  [K in keyof T as SnakeCase<K>]: T[K] extends ZodRawShapeRecurse<infer Res> ? ZodRecurseShapeSnakeCased<Res> : T[K]
}

export type ToApiCall<TInput extends ZodRawShapeRecurse | z.ZodTypeAny> = (
  obj: object
) => TInput extends ZodRawShapeRecurse
  ? SnakeCasedPropertiesDeep<GetInferredRecurseRaw<TInput>>
  : TInput extends z.ZodTypeAny
  ? z.infer<TInput>
  : never

export type FromApiCall<TOutput extends ZodRawShapeRecurse | z.ZodTypeAny> = (
  obj: object
) => TOutput extends ZodRawShapeRecurse
  ? GetInferredRecurseRaw<TOutput>
  : TOutput extends z.ZodTypeAny
  ? z.infer<TOutput>
  : never

export const zodRecurseShapeToSnakeCase = <T extends ZodRawShapeRecurse>(
  zodRecurseShape: T
): ZodRecurseShapeSnakeCased<T> => {
  return Object.fromEntries(
    Object.entries(zodRecurseShape).map(([k, v]) => {
      if (v instanceof z.ZodType) {
        return [toSnakeCase(k), v]
      }
      return [toSnakeCase(k), zodRecurseShapeToSnakeCase(v)]
    })
  ) as ZodRecurseShapeSnakeCased<T>
}

export const getPaginatedSnakeCasedZod = <T extends ZodRawShapeRecurse>(zodShape: T) => {
  return getPaginatedZod(objectToValidZodShape(zodRecurseShapeToSnakeCase(zodShape)))
}

type FromApiUtil<T extends ZodRawShapeRecurse | ZodPrimitives> = {
  /**
   * Given an object, parses the response based on outputShape, it turns the result keys into camelCase. It also shows a warning if the outputShape does not match the passed object
   */
  fromApi: FromApiCall<T>
}
type ToApiUtil<T extends ZodRawShapeRecurse | ZodPrimitives> = {
  /**
   * Given an object, parses the input and turns its keys into snake_case
   */
  toApi: ToApiCall<T>
}

export type CallbackUtils<
  TInput extends ZodRawShapeRecurse | ZodPrimitives,
  TOutput extends ZodRawShapeRecurse | ZodPrimitives,
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

const createToApiHandler = <T extends ZodRawShapeRecurse | ZodPrimitives>(inputShape: T) => {
  const isInputZodPrimitive = inputShape instanceof z.ZodSchema
  // Given that this is under our control, we should not do safe parse, if the parsing fails means something is wrong (you're not complying with the schema you defined)
  return isInputZodPrimitive
    ? undefined
    : (((obj: object) =>
        z
          .object(objectToValidZodShape(zodRecurseShapeToSnakeCase(inputShape)))
          .parse(objectToSnakeCase(obj))) as ToApiCall<T>)
}

const createFromApiHandler = <T extends ZodRawShapeRecurse | ZodPrimitives>(outputShape: T, callerName: string) => {
  const isOutputZodPrimitive = outputShape instanceof z.ZodSchema
  // since this checks for the api response, which we don't control, we can't strict parse, else we would break the flow. We'd rather safe parse and show a warning if there's a mismatch
  return isOutputZodPrimitive
    ? undefined
    : (((obj: object) =>
        parseResponse({
          identifier: callerName,
          data: objectToCamelCase(obj) ?? {},
          zod: z.object(objectToValidZodShape(outputShape)),
        })) as FromApiCall<T>)
}

export function createApiUtils<
  TInput extends ZodRawShapeRecurse | ZodPrimitives,
  TOutput extends ZodRawShapeRecurse | ZodPrimitives
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

export type ZodRawShapeRecurse<T extends object = object> = {
  [K in keyof T]: T[K] extends z.ZodTypeAny
    ? T[K]
    : T[K] extends z.ZodRawShape
    ? T[K]
    : T[K] extends ZodRawShapeRecurse<infer Res>
    ? ZodRawShapeRecurse<Res>
    : never
}

export type GetInferredRecurseRaw<T extends ZodRawShapeRecurse> = Prettify<{
  [K in keyof T]: T[K] extends z.ZodTypeAny
    ? z.infer<T[K]>
    : T[K] extends z.ZodRawShape
    ? GetInferredFromRaw<T[K]>
    : T[K] extends ZodRawShapeRecurse
    ? GetInferredRecurseRaw<T[K]>
    : never
}>

type Prettify<T> = {
  [K in keyof T]: T[K]
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {}

export type GetRecursiveZodShape<T extends ZodRawShapeRecurse> = {
  [K in keyof T]: T[K] extends z.ZodTypeAny
    ? T[K]
    : T[K] extends z.ZodRawShape
    ? GetZodObjectType<T[K]>
    : T[K] extends Prettify<ZodRawShapeRecurse<infer Res>>
    ? GetZodObjectType<GetRecursiveZodShape<ZodRawShapeRecurse<Res>>>
    : never
}

const isShape = (input: object): input is z.ZodRawShape => {
  return Object.values(input).every((item) => item instanceof z.ZodType)
}

/**
 * Given an object, turn it into a zod object
 */
export const objectToValidZodShape = <T extends ZodRawShapeRecurse>(input: T): Prettify<GetRecursiveZodShape<T>> => {
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
      return [k, z.object(objectToValidZodShape(v))] as const
    })
  ) as GetRecursiveZodShape<T>
}
