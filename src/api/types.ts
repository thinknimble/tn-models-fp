import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"
import { z } from "zod"
import { And, CallbackUtils, GetInferredFromRaw, InferShapeOrZod, Is, UnknownIfNever, ZodPrimitives } from "../utils"

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

export type ServiceCallFn<TInput extends object = never, TOutput extends object = never> = And<
  Is<TInput, never>,
  Is<TOutput, never>
> extends true
  ? () => Promise<void>
  : And<Is<TInput, never>, Is<TOutput, z.ZodRawShape | z.ZodTypeAny>> extends true
  ? () => Promise<InferShapeOrZod<TOutput>>
  : And<Is<TInput, z.ZodRawShape | z.ZodTypeAny>, Is<TOutput, never>> extends true
  ? (inputs: InferShapeOrZod<TInput>) => Promise<void>
  : (inputs: InferShapeOrZod<TInput>) => Promise<InferShapeOrZod<TOutput>>

{
  // Test suite for ServiceCallFn
  type inputShapeMock = { testInput: z.ZodString }
  type outputShapeMock = { testOutput: z.ZodNumber }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type tests = [
    Expect<
      Equals<
        ServiceCallFn<inputShapeMock, outputShapeMock>,
        (input: InferShapeOrZod<inputShapeMock>) => Promise<InferShapeOrZod<outputShapeMock>>
      >
    >,
    Expect<Equals<ServiceCallFn<inputShapeMock>, (input: InferShapeOrZod<inputShapeMock>) => Promise<void>>>,
    Expect<Equals<ServiceCallFn<never, outputShapeMock>, () => Promise<InferShapeOrZod<outputShapeMock>>>>,
    Expect<Equals<ServiceCallFn, () => Promise<void>>>
  ]
}

type BaseUriInput = {
  slashEndingBaseUri: `${string}/`
}

export type CustomServiceCallback<
  TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid,
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid
> = (
  params: {
    client: AxiosLike
  } & BaseUriInput &
    CallbackUtils<TInput, TOutput> &
    CallbackInput<TInput>
) => Promise<InferShapeOrZod<TOutput>>

export type CustomServiceStandAloneCallback<
  TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid,
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodVoid
> = (
  params: {
    client: AxiosInstance
  } & CallbackUtils<TInput, TOutput> &
    CallbackInput<TInput>
) => Promise<InferShapeOrZod<TOutput>>

export type CustomServiceCallOpts<
  TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodUndefined,
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = z.ZodUndefined
> = CustomServiceCallInputObj<TInput> &
  CustomServiceCallOutputObj<TOutput> & { callback: CustomServiceCallback<TInput, TOutput> }
