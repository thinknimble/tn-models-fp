import { z } from "zod"
import { FiltersShape, UnwrapBranded, ZodPrimitives, createCustomServiceCallHandler } from "../utils"
import {
  AxiosLike,
  CustomServiceCallFiltersObj,
  CustomServiceCallInputObj,
  CustomServiceCallOpts,
  CustomServiceCallOutputObj,
  CustomServiceCallback,
  ServiceCallFn,
} from "./types"

//TODO: remove this way of handling overloads. Prefer unions rather so that we can condense everything in a single site (the implementation)
//! The order of overloads MATTER. This was quite a foot-gun-ish thing to discover. Lesson is: declare overloads from most generic > most narrowed. It kind of makes sense to go narrowing down the parameter possibilities. Seems like the first overload that matches is the one that is used.
/**
 * Create a custom type-inferred service call with both input and output
 */
export function createCustomServiceCall<
  TInput extends z.ZodRawShape | ZodPrimitives,
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>,
  TFilters extends FiltersShape | z.ZodVoid = z.ZodVoid
>(
  models: CustomServiceCallInputObj<TInput> &
    CustomServiceCallOutputObj<TOutput> &
    CustomServiceCallFiltersObj<TFilters, TOutput>,
  cb: TOutput extends z.ZodRawShape
    ? CustomServiceCallback<TInput, UnwrapBranded<TOutput>, TFilters>
    : CustomServiceCallback<TInput, TOutput, TFilters>
): TOutput extends z.ZodRawShape
  ? CustomServiceCallOpts<TInput, UnwrapBranded<TOutput>, TFilters>
  : CustomServiceCallOpts<TInput, TOutput, TFilters>
/**
 * Create a custom type-inferred service call with input only
 */
export function createCustomServiceCall<TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>>(
  models: CustomServiceCallInputObj<TInput>,
  cb: CustomServiceCallback<TInput, z.ZodVoid, z.ZodVoid>
): CustomServiceCallOpts<TInput, z.ZodVoid, z.ZodVoid>
/**
 * Create a custom type-inferred service call with output only
 */
export function createCustomServiceCall<
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>,
  TFilters extends FiltersShape | z.ZodVoid = z.ZodVoid
>(
  models: CustomServiceCallOutputObj<TOutput> & CustomServiceCallFiltersObj<TFilters, TOutput>,
  cb: TOutput extends z.ZodRawShape
    ? CustomServiceCallback<z.ZodVoid, UnwrapBranded<TOutput>, TFilters>
    : CustomServiceCallback<z.ZodVoid, TOutput, TFilters>
): TOutput extends z.ZodRawShape
  ? CustomServiceCallOpts<z.ZodVoid, UnwrapBranded<TOutput>, TFilters>
  : CustomServiceCallOpts<z.ZodVoid, TOutput, TFilters>
/**
 * Create a custom type-inferred service call with neither input nor output
 */
export function createCustomServiceCall(
  cb: CustomServiceCallback<z.ZodVoid, z.ZodVoid, z.ZodVoid>
): CustomServiceCallOpts<z.ZodVoid, z.ZodVoid, z.ZodVoid>
export function createCustomServiceCall(...args: any[]): CustomServiceCallOpts<any, any, any> {
  const [first, second] = args
  const inputShape = typeof first === "function" || !("inputShape" in first) ? z.void() : first.inputShape
  const outputShape = typeof first === "function" || !("outputShape" in first) ? z.void() : first.outputShape
  const filtersShape = typeof first === "function" || !("filtersShape" in first) ? z.void() : first.filtersShape
  const callback = typeof first === "function" ? first : second

  return {
    inputShape,
    outputShape,
    callback,
    filtersShape,
  }
}

type StandAloneBaseArgs = {
  client: AxiosLike
  name?: string
}

function standAlone<
  TInput extends z.ZodRawShape | ZodPrimitives,
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>,
  TFilters extends FiltersShape | z.ZodVoid = z.ZodVoid
>(
  args: StandAloneBaseArgs & {
    models: CustomServiceCallInputObj<TInput> &
      CustomServiceCallOutputObj<TOutput> &
      CustomServiceCallFiltersObj<TFilters, TOutput>
    cb: CustomServiceCallback<TInput, TOutput, TFilters, "StandAlone">
  }
): ServiceCallFn<TInput, TOutput, TFilters>
/**
 * Create a custom type-inferred service call with input only
 */
function standAlone<TInput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>>(
  args: StandAloneBaseArgs & {
    models: CustomServiceCallInputObj<TInput>
    cb: CustomServiceCallback<TInput, z.ZodVoid, z.ZodVoid, "StandAlone">
  }
): ServiceCallFn<TInput, z.ZodVoid, z.ZodVoid>
/**
 * Create a custom type-inferred service call with output only
 */
function standAlone<
  TOutput extends z.ZodRawShape | ZodPrimitives | z.ZodArray<z.ZodTypeAny>,
  TFilters extends FiltersShape | z.ZodVoid = z.ZodVoid
>(
  args: StandAloneBaseArgs & {
    models: CustomServiceCallOutputObj<TOutput> & CustomServiceCallFiltersObj<TFilters, TOutput>
    cb: CustomServiceCallback<z.ZodVoid, TOutput, TFilters, "StandAlone">
  }
): ServiceCallFn<z.ZodVoid, TOutput, TFilters>
/**
 * Create a custom type-inferred service call with neither input nor output
 */
function standAlone(
  args: StandAloneBaseArgs & {
    cb: CustomServiceCallback<z.ZodVoid, z.ZodVoid, z.ZodVoid, "StandAlone">
  }
): ServiceCallFn

function standAlone(
  args: StandAloneBaseArgs & {
    models?:
      | CustomServiceCallInputObj<any>
      | (CustomServiceCallOutputObj<any> & CustomServiceCallFiltersObj<any, any>)
      | (CustomServiceCallOutputObj<any> & CustomServiceCallInputObj<any> & CustomServiceCallFiltersObj<any, any>)
    cb: CustomServiceCallback<any, any, any, "StandAlone">
  }
): ServiceCallFn<any, any, any> {
  //? Should I use zod to improve the types in here rather than any[] it?. We could probably do the same for the createCustomServiceCall
  const inputShape = (args.models && "inputShape" in args.models ? args.models.inputShape : undefined) ?? z.void()
  const outputShape = (args.models && "outputShape" in args.models ? args.models.outputShape : undefined) ?? z.void()
  const filtersShape = (args.models && "filtersShape" in args.models ? args.models.filtersShape : undefined) ?? z.void()
  const result = createCustomServiceCall(
    {
      inputShape,
      outputShape,
      filtersShape,
    },
    args.cb
  )

  return createCustomServiceCallHandler({
    client: args.client,
    serviceCallOpts: result,
    name: args.name,
  })
}

/**
 *  Create a stand-alone version of a custom service call.
 * Useful when you don't have a specific api resource you want to attach this call to (probably an rpc-like call)
 */
createCustomServiceCall.standAlone = standAlone
