import { z } from "zod"
import { recursiveShapeToValidZodRawShape, ZodRecursiveShape } from "../utils"

export const getPaginatedShape = <T extends ZodRecursiveShape>(zodRawShape: T) => {
  return {
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(z.object(recursiveShapeToValidZodRawShape(zodRawShape))),
  }
}

export const getPaginatedZod = <T extends ZodRecursiveShape>(zodRawShape: T) => z.object(getPaginatedShape(zodRawShape))
