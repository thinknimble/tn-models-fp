import Pagination, { IPagination } from "../pagination"

type PaginationResult<TEntity> = {
  count: number
  next: string | null
  previous: string | null
  results: TEntity[]
}

type FilterFn<TFilter = any, TEntity = unknown> = (params?: {
  filters?: TFilter
  pagination?: IPagination
}) => Promise<PaginationResult<TEntity>>

type FilterParam<T extends FilterFn<unknown, unknown>> = T extends FilterFn<infer TFilters, unknown> ? TFilters : never

type GetListType<T extends FilterFn> = T extends FilterFn<never, infer TEntity> ? TEntity : never

export const createCollectionManager = <TFetchList extends FilterFn>({
  fetchList,
  list: feedList,
  filters,
  pagination: feedPagination = Pagination.create(),
  refreshing: feedRefreshing = false,
  loadingNextPage: feedLoadingNextPage = false,
}: {
  fetchList: TFetchList
  list?: GetListType<TFetchList>[]
  refreshing?: boolean
  loadingNextPage?: boolean
  filters?: FilterParam<TFetchList>
  pagination?: IPagination
}) => {
  let list: GetListType<TFetchList>[] = feedList ?? []
  let pagination: IPagination = feedPagination
  let refreshing: boolean = feedRefreshing
  let loadingNextPage: boolean = feedLoadingNextPage

  const update = (data: PaginationResult<GetListType<TFetchList>>, append = false) => {
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
      // we know better here that this is what it returns, otherwise we're left with unknown or having to do some workaround (like parsing, which btw is already done within fetchList so there's no point in doing it again)
      const res = (await fetchList({ filters, pagination: pagination })) as PaginationResult<GetListType<TFetchList>>
      update(res)
    } finally {
      refreshing = false
    }
  }

  const nextPage = async () => {
    pagination.setNextPage()
    return refresh()
  }

  const prevPage = async () => {
    pagination.setPrevPage()
    return refresh()
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
      const res = (await fetchList({ filters, pagination })) as PaginationResult<GetListType<TFetchList>>
      update(res, true)
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
