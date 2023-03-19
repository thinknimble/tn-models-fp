import { z } from "zod"
import { zodObjectRecursive } from "./zod"

export const getPaginatedShape = <T extends z.ZodRawShape>(zodRawShape: T) => {
  return {
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(zodObjectRecursive(z.object(zodRawShape))),
  }
}

export const getPaginatedZod = <T extends z.ZodRawShape>(zodRawShape: T) => z.object(getPaginatedShape(zodRawShape))
