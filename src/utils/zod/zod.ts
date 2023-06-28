import { toSnakeCase } from "@thinknimble/tn-utils"
import { z } from "zod"
import { ZodPrimitives, ZodRawShapeToSnakedRecursive, zodPrimitivesList } from "./types"

export const isZod = (input: unknown): input is z.ZodSchema => {
  return input instanceof z.ZodSchema
}
export const isZodArray = (input: z.ZodTypeAny): input is z.ZodArray<z.ZodTypeAny> => {
  return input instanceof z.ZodArray
}
export const isZodObject = (input: z.ZodTypeAny): input is z.ZodObject<z.ZodRawShape> => {
  return input instanceof z.ZodObject
}
export const isZodOptional = (input: z.ZodTypeAny): input is z.ZodOptional<z.ZodTypeAny> => {
  return input instanceof z.ZodOptional
}
export const isZodNullable = (input: z.ZodTypeAny): input is z.ZodNullable<z.ZodTypeAny> => {
  return input instanceof z.ZodNullable
}
export const isZodPrimitive = (input: z.ZodTypeAny): input is ZodPrimitives => {
  return zodPrimitivesList.some((inst) => input instanceof inst)
}
export const isZodIntersection = (input: z.ZodTypeAny): input is z.ZodIntersection<z.ZodTypeAny, z.ZodTypeAny> => {
  return input instanceof z.ZodIntersection
}
export const isZodUnion = (input: z.ZodTypeAny): input is z.ZodUnion<readonly [z.ZodTypeAny]> => {
  return input instanceof z.ZodUnion
}
export const isZodBrand = (input: z.ZodTypeAny): input is z.ZodBranded<any, any> => {
  return input instanceof z.ZodBranded
}
export const isZodReadonly = (input: z.ZodTypeAny): input is z.ZodBranded<any, ReadonlyTag> => {
  return input instanceof z.ZodBranded && input.description === READONLY_TAG
}

//TODO: we should probably revisit the types here but they seem not too friendly to tackle given the recursive nature of this operation
export function resolveRecursiveZod<T extends z.ZodTypeAny>(zod: T) {
  //: ZodRecursiveResult<T>
  if (isZodReadonly(zod)) {
    return zodReadonlyToSnakeRecursive(zod)
  }
  if (isZodBrand(zod)) {
    return zodBrandToSnakeRecursive(zod)
  }
  if (isZodObject(zod)) {
    return zodObjectToSnakeRecursive(zod)
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
  if (isZodUnion(zod)) {
    return zodUnionRecursive(zod)
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

function zodIntersectionRecursive<T extends z.ZodIntersection<z.ZodTypeAny, z.ZodTypeAny>>(zod: T): any {
  const { left, right } = zod._def
  return resolveRecursiveZod(left).and(resolveRecursiveZod(right))
}

function zodUnionRecursive<T extends z.ZodUnion<readonly [z.ZodTypeAny]>>(zod: T): any {
  const allUnions = zod._def.options
  const remapped: unknown = allUnions.map((u) => resolveRecursiveZod(u))
  return z.union(remapped as readonly [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]])
}

//TODO: why are we not using `resolveRecursiveZod` as the main method instead..
/**
 * Recursively convert a zod object into its snake_cased equivalent
 * !! This is the core method of the library.
 */
export function zodObjectToSnakeRecursive<T extends z.ZodRawShape>(
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

function zodReadonlyToSnakeRecursive<T extends z.ZodBranded<any, ReadonlyTag>>(zodBrand: T): any {
  return readonlyField(resolveRecursiveZod(zodBrand.unwrap()))
}

function zodBrandToSnakeRecursive<T extends z.ZodBranded<any, any>>(zodBrand: T): any {
  //brand is just a static type thing so I don't think this is going to affect that much runtime...We're losing the brand information anyway so I think it would be good to document that users should just not use brands since they're sort of pointless in the context of the library. We're just getting around the runtime here.
  return resolveRecursiveZod(zodBrand.unwrap()).brand()
}

export const READONLY_TAG = "ReadonlyField"
export type ReadonlyTag = typeof READONLY_TAG
export type ReadonlyField<T> = T & z.BRAND<ReadonlyTag>

/**
 * Identity function that just brands this type so we can recognize readonly fields
 * @param zod
 * @returns
 */
export const readonlyField = <T extends z.ZodTypeAny>(zod: T) => {
  //we will detect readonly fields with brands at the type level and verify the ReadonlyTag with the description.
  return zod.brand(READONLY_TAG).describe(READONLY_TAG)
}
