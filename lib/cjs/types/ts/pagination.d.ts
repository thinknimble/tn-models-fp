declare const PaginationDefaults: {
    page: number;
    totalCount: number;
    next: null;
    previous: null;
    size: number;
};
export { PaginationDefaults };
export interface PaginationKwargs {
    page: number;
    totalCount: number;
    next: null | string;
    previous: null | string;
    size: number;
}
export interface IPagination {
    page: number;
    totalCount: number;
    next: null | string;
    previous: null | string;
    size: number;
    copy(): IPagination;
    update(data: unknown): Pagination;
    calcTotalPages(pagination: unknown): number;
    setNextPage(): void;
    setPrevPage(): void;
    get hasNextPage(): boolean;
    get hasPrevPage(): boolean;
    get currentPageStart(): number;
    get currentPageEnd(): number;
}
export default class Pagination implements IPagination {
    page: number;
    totalCount: number;
    next: null | string;
    previous: null | string;
    size: number;
    constructor(opts?: Partial<PaginationKwargs>);
    static create(opts?: Partial<PaginationKwargs>): Pagination;
    copy(): IPagination;
    update(data?: {}): Pagination;
    calcTotalPages(pagination: IPagination): number;
    setNextPage(): void;
    setPrevPage(): void;
    get hasPrevPage(): boolean;
    get hasNextPage(): boolean;
    get currentPageStart(): number;
    get currentPageEnd(): number;
}
//# sourceMappingURL=pagination.d.ts.map