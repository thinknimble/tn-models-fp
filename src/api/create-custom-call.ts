import { z } from "zod"
import { ZodPrimitives } from "../utils"
import {
  CustomServiceCallback,
  CustomServiceCallInputObj,
  CustomServiceCallOpts,
  CustomServiceCallOutputObj,
} from "./types"

//! The order of overloads MATTER. This was quite a foot-gun-ish thing to discover. Lesson is: declare overloads from most generic > most narrowed. It kind of makes sense to go narrowing down the parameter possibilities. Seems like the first overload that matches is the one that is used.
/**
 * Create a custom type-inferred service call with both input and output
 */
export function createCustomServiceCall<
  TInput extends z.ZodRawShape | ZodPrimitives,
  TOutput extends z.ZodRawShape | ZodPrimitives
>(
  models: CustomServiceCallInputObj<TInput> & CustomServiceCallOutputObj<TOutput>,
  cb: CustomServiceCallback<TInput, TOutput>
): CustomServiceCallOpts<TInput, TOutput>
/**
 * Create a custom type-inferred service call with input only
 */
export function createCustomServiceCall<TInput extends z.ZodRawShape | ZodPrimitives>(
  models: CustomServiceCallInputObj<TInput>,
  cb: CustomServiceCallback<TInput, z.ZodVoid>
): CustomServiceCallOpts<TInput, z.ZodVoid>
/**
 * Create a custom type-inferred service call with output only
 */
export function createCustomServiceCall<TOutput extends z.ZodRawShape | ZodPrimitives>(
  models: CustomServiceCallOutputObj<TOutput>,
  cb: CustomServiceCallback<z.ZodVoid, TOutput>
): CustomServiceCallOpts<z.ZodVoid, TOutput>
/**
 * Create a custom type-inferred service call with neither input nor output
 */
export function createCustomServiceCall(
  cb: CustomServiceCallback<z.ZodVoid, z.ZodVoid>
): CustomServiceCallOpts<z.ZodVoid, z.ZodVoid>

export function createCustomServiceCall(...args: any[]): CustomServiceCallOpts<any, any> {
  const [first, second] = args
  if (typeof first === "function") {
    return { callback: first, inputShape: z.void(), outputShape: z.void() }
  }
  if ("inputShape" in first && "outputShape" in first) {
    return {
      inputShape: first.inputShape,
      outputShape: first.outputShape,
      callback: second,
    }
  }
  if ("inputShape" in first) {
    return {
      inputShape: first.inputShape,
      outputShape: z.void(),
      callback: second,
    }
  }

  // only output
  return {
    inputShape: z.void(),
    outputShape: first.outputShape,
    callback: second,
  }
}
