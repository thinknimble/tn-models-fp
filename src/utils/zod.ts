import { SnakeCase, toSnakeCase } from "@thinknimble/tn-utils"
import { z } from "zod"

export const zodArrayToShape = <T extends z.ZodRawShape>(zodArray: z.ZodArray<z.ZodObject<T>>) => {
  return zodArray._def.type._def.shape()
}
export const isZodArray = (input: unknown): input is z.ZodArray<any> => {
  return input instanceof z.ZodArray
}
export const isZodObject = (input: unknown): input is z.ZodObject<any> => {
  return input instanceof z.ZodObject
}
type InferShape<T extends z.ZodObject<z.ZodRawShape>> = T extends z.ZodObject<infer Obj> ? Obj : never

// I'm a bit concerned about what this will look like and how will this work.
export type ZodRawShapeToSnakedRecursive<T extends z.ZodRawShape> = {
  [K in keyof T as SnakeCase<K>]: T[K] extends z.ZodObject<z.ZodRawShape>
    ? z.ZodObject<ZodRawShapeToSnakedRecursive<InferShape<T[K]>>>
    : T[K] extends z.ZodArray<infer El>
    ? El extends z.ZodObject<z.ZodRawShape>
      ? z.ZodArray<z.ZodObject<ZodRawShapeToSnakedRecursive<InferShape<El>>>>
      : T[K]
    : T[K]
}

/**
 * Recursively convert a zod object into its snake_cased equivalent
 */
export const zodToSnakeCaseRecursive = <T extends z.ZodRawShape>(
  zodObj: z.ZodObject<T>
): z.ZodObject<ZodRawShapeToSnakedRecursive<T>> => {
  const resultingShape = Object.fromEntries(
    Object.entries(zodObj.shape).map(([k, v]) => {
      const snakeCasedKey = toSnakeCase(k)
      if (isZodObject(v)) {
        return [snakeCasedKey, zodToSnakeCaseRecursive(v)]
      }
      if (isZodArray(v) && isZodObject(v.element)) {
        return [snakeCasedKey, z.array(zodToSnakeCaseRecursive(v.element))]
      }
      //then V is another ZodType which we don't care to address right now
      return [snakeCasedKey, v]
    })
  ) as ZodRawShapeToSnakedRecursive<T>
  return z.object(resultingShape)
}
