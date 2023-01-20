import { z, ZodRawShape } from "zod"

export const getPaginatedZod = <T extends ZodRawShape>(zodRawShape: T) =>
  z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(z.object(zodRawShape)),
  })
