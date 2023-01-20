import { z } from "zod";
export const getPaginatedZod = (zodRawShape) => z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(z.object(zodRawShape)),
});
