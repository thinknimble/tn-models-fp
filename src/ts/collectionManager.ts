import Pagination, { IPagination } from "./pagination"

export interface ICollectionKwargs {
  list: any[]
  pagination: IPagination
  refreshing: boolean
  loadingNextPage: boolean
  filters: object
  ModelClass: null | any
}

export interface ICollectionManager {
  update(data: any, append: boolean): ICollectionManager
  refresh(): void
  nextPage(): void
  prevPage(): void
  addNextPage(): void
}

export default class CollectionManager<T> {
  list: T[]
  pagination: IPagination
  refreshing: boolean
  loadingNextPage: boolean
  filters: object
  ModelClass: null | any
  constructor({
    list = [],
    pagination = Pagination.create(),
    refreshing = false,
    loadingNextPage = false,
    filters = {},
    ModelClass = null,
  } = {}) {
    this.list = list
    this.pagination = pagination
    this.refreshing = refreshing
    this.loadingNextPage = loadingNextPage
    this.filters = filters
    this.ModelClass = ModelClass
  }
  static create<T>(opts: ICollectionKwargs = {} as ICollectionKwargs) {
    if (Object.keys(opts)) {
      return new CollectionManager<T>(opts as any)
    }
    return new CollectionManager<T>()
  }
  update(data: any, append = false) {
    this.list = [...(append ? this.list : []), ...data.results]
    this.pagination = Pagination.create({
      ...this.pagination,
      next: data.next,
      previous: data.previous,
      totalCount: data.count,
    })
    return this
  }
  async refresh() {
    this.refreshing = true
    try {
      const response = await this.ModelClass.api.list({
        pagination: this.pagination,
        filters: this.filters,
      })
      return this.update(response)
    } finally {
      this.refreshing = false
    }
  }
  nextPage() {
    this.pagination.setNextPage()
    return this.refresh()
  }
  prevPage() {
    this.pagination.setPrevPage()
    return this.refresh()
  }
  async addNextPage() {
    if (this.pagination.next === null) {
      return
    }

    this.loadingNextPage = true
    this.pagination = Pagination.create({
      ...this.pagination,
      page: this.pagination.page + 1,
    })

    try {
      const response = await this.ModelClass.api.list({
        pagination: this.pagination,
        filters: this.filters,
      })
      return this.update(response, true)
    } finally {
      this.loadingNextPage = false
    }
  }
}
