import { SnakeCase, SnakeCasedPropertiesDeep } from "@thinknimble/tn-utils";
import { AxiosInstance } from "axios";
import { z } from "zod";
import { IPagination } from "../pagination";
import { getPaginatedZod } from "./pagination";
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
declare type CustomServiceCallInputOutputs<TInput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined, TOutput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined> = {
    inputShape: TInput;
    outputShape: TOutput;
};
declare type CustomServiceCallback<TInput extends z.ZodRawShape | ZodPrimitives = z.ZodVoid, TOutput extends z.ZodRawShape | ZodPrimitives = z.ZodVoid> = (params: {
    client: AxiosInstance;
    endpoint: string;
} & (TInput extends z.ZodVoid ? TOutput extends z.ZodVoid ? unknown : TOutput extends ZodPrimitives ? unknown : {
    utils: {
        fromApi: (obj: object) => TOutput extends z.ZodRawShape ? GetZodInferredTypeFromRaw<TOutput> : TOutput extends z.ZodTypeAny ? z.infer<TOutput> : never;
    };
} : TOutput extends z.ZodVoid ? {
    input: TInput extends z.ZodRawShape ? GetZodInferredTypeFromRaw<TInput> : TInput extends z.ZodTypeAny ? z.infer<TInput> : never;
} & (TInput extends ZodPrimitives ? unknown : {
    utils: {
        toApi: (obj: object) => TInput extends z.ZodRawShape ? SnakeCasedPropertiesDeep<GetZodInferredTypeFromRaw<TInput>> : TInput extends z.ZodTypeAny ? z.infer<TInput> : never;
    };
}) : {
    input: TInput extends z.ZodRawShape ? GetZodInferredTypeFromRaw<TInput> : TInput extends z.ZodTypeAny ? z.infer<TInput> : never;
} & ((TOutput extends ZodPrimitives ? unknown : {
    utils: {
        fromApi: (obj: object) => TOutput extends z.ZodRawShape ? GetZodInferredTypeFromRaw<TOutput> : TOutput extends z.ZodTypeAny ? z.infer<TOutput> : never;
    };
}) & (TInput extends ZodPrimitives ? unknown : {
    utils: {
        toApi: (obj: object) => TInput extends z.ZodRawShape ? SnakeCasedPropertiesDeep<GetZodInferredTypeFromRaw<TInput>> : TInput extends z.ZodTypeAny ? z.infer<TInput> : never;
    };
})))) => Promise<TOutput extends z.ZodRawShape ? GetZodInferredTypeFromRaw<TOutput> : TOutput extends z.ZodTypeAny ? z.infer<TOutput> : never>;
declare type CustomServiceCallOpts<TInput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined, TOutput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined> = CustomServiceCallInputOutputs<TInput, TOutput> & {
    callback: CustomServiceCallback<TInput, TOutput>;
};
declare type ZodPrimitives = z.ZodString | z.ZodNumber | z.ZodDate | z.ZodBigInt | z.ZodBoolean | z.ZodUndefined | z.ZodVoid;
/**
 * Use this method to get the right type inference when creating a custom service call
 */
export declare function createCustomServiceCall<TInput extends z.ZodRawShape | ZodPrimitives, TOutput extends z.ZodRawShape | ZodPrimitives>(models: CustomServiceCallInputOutputs<TInput, TOutput>, cb: CustomServiceCallback<TInput, TOutput>): CustomServiceCallOpts<TInput, TOutput>;
export declare function createCustomServiceCall<TInput extends z.ZodRawShape | ZodPrimitives>(models: {
    inputShape: TInput;
}, cb: CustomServiceCallback<TInput, z.ZodVoid>): CustomServiceCallOpts<TInput, z.ZodVoid>;
export declare function createCustomServiceCall<TOutput extends z.ZodRawShape | ZodPrimitives>(models: {
    outputShape: TOutput;
}, cb: CustomServiceCallback<z.ZodVoid, TOutput>): CustomServiceCallOpts<z.ZodVoid, TOutput>;
export declare function createCustomServiceCall(cb: CustomServiceCallback<z.ZodVoid, z.ZodVoid>): CustomServiceCallOpts<z.ZodVoid, z.ZodVoid>;
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
declare type CustomServiceCall<TOpts extends object> = TOpts extends Record<string, CustomServiceCallPlaceholder> ? {
    [TKey in keyof TOpts]: (inputs: TOpts[TKey]["inputShape"] extends z.ZodRawShape ? GetZodInferredTypeFromRaw<TOpts[TKey]["inputShape"]> : TOpts[TKey]["inputShape"] extends z.ZodTypeAny ? z.infer<TOpts[TKey]["inputShape"]> : never) => Promise<TOpts[TKey]["outputShape"] extends z.ZodRawShape ? GetZodInferredTypeFromRaw<TOpts[TKey]["outputShape"]> : TOpts[TKey]["outputShape"] extends z.ZodTypeAny ? z.infer<TOpts[TKey]["outputShape"]> : never>;
} : never;
declare type ZodRawShapeSnakeCased<T extends z.ZodRawShape> = {
    [TKey in keyof T as SnakeCase<TKey>]: T[TKey];
};
export declare const getPaginatedSnakeCasedZod: <T extends z.ZodRawShape>(zodShape: T) => z.ZodObject<{
    count: z.ZodNumber;
    next: z.ZodNullable<z.ZodString>;
    previous: z.ZodNullable<z.ZodString>;
    results: z.ZodArray<z.ZodObject<ZodRawShapeSnakeCased<T>, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<ZodRawShapeSnakeCased<T> extends infer T_3 extends z.ZodRawShape ? { [k_2 in keyof T_3]: ZodRawShapeSnakeCased<T>[k_2]["_output"]; } : never> extends infer T_1 ? { [k_1 in keyof T_1]: z.objectUtil.addQuestionMarks<ZodRawShapeSnakeCased<T> extends infer T_2 extends z.ZodRawShape ? { [k in keyof T_2]: ZodRawShapeSnakeCased<T>[k]["_output"]; } : never>[k_1]; } : never, z.objectUtil.addQuestionMarks<ZodRawShapeSnakeCased<T> extends infer T_6 extends z.ZodRawShape ? { [k_2_1 in keyof T_6]: ZodRawShapeSnakeCased<T>[k_2_1]["_input"]; } : never> extends infer T_4 ? { [k_3 in keyof T_4]: z.objectUtil.addQuestionMarks<ZodRawShapeSnakeCased<T> extends infer T_5 extends z.ZodRawShape ? { [k_2 in keyof T_5]: ZodRawShapeSnakeCased<T>[k_2]["_input"]; } : never>[k_3]; } : never>, "many">;
}, "strip", z.ZodTypeAny, {
    next: string | null;
    previous: string | null;
    count: number;
    results: (z.objectUtil.addQuestionMarks<ZodRawShapeSnakeCased<T> extends infer T_3 extends z.ZodRawShape ? { [k_2 in keyof T_3]: ZodRawShapeSnakeCased<T>[k_2]["_output"]; } : never> extends infer T_1 ? { [k_1 in keyof T_1]: z.objectUtil.addQuestionMarks<ZodRawShapeSnakeCased<T> extends infer T_2 extends z.ZodRawShape ? { [k in keyof T_2]: ZodRawShapeSnakeCased<T>[k]["_output"]; } : never>[k_1]; } : never)[];
}, {
    next: string | null;
    previous: string | null;
    count: number;
    results: (z.objectUtil.addQuestionMarks<ZodRawShapeSnakeCased<T> extends infer T_6 extends z.ZodRawShape ? { [k_2_1 in keyof T_6]: ZodRawShapeSnakeCased<T>[k_2_1]["_input"]; } : never> extends infer T_4 ? { [k_3 in keyof T_4]: z.objectUtil.addQuestionMarks<ZodRawShapeSnakeCased<T> extends infer T_5 extends z.ZodRawShape ? { [k_2 in keyof T_5]: ZodRawShapeSnakeCased<T>[k_2]["_input"]; } : never>[k_3]; } : never)[];
}>;
export declare type GetZodInferredTypeFromRaw<T extends z.ZodRawShape> = z.infer<ReturnType<typeof z.object<T>>>;
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
    customServiceCalls: CustomServiceCall<TCustomServiceCalls>;
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
export declare function createApi<TApiEntity extends z.ZodRawShape, TApiCreate extends z.ZodRawShape, TCustomServiceCalls extends Record<string, CustomServiceCallPlaceholder>, TExtraFilters extends z.ZodRawShape = never>(base: ApiBaseParams<TApiEntity, TApiCreate, TExtraFilters>, 
/**
 * Create your own custom service calls to use with this API. Tools for case conversion are provided.
 */
customServiceCalls: TCustomServiceCalls): ApiService<TApiEntity, TApiCreate, TCustomServiceCalls, TExtraFilters>;
export declare function createApi<TApiEntity extends z.ZodRawShape, TApiCreate extends z.ZodRawShape, TExtraFilters extends z.ZodRawShape = never>(base: ApiBaseParams<TApiEntity, TApiCreate, TExtraFilters>): BareApiService<TApiEntity, TApiCreate, TExtraFilters>;
export {};
//# sourceMappingURL=api.d.ts.map