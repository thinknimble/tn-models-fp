import { objectToSnakeCase } from "@thinknimble/tn-utils"
import { z } from "zod"

export const paginationFiltersZod = z
  .object({
    page: z.number(),
    pageSize: z.number(),
  })
  .partial()
  .optional()

export type PaginationFilters = z.infer<typeof paginationFiltersZod>

//TODO: Remove
/**
 * @deprecated we should remove this at some point since I have not seen those many filters used.
 */
export const filtersZod = z
  .object({
    ordering: z.string(),
  })
  .partial()
  .optional()

export const parseFilters = <TFilters extends z.ZodRawShape>(shape?: TFilters, filters?: unknown) => {
  if (!filters || !shape) return
  const filtersParsed = z.object(shape).partial().parse(filters)
  const snakedFilters = objectToSnakeCase(filtersParsed)
  return snakedFilters
    ? Object.fromEntries(
        Object.entries(snakedFilters).flatMap(([k, v]) => {
          if (typeof v === "number") return [[k, v.toString()]]
          if (!v) return []
          return [[k, v]]
        })
      )
    : undefined
}
