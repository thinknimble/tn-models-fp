import { SnakeCasedPropertiesDeep } from "@thinknimble/tn-utils"
import { z } from "zod"
import { objectToSnakeCaseArr } from "./api"
import { GetInferredFromRaw, GetInferredFromRawWithReadonly } from "./zod"

export const paginationFiltersZodShape = {
  page: z.number(),
  pageSize: z.number(),
}

export type PaginationFilters = GetInferredFromRaw<typeof paginationFiltersZodShape>

type AsQueryParam<T extends object> = {
  [K in keyof T as T[K] extends string | number ? K : never]: string
}

export const parseFilters = <TFilters extends FiltersShape>({
  filters,
  shape,
}: {
  shape?: TFilters
  filters?: unknown
}) => {
  if (!filters || !shape) return
  try {
    const filtersParsed = z.object(shape).partial().parse(filters)
    const snakedFilters = objectToSnakeCaseArr(filtersParsed)
    return snakedFilters
      ? (Object.fromEntries(
          Object.entries(snakedFilters).flatMap(([k, v]) => {
            if (["boolean", "number"].includes(typeof v)) return [[k, v.toString()]]
            if (!v) return []
            return [[k, v]]
          }),
        ) as SnakeCasedPropertiesDeep<AsQueryParam<GetInferredFromRawWithReadonly<TFilters>>>)
      : undefined
  } catch (e) {
    console.error(`${parseFilters.name} - errors`)
    throw e
  }
}

export type FiltersShape = Record<
  string,
  z.ZodString | z.ZodNumber | z.ZodArray<z.ZodNumber> | z.ZodArray<z.ZodString> | z.ZodBoolean
>
