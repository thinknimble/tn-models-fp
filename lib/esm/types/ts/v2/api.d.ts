import { AxiosInstance } from "axios";
import { z } from "zod";
import { IPagination } from "../pagination";
import { getPaginatedZod } from "./pagination";
import { CallbackUtils, GetZodInferredTypeFromRaw, ZodPrimitives } from "./utils";
declare const paginationFiltersZod: z.ZodOptional<z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page?: number | undefined;
    pageSize?: number | undefined;
}, {
    page?: number | undefined;
    pageSize?: number | undefined;
}>>;
export declare type PaginationFilters = z.infer<typeof paginationFiltersZod>;
declare const filtersZod: z.ZodOptional<z.ZodObject<{
    ordering: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    ordering?: string | undefined;
}, {
    ordering?: string | undefined;
}>>;
declare type InferCallbackInput<TInput extends z.ZodRawShape | z.ZodTypeAny> = TInput extends z.ZodRawShape ? GetZodInferredTypeFromRaw<TInput> : TInput extends z.ZodTypeAny ? z.infer<TInput> : never;
declare type CallbackInput<TInput extends z.ZodRawShape | ZodPrimitives> = TInput extends z.ZodVoid ? unknown : {
    input: InferCallbackInput<TInput>;
};
declare type CustomServiceCallback<TInput extends z.ZodRawShape | ZodPrimitives = z.ZodVoid, TOutput extends z.ZodRawShape | ZodPrimitives = z.ZodVoid> = (params: {
    client: AxiosInstance;
    /**
     * Note this endpoint is the same as defined on api creation. So you must address its trailing slash on client call if required
     */
    endpoint: string;
} & CallbackUtils<TInput, TOutput> & CallbackInput<TInput>) => Promise<TOutput extends z.ZodRawShape ? GetZodInferredTypeFromRaw<TOutput> : TOutput extends z.ZodTypeAny ? z.infer<TOutput> : never>;
declare type CustomServiceCallInputObj<TInput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined> = {
    inputShape: TInput;
};
declare type CustomServiceCallOutputObj<TOutput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined> = {
    outputShape: TOutput;
};
declare type CustomServiceCallOpts<TInput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined, TOutput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined> = CustomServiceCallInputObj<TInput> & CustomServiceCallOutputObj<TOutput> & {
    callback: CustomServiceCallback<TInput, TOutput>;
};
/**
 * Create a custom type-inferred service call with both input and output
 */
export declare function createCustomServiceCall<TInput extends z.ZodRawShape | ZodPrimitives, TOutput extends z.ZodRawShape | ZodPrimitives>(models: CustomServiceCallInputObj<TInput> & CustomServiceCallOutputObj<TOutput>, cb: CustomServiceCallback<TInput, TOutput>): CustomServiceCallOpts<TInput, TOutput>;
/**
 * Create a custom type-inferred service call with input only
 */
export declare function createCustomServiceCall<TInput extends z.ZodRawShape | ZodPrimitives>(models: CustomServiceCallInputObj<TInput>, cb: CustomServiceCallback<TInput, z.ZodVoid>): CustomServiceCallOpts<TInput, z.ZodVoid>;
/**
 * Create a custom type-inferred service call with output only
 */
export declare function createCustomServiceCall<TOutput extends z.ZodRawShape | ZodPrimitives>(models: CustomServiceCallOutputObj<TOutput>, cb: CustomServiceCallback<z.ZodVoid, TOutput>): CustomServiceCallOpts<z.ZodVoid, TOutput>;
/**
 * Create a custom type-inferred service call with neither input nor output
 */
export declare function createCustomServiceCall(cb: CustomServiceCallback<z.ZodVoid, z.ZodVoid>): CustomServiceCallOpts<z.ZodVoid, z.ZodVoid>;
/**
 * Base type for custom service calls which serves as a placeholder to later take advantage of inference
 */
declare type CustomServiceCallPlaceholder = {
    inputShape: any;
    outputShape: any;
    callback: (params: {
        endpoint: string;
        client: AxiosInstance;
        input: any;
        utils: {
            fromApi: (obj: object) => never;
            toApi: (obj: object) => never;
        };
    }) => Promise<unknown>;
};
/**
 * Get resulting custom service call from `createApi`
 */
declare type CustomServiceCallsRecord<TOpts extends object> = TOpts extends Record<string, CustomServiceCallPlaceholder> ? {
    [TKey in keyof TOpts]: (inputs: TOpts[TKey]["inputShape"] extends z.ZodRawShape ? GetZodInferredTypeFromRaw<TOpts[TKey]["inputShape"]> : TOpts[TKey]["inputShape"] extends z.ZodTypeAny ? z.infer<TOpts[TKey]["inputShape"]> : never) => Promise<TOpts[TKey]["outputShape"] extends z.ZodRawShape ? GetZodInferredTypeFromRaw<TOpts[TKey]["outputShape"]> : TOpts[TKey]["outputShape"] extends z.ZodTypeAny ? z.infer<TOpts[TKey]["outputShape"]> : never>;
} : never;
declare type BareApiService<TEntity extends z.ZodRawShape, TCreate extends z.ZodRawShape, TExtraFilters extends z.ZodRawShape = never> = {
    client: AxiosInstance;
    retrieve(id: string): Promise<GetZodInferredTypeFromRaw<TEntity>>;
    create(inputs: GetZodInferredTypeFromRaw<TCreate>): Promise<GetZodInferredTypeFromRaw<TEntity>>;
    list(params?: {
        filters?: GetZodInferredTypeFromRaw<TExtraFilters> & z.infer<typeof filtersZod>;
        pagination?: IPagination;
    }): Promise<z.infer<ReturnType<typeof getPaginatedZod<TEntity>>>>;
};
declare type ApiService<TEntity extends z.ZodRawShape, TCreate extends z.ZodRawShape, TCustomServiceCalls extends object, TExtraFilters extends z.ZodRawShape = never> = BareApiService<TEntity, TCreate, TExtraFilters> & {
    /**
     * The custom calls you declared as input but as plain functions and wrapped for type safety
     */
    customServiceCalls: CustomServiceCallsRecord<TCustomServiceCalls>;
    /**
     * Alias for customServiceCalls
     */
    csc: CustomServiceCallsRecord<TCustomServiceCalls>;
};
declare type ApiBaseParams<TApiEntity extends z.ZodRawShape, TApiCreate extends z.ZodRawShape, TExtraFilters extends z.ZodRawShape = never> = {
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
         * Zod raw shape of extra filters if any
         */
        extraFilters?: TExtraFilters;
    };
    /**
     * The base endpoint for te api to hit. We append this to request's uris for listing, retrieving and creating
     */
    readonly endpoint: string;
    /**
     * The axios instance created for the app.
     */
    client: AxiosInstance;
};
export declare function createApi<TApiEntity extends z.ZodRawShape, TApiCreate extends z.ZodRawShape, TExtraFilters extends z.ZodRawShape = never, TCustomServiceCalls extends Record<string, CustomServiceCallPlaceholder> = never>(base: ApiBaseParams<TApiEntity, TApiCreate, TExtraFilters>, 
/**
 * Create your own custom service calls to use with this API. Tools for case conversion are provided.
 */
customServiceCalls: TCustomServiceCalls): ApiService<TApiEntity, TApiCreate, TCustomServiceCalls, TExtraFilters>;
export declare function createApi<TApiEntity extends z.ZodRawShape, TApiCreate extends z.ZodRawShape, TExtraFilters extends z.ZodRawShape = never>(base: ApiBaseParams<TApiEntity, TApiCreate, TExtraFilters>): BareApiService<TApiEntity, TApiCreate, TExtraFilters>;
export {};
//# sourceMappingURL=api.d.ts.map