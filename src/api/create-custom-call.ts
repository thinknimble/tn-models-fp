import { z } from "zod"
import { FiltersShape, IsNever, ZodPrimitives, createCustomServiceCallHandler } from "../utils"
import {
  AxiosLike,
  CustomServiceCallback,
  ResolveCustomServiceCallOpts,
  ResolveShapeOrVoid,
  ServiceCallFn,
  StandAloneCallType,
} from "./types"

type ResolveCustomServiceCallback<
  TInputShape extends z.ZodRawShape | ZodPrimitives = never,
  TOutputShape extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = never,
  TFilters extends FiltersShape | z.ZodVoid = never,
  TCallType extends string = "",
  TShapeOrVoid extends ResolveShapeOrVoid<any, any, any> = ResolveShapeOrVoid<TInputShape, TOutputShape, TFilters>
> = CustomServiceCallback<TShapeOrVoid["input"], TShapeOrVoid["output"], TShapeOrVoid["filters"], TCallType>

type ResolveServiceCallFn<
  TInputShape extends z.ZodRawShape | ZodPrimitives = never,
  TOutputShape extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = never,
  TFiltersShape extends FiltersShape | z.ZodVoid = never,
  TShapeOrVoid extends ResolveShapeOrVoid<any, any, any> = ResolveShapeOrVoid<TInputShape, TOutputShape, TFiltersShape>
> = ServiceCallFn<TShapeOrVoid["input"], TShapeOrVoid["output"], TShapeOrVoid["filters"]>

export const createCustomServiceCall = <
  TInputShape extends z.ZodRawShape | ZodPrimitives = never,
  TOutputShape extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = never,
  TFiltersShape extends FiltersShape = never
>(
  args:
    | ({
        inputShape?: TInputShape
        outputShape?: TOutputShape
        cb: ResolveCustomServiceCallback<TInputShape, TOutputShape, TFiltersShape>
      } & (IsNever<TOutputShape> extends true ? unknown : { filtersShape?: TFiltersShape }))
    | ResolveCustomServiceCallback<z.ZodVoid, z.ZodVoid, z.ZodVoid>
): ResolveCustomServiceCallOpts<TInputShape, TOutputShape, TFiltersShape> => {
  const inputShape = typeof args === "function" || !args.inputShape ? z.void() : args.inputShape
  const outputShape = typeof args === "function" || !args.outputShape ? z.void() : args.outputShape
  const filtersShape = (
    typeof args === "function" || !args.outputShape || !("filtersShape" in args) ? z.void() : args.filtersShape
  ) as TFiltersShape | z.ZodVoid
  const callback = typeof args === "function" ? args : args.cb

  //TODO: revisit and  see if we can fix the return type here. There seems to be a mismatch deeper in the type
  return {
    inputShape,
    outputShape,
    callback,
    filtersShape,
  } as unknown as ResolveCustomServiceCallOpts<TInputShape, TOutputShape, TFiltersShape>
}

const result = createCustomServiceCall({
  inputShape: {
    id: z.string(),
  },
  outputShape: {
    id: z.string(),
  },
  filtersShape: {
    id: z.string(),
  },
  cb: async ({ client, input, slashEndingBaseUri, utils, parsedFilters }) => {
    return utils.fromApi({})
  },
})

const standAlone = <
  TInputShape extends z.ZodRawShape | ZodPrimitives = never,
  TOutputShape extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny> = never,
  TFiltersShape extends FiltersShape | z.ZodVoid = never
>(
  args: {
    client: AxiosLike
    name?: string
  } & {
    models?: (
      | {
          inputShape: TInputShape
          outputShape?: TOutputShape
        }
      | {
          inputShape?: TInputShape
          outputShape: TOutputShape
        }
    ) &
      (IsNever<TOutputShape> extends true ? unknown : { filtersShape?: TFiltersShape })
    cb: ResolveCustomServiceCallback<TInputShape, TOutputShape, TFiltersShape, StandAloneCallType>
  }
): ResolveServiceCallFn<TInputShape, TOutputShape, TFiltersShape> => {
  //? Should I use zod to improve the types in here rather than any[] it?. We could probably do the same for the createCustomServiceCall
  const inputShape = (args.models && "inputShape" in args.models ? args.models.inputShape : undefined) ?? z.void()
  const outputShape = (args.models && "outputShape" in args.models ? args.models.outputShape : undefined) ?? z.void()
  const filtersShape = (args.models && "filtersShape" in args.models ? args.models.filtersShape : undefined) ?? z.void()
  const result = createCustomServiceCall({
    inputShape,
    outputShape,
    filtersShape,
    cb: args.cb,
    //TODO: check whether we can avoid any in these situations
  } as any)

  return createCustomServiceCallHandler({
    client: args.client,
    serviceCallOpts: result,
    name: args.name,
  }) as ResolveServiceCallFn<TInputShape, TOutputShape, TFiltersShape>
}

createCustomServiceCall.standAlone = standAlone
