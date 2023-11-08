import { SnakeCasedPropertiesDeep } from "@thinknimble/tn-utils"
import { z } from "zod"
import { GetInferredFromRawWithBrand } from "./zod"
import { objectToSnakeCaseArr } from "./api"

export const paginationFiltersZodShape = {
  page: z.number(),
  pageSize: z.number(),
}

export type PaginationFilters = GetInferredFromRawWithBrand<typeof paginationFiltersZodShape>

type AsQueryParam<T extends object> = {
  [K in keyof T as T[K] extends string | number ? K : never]: string
}

const defaultParser = (value: unknown) => {
  if (typeof value === "number") return value.toString()
  if (typeof value === "object" && Array.isArray(value)) {
    return value.join(",")
  }
  if (!value) return
  return value
}

export const parseFilters = <TFilters extends FiltersShape>({
  customValueParser = defaultParser,
  filters,
  shape,
}: {
  shape?: TFilters
  filters?: unknown
  /**
   * Parse a single filter value
   * When not defined, a default parser is used
   * @param value the filter value to address
   * @returns the filter value parsed
   */
  customValueParser?: (value: unknown) => unknown
}) => {
  if (!filters || !shape) return
  const filtersParsed = z.object(shape).partial().parse(filters)
  const snakedFilters = objectToSnakeCaseArr(filtersParsed)
  if (!snakedFilters) return
  const entries = Object.entries(snakedFilters).flatMap(([k, v]) => {
    const parsedValue = customValueParser(v)
    if (!parsedValue) return []
    return [[k, parsedValue]]
  })
  return Object.fromEntries(entries) as SnakeCasedPropertiesDeep<AsQueryParam<GetInferredFromRawWithBrand<TFilters>>>
}

export type FiltersShape = Record<string, z.ZodString | z.ZodNumber | z.ZodArray<z.ZodNumber> | z.ZodArray<z.ZodString>>
