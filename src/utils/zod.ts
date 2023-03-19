import { SnakeCase, toSnakeCase } from "@thinknimble/tn-utils"
import { z } from "zod"

export const isZodArray = (input: z.ZodTypeAny): input is z.ZodArray<z.ZodTypeAny> => {
  return input instanceof z.ZodArray
}
export const isZodObject = (input: z.ZodTypeAny): input is z.ZodObject<z.ZodRawShape> => {
  return input instanceof z.ZodObject
}
export const isZodOptional = (input: z.ZodTypeAny): input is z.ZodOptional<z.ZodTypeAny> => {
  return input.isOptional()
}
export const isZodNullable = (input: z.ZodTypeAny): input is z.ZodNullable<z.ZodTypeAny> => {
  return input.isNullable()
}

export const isZodIntersection = (input: z.ZodTypeAny): input is z.ZodIntersection<z.ZodTypeAny, z.ZodTypeAny> => {
  return input instanceof z.ZodIntersection
}

type InferZodArray<T extends z.ZodArray<z.ZodTypeAny>> = T extends z.ZodArray<infer TEl>
  ? z.ZodArray<ZodRecursiveResult<TEl>>
  : never

type InferZodObject<T extends z.ZodObject<z.ZodRawShape>> = T extends z.ZodObject<infer TZodObj>
  ? z.ZodObject<ZodRawShapeToSnakedRecursive<TZodObj>>
  : never

type InferZodOptional<T extends z.ZodOptional<z.ZodTypeAny>> = T extends z.ZodOptional<infer TOpt>
  ? z.ZodOptional<ZodRecursiveResult<TOpt>>
  : never

type InferZodNullable<T extends z.ZodNullable<z.ZodTypeAny>> = T extends z.ZodNullable<infer TNull>
  ? z.ZodNullable<ZodRecursiveResult<TNull>>
  : never

// I don't think this is going to work properly to be completely honest. I feel intersection and unions should have their own branch in this inference given that for those we need two types so it is going to be weird.
type InferZodIntersection<T extends z.ZodIntersection<z.ZodTypeAny, z.ZodTypeAny>> = T extends z.ZodIntersection<
  infer TLeft,
  infer TRight
>
  ? z.ZodIntersection<ZodRecursiveResult<TLeft>, ZodRecursiveResult<TRight>>
  : never

/**
 * Determine the type of processing a zod shape into its snake cased equivalent
 */
export type ZodRawShapeToSnakedRecursive<T extends z.ZodRawShape> = {
  [K in keyof T as SnakeCase<K>]: T[K] extends z.ZodRawShape
    ? never
    : T[K] extends z.ZodOptional<z.ZodTypeAny>
    ? InferZodOptional<T[K]>
    : //check whether it is array or object, else just default to its type
    T[K] extends z.ZodNullable<z.ZodTypeAny>
    ? InferZodNullable<T[K]>
    : T[K] extends z.ZodObject<z.ZodRawShape>
    ? InferZodObject<T[K]>
    : T[K] extends z.ZodArray<z.ZodTypeAny>
    ? InferZodArray<T[K]>
    : T[K] extends z.ZodIntersection<z.ZodTypeAny, z.ZodTypeAny>
    ? InferZodIntersection<T[K]>
    : T[K]
}
type ZodRecursiveResult<T extends z.ZodTypeAny> = T extends z.ZodObject<z.ZodRawShape>
  ? InferZodObject<T>
  : T extends z.ZodArray<z.ZodTypeAny>
  ? InferZodArray<T>
  : T extends z.ZodOptional<z.ZodTypeAny>
  ? InferZodOptional<T>
  : T extends z.ZodNullable<z.ZodTypeAny>
  ? InferZodNullable<T>
  : T extends z.ZodIntersection<z.ZodTypeAny, z.ZodTypeAny>
  ? InferZodIntersection<T>
  : T

function resolveRecursiveZod<T extends z.ZodTypeAny>(zod: T) {
  //: ZodRecursiveResult<T>
  if (isZodObject(zod)) {
    return zodObjectRecursive(zod)
  }
  if (isZodArray(zod)) {
    return zodArrayRecursive(zod)
  }
  if (isZodOptional(zod)) {
    return zodOptionalRecursive(zod)
  }
  if (isZodNullable(zod)) {
    return zodNullableRecursive(zod)
  }
  if (isZodIntersection(zod)) {
    return zodIntersectionRecursive(zod)
  }
  return zod
}

//! could not escape of these any here. in the three functions below
function zodArrayRecursive<T extends z.ZodTypeAny>(zodArray: z.ZodArray<T>): any {
  //: InferZodArray<z.ZodArray<T>>
  const innerElement = zodArray.element

  return resolveRecursiveZod(innerElement).array()
}

function zodNullableRecursive<T extends z.ZodTypeAny>(zodNullable: z.ZodNullable<T>): any {
  // : InferZodNullable<z.ZodNullable<T>>
  const unwrapped = zodNullable.unwrap()
  return resolveRecursiveZod(unwrapped).nullable()
}

function zodOptionalRecursive<T extends z.ZodTypeAny>(zodOptional: z.ZodOptional<T>): any {
  // : InferZodOptional<z.ZodOptional<T>>
  const unwrapped = zodOptional.unwrap()
  return resolveRecursiveZod(unwrapped).optional()
}

export function zodIntersectionRecursive<T extends z.ZodIntersection<z.ZodTypeAny, z.ZodTypeAny>>(zod: T): any {
  const { left, right } = zod._def
  return resolveRecursiveZod(left).and(resolveRecursiveZod(right))
}

/**
 * Recursively convert a zod object into its snake_cased equivalent
 */
export function zodObjectRecursive<T extends z.ZodRawShape>(
  zodObj: z.ZodObject<T>
): z.ZodObject<ZodRawShapeToSnakedRecursive<T>> {
  const resultingShape = Object.fromEntries(
    Object.entries(zodObj.shape).map(([k, v]) => {
      const snakeCasedKey = toSnakeCase(k)
      return [snakeCasedKey, resolveRecursiveZod(v)]
    })
  ) as ZodRawShapeToSnakedRecursive<T>
  return z.object(resultingShape)
}
