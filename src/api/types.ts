import { AxiosRequestConfig, AxiosResponse } from "axios"
import { z } from "zod"
import { CallbackUtils, GetInferredFromRaw, ZodPrimitives } from "../utils"

export type CustomServiceCallInputObj<TInput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined> = {
  inputShape: TInput
}
export type CustomServiceCallOutputObj<TOutput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined> = {
  outputShape: TOutput
}

type InferCallbackInput<TInput extends z.ZodRawShape | z.ZodType> = TInput extends z.ZodRawShape
  ? GetInferredFromRaw<TInput>
  : TInput extends z.ZodRawShape
  ? GetInferredFromRaw<TInput>
  : TInput extends z.ZodType
  ? z.infer<TInput>
  : never

type CallbackInput<TInput extends z.ZodRawShape | ZodPrimitives> = TInput extends z.ZodVoid
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

export type CustomServiceCallback<
  TInput extends z.ZodRawShape | ZodPrimitives = z.ZodVoid,
  TOutput extends z.ZodRawShape | ZodPrimitives = z.ZodVoid
> = (
  params: {
    client: AxiosLike
    slashEndingBaseUri: `${string}/`
  } & CallbackUtils<TInput, TOutput> &
    CallbackInput<TInput>
) => Promise<
  TOutput extends z.ZodRawShape ? GetInferredFromRaw<TOutput> : TOutput extends z.ZodTypeAny ? z.infer<TOutput> : never
>

export type CustomServiceCallOpts<
  TInput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined,
  TOutput extends z.ZodRawShape | ZodPrimitives = z.ZodUndefined
> = CustomServiceCallInputObj<TInput> &
  CustomServiceCallOutputObj<TOutput> & { callback: CustomServiceCallback<TInput, TOutput> }
