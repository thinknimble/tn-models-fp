import { AxiosRequestConfig, AxiosResponse } from "axios"
import { z } from "zod"
import { And, CallbackUtils, GetInferredFromRaw, InferShapeOrZod, Is, UnknownIfNever, ZodPrimitives } from "../utils"
import { SnakeCasedPropertiesDeep } from "@thinknimble/tn-utils"

export type CustomServiceCallInputObj<
  TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodUndefined
> = UnknownIfNever<TInput, { inputShape: TInput }>

export type CustomServiceCallOutputObj<
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodUndefined
> = UnknownIfNever<
  TOutput,
  {
    outputShape: TOutput
  }
>

export type CustomServiceCallFiltersObj<T extends z.ZodRawShape | z.ZodVoid = z.ZodVoid> = UnknownIfNever<
  T,
  { filtersShape?: T }
>

type InferCallbackInput<TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>> =
  TInput extends z.ZodRawShape
    ? GetInferredFromRaw<TInput>
    : TInput extends z.ZodRawShape
    ? GetInferredFromRaw<TInput>
    : TInput extends z.ZodTypeAny
    ? z.infer<TInput>
    : never

type CallbackInput<TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>> = TInput extends z.ZodVoid
  ? unknown
  : {
      input: InferCallbackInput<TInput>
    }
type CallbackFilters<
  TFilters extends z.ZodRawShape | z.ZodVoid,
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid
> = TOutput extends z.ZodVoid
  ? unknown
  : TFilters extends z.ZodRawShape
  ? { parsedFilters?: SnakeCasedPropertiesDeep<InferShapeOrZod<TFilters>> }
  : unknown

type StringTrailingSlash = `${string}/`
type AxiosCall = <TUri extends StringTrailingSlash, T = any, R = AxiosResponse<T>, D = any>(
  url: TUri,
  config?: AxiosRequestConfig<D>
) => Promise<R>
type BodyAxiosCall = <TUri extends StringTrailingSlash, T = any, R = AxiosResponse<T>, D = any>(
  url: StringTrailingSlash,
  data?: D,
  config?: AxiosRequestConfig<D>
) => Promise<R>

export type AxiosLike = {
  get: AxiosCall
  post: BodyAxiosCall
  delete: AxiosCall
  put: BodyAxiosCall
  patch: BodyAxiosCall
  options: AxiosCall
  postForm: BodyAxiosCall
  putForm: BodyAxiosCall
  patchForm: BodyAxiosCall
}

export type ServiceCallFn<
  TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid,
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid,
  TFilters extends z.ZodRawShape | z.ZodVoid = z.ZodVoid
> = (...args: ResolveServiceCallArgs<TInput, TFilters>) => Promise<InferShapeOrZod<TOutput>>

{
  // Test suite for ServiceCallFn
  type inputShapeMock = { testInput: z.ZodString }
  type outputShapeMock = { testOutput: z.ZodNumber }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type tests = [
    Expect<
      Equals<
        ServiceCallFn<inputShapeMock, outputShapeMock>,
        (args: { input: InferShapeOrZod<inputShapeMock> }) => Promise<InferShapeOrZod<outputShapeMock>>
      >
    >,
    Expect<Equals<ServiceCallFn<inputShapeMock>, (args: { input: InferShapeOrZod<inputShapeMock> }) => Promise<void>>>,
    Expect<Equals<ServiceCallFn<z.ZodVoid, outputShapeMock>, () => Promise<InferShapeOrZod<outputShapeMock>>>>,
    Expect<Equals<ServiceCallFn, () => Promise<void>>>
  ]
}

type BaseUriInput = {
  slashEndingBaseUri: `${string}/`
}

export type CustomServiceCallback<
  TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid,
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid,
  TFilters extends z.ZodRawShape | z.ZodVoid = z.ZodVoid
> = (
  params: {
    client: AxiosLike
  } & BaseUriInput &
    CallbackUtils<TInput, TOutput> &
    CallbackInput<TInput> &
    CallbackFilters<TFilters, TOutput>
) => Promise<InferShapeOrZod<TOutput>>

export type CustomServiceCallOpts<
  TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodUndefined,
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodUndefined,
  TFilters extends z.ZodRawShape | z.ZodVoid = z.ZodVoid
> = CustomServiceCallInputObj<TInput> &
  CustomServiceCallOutputObj<TOutput> & {
    callback: CustomServiceCallback<TInput, TOutput, TFilters>
  } & CustomServiceCallFiltersObj<TFilters>

type FromApiPlaceholder = { fromApi: (obj: object) => any }
type ToApiPlaceholder = { toApi: (obj: object) => any }

/**
 * Base type for custom service calls which serves as a placeholder to later take advantage of inference
 */
export type CustomServiceCallPlaceholder<
  TInput extends z.ZodRawShape | ZodPrimitives | z.ZodVoid = any,
  TOutput extends object = any,
  TFilters extends z.ZodRawShape | z.ZodVoid = any
> = {
  inputShape: TInput
  outputShape: TOutput
  filtersShape?: TFilters
  callback: (params: {
    slashEndingBaseUri: `${string}/`
    client: AxiosLike
    input: InferShapeOrZod<TInput>
    utils: FromApiPlaceholder & ToApiPlaceholder
  }) => Promise<InferShapeOrZod<TOutput>>
}

type ResolveServiceCallArgs<TInput extends z.ZodRawShape | z.ZodType, TFilters extends z.ZodRawShape | z.ZodVoid> = And<
  [Is<TInput, z.ZodVoid>, Is<TFilters, z.ZodVoid>]
> extends true
  ? []
  : [
      params: (Is<TInput, z.ZodVoid> extends true ? unknown : { input: InferShapeOrZod<TInput> }) &
        (Is<TFilters, z.ZodVoid> extends true ? unknown : { filters?: Partial<InferShapeOrZod<TFilters>> })
    ]

/**
 * Get resulting custom service call from `createApi`
 */
export type CustomServiceCallsRecord<TOpts extends object> = TOpts extends Record<string, CustomServiceCallPlaceholder>
  ? {
      [K in keyof TOpts]: TOpts[K] extends CustomServiceCallPlaceholder<infer TInput, infer TOutput, infer TFilters>
        ? (...args: ResolveServiceCallArgs<TInput, TFilters>) => Promise<InferShapeOrZod<TOutput>>
        : "Invalid entry does not match CustomServiceCall type"
    }
  : "This should be a record of custom calls"
