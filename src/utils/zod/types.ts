import { SnakeCase } from "@thinknimble/tn-utils"
import { z } from "zod"

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

type InferZodIntersection<T extends z.ZodIntersection<z.ZodTypeAny, z.ZodTypeAny>> = T extends z.ZodIntersection<
  infer TLeft,
  infer TRight
>
  ? z.ZodIntersection<ZodRecursiveResult<TLeft>, ZodRecursiveResult<TRight>>
  : never

type InferZodUnionOptions<T extends readonly z.ZodTypeAny[]> = T["length"] extends 0
  ? T
  : T extends readonly [infer TOpt, ...infer Rest]
  ? TOpt extends z.ZodTypeAny
    ? Rest extends readonly z.ZodTypeAny[]
      ? readonly [ZodRecursiveResult<TOpt>, ...InferZodUnionOptions<Rest>]
      : ZodRecursiveResult<TOpt>
    : never
  : T extends readonly [infer TOptAnother]
  ? TOptAnother extends z.ZodTypeAny
    ? ZodRecursiveResult<TOptAnother>
    : never
  : never
type InferZodUnion<T extends z.ZodUnion<z.ZodUnionOptions>> = T extends z.ZodUnion<infer TOpts>
  ? z.ZodUnion<InferZodUnionOptions<TOpts>>
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
    : T[K] extends z.ZodUnion<z.ZodUnionOptions>
    ? InferZodUnion<T[K]>
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
  : T extends z.ZodUnion<z.ZodUnionOptions>
  ? InferZodUnion<T>
  : T

export const zodPrimitivesList = [
  z.ZodString,
  z.ZodNumber,
  z.ZodDate,
  z.ZodBigInt,
  z.ZodBoolean,
  z.ZodUndefined,
  z.ZodVoid,
] as const

//! trying to use the above list to create these types is failing bc of the class nature of the zod types
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

export type PartializeShape<T extends z.ZodRawShape> = {
  [K in keyof T]: z.ZodOptional<T[K]>
}
export type InferShapeOrZod<T extends object> = T extends z.ZodRawShape
  ? GetInferredFromRaw<T>
  : T extends z.ZodTypeAny
  ? z.infer<T>
  : never
