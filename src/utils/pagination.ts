import { z } from "zod"
import { objectToValidZodShape, ZodRawShapeRecurse } from "../utils"

export const getPaginatedZod = <T extends ZodRawShapeRecurse>(zodRawShape: T) =>
  z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(z.object(objectToValidZodShape(zodRawShape))),
  })
