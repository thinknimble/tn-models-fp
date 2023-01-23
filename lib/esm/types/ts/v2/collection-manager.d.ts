import { ZodRawShape } from "zod";
import { IPagination } from "../pagination";
import { GetZodInferredTypeFromRaw } from "./api";
declare type PaginationResult<TEntity> = {
    count: number;
    next: string | null;
    previous: string | null;
    results: TEntity[];
};
declare type FilterFn<TFilter, TEntity> = (params?: {
    filters?: TFilter;
    pagination?: IPagination;
}) => Promise<PaginationResult<TEntity>>;
declare type FilterParam<T extends FilterFn<any, any>> = T extends FilterFn<infer TFilters, any> ? TFilters : never;
export declare const createCollectionManager: <TFetchList extends FilterFn<any, any>, TEntityZodShape extends ZodRawShape>({ fetchList, list: feedList, filters, pagination: feedPagination, entityZodShape, refreshing: feedRefreshing, loadingNextPage: feedLoadingNextPage, }: {
    fetchList: TFetchList;
    entityZodShape: TEntityZodShape;
    list?: (import("zod").objectUtil.addQuestionMarks<{ [k_2 in keyof TEntityZodShape]: TEntityZodShape[k_2]["_output"]; }> extends infer T ? { [k_1 in keyof T]: import("zod").objectUtil.addQuestionMarks<{ [k in keyof TEntityZodShape]: TEntityZodShape[k]["_output"]; }>[k_1]; } : never)[] | undefined;
    refreshing?: boolean | undefined;
    loadingNextPage?: boolean | undefined;
    filters?: FilterParam<TFetchList> | undefined;
    pagination?: IPagination | undefined;
}) => {
    update: (data: PaginationResult<import("zod").objectUtil.addQuestionMarks<{ [k_2 in keyof TEntityZodShape]: TEntityZodShape[k_2]["_output"]; }> extends infer T ? { [k_1 in keyof T]: import("zod").objectUtil.addQuestionMarks<{ [k in keyof TEntityZodShape]: TEntityZodShape[k]["_output"]; }>[k_1]; } : never>, append?: boolean) => void;
    refresh: () => Promise<void>;
    nextPage: () => Promise<void>;
    prevPage: () => Promise<void>;
    addNextPage: () => Promise<void>;
    readonly list: (import("zod").objectUtil.addQuestionMarks<{ [k_2 in keyof TEntityZodShape]: TEntityZodShape[k_2]["_output"]; }> extends infer T ? { [k_1 in keyof T]: import("zod").objectUtil.addQuestionMarks<{ [k in keyof TEntityZodShape]: TEntityZodShape[k]["_output"]; }>[k_1]; } : never)[];
    refreshing: boolean;
    loadingNextPage: boolean;
    readonly pagination: IPagination;
};
export {};
//# sourceMappingURL=collection-manager.d.ts.map