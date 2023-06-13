import { SnakeCasedPropertiesDeep } from "@thinknimble/tn-utils"
import { AxiosRequestConfig, AxiosResponse } from "axios"
import { z } from "zod"
import {
  And,
  CallbackUtils,
  FiltersShape,
  GetInferredFromRawWithBrand,
  InferShapeOrZod,
  Is,
  IsAny,
  UnknownIfNever,
  ZodPrimitives,
} from "../utils"

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

export type CustomServiceCallFiltersObj<
  TFilters extends FiltersShape | z.ZodVoid = z.ZodVoid,
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid
> = And<[IsAny<TOutput>, IsAny<TFilters>]> extends true
  ? { filtersShape?: any }
  : TOutput extends z.ZodVoid
  ? unknown
  : UnknownIfNever<TFilters, { filtersShape?: TFilters }>

type InferCallbackInput<TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>> =
  TInput extends z.ZodRawShape
    ? GetInferredFromRawWithBrand<TInput>
    : TInput extends z.ZodRawShape
    ? GetInferredFromRawWithBrand<TInput>
    : TInput extends z.ZodTypeAny
    ? z.infer<TInput>
    : never

type CallbackInput<TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>> = TInput extends z.ZodVoid
  ? unknown
  : {
      input: InferCallbackInput<TInput>
    }
type CallbackFilters<
  TFilters extends FiltersShape | z.ZodVoid,
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid
> = TOutput extends z.ZodVoid
  ? unknown
  : TFilters extends FiltersShape
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
  TFilters extends FiltersShape | z.ZodVoid = z.ZodVoid
> = (...args: ResolveServiceCallArgs<TInput, TFilters>) => Promise<InferShapeOrZod<TOutput>>

type BaseUriInput<TCallType extends string = ""> = TCallType extends "StandAlone"
  ? unknown
  : {
      slashEndingBaseUri: `${string}/`
    }

export type CustomServiceCallback<
  TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid,
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid,
  TFilters extends FiltersShape | z.ZodVoid = z.ZodVoid,
  TCallType extends string = ""
> = (
  params: {
    client: AxiosLike
  } & BaseUriInput<TCallType> &
    CallbackUtils<TInput, TOutput> &
    CallbackInput<TInput> &
    CallbackFilters<TFilters, TOutput>
) => Promise<InferShapeOrZod<TOutput>>

export type CustomServiceCallOpts<
  TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid,
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid,
  TFilters extends FiltersShape | z.ZodVoid = z.ZodVoid,
  TCallType extends string = ""
> = CustomServiceCallInputObj<TInput> &
  CustomServiceCallOutputObj<TOutput> & {
    callback: CustomServiceCallback<TInput, TOutput, TFilters, TCallType>
  } & CustomServiceCallFiltersObj<TFilters, TOutput>

type FromApiPlaceholder = { fromApi: (obj: object) => any }
type ToApiPlaceholder = { toApi: (obj: object) => any }

/**
 * Base type for custom service calls which serves as a placeholder to later take advantage of inference
 */
export type CustomServiceCallPlaceholder<
  TInput extends z.ZodRawShape | ZodPrimitives | z.ZodVoid = any,
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodVoid = any,
  TFilters extends FiltersShape | z.ZodVoid = any
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
type ResolveInputArg<TInput extends object> = Is<TInput, z.ZodVoid> extends true
  ? unknown
  : { input: InferShapeOrZod<TInput> }
type ResolveFilterArg<TFilters extends object> = Is<TFilters, z.ZodVoid> extends true
  ? unknown
  : { filters?: Partial<InferShapeOrZod<TFilters>> }
type ResolveServiceCallArgs<TInput extends z.ZodRawShape | z.ZodType, TFilters extends FiltersShape | z.ZodVoid> = And<
  [Is<TInput, z.ZodVoid>, Is<TFilters, z.ZodVoid>]
> extends true
  ? []
  : Is<TFilters, z.ZodVoid> extends true
  ? [args: InferShapeOrZod<TInput>]
  : Is<TInput, z.ZodVoid> extends true
  ? [args: ResolveFilterArg<TFilters>] | []
  : [args: ResolveInputArg<TInput> & ResolveFilterArg<TFilters>]

/**
 * Get resulting custom service call from `createApi`
 */
export type CustomServiceCallsRecord<TOpts extends object> = TOpts extends Record<string, CustomServiceCallPlaceholder>
  ? {
      [K in keyof TOpts]: TOpts[K] extends CustomServiceCallPlaceholder<infer TInput, infer TOutput, any>
        ? TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>
          ? TOpts[K] extends { filtersShape?: infer TFilters }
            ? TFilters extends FiltersShape
              ? ServiceCallFn<TInput, TOutput, TFilters>
              : ServiceCallFn<TInput, TOutput, z.ZodVoid>
            : ServiceCallFn<TInput, TOutput, z.ZodVoid>
          : ServiceCallFn<TInput, z.ZodVoid, z.ZodVoid>
        : "Invalid entry does not match CustomServiceCall type"
    }
  : "This should be a record of custom calls"
