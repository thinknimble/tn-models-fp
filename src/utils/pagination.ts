import { z } from "zod"
import { zodObjectToSnakeRecursive } from "./zod"

//TODO: this needs cleanup. I am not happy with the usage of these across the library. Seems like we could have at least one of these less

export const getPaginatedShape = <T extends z.ZodRawShape>(zodRawShape: T) => {
  return {
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(zodObjectToSnakeRecursive(z.object(zodRawShape))),
  }
}

export const getPaginatedSnakeCasedZod = <T extends z.ZodRawShape>(zodRawShape: T) =>
  z.object(getPaginatedShape(zodRawShape))

export const getPaginatedZod = <T extends z.ZodRawShape>(zodRawShape: T) =>
  z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(z.object(zodRawShape)),
  })

const PaginationDefaults = {
  page: 1,
  totalCount: 0,
  next: null,
  previous: null,
  size: 25,
}
export { PaginationDefaults }
export interface PaginationKwargs {
  page: number
  totalCount: number
  next: null | string
  previous: null | string
  size: number
}

export interface IPagination {
  page: number
  totalCount: number
  next: null | string
  previous: null | string
  size: number
  copy(): IPagination
  update(data: unknown): Pagination
  calcTotalPages(pagination: unknown): number
  setNextPage(): void
  setPrevPage(): void
  get hasNextPage(): boolean
  get hasPrevPage(): boolean
  get currentPageStart(): number
  get currentPageEnd(): number
}

export class Pagination implements IPagination {
  page: number
  totalCount: number
  next: null | string
  previous: null | string
  size: number
  constructor(opts?: Partial<PaginationKwargs>) {
    const options = { ...PaginationDefaults, ...(opts ?? {}) }
    this.page = options.page
    this.totalCount = options.totalCount
    this.next = options.next
    this.previous = options.previous
    this.size = options.size
  }

  static create(opts?: Partial<PaginationKwargs>) {
    return new Pagination(opts)
  }

  copy(): IPagination {
    return Pagination.create(this)
  }

  update(data = {}): Pagination {
    return Object.assign(this.copy(), data)
  }

  calcTotalPages(pagination: IPagination): number {
    const { totalCount, size } = pagination
    if (!totalCount) {
      return 0
    }
    return Math.ceil(totalCount / size)
  }

  setNextPage(): void {
    if (this.page === this.calcTotalPages(this)) return
    this.page++
  }

  setPrevPage(): void {
    if (this.page === 1) return
    this.page--
  }

  get hasPrevPage(): boolean {
    return this.page > 1
  }

  get hasNextPage(): boolean {
    if (this.calcTotalPages(this)) {
      return this.page !== this.calcTotalPages(this)
    } else {
      return false
    }
  }

  get currentPageStart(): number {
    return this.page > 1 ? (this.page - 1) * this.size : 0
  }

  get currentPageEnd(): number {
    return Math.min(this.page > 1 ? this.page * this.size : this.size, this.totalCount)
  }
}
