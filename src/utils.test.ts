/* eslint-disable @typescript-eslint/no-unused-vars */
import { CamelCasedPropertiesDeep } from "@thinknimble/tn-utils"
import { describe, expect, it } from "vitest"
import { z } from "zod"
import { createApiUtils, GetInferredRecursiveShape, recursiveShapeToValidZodRawShape } from "./utils"
import { ZodRawShapeToSnakedRecursive, zodToSnakeCaseRecursive } from "./utils/zod"

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
    const validZodShape = recursiveShapeToValidZodRawShape(shape)
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

describe.only("zodToSnakeCaseShapeRecursive", () => {
  const myZod = z.object({
    stringZod: z.string(),
    objectZod: z.object({
      numberZod: z.number(),
    }),
    arrayObjZod: z.array(
      z.object({
        elementOne: z.string(),
        elementTwo: z.number(),
      })
    ),
    arrayStringZod: z.array(z.string()),
  })
  const result = zodToSnakeCaseRecursive(myZod)
  const { array_obj_zod, array_string_zod, object_zod, string_zod } = result.shape
  it("Passes these ts tests", () => {
    const result = myZod.shape
    type ResultType = z.ZodObject<ZodRawShapeToSnakedRecursive<typeof result>>
    type tests = [Expect<Equals<z.infer<typeof myZod>, CamelCasedPropertiesDeep<z.infer<ResultType>>>>]
  })
  it("Works on primitives", () => {
    expect(string_zod).toBeInstanceOf(z.ZodString)
  })
  it("Works on simple objects", () => {
    expect(object_zod).toBeInstanceOf(z.ZodObject)
    expect(object_zod.shape).toHaveProperty("number_zod")
    expect(object_zod.shape.number_zod).toBeInstanceOf(z.ZodNumber)
  })
  it("Works on object arrays", () => {
    // const {arrayObjZod,arrayStringZod,objectZod,stringZod}  = myZod.shape
    expect(array_obj_zod).toBeInstanceOf(z.ZodArray)
    expect(array_obj_zod.element).toBeInstanceOf(z.ZodObject)
    expect(array_obj_zod.element.shape).toHaveProperty("element_one")
    expect(array_obj_zod.element.shape.element_one).toBeInstanceOf(z.ZodString)
    expect(array_obj_zod.element.shape).toHaveProperty("element_two")
    expect(array_obj_zod.element.shape.element_two).toBeInstanceOf(z.ZodNumber)
  })
  it("Works on primitive arrays", () => {
    expect(array_string_zod).toBeInstanceOf(z.ZodArray)
    expect(array_string_zod.element).toBeInstanceOf(z.ZodString)
  })
  it("Works on nested objects", () => {
    expect(array_string_zod).toBeInstanceOf(z.ZodArray)
    expect(array_string_zod).toBeInstanceOf(z.ZodArray)
    expect(array_string_zod).toBeInstanceOf(z.ZodArray)
  })
})
