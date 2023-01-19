import { CamelCasedPropertiesDeep } from "@thinknimble/tn-utils";
import { AxiosInstance } from "axios";
import { z, ZodAny, ZodRawShape, ZodTypeAny } from "zod";
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
declare const getPaginatedZod: <T extends z.ZodRawShape>(zod: T) => z.ZodObject<{
    count: z.ZodNumber;
    next: z.ZodNullable<z.ZodString>;
    previous: z.ZodNullable<z.ZodString>;
    results: z.ZodArray<z.ZodObject<T, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_output"]; }> extends infer T_1 ? { [k_1 in keyof T_1]: z.objectUtil.addQuestionMarks<{ [k in keyof T]: T[k]["_output"]; }>[k_1]; } : never, z.objectUtil.addQuestionMarks<{ [k_2_1 in keyof T]: T[k_2_1]["_input"]; }> extends infer T_2 ? { [k_3 in keyof T_2]: z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_input"]; }>[k_3]; } : never>, "many">;
}, "strip", z.ZodTypeAny, {
    next: string | null;
    previous: string | null;
    count: number;
    results: (z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_output"]; }> extends infer T_1 ? { [k_1 in keyof T_1]: z.objectUtil.addQuestionMarks<{ [k in keyof T]: T[k]["_output"]; }>[k_1]; } : never)[];
}, {
    next: string | null;
    previous: string | null;
    count: number;
    results: (z.objectUtil.addQuestionMarks<{ [k_2_1 in keyof T]: T[k_2_1]["_input"]; }> extends infer T_2 ? { [k_3 in keyof T_2]: z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_input"]; }>[k_3]; } : never)[];
}>;
export declare type GetZodInferredTypeFromRaw<T extends ZodRawShape> = z.infer<ReturnType<typeof z.object<T>>>;
declare type BareApiService<TEntity extends ZodRawShape, TCreate extends ZodRawShape, TExtraFilters extends ZodRawShape = Record<string, ZodTypeAny>> = {
    client: AxiosInstance;
    retrieve(id: string): Promise<GetZodInferredTypeFromRaw<TEntity>>;
    create(inputs: GetZodInferredTypeFromRaw<TCreate>): Promise<GetZodInferredTypeFromRaw<TEntity>>;
    list(filters?: TExtraFilters extends ZodAny ? z.infer<typeof filtersZod> : GetZodInferredTypeFromRaw<TExtraFilters> & z.infer<typeof filtersZod>): Promise<z.infer<ReturnType<typeof getPaginatedZod<TEntity>>>>;
};
declare type ApiService<TEntity extends ZodRawShape, TCreate extends ZodRawShape, TCustomEndpoints extends object, TExtraFilters extends ZodRawShape = Record<string, ZodTypeAny>> = BareApiService<TEntity, TCreate, TExtraFilters> & {
    customEndpoints: ExtractCamelCaseValue<TCustomEndpoints>;
};
declare type ApiBaseParams<TApiEntity extends ZodRawShape, TApiCreate extends ZodRawShape, TApiUpdate extends ZodRawShape, TExtraFilters extends ZodRawShape = Record<string, ZodTypeAny>> = {
    /**
     * Zod raw shapes to use as models. All these should be the frontend camelCased version
     */
    models: {
        /**
         * Zod raw shape of the equivalent camel-cased version of the entity in backend
         *
         * Example
         * ```ts
         * type BackendModel = {
         *  my_model:string
         * }
         * type TApiEntity = {
         *  myModel: z.string()
         * }
         * ```
         */
        entity: TApiEntity;
        /**
         * Zod raw shape of the input for creating an entity
         */
        create: TApiCreate;
        /**
         * Zod raw shape of input for updating an entity
         */
        update: TApiUpdate;
        /**
         * Zod raw shape of extra filters if any
         */
        extraFilters?: TExtraFilters;
    };
    /**
     * The base endpoint for te api to hit. We append this to request's uris for listing, retrieving and creating
     */
    endpoint: string;
    /**
     * The axios instance created for the app.
     */
    client: AxiosInstance;
};
export declare function createApi<TApiEntity extends ZodRawShape, TApiCreate extends ZodRawShape, TApiUpdate extends ZodRawShape, TCustomEndpoints extends Record<string, CustomServiceCall>, TExtraFilters extends ZodRawShape = Record<string, ZodTypeAny>>(base: ApiBaseParams<TApiEntity, TApiCreate, TApiUpdate, TExtraFilters>, 
/**
 * Create your own custom endpoints to use with this API. We take care of camel and snake casing on the way in and out.
 * You will need to handle errors and reuse the same client passed in previous parameter as well as append the endpoint.
 */
customEndpoints: TCustomEndpoints): ApiService<TApiEntity, TApiCreate, TCustomEndpoints, TExtraFilters>;
export declare function createApi<TApiEntity extends ZodRawShape, TApiCreate extends ZodRawShape, TApiUpdate extends ZodRawShape, TExtraFilters extends ZodRawShape = Record<string, ZodTypeAny>>(base: ApiBaseParams<TApiEntity, TApiCreate, TApiUpdate, TExtraFilters>): BareApiService<TApiEntity, TApiCreate, TExtraFilters>;
export {};
//# sourceMappingURL=api.d.ts.map