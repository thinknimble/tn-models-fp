/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect } from "vitest"
import { z } from "zod"
import { createApiUtils } from "./utils"

describe("createApiUtils", () => {
  it("returns undefined when both input output are primitives", () => {
    const utils = createApiUtils({
      inputShape: z.string(),
      name: "input-output-primitives",
      outputShape: z.number(),
    })
    type tests = [Expect<Equals<typeof utils, unknown>>]
    expect(utils).toBeNull()
  })
  it("only returns toApi when only inputShape is provided", () => {
    const { utils } = createApiUtils({
      inputShape: {
        testInput: z.string(),
      },
      name: "input-only",
    })
    type tests = [Expect<Equals<ReturnType<(typeof utils)["toApi"]>, { test_input: string }>>]
    //@ts-expect-error this should not be present
    utils.fromApi
    expect("fromApi" in utils).toEqual(false)
    expect("toApi" in utils).toEqual(true)
  })
  it("only returns fromApi when only outputShape is provided", () => {
    const { utils } = createApiUtils({
      outputShape: {
        testOutput: z.string(),
      },
      name: "output-only",
    })
    type tests = [Expect<Equals<ReturnType<(typeof utils)["fromApi"]>, { testOutput: string }>>]
    //@ts-expect-error this should not be present
    utils.toApi
    expect("toApi" in utils).toEqual(false)
    expect("fromApi" in utils).toEqual(true)
  })
  it("only returns toApi when input is shape and output is primitive", () => {
    const { utils } = createApiUtils({
      inputShape: {
        testInput: z.string(),
      },
      outputShape: z.number(),
      name: "input-shape-output-primitive",
    })
    type tests = [Expect<Equals<ReturnType<(typeof utils)["toApi"]>, { test_input: string }>>]
    //@ts-expect-error this should not be present
    utils.fromApi
    expect("fromApi" in utils).toEqual(false)
    expect("toApi" in utils).toEqual(true)
  })
  it("only returns fromApi when output is shape and input is primitive", () => {
    const { utils } = createApiUtils({
      inputShape: z.number(),
      outputShape: {
        testOutput: z.string(),
      },
      name: "output-shape-input-primitive",
    })
    type tests = [Expect<Equals<ReturnType<(typeof utils)["fromApi"]>, { testOutput: string }>>]
    //@ts-expect-error this should not be present
    utils.toApi
    expect("toApi" in utils).toEqual(false)
    expect("fromApi" in utils).toEqual(true)
  })
  it("returns both fromApi and toApi when output and input are shapes", () => {
    const { utils } = createApiUtils({
      inputShape: {
        testInput: z.number(),
      },
      outputShape: {
        testOutput: z.string(),
      },
      name: "output-only",
    })
    type tests = [
      Expect<Equals<ReturnType<(typeof utils)["fromApi"]>, { testOutput: string }>>,
      Expect<Equals<ReturnType<(typeof utils)["toApi"]>, { test_input: number }>>
    ]
    expect("toApi" in utils).toEqual(true)
    expect("fromApi" in utils).toEqual(true)
  })
})
