import { SnakeCasedPropertiesDeep, objectToSnakeCase } from "@thinknimble/tn-utils"
import { z } from "zod"
import { GetInferredFromRawWithBrand } from "./zod"

export const paginationFiltersZodShape = {
  page: z.number(),
  pageSize: z.number(),
}

export type PaginationFilters = GetInferredFromRawWithBrand<typeof paginationFiltersZodShape>

type AsQueryParam<T extends object> = {
  [K in keyof T as T[K] extends string | number ? K : never]: string
}

export const parseFilters = <TFilters extends FiltersShape>(shape?: TFilters, filters?: unknown) => {
  if (!filters || !shape) return
  const filtersParsed = z.object(shape).partial().parse(filters)
  const snakedFilters = objectToSnakeCase(filtersParsed)
  return snakedFilters
    ? (Object.fromEntries(
        Object.entries(snakedFilters).flatMap(([k, v]) => {
          if (typeof v === "number") return [[k, v.toString()]]
          if (!v) return []
          return [[k, v]]
        })
      ) as SnakeCasedPropertiesDeep<AsQueryParam<GetInferredFromRawWithBrand<TFilters>>>)
    : undefined
}

export type FiltersShape = Record<string, z.ZodString | z.ZodNumber>
