import { CamelCasedPropertiesDeep } from "@thinknimble/tn-utils";
import { AxiosInstance } from "axios";
import { ZodType, z, ZodAny } from "zod";
declare const filtersZod: z.ZodOptional<z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
    ordering: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    page?: number | undefined;
    ordering?: string | undefined;
    pageSize?: number | undefined;
}, {
    page?: number | undefined;
    ordering?: string | undefined;
    pageSize?: number | undefined;
}>>;
export declare type CustomServiceCall = (inputs: any) => Promise<unknown>;
declare type ExtractCamelCaseValue<T extends object> = T extends undefined ? never : {
    [TKey in keyof T]: T[TKey] extends () => Promise<infer TResult> ? () => Promise<CamelCasedPropertiesDeep<TResult>> : T[TKey] extends (input: infer TInput) => Promise<infer TResult> ? (input: TInput) => Promise<CamelCasedPropertiesDeep<TResult>> : never;
};
declare const getPaginatedZod: <T extends ZodType<any, z.ZodTypeDef, any>>(zod: T) => z.ZodObject<{
    count: z.ZodNumber;
    next: z.ZodNullable<z.ZodString>;
    previous: z.ZodNullable<z.ZodString>;
    results: z.ZodArray<T, "many">;
}, "strip", z.ZodTypeAny, {
    next: string | null;
    previous: string | null;
    count: number;
    results: T["_output"][];
}, {
    next: string | null;
    previous: string | null;
    count: number;
    results: T["_input"][];
}>;
declare type BareApiService<TEntity extends ZodType, TCreate extends ZodType, TExtraFilters extends ZodType = ZodAny> = {
    client: AxiosInstance;
    retrieve(id: string): Promise<z.infer<TEntity>>;
    create(inputs: z.infer<TCreate>): Promise<z.infer<TCreate>>;
    list(filters: TExtraFilters extends ZodAny ? z.infer<typeof filtersZod> : z.infer<TExtraFilters> & z.infer<typeof filtersZod>): Promise<z.infer<ReturnType<typeof getPaginatedZod<TEntity>>>>;
};
declare type ApiService<TEntity extends ZodType, TCreate extends ZodType, TCustomEndpoints extends object, TExtraFilters extends ZodType = ZodAny> = BareApiService<TEntity, TCreate, TExtraFilters> & {
    customEndpoints: ExtractCamelCaseValue<TCustomEndpoints>;
};
declare type ApiBaseParams<TApiEntity extends ZodType, TApiCreate extends ZodType, TApiUpdate extends ZodType, TExtraFilters extends ZodType = ZodAny> = {
    models: {
        entity: TApiEntity;
        create: TApiCreate;
        update: TApiUpdate;
        extraFilters?: TExtraFilters;
    };
    endpoint: string;
    client: AxiosInstance;
};
export declare function createApi<TApiEntity extends ZodType, TApiCreate extends ZodType, TApiUpdate extends ZodType, TCustomEndpoints extends Record<string, CustomServiceCall>, TExtraFilters extends ZodType = ZodAny>(base: ApiBaseParams<TApiEntity, TApiCreate, TApiUpdate, TExtraFilters>, customEndpoints: TCustomEndpoints): ApiService<TApiEntity, TApiCreate, TCustomEndpoints, TExtraFilters>;
export declare function createApi<TApiEntity extends ZodType, TApiCreate extends ZodType, TApiUpdate extends ZodType, TExtraFilters extends ZodType = ZodAny>(base: ApiBaseParams<TApiEntity, TApiCreate, TApiUpdate, TExtraFilters>): BareApiService<TApiEntity, TApiCreate, TExtraFilters>;
export {};
//# sourceMappingURL=api.d.ts.map