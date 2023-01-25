import { IPagination } from "../pagination";
declare type PaginationResult<TEntity> = {
    count: number;
    next: string | null;
    previous: string | null;
    results: TEntity[];
};
declare type FilterFn<TFilter = any, TEntity = unknown> = (params?: {
    filters?: TFilter;
    pagination?: IPagination;
}) => Promise<PaginationResult<TEntity>>;
declare type FilterParam<T extends FilterFn<unknown, unknown>> = T extends FilterFn<infer TFilters, unknown> ? TFilters : never;
declare type GetListType<T extends FilterFn> = T extends FilterFn<never, infer TEntity> ? TEntity : never;
export declare const createCollectionManager: <TFetchList extends FilterFn<any, unknown>>({ fetchList, list: feedList, filters, pagination: feedPagination, refreshing: feedRefreshing, loadingNextPage: feedLoadingNextPage, }: {
    fetchList: TFetchList;
    list?: GetListType<TFetchList>[] | undefined;
    refreshing?: boolean | undefined;
    loadingNextPage?: boolean | undefined;
    filters?: FilterParam<TFetchList> | undefined;
    pagination?: IPagination | undefined;
}) => {
    update: (data: PaginationResult<GetListType<TFetchList>>, append?: boolean) => void;
    refresh: () => Promise<void>;
    nextPage: () => Promise<void>;
    prevPage: () => Promise<void>;
    addNextPage: () => Promise<void>;
    readonly list: GetListType<TFetchList>[];
    refreshing: boolean;
    loadingNextPage: boolean;
    readonly pagination: IPagination;
};
export {};
//# sourceMappingURL=collection-manager.d.ts.map