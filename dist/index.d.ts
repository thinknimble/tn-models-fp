import { AxiosResponse, AxiosRequestConfig, AxiosInstance } from 'axios';
import { z } from 'zod';
import { SnakeCasedPropertiesDeep } from '@thinknimble/tn-utils';

type CustomServiceCallInputObj<TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodUndefined> = UnknownIfNever<TInput, {
    inputShape: TInput;
}>;
type CustomServiceCallOutputObj<TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodUndefined> = UnknownIfNever<TOutput, {
    outputShape: TOutput;
}>;
type CustomServiceCallFiltersObj<TFilters extends FiltersShape | z.ZodVoid = z.ZodVoid, TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid> = And<[IsAny<TOutput>, IsAny<TFilters>]> extends true ? {
    filtersShape?: any;
} : TOutput extends z.ZodVoid ? unknown : UnknownIfNever<TFilters, {
    filtersShape?: TFilters;
}>;
type InferCallbackInput<TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>> = TInput extends z.ZodRawShape ? GetInferredFromRawWithBrand<TInput> : TInput extends z.ZodRawShape ? GetInferredFromRawWithBrand<TInput> : TInput extends z.ZodTypeAny ? z.infer<TInput> : never;
type CallbackInput<TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>> = TInput extends z.ZodVoid ? unknown : {
    input: InferCallbackInput<TInput>;
};
type CallbackFilters<TFilters extends FiltersShape | z.ZodVoid, TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid> = TOutput extends z.ZodVoid ? unknown : TFilters extends FiltersShape ? {
    parsedFilters?: SnakeCasedPropertiesDeep<InferShapeOrZod<TFilters>>;
} : unknown;
type StringTrailingSlash = `${string}/`;
type AxiosCall = <TUri extends StringTrailingSlash, T = any, R = AxiosResponse<T>, D = any>(url: TUri, config?: AxiosRequestConfig<D>) => Promise<R>;
type BodyAxiosCall = <TUri extends StringTrailingSlash, T = any, R = AxiosResponse<T>, D = any>(url: StringTrailingSlash, data?: D, config?: AxiosRequestConfig<D>) => Promise<R>;
type AxiosLike = {
    get: AxiosCall;
    post: BodyAxiosCall;
    delete: AxiosCall;
    put: BodyAxiosCall;
    patch: BodyAxiosCall;
    options: AxiosCall;
    postForm: BodyAxiosCall;
    putForm: BodyAxiosCall;
    patchForm: BodyAxiosCall;
};
type StandAloneCallType = "StandAlone";
type ServiceCallFn<TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid, TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid, TFilters extends FiltersShape | z.ZodVoid = z.ZodVoid> = (...args: ResolveServiceCallArgs<TInput, TFilters>) => Promise<InferShapeOrZodWithoutBrand<TOutput>>;
type BaseUriInput<TCallType extends string = ""> = TCallType extends StandAloneCallType ? unknown : {
    slashEndingBaseUri: `${string}/`;
};
type CustomServiceCallback<TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid, TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid, TFilters extends FiltersShape | z.ZodVoid = z.ZodVoid, TCallType extends string = ""> = (params: {
    client: AxiosLike;
} & BaseUriInput<TCallType> & CallbackUtils<TInput, TOutput> & CallbackInput<TInput> & CallbackFilters<TFilters, TOutput>) => Promise<InferShapeOrZodWithoutBrand<TOutput>>;
type CustomServiceCallOpts<TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid, TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid, TFilters extends FiltersShape | z.ZodVoid = z.ZodVoid, TCallType extends string = ""> = CustomServiceCallInputObj<TInput> & CustomServiceCallOutputObj<TOutput> & {
    callback: CustomServiceCallback<TInput, TOutput, TFilters, TCallType>;
} & CustomServiceCallFiltersObj<TFilters, TOutput>;
type FromApiPlaceholder = {
    fromApi: (obj: object) => any;
};
type ToApiPlaceholder = {
    toApi: (obj: object) => any;
};
/**
 * Base type for custom service calls which serves as a placeholder to later take advantage of inference
 */
type CustomServiceCallPlaceholder<TInput extends z.ZodRawShape | ZodPrimitives | z.ZodVoid = any, TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> | z.ZodVoid = any, TFilters extends FiltersShape | z.ZodVoid = any> = {
    inputShape: TInput;
    outputShape: TOutput;
    filtersShape?: TFilters;
    callback: (params: {
        slashEndingBaseUri: `${string}/`;
        client: AxiosLike;
        input: InferShapeOrZod<TInput>;
        utils: FromApiPlaceholder & ToApiPlaceholder;
    }) => Promise<InferShapeOrZod<TOutput>>;
};
type ResolveInputArg<TInput extends object> = Is<TInput, z.ZodVoid> extends true ? unknown : {
    input: InferShapeOrZod<TInput>;
};
type ResolveFilterArg<TFilters extends object> = Is<TFilters, z.ZodVoid> extends true ? unknown : {
    filters?: Partial<InferShapeOrZod<TFilters>>;
};
type ResolveServiceCallArgs<TInput extends z.ZodRawShape | z.ZodType, TFilters extends FiltersShape | z.ZodVoid> = And<[Is<TInput, z.ZodVoid>, Is<TFilters, z.ZodVoid>]> extends true ? [] : Is<TFilters, z.ZodVoid> extends true ? [args: InferShapeOrZod<TInput>] : Is<TInput, z.ZodVoid> extends true ? [args: ResolveFilterArg<TFilters>] | [] : [args: ResolveInputArg<TInput> & ResolveFilterArg<TFilters>];
/**
 * Get resulting custom service call from `createApi`
 */
type CustomServiceCallsRecord<TOpts extends object> = TOpts extends Record<string, CustomServiceCallPlaceholder> ? {
    [K in keyof TOpts]: TOpts[K] extends CustomServiceCallPlaceholder<infer TInput, infer TOutput, any> ? TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> ? TOpts[K] extends {
        filtersShape?: infer TFilters;
    } ? TFilters extends FiltersShape ? ServiceCallFn<TInput, TOutput, TFilters> : ServiceCallFn<TInput, TOutput, z.ZodVoid> : ServiceCallFn<TInput, TOutput, z.ZodVoid> : ServiceCallFn<TInput, z.ZodVoid, z.ZodVoid> : TOpts[K];
} : "This should be a record of custom calls";
type ResolveShapeOrVoid<TInputShape extends z.ZodRawShape | ZodPrimitives = never, TOutputShape extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = never, TFiltersShape extends FiltersShape | z.ZodVoid = never> = {
    input: IsNever<TInputShape> extends true ? z.ZodVoid : TInputShape;
    output: IsNever<TOutputShape> extends true ? z.ZodVoid : TOutputShape extends z.ZodRawShape ? UnwrapBrandedRecursive<TOutputShape> : TOutputShape;
    filters: IsNever<TOutputShape> extends true ? z.ZodVoid : IsNever<TFiltersShape> extends true ? z.ZodVoid : TFiltersShape;
};
type ResolveCustomServiceCallOpts<TInputShape extends z.ZodRawShape | ZodPrimitives = never, TOutputShape extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = never, TFiltersShape extends FiltersShape | z.ZodVoid = never, TShapeOrVoid extends ResolveShapeOrVoid<any, any, any> = ResolveShapeOrVoid<TInputShape, TOutputShape, TFiltersShape>> = CustomServiceCallOpts<TShapeOrVoid["input"], TShapeOrVoid["output"], TShapeOrVoid["filters"]>;

type ZodPrimitives = z.ZodString | z.ZodNumber | z.ZodDate | z.ZodBigInt | z.ZodBoolean | z.ZodNativeEnum<any> | z.ZodUndefined | z.ZodVoid;
type GetZodObjectType<T extends z.ZodRawShape> = ReturnType<typeof z.object<T>>;
/**
 * Get the resulting inferred type from a zod shape (brands are inferred as such)
 */
type GetInferredFromRawWithBrand<T extends z.ZodRawShape> = z.infer<GetZodObjectType<T>>;
/**
 * Strip read only brand from a type, optionally unwrap some types from brands
 */
type StripReadonlyBrand<T extends z.ZodRawShape, TUnwrap extends (keyof T)[] = []> = {
    [K in keyof T as K extends TUnwrap[number] ? K : IsBrand<T[K], ReadonlyTag> extends true ? never : K]: T[K] extends z.ZodBranded<infer TZod, any> ? TZod : T[K];
};
/**
 * Infer the shape type, removing all the readonly fields in it.
 */
type GetInferredWithoutReadonlyBrands<T extends z.ZodRawShape> = GetInferredFromRawWithBrand<StripReadonlyBrand<T>>;
/**
 * Infer the shape type, removing readonly marks and inferring their inner types
 */
type GetInferredFromRaw<T extends z.ZodRawShape> = GetInferredFromRawWithBrand<UnwrapBrandedRecursive<T, ReadonlyTag>>;
type InferShapeOrZod<T extends object> = T extends z.ZodRawShape ? GetInferredFromRawWithBrand<T> : T extends z.ZodTypeAny ? z.infer<T> : never;
type InferShapeOrZodWithoutBrand<T extends object> = T extends z.ZodRawShape ? GetInferredFromRaw<T> : T extends z.ZodTypeAny ? z.infer<T> : never;
/**
 * Determine whether a given zod is of a certain brand
 */
type IsBrand<T extends z.ZodTypeAny, TBrand extends string> = T extends z.ZodBranded<infer TZod, any> ? (z.infer<T> extends z.infer<TZod> & z.BRAND<TBrand> ? true : false) : false;
type UnwrapBranded<T extends z.ZodRawShape, TBrandType extends string | number | symbol = any> = {
    [K in keyof T]: T[K] extends z.ZodBranded<infer TUnwrapped, TBrandType> ? TUnwrapped : T[K];
};
type UnwrapBrandedInArray<T extends z.ZodArray<z.ZodTypeAny>, TBrandType extends string | number | symbol = any> = T extends z.ZodArray<infer TZod> ? TZod extends z.ZodObject<z.ZodRawShape> ? TZod["shape"] extends z.ZodRawShape ? z.ZodArray<z.ZodObject<UnwrapBrandedRecursive<TZod["shape"], TBrandType>>> : T : T : T;
type UnwrapBrandedRecursive<T extends z.ZodRawShape, TBrandType extends string | number | symbol = any> = {
    [K in keyof T]: T[K] extends z.ZodObject<z.ZodRawShape> ? z.ZodObject<UnwrapBrandedRecursive<T[K]["shape"], TBrandType>> : T[K] extends z.ZodArray<z.ZodObject<z.ZodRawShape>> ? UnwrapBrandedInArray<T[K], TBrandType> : T[K] extends z.ZodBranded<infer TUnwrapped, TBrandType> ? TUnwrapped : T[K];
};

declare const READONLY_TAG = "ReadonlyField";
type ReadonlyTag = typeof READONLY_TAG;
/**
 * Identity function that just brands this type so we can recognize readonly fields
 * @param zod
 * @returns
 */
declare const readonly: <T extends z.ZodTypeAny>(zod: T) => z.ZodBranded<T, "ReadonlyField">;

type ToApiCall<TInput extends z.ZodRawShape | z.ZodTypeAny> = (obj: object) => TInput extends z.ZodRawShape ? SnakeCasedPropertiesDeep<GetInferredFromRawWithBrand<TInput>> : TInput extends z.ZodType ? z.infer<TInput> : never;
type FromApiCall<TOutput extends z.ZodRawShape | z.ZodTypeAny> = (obj: object) => TOutput extends z.ZodRawShape ? GetInferredFromRawWithBrand<TOutput> : TOutput extends z.ZodType ? z.infer<TOutput> : never;
type FromApiUtil<T extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>> = {
    /**
     * Given an object, parses the response based on outputShape, it turns the result keys into camelCase. It also shows a warning if the outputShape does not match the passed object
     */
    fromApi: FromApiCall<T>;
};
type ToApiUtil<T extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>> = {
    /**
     * Given an object, parses the input and turns its keys into snake_case
     */
    toApi: ToApiCall<T>;
};
type FromApiOrUnknown<T extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>, TIsPrimitive extends boolean = T extends ZodPrimitives ? true : false> = TIsPrimitive extends true ? unknown : T extends z.ZodVoid ? unknown : {
    utils: FromApiUtil<T>;
};
type ToApiOrUnknown<T extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>, TIsPrimitive extends boolean = T extends ZodPrimitives ? true : false> = TIsPrimitive extends true ? unknown : T extends z.ZodVoid ? unknown : {
    utils: ToApiUtil<T>;
};
type CallbackUtils<TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>, TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>> = FromApiOrUnknown<TOutput> & ToApiOrUnknown<TInput>;

declare function createApiUtils<TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>, TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>>(args: {
    name: string;
    disableLoggingWarning?: boolean;
} & ({
    inputShape: TInput;
    outputShape: TOutput;
} | {
    inputShape: TInput;
} | {
    outputShape: TOutput;
})): CallbackUtils<TInput, TOutput>;

declare const paginationFiltersZodShape: {
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
};
type PaginationFilters = GetInferredFromRawWithBrand<typeof paginationFiltersZodShape>;
type FiltersShape = Record<string, z.ZodString | z.ZodNumber | z.ZodArray<z.ZodNumber> | z.ZodArray<z.ZodString> | z.ZodBoolean>;

declare const getPaginatedZod: <T extends z.ZodRawShape>(zodRawShape: T) => z.ZodObject<{
    count: z.ZodNumber;
    next: z.ZodNullable<z.ZodString>;
    previous: z.ZodNullable<z.ZodString>;
    results: z.ZodArray<z.ZodObject<T, "strip", z.ZodTypeAny, { [k_1 in keyof z.objectUtil.addQuestionMarks<z.baseObjectOutputType<T>, { [k in keyof z.baseObjectOutputType<T>]: undefined extends z.baseObjectOutputType<T>[k] ? never : k; }[keyof T]>]: z.objectUtil.addQuestionMarks<z.baseObjectOutputType<T>, { [k_2 in keyof z.baseObjectOutputType<T>]: undefined extends z.baseObjectOutputType<T>[k_2] ? never : k_2; }[keyof T]>[k_1]; }, { [k_2_1 in keyof z.baseObjectInputType<T>]: z.baseObjectInputType<T>[k_2_1]; }>, "many">;
}, "strip", z.ZodTypeAny, {
    next: string | null;
    previous: string | null;
    count: number;
    results: { [k_1 in keyof z.objectUtil.addQuestionMarks<z.baseObjectOutputType<T>, { [k in keyof z.baseObjectOutputType<T>]: undefined extends z.baseObjectOutputType<T>[k] ? never : k; }[keyof T]>]: z.objectUtil.addQuestionMarks<z.baseObjectOutputType<T>, { [k_2 in keyof z.baseObjectOutputType<T>]: undefined extends z.baseObjectOutputType<T>[k_2] ? never : k_2; }[keyof T]>[k_1]; }[];
}, {
    next: string | null;
    previous: string | null;
    count: number;
    results: { [k_2_1 in keyof z.baseObjectInputType<T>]: z.baseObjectInputType<T>[k_2_1]; }[];
}>;
declare const PaginationDefaults: {
    page: number;
    totalCount: number;
    next: null;
    previous: null;
    size: number;
};

interface PaginationKwargs {
    page: number;
    totalCount: number;
    next: null | string;
    previous: null | string;
    size: number;
}
interface IPagination {
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
declare class Pagination implements IPagination {
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

/**
 * Parse a backend response by providing a zod schema which will safe validate it and return the corresponding value typed. Will raise a warning if what we receive does not match our expected schema, thus we can update the schema and that will automatically update our types by inference.
 */
declare const parseResponse: <T extends z.ZodType<any, z.ZodTypeDef, any>, Z = z.TypeOf<T>>({ identifier, data, zod, onError, }: {
    /**
     * Give a relevant name to identify the source request of this response (A good option is to use the name of the function that performs the request)
     */
    identifier: string;
    data: object;
    zod: T;
    onError?: null | ((zodErr: z.ZodError<any>) => void);
}) => Z;

type And<T extends readonly boolean[]> = T extends {
    length: 0;
} ? true : T extends [infer TFirst, ...infer TRest] ? TFirst extends true ? TRest extends boolean[] ? And<TRest> : false : false : false;
type IsNever<T> = [T] extends [never] ? true : false;
type Is<TSubject, TReference> = And<[IsNever<TSubject>, IsNever<TReference>]> extends true ? true : IsNever<TSubject> extends true ? false : IsNever<TReference> extends true ? IsNever<TSubject> : TSubject extends TReference ? true : false;
type UnknownIfNever<T, TRes = T> = IsNever<T> extends true ? unknown : TRes;
type IsAny<T> = boolean extends (T extends never ? true : false) ? true : false;

type EntityShape = z.ZodRawShape & {
    id: z.ZodString | z.ZodNumber | z.ZodBranded<z.ZodString, ReadonlyTag> | z.ZodBranded<z.ZodNumber, ReadonlyTag>;
};
type ApiService<TEntity extends EntityShape = never, TCreate extends z.ZodRawShape = never, TExtraFilters extends FiltersShape = never, TCustomServiceCalls extends object = never> = BareApiService<TEntity, TCreate, TExtraFilters> & (IsNever<TCustomServiceCalls> extends true ? unknown : {
    /**
     * The custom calls you declared as input but as plain functions and wrapped for type safety
     */
    customServiceCalls: CustomServiceCallsRecord<TCustomServiceCalls>;
    /**
     * Alias for customServiceCalls
     */
    csc: CustomServiceCallsRecord<TCustomServiceCalls>;
});
type RetrieveCallObj<TEntity extends EntityShape> = {
    /**
     * Get resource by id
     * @param id resource id
     * @returns
     */
    retrieve: (id: GetInferredFromRaw<TEntity>["id"]) => Promise<GetInferredFromRaw<TEntity>>;
};
type ListCallObj<TEntity extends EntityShape, TExtraFilters extends FiltersShape = never> = {
    /**
     * This calls the `{baseUri}/list` endpoint. Note that this has to be available in the api you're consuming for this method to actually work
     */
    list: (params?: IsNever<TExtraFilters> extends true ? {
        pagination?: IPagination;
    } : {
        pagination?: IPagination;
        filters?: Partial<GetInferredFromRawWithBrand<TExtraFilters>>;
    }) => Promise<z.infer<ReturnType<typeof getPaginatedZod<UnwrapBranded<TEntity, ReadonlyTag>>>>>;
};
type CreateCallObj<TEntity extends EntityShape, TCreate extends z.ZodRawShape = never> = {
    create: (inputs: IsNever<TCreate> extends true ? Omit<GetInferredWithoutReadonlyBrands<TEntity>, "id"> : GetInferredWithoutReadonlyBrands<TCreate>) => Promise<GetInferredFromRaw<TEntity>>;
};
type ErrorEntityShapeMustHaveAnIdField = '[TypeError] Your entity should have an "id" field';
type UpdateCallObj<TEntity extends EntityShape, TInferredEntityWithoutReadonlyFields = GetInferredWithoutReadonlyBrands<TEntity>, TInferredIdObj = TInferredEntityWithoutReadonlyFields extends {
    id: infer TId;
} ? {
    id: TId;
} : ErrorEntityShapeMustHaveAnIdField> = {
    update: {
        /**
         * Perform a patch request with a partial body
         */
        (inputs: Omit<Partial<TInferredEntityWithoutReadonlyFields>, "id"> & TInferredIdObj): Promise<GetInferredFromRaw<TEntity>>;
        /**
         * Perform a put request with a full body
         */
        replace: {
            (inputs: TInferredEntityWithoutReadonlyFields): Promise<GetInferredFromRaw<TEntity>>;
            /**
             * Perform a put request with a full body
             */
            asPartial: (inputs: Omit<Partial<TInferredEntityWithoutReadonlyFields>, "id"> & TInferredIdObj) => Promise<GetInferredFromRaw<TEntity>>;
        };
    };
};
type UpsertCallObj<TEntity extends EntityShape, TCreate extends z.ZodRawShape = never, TInferredEntityWithoutReadonlyFields = GetInferredWithoutReadonlyBrands<TEntity>, TInferredIdObj = TInferredEntityWithoutReadonlyFields extends {
    id: infer TId;
} ? {
    id: TId;
} : ErrorEntityShapeMustHaveAnIdField> = {
    upsert(
    /**
     * Perform a patch request with a partial body
     */
    inputs: (IsNever<TCreate> extends true ? Omit<GetInferredWithoutReadonlyBrands<TEntity>, "id"> : GetInferredWithoutReadonlyBrands<TCreate>) | (Omit<Partial<TInferredEntityWithoutReadonlyFields>, "id"> & TInferredIdObj)): Promise<GetInferredFromRaw<TEntity>>;
};
type WithCreateModelCall<TEntity extends EntityShape = never, TCreate extends z.ZodRawShape = never> = IsNever<TEntity> extends true ? unknown : IsNever<TCreate> extends true ? CreateCallObj<TEntity> : CreateCallObj<TEntity, TCreate>;
type WithEntityModelCall<TEntity extends EntityShape = never> = IsNever<TEntity> extends true ? unknown : RetrieveCallObj<TEntity>;
type WithExtraFiltersModelCall<TEntity extends EntityShape = never, TExtraFilters extends FiltersShape = never> = IsNever<TEntity> extends true ? unknown : IsNever<TExtraFilters> extends true ? ListCallObj<TEntity> : ListCallObj<TEntity, TExtraFilters>;
type WithRemoveModelCall<TEntity extends EntityShape = never> = IsNever<TEntity> extends true ? unknown : {
    remove: (id: GetInferredFromRaw<TEntity>["id"]) => Promise<void>;
};
type WithUpdateModelCall<TEntity extends EntityShape = never> = IsNever<TEntity> extends true ? unknown : UpdateCallObj<TEntity>;
type WithUpsertModelCall<TEntity extends EntityShape = never, TCreate extends z.ZodRawShape = never> = IsNever<TEntity> extends true ? unknown : IsNever<TCreate> extends true ? UpsertCallObj<TEntity> : UpsertCallObj<TEntity, TCreate>;
type BaseApiCalls<TEntity extends EntityShape = never, TCreate extends z.ZodRawShape = never, TExtraFilters extends FiltersShape = never> = WithCreateModelCall<TEntity, TCreate> & WithEntityModelCall<TEntity> & WithExtraFiltersModelCall<TEntity, TExtraFilters> & WithRemoveModelCall<TEntity> & WithUpdateModelCall<TEntity> & WithUpsertModelCall<TEntity, TCreate>;
type BareApiService<TEntity extends EntityShape = never, TCreate extends z.ZodRawShape = never, TExtraFilters extends FiltersShape = never> = IsNever<TEntity> extends false ? {
    client: AxiosLike;
} & BaseApiCalls<TEntity, TCreate, TExtraFilters> : {
    client: AxiosLike;
};
declare const createApi: <TEntity extends EntityShape = never, TCreate extends z.ZodRawShape = never, TExtraFilters extends FiltersShape = never, TCustomServiceCalls extends Record<string, CustomServiceCallPlaceholder> = never>(args: {
    baseUri: string;
    client: AxiosInstance;
    customCalls?: TCustomServiceCalls;
    models?: {
        entity: TEntity;
        create?: TCreate;
        extraFilters?: TExtraFilters;
    };
    options?: {
        disableTrailingSlash?: boolean;
        disableWarningLogging?: boolean;
    };
}) => ApiService<TEntity, TCreate, TExtraFilters, TCustomServiceCalls>;

type ResolveCustomServiceCallback<TInputShape extends z.ZodRawShape | ZodPrimitives = never, TOutputShape extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = never, TFilters extends FiltersShape | z.ZodVoid = never, TCallType extends string = "", TShapeOrVoid extends ResolveShapeOrVoid<any, any, any> = ResolveShapeOrVoid<TInputShape, TOutputShape, TFilters>> = CustomServiceCallback<TShapeOrVoid["input"], TShapeOrVoid["output"], TShapeOrVoid["filters"], TCallType>;
type ResolveServiceCallFn<TInputShape extends z.ZodRawShape | ZodPrimitives = never, TOutputShape extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = never, TFiltersShape extends FiltersShape | z.ZodVoid = never, TShapeOrVoid extends ResolveShapeOrVoid<any, any, any> = ResolveShapeOrVoid<TInputShape, TOutputShape, TFiltersShape>> = ServiceCallFn<TShapeOrVoid["input"], TShapeOrVoid["output"], TShapeOrVoid["filters"]>;
declare const createCustomServiceCall: {
    <TInputShape extends z.ZodRawShape | ZodPrimitives = never, TOutputShape extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny, "many"> = never, TFiltersShape extends FiltersShape = never>(args: ({
        inputShape?: TInputShape;
        outputShape?: TOutputShape;
        cb: ResolveCustomServiceCallback<TInputShape, TOutputShape, TFiltersShape>;
    } & (IsNever<TOutputShape> extends true ? unknown : {
        filtersShape?: TFiltersShape;
    })) | ResolveCustomServiceCallback<z.ZodVoid, z.ZodVoid, z.ZodVoid>): ResolveCustomServiceCallOpts<TInputShape, TOutputShape, TFiltersShape>;
    standAlone: <TInputShape_1 extends z.ZodRawShape | ZodPrimitives = never, TOutputShape_1 extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny, "many"> = never, TFiltersShape_1 extends z.ZodVoid | FiltersShape = never>(args: {
        client: AxiosLike;
        name?: string | undefined;
    } & {
        models?: (({
            inputShape: TInputShape_1;
            outputShape?: TOutputShape_1 | undefined;
        } | {
            inputShape?: TInputShape_1 | undefined;
            outputShape: TOutputShape_1;
        }) & (IsNever<TOutputShape_1> extends true ? unknown : {
            filtersShape?: TFiltersShape_1 | undefined;
        })) | undefined;
        cb: ResolveCustomServiceCallback<TInputShape_1, TOutputShape_1, TFiltersShape_1, "StandAlone", ResolveShapeOrVoid<TInputShape_1, TOutputShape_1, TFiltersShape_1>>;
    }) => ResolveServiceCallFn<TInputShape_1, TOutputShape_1, TFiltersShape_1, ResolveShapeOrVoid<TInputShape_1, TOutputShape_1, TFiltersShape_1>>;
};

declare const paginationObjShape: {
    pagination: z.ZodType<Pagination, z.ZodTypeDef, Pagination>;
};
declare const createPaginatedServiceCall: <TOutput extends z.ZodRawShape = z.ZodRawShape, TFilters extends FiltersShape = never, TInput extends z.ZodRawShape | ZodPrimitives = never, TReturnType extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny, "many"> = {
    count: z.ZodNumber;
    next: z.ZodNullable<z.ZodString>;
    previous: z.ZodNullable<z.ZodString>;
    results: z.ZodArray<z.ZodObject<UnwrapBrandedRecursive<TOutput, any>, "strip", z.ZodTypeAny, { [k_1 in keyof z.objectUtil.addQuestionMarks<z.baseObjectOutputType<UnwrapBrandedRecursive<TOutput, any>>, { [k in keyof z.baseObjectOutputType<UnwrapBrandedRecursive<TOutput, any>>]: undefined extends z.baseObjectOutputType<UnwrapBrandedRecursive<TOutput, any>>[k] ? never : k; }[keyof TOutput]>]: z.objectUtil.addQuestionMarks<z.baseObjectOutputType<UnwrapBrandedRecursive<TOutput, any>>, { [k_2 in keyof z.baseObjectOutputType<UnwrapBrandedRecursive<TOutput, any>>]: undefined extends z.baseObjectOutputType<UnwrapBrandedRecursive<TOutput, any>>[k_2] ? never : k_2; }[keyof TOutput]>[k_1]; }, { [k_2_1 in keyof z.baseObjectInputType<UnwrapBrandedRecursive<TOutput, any>>]: z.baseObjectInputType<UnwrapBrandedRecursive<TOutput, any>>[k_2_1]; }>, "many">;
}>({ inputShape, outputShape, filtersShape, opts, }: {
    outputShape: TOutput;
    inputShape?: TInput;
    filtersShape?: TFilters;
    opts?: {
        /**
         * Disable the logging of errors if the response type doesn't match the one expected from the library
         */
        disableLoggingWarning?: boolean;
        /**
         * Choose the http method you want this call to be executed as
         */
        httpMethod?: "post" | "get";
        /**
         * Optionally point to another uri different than the original
         */
        uri?: IsNever<TInput> extends true ? string : TInput extends {
            urlParams: z.ZodObject<any>;
        } ? (input: z.infer<TInput["urlParams"]>) => string : string;
    };
}) => ResolveCustomServiceCallOpts<UnknownIfNever<TInput> & typeof paginationObjShape, TReturnType, TFilters>;

type PaginationResult<TEntity> = {
    count: number;
    next: string | null;
    previous: string | null;
    results: TEntity[];
};
type FilterFn<TFilter = any, TEntity = unknown> = (params?: {
    filters?: TFilter;
    pagination?: IPagination;
}) => Promise<PaginationResult<TEntity>>;
type FilterParam<T extends FilterFn<unknown, unknown>> = T extends FilterFn<infer TFilters, unknown> ? TFilters : never;
type GetListType<T extends FilterFn> = T extends FilterFn<never, infer TEntity> ? TEntity : never;
declare const createCollectionManager: <TFetchList extends FilterFn<any, unknown>>({ fetchList, list: feedList, filters, pagination: feedPagination, refreshing: feedRefreshing, loadingNextPage: feedLoadingNextPage, }: {
    fetchList: TFetchList;
    list?: GetListType<TFetchList>[];
    refreshing?: boolean;
    loadingNextPage?: boolean;
    filters?: FilterParam<TFetchList>;
    pagination?: IPagination;
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
    filters: FilterParam<TFetchList> | undefined;
};

export { FromApiCall, GetInferredFromRaw, IPagination, Pagination, PaginationDefaults, PaginationFilters, PaginationKwargs, ToApiCall, UnwrapBranded, createApi, createApiUtils, createCollectionManager, createCustomServiceCall, createPaginatedServiceCall, getPaginatedZod, parseResponse, readonly };
