import { ZodRawShape } from "zod"
import Pagination, { IPagination } from "../pagination"
import { GetZodInferredTypeFromRaw } from "./api"
import { getPaginatedZod } from "./pagination"

type PaginationResult<TEntity> = {
  count: number
  next: string | null
  previous: string | null
  results: TEntity[]
}

type FilterFn<TFilter, TEntity> = (params?: {
  filters?: TFilter
  pagination?: IPagination
}) => Promise<PaginationResult<TEntity>>

type FilterParam<T extends FilterFn<any, any>> = T extends FilterFn<infer TFilters, any> ? TFilters : never

export const createCollectionManager = <TFetchList extends FilterFn<any, any>, TEntityZodShape extends ZodRawShape>({
  fetchList,
  list: feedList,
  filters,
  pagination: feedPagination = Pagination.create(),
  entityZodShape,
  refreshing: feedRefreshing = false,
  loadingNextPage: feedLoadingNextPage = false,
}: {
  fetchList: TFetchList
  entityZodShape: TEntityZodShape
  list?: GetZodInferredTypeFromRaw<TEntityZodShape>[]
  refreshing?: boolean
  loadingNextPage?: boolean
  filters?: FilterParam<TFetchList>
  pagination?: IPagination
}) => {
  let list: GetZodInferredTypeFromRaw<TEntityZodShape>[] = feedList ?? []
  let pagination: IPagination = feedPagination
  let refreshing: boolean = feedRefreshing
  let loadingNextPage: boolean = feedLoadingNextPage

  const update = (data: PaginationResult<GetZodInferredTypeFromRaw<TEntityZodShape>>, append = false) => {
    list = [...(append ? list : []), ...data.results]
    pagination = Pagination.create({
      ...pagination,
      next: data.next,
      previous: data.previous,
      totalCount: data.count,
    })
  }

  const refresh = async (): Promise<void> => {
    refreshing = true
    try {
      const res = await fetchList({ filters, pagination: pagination })
      const parsed = getPaginatedZod(entityZodShape).parse(res)
      update(parsed)
    } finally {
      refreshing = false
    }
  }

  const nextPage = () => {
    pagination.setNextPage()
    refresh()
  }

  const prevPage = () => {
    pagination.setPrevPage()
    refresh()
  }
  const addNextPage = async () => {
    if (pagination.next === null) {
      return
    }
    loadingNextPage = true
    pagination = Pagination.create({
      ...pagination,
      page: pagination.page + 1,
    })

    try {
      const res = await fetchList({ filters, pagination })
      const parsed = getPaginatedZod(entityZodShape).parse(res)
      update(parsed, true)
    } finally {
      loadingNextPage = false
    }
  }
  return {
    update,
    refresh,
    nextPage,
    prevPage,
    addNextPage,
    //TODO: I'd like someone to give this a shot in a vue app so that we can tell whether it works as expected (as a piece of state?)
    get list() {
      return list
    },
    get refreshing() {
      return refreshing
    },
    //? do we need a setter for this or should it just be changeable from within
    set refreshing(newValue: boolean) {
      refreshing = newValue
    },
    get loadingNextPage() {
      return loadingNextPage
    },
    //? same question for this setter
    set loadingNextPage(newValue: boolean) {
      loadingNextPage = newValue
    },
    get pagination() {
      return pagination
    },
  }
}
