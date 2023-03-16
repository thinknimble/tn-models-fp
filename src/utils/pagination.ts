import { z } from "zod"
import { recursiveShapeToValidZodRawShape, ZodRecursiveShape } from "../utils"

export const getPaginatedZod = <T extends ZodRecursiveShape>(zodRawShape: T) =>
  z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(z.object(recursiveShapeToValidZodRawShape(zodRawShape))),
  })
