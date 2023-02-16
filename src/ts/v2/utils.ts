import {
  objectToCamelCase,
  objectToSnakeCase,
  SnakeCase,
  SnakeCasedPropertiesDeep,
  toSnakeCase,
} from "@thinknimble/tn-utils"
import { z } from "zod"
import { getPaginatedZod } from "./pagination"
import { parseResponse } from "./response"

export type ZodPrimitives =
  | z.ZodString
  | z.ZodNumber
  | z.ZodDate
  | z.ZodBigInt
  | z.ZodBoolean
  | z.ZodUndefined
  | z.ZodVoid

/**
 * Get the resulting inferred type from a zod shape
 */
export type GetZodInferredTypeFromRaw<T extends z.ZodRawShape> = z.infer<ReturnType<typeof z.object<T>>>

type ZodRawShapeSnakeCased<T extends z.ZodRawShape> = {
  [TKey in keyof T as SnakeCase<TKey>]: T[TKey]
}

export type ToApiCall<TInput extends z.ZodRawShape | z.ZodTypeAny> = (
  obj: object
) => TInput extends z.ZodRawShape
  ? SnakeCasedPropertiesDeep<GetZodInferredTypeFromRaw<TInput>>
  : TInput extends z.ZodTypeAny
  ? z.infer<TInput>
  : never

export type FromApiCall<TOutput extends z.ZodRawShape | z.ZodTypeAny> = (
  obj: object
) => TOutput extends z.ZodRawShape
  ? GetZodInferredTypeFromRaw<TOutput>
  : TOutput extends z.ZodTypeAny
  ? z.infer<TOutput>
  : never

export const getSnakeCasedZodRawShape = <T extends z.ZodRawShape>(zodShape: T) => {
  // objectToSnakeCase would mess up zod internal fields, so we must do the case conversion only on the keys of the shape
  const unknownSnakeCasedZod: unknown = Object.fromEntries(
    Object.entries(zodShape).map(([k, v]) => {
      return [toSnakeCase(k), v]
    })
  )
  return unknownSnakeCasedZod as ZodRawShapeSnakeCased<T>
}
export const getPaginatedSnakeCasedZod = <T extends z.ZodRawShape>(zodShape: T) => {
  return getPaginatedZod(getSnakeCasedZodRawShape(zodShape))
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
    : { utils: { fromApi: FromApiCall<TOutput> } }
  : TOutput extends z.ZodVoid
  ? TInputIsPrimitive extends true
    ? unknown
    : {
        utils: {
          toApi: ToApiCall<TInput>
        }
      }
  : (TInputIsPrimitive extends true ? unknown : { utils: { toApi: ToApiCall<TInput> } }) &
      (TOutputIsPrimitive extends true
        ? unknown
        : {
            utils: {
              fromApi: FromApiCall<TOutput>
            }
          })

const getToApiHandler = <T extends z.ZodRawShape | ZodPrimitives>(inputShape: T) => {
  const isInputZodPrimitive = inputShape instanceof z.ZodSchema
  // Given that this is under our control, we should not do safe parse, if the parsing fails means something is wrong (you're not complying with the schema you defined)
  return isInputZodPrimitive
    ? undefined
    : (((obj: object) => z.object(getSnakeCasedZodRawShape(inputShape)).parse(objectToSnakeCase(obj))) as ToApiCall<T>)
}

const getFromApiHandler = <T extends z.ZodRawShape | ZodPrimitives>(outputShape: T, callerName: string) => {
  const isOutputZodPrimitive = outputShape instanceof z.ZodSchema
  // since this checks for the api response, which we don't control, we can't strict parse, else we would break the flow. We'd rather safe parse and show a warning if there's a mismatch
  return isOutputZodPrimitive
    ? undefined
    : (((obj: object) =>
        parseResponse({
          identifier: callerName,
          data: objectToCamelCase(obj) ?? {},
          zod: z.object(outputShape),
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
  const fromApi = "outputShape" in args ? getFromApiHandler(args.outputShape, args.name) : undefined
  const toApi = "inputShape" in args ? getToApiHandler(args.inputShape) : undefined

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
