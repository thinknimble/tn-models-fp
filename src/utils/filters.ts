import { z } from "zod"

export const paginationFiltersZod = z
  .object({
    page: z.number(),
    pageSize: z.number(),
  })
  .partial()
  .optional()

export type PaginationFilters = z.infer<typeof paginationFiltersZod>

export const filtersZod = z
  .object({
    //TODO: (help wanted) add filter fields that are always available on TN backend's for listing entities -- Need Python guys here to chime in
    ordering: z.string(),
  })
  .partial()
  .optional()
