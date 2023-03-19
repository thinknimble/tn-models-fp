import { z } from "zod"
import { zodObjectRecursive } from "./zod"

//TODO: this needs cleanup. I am not happy with the usage of these across the library. Seems like we could have at least one of these less

export const getPaginatedShape = <T extends z.ZodRawShape>(zodRawShape: T) => {
  return {
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(zodObjectRecursive(z.object(zodRawShape))),
  }
}

export const getPaginatedSnakeCasedZod = <T extends z.ZodRawShape>(zodRawShape: T) =>
  z.object(getPaginatedShape(zodRawShape))

export const getPaginatedZod = <T extends z.ZodRawShape>(zodRawShape: T) =>
  z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(z.object(zodRawShape)),
  })
