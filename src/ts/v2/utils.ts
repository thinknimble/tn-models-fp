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

export const createApiUtils = <
  TInput extends z.ZodRawShape | z.ZodTypeAny,
  TOutput extends z.ZodRawShape | z.ZodTypeAny
>({
  inputShape,
  outputShape,
  name,
}: {
  inputShape: TInput
  outputShape: TOutput
  name: string
}) => {
  // we have to identify if we have a shape or a plain zod (only primitives are allowed). Primitive zods do not get util functions since they don't require response case transformation
  const isInputZodPrimitive = inputShape instanceof z.ZodSchema
  const isOutputZodPrimitive = outputShape instanceof z.ZodSchema
  // since this checks for the api response, which we don't control, we can't strict parse, else we would break the flow. We'd rather safe parse and show a warning if there's a mismatch
  const fromApi: FromApiCall<TOutput> | undefined = isOutputZodPrimitive
    ? undefined
    : (obj: object) =>
        parseResponse({
          identifier: name,
          data: objectToCamelCase(obj) ?? {},
          zod: z.object(outputShape),
        })

  // Given that this is under our control, we should not do safe parse, if the parsing fails means something is wrong (you're not complying with the schema you defined)
  const toApi = isInputZodPrimitive
    ? undefined
    : (obj: object) => z.object(getSnakeCasedZodRawShape(inputShape)).parse(objectToSnakeCase(obj))
  // avoid leaking the wrong fields to our callback (we already protect this through ts but it does not hurt to prevent it at runtime as well)
  return fromApi || toApi
    ? {
        utils: {
          ...(fromApi ? { fromApi } : {}),
          ...(toApi ? { toApi } : {}),
        },
      }
    : {}
}
