/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, expect, it } from "vitest"
import { z } from "zod"
import { createApiUtils, GetInferredRecursiveShape, objectToValidZodShape } from "./utils"

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

describe("objectToValidZodShape", () => {
  it("Takes a nested shape and turns it into the corresponding zod", () => {
    //arrange
    const shape = {
      a: {
        a1: z.string(),
      },
      b: {
        b1: {
          b11: z.string(),
          b12: {
            b121: z.string(),
          },
        },
      },
      c: z.string(),
    }
    const expectedParsePass: GetInferredRecursiveShape<typeof shape> = {
      a: {
        a1: "a1",
      },
      b: {
        b1: {
          b11: "b11",
          b12: {
            b121: "hello",
          },
        },
      },
      c: "c",
    }
    type ExpectedParsePassType = typeof expectedParsePass
    //act
    const validZodShape = objectToValidZodShape(shape)
    const result = z.object(validZodShape)
    type test = z.infer<typeof result>
    type typeTests = [
      Expect<Equals<test["c"], ExpectedParsePassType["c"]>>,
      Expect<Equals<test["a"], ExpectedParsePassType["a"]>>,
      Expect<Equals<test["b"], ExpectedParsePassType["b"]>>
    ]
    //assert
    expect(() => result.parse(expectedParsePass)).not.toThrow()
  })
})
