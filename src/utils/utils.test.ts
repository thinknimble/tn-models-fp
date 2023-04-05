/* eslint-disable @typescript-eslint/no-unused-vars */
import { CamelCasedPropertiesDeep, SnakeCasedPropertiesDeep } from "@thinknimble/tn-utils"
import { describe, expect, it } from "vitest"
import { z } from "zod"
import { createApiUtils, GetInferredFromRaw, objectToCamelCaseArr } from "."
import { ZodRawShapeToSnakedRecursive, zodObjectRecursive } from "./zod"

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
  it("fromApi makes the right key conversion", () => {
    //arrange
    const { utils } = createApiUtils({
      outputShape: {
        testBoolean: z.boolean(),
      },
      name: "fromApi",
    })
    const input = {
      test_boolean: false,
    }
    //act
    const trial = utils.fromApi(input)
    //assert
    expect(trial).toEqual({
      testBoolean: false,
    })
  })

  it("toApi makes the right key conversion", () => {
    //arrange
    const { utils } = createApiUtils({
      inputShape: {
        testBoolean: z.boolean(),
      },
      name: "toApi",
    })
    const input = {
      testBoolean: false,
    }
    //act
    const trial = utils.toApi(input)
    //assert
    expect(trial).toEqual({
      test_boolean: false,
    })
  })

  it("returns fromApi when outputShape is zod array", () => {
    //arrange
    const { utils } = createApiUtils({
      inputShape: z.number(),
      outputShape: z.array(
        z.object({
          testString: z.string(),
          testNumber: z.number(),
        })
      ),
      name: "fromApiZodArray",
    })
    const output = [{ test_string: "testString", test_number: 9 }]
    //act
    const trial = utils.fromApi(output)
    //assert
    expect(trial).toEqual([{ testString: "testString", testNumber: 9 }])
  })
})

const setupTest = <T extends z.ZodRawShape>(zodShape: T) => {
  return zodObjectRecursive(z.object(zodShape))
}

describe("zodToSnakeCaseShapeRecursive", () => {
  //TODO:  This became huge, I would like to split this one at least into multiple files that only address certain features of zodToSnakeCaseShapeRecursive, zod-optional.test.ts, zod-intersection.test.ts etc
  const stringZod = z.string()
  const objectZod = z.object({
    numberZod: z.number(),
  })
  const arrayObjZod = z.array(
    z.object({
      elementOne: z.string(),
      elementTwo: z.number(),
    })
  )
  const arrayStringZod = z.array(z.string())
  const optionalObject = z
    .object({
      numberZod: z.number(),
    })
    .optional()
  const optionalNestedObject = z
    .object({
      objectZod: z
        .object({
          stringZod: z.string().optional(),
        })
        .optional(),
    })
    .optional()
  const optionalArrayString = arrayStringZod.optional()
  const optionalArrayObject = arrayObjZod.optional()
  const optionalArrayObjectNested = optionalNestedObject.array().optional()
  const optionalStringZod = stringZod.optional()
  const nullableObject = z
    .object({
      numberZod: z.number(),
    })
    .nullable()
  const nullableNestedObject = z
    .object({
      objectZod: z
        .object({
          stringZod: z.string().nullable(),
        })
        .nullable(),
    })
    .nullable()
  const nullableArrayString = arrayStringZod.nullable()
  const nullableArrayObject = arrayObjZod.nullable()
  const nullableArrayObjectNested = nullableNestedObject.array().nullable()
  const nullableStringZod = stringZod.nullable()
  const nullishNestedObject = z
    .object({
      objectZod: z
        .object({
          stringZod: z.string().nullish(),
        })
        .nullish(),
    })
    .nullish()
  const intersectionObjects = objectZod.and(optionalNestedObject)
  const unionInput = [objectZod, stringZod] as const
  const unionObjectString = z.union(unionInput)
  it("Passes these ts tests", () => {
    //arrange
    const testZods = z.object({
      stringZod,
      objectZod,
      arrayObjZod,
      arrayStringZod,
      optionalObject,
      optionalNestedObject,
      optionalArrayString,
      optionalArrayObject,
      optionalArrayObjectNested,
      nullableArrayString,
      nullableArrayObject,
      nullableArrayObjectNested,
      nullableStringZod,
      nullableObject,
      //! this is crashing due to CamelCasePropertiesDeep not being able to solve the intersections and unions properly, I will have to split things at some point, the fact that the types are right in the tests for intersections/unions in their tests is good enough for me (and ofc the test is passing as well)
      // intersectionObjects,
      // unionObjectString
    })
    type TestZods = z.infer<typeof testZods>
    type TestZodsSnakeCasedInferred = SnakeCasedPropertiesDeep<TestZods>
    //act
    const shape = testZods.shape
    const result = setupTest(shape)

    type ResultType = z.ZodObject<ZodRawShapeToSnakedRecursive<typeof shape>>
    type InferredResultType = z.infer<ResultType>
    type ResultTypeCamelCasedInferred = CamelCasedPropertiesDeep<z.infer<ResultType>>

    type ResultTypeOriginal = typeof result
    type InferredResultTypeOriginal = z.infer<ResultTypeOriginal>
    type ResultTypeOriginalCamelCasedInferred = CamelCasedPropertiesDeep<InferredResultTypeOriginal>

    //assert
    //check both ways
    type tests = [
      Expect<Equals<TestZods, ResultTypeCamelCasedInferred>>,
      Expect<Equals<TestZodsSnakeCasedInferred, InferredResultType>>,
      Expect<Equals<TestZods, ResultTypeOriginalCamelCasedInferred>>,
      Expect<Equals<TestZodsSnakeCasedInferred, InferredResultTypeOriginal>>
    ]
  })
  it("Works on primitives", () => {
    //arrange
    //act
    const { string_zod } = setupTest({
      stringZod,
    }).shape
    //assert
    expect(string_zod).toBeInstanceOf(z.ZodString)
  })
  it("Works on simple objects", () => {
    //arrange
    //act
    const { object_zod } = setupTest({
      objectZod,
    }).shape
    //assert
    expect(object_zod).toBeInstanceOf(z.ZodObject)
    expect(object_zod.shape).toHaveProperty("number_zod")
    expect(object_zod.shape.number_zod).toBeInstanceOf(z.ZodNumber)
  })
  it("Works on object arrays", () => {
    //arrange
    //act
    const { array_obj_zod } = setupTest({
      arrayObjZod,
    }).shape
    //assert
    expect(array_obj_zod).toBeInstanceOf(z.ZodArray)
    expect(array_obj_zod.element).toBeInstanceOf(z.ZodObject)
    expect(array_obj_zod.element.shape).toHaveProperty("element_one")
    expect(array_obj_zod.element.shape.element_one).toBeInstanceOf(z.ZodString)
    expect(array_obj_zod.element.shape).toHaveProperty("element_two")
    expect(array_obj_zod.element.shape.element_two).toBeInstanceOf(z.ZodNumber)
  })
  it("Works on primitive arrays", () => {
    //arrange
    //act
    const { array_string_zod } = setupTest({
      arrayStringZod,
    }).shape
    //asert
    expect(array_string_zod).toBeInstanceOf(z.ZodArray)
    expect(array_string_zod.element).toBeInstanceOf(z.ZodString)
  })
  it("Works on nested objects", () => {
    //TODO:
  })
  it("Works on optional simple objects", () => {
    //arrange
    //act
    const { object_zod_optional } = setupTest({
      objectZodOptional: optionalObject,
    }).shape
    //assert
    expect(object_zod_optional).toBeInstanceOf(z.ZodOptional)
    expect(object_zod_optional.unwrap()).toBeInstanceOf(z.ZodObject)
    expect(object_zod_optional.unwrap().shape).toHaveProperty("number_zod")
  })
  it("Works on optional nested objects", () => {
    //arrange
    //act
    const { nested_object_zod_optional } = setupTest({
      nestedObjectZodOptional: optionalNestedObject,
    }).shape
    //assert
    expect(nested_object_zod_optional).toBeInstanceOf(z.ZodOptional)
    const unwrappedShape = nested_object_zod_optional.unwrap().shape
    expect(unwrappedShape).toHaveProperty("object_zod")
    expect(unwrappedShape.object_zod).toBeInstanceOf(z.ZodOptional)
    const unwrappedNestedShape = unwrappedShape.object_zod.unwrap().shape
    expect(unwrappedNestedShape).toHaveProperty("string_zod")
    expect(unwrappedNestedShape.string_zod).toBeInstanceOf(z.ZodOptional)
    expect(unwrappedNestedShape.string_zod.unwrap()).toBeInstanceOf(z.ZodString)
  })
  it("Works on optional array", () => {
    //arrange
    //act
    const { optional_array_object } = setupTest({
      optionalArrayObject,
    }).shape
    //assert
    expect(optional_array_object).toBeInstanceOf(z.ZodOptional)
    const unwrapped = optional_array_object.unwrap()
    expect(unwrapped).toBeInstanceOf(z.ZodArray)
    expect(unwrapped.element).toBeInstanceOf(z.ZodObject)
    expect(unwrapped.element.shape).toHaveProperty("element_one")
    expect(unwrapped.element.shape.element_one).toBeInstanceOf(z.ZodString)
    expect(unwrapped.element.shape).toHaveProperty("element_two")
    expect(unwrapped.element.shape.element_two).toBeInstanceOf(z.ZodNumber)
  })
  it("Works on optional primitive", () => {
    //arrange
    //act
    const { optional_string_zod } = setupTest({
      optionalStringZod,
    }).shape
    //assert
    expect(optional_string_zod).toBeInstanceOf(z.ZodOptional)
    expect(optional_string_zod.unwrap()).toBeInstanceOf(z.ZodString)
  })
  it("Works on optional nested objects array", () => {
    //arrange
    //act
    const { optional_array_object_nested } = setupTest({
      optionalArrayObjectNested,
    }).shape
    //assert
    expect(optional_array_object_nested).toBeInstanceOf(z.ZodOptional)
    const unwrapped = optional_array_object_nested.unwrap()
    expect(unwrapped).toBeInstanceOf(z.ZodArray)
    expect(unwrapped.element).toBeInstanceOf(z.ZodOptional)
    const unwrappedElement = unwrapped.element.unwrap()
    expect(unwrappedElement).toBeInstanceOf(z.ZodObject)
    expect(unwrappedElement.shape).toHaveProperty("object_zod")
    const object_zod = unwrappedElement.shape.object_zod
    expect(object_zod).toBeInstanceOf(z.ZodOptional)
    expect(object_zod.unwrap()).toBeInstanceOf(z.ZodObject)
    expect(object_zod.unwrap().shape).toHaveProperty("string_zod")
    const string_zod = object_zod.unwrap().shape.string_zod
    expect(string_zod).toBeInstanceOf(z.ZodOptional)
    expect(string_zod.unwrap()).toBeInstanceOf(z.ZodString)
  })
  it("works on nullable simple objects", () => {
    //arrange
    const { nullable_object } = setupTest({
      nullableObject,
    }).shape

    expect(nullable_object).toBeInstanceOf(z.ZodNullable)
    const unwrapped = nullable_object.unwrap()
    expect(unwrapped).toBeInstanceOf(z.ZodObject)
    expect(unwrapped.shape).toHaveProperty("number_zod")
    expect(unwrapped.shape.number_zod).toBeInstanceOf(z.ZodNumber)
  })
  it("Works on nullable nested objects", () => {
    //arrange
    //act
    const { nullable_nested_object } = setupTest({
      nullableNestedObject,
    }).shape
    //assert
    expect(nullable_nested_object).toBeInstanceOf(z.ZodNullable)
    const unwrappedShape = nullable_nested_object.unwrap().shape
    expect(unwrappedShape).toHaveProperty("object_zod")
    expect(unwrappedShape.object_zod).toBeInstanceOf(z.ZodNullable)
    const unwrappedNestedShape = unwrappedShape.object_zod.unwrap().shape
    expect(unwrappedNestedShape).toHaveProperty("string_zod")
    expect(unwrappedNestedShape.string_zod).toBeInstanceOf(z.ZodNullable)
    expect(unwrappedNestedShape.string_zod.unwrap()).toBeInstanceOf(z.ZodString)
  })
  it("Works on nullable array", () => {
    //arrange
    //act
    const { nullable_array_object } = setupTest({
      nullableArrayObject,
    }).shape
    //assert
    expect(nullable_array_object).toBeInstanceOf(z.ZodNullable)
    const unwrapped = nullable_array_object.unwrap()
    expect(unwrapped).toBeInstanceOf(z.ZodArray)
    expect(unwrapped.element).toBeInstanceOf(z.ZodObject)
    expect(unwrapped.element.shape).toHaveProperty("element_one")
    expect(unwrapped.element.shape.element_one).toBeInstanceOf(z.ZodString)
    expect(unwrapped.element.shape).toHaveProperty("element_two")
    expect(unwrapped.element.shape.element_two).toBeInstanceOf(z.ZodNumber)
  })
  it("Works on nullable primitive", () => {
    //arrange
    //act
    const { nullable_string_zod } = setupTest({
      nullableStringZod,
    }).shape
    //assert
    expect(nullable_string_zod).toBeInstanceOf(z.ZodNullable)
    expect(nullable_string_zod.unwrap()).toBeInstanceOf(z.ZodString)
  })
  it("Works on nullable nested objects array", () => {
    //arrange
    //act
    const { nullable_array_object_nested } = setupTest({
      nullableArrayObjectNested,
    }).shape
    //assert
    expect(nullable_array_object_nested).toBeInstanceOf(z.ZodNullable)
    const unwrapped = nullable_array_object_nested.unwrap()
    expect(unwrapped).toBeInstanceOf(z.ZodArray)
    expect(unwrapped.element).toBeInstanceOf(z.ZodNullable)
    const unwrappedElement = unwrapped.element.unwrap()
    expect(unwrappedElement).toBeInstanceOf(z.ZodObject)
    expect(unwrappedElement.shape).toHaveProperty("object_zod")
    const object_zod = unwrappedElement.shape.object_zod
    expect(object_zod).toBeInstanceOf(z.ZodNullable)
    expect(object_zod.unwrap()).toBeInstanceOf(z.ZodObject)
    expect(object_zod.unwrap().shape).toHaveProperty("string_zod")
    const string_zod = object_zod.unwrap().shape.string_zod
    expect(string_zod).toBeInstanceOf(z.ZodNullable)
    expect(string_zod.unwrap()).toBeInstanceOf(z.ZodString)
  })
  it("Works on nullish object", () => {
    //nullish is a combination of zod optional and zod nullable so if those two work, we should be able to make nullish work
    const { nullish_nested_object } = setupTest({
      nullishNestedObject,
    }).shape

    expect(nullish_nested_object).toBeInstanceOf(z.ZodOptional)
    const optionalUnwrapped = nullish_nested_object.unwrap()
    expect(optionalUnwrapped).toBeInstanceOf(z.ZodNullable)
    const nullableUnwrapped = optionalUnwrapped.unwrap()
    expect(nullableUnwrapped).toBeInstanceOf(z.ZodObject)
    expect(nullableUnwrapped.shape).toHaveProperty("object_zod")
    expect(nullableUnwrapped.shape.object_zod).toBeInstanceOf(z.ZodOptional)
    const nullishObjectUnwrapped = nullableUnwrapped.shape.object_zod.unwrap()
    expect(nullishObjectUnwrapped).toBeInstanceOf(z.ZodNullable)
    const nextUnwrapped = nullishObjectUnwrapped.unwrap()
    expect(nextUnwrapped).toBeInstanceOf(z.ZodObject)
    expect(nextUnwrapped.shape).toHaveProperty("string_zod")
    expect(nextUnwrapped.shape.string_zod).toBeInstanceOf(z.ZodOptional)
    const optionalStringZodUnwrapped = nextUnwrapped.shape.string_zod.unwrap()
    expect(optionalStringZodUnwrapped).toBeInstanceOf(z.ZodNullable)
    expect(optionalStringZodUnwrapped.unwrap()).toBeInstanceOf(z.ZodString)
  })
  it("Works with intersections", () => {
    const { intersection_objects } = setupTest({
      intersectionObjects,
    }).shape
    const subject = intersection_objects
    expect(subject).toBeInstanceOf(z.ZodIntersection)
    const { left, right } = subject._def
    expect(left).toBeInstanceOf(z.ZodObject)
    expect(left.shape).toHaveProperty("number_zod")
    // seems like working on runtime but ts does not accept this
    expect(left.shape.number_zod).toBeInstanceOf(z.ZodNumber)
    expect(right).toBeInstanceOf(z.ZodOptional)
    const unwrappedShape = right.unwrap().shape
    expect(unwrappedShape).toHaveProperty("object_zod")
    expect(unwrappedShape.object_zod).toBeInstanceOf(z.ZodOptional)
    const unwrappedNestedShape = unwrappedShape.object_zod.unwrap().shape
    expect(unwrappedNestedShape).toHaveProperty("string_zod")
    expect(unwrappedNestedShape.string_zod).toBeInstanceOf(z.ZodOptional)
    expect(unwrappedNestedShape.string_zod.unwrap()).toBeInstanceOf(z.ZodString)
  })
  it("Works with unions", () => {
    const { union_object_string: subject } = setupTest({
      unionObjectString,
    }).shape

    expect(subject).toBeInstanceOf(z.ZodUnion)
    const unionOpts = subject.options
    expect(unionOpts).toHaveLength(unionInput.length)
    const [objectZod, stringZod] = unionOpts
    expect(objectZod).toBeInstanceOf(z.ZodObject)
    expect(stringZod).toBeInstanceOf(z.ZodString)
    expect(objectZod.shape).toHaveProperty("number_zod")
    expect(objectZod.shape.number_zod).toBeInstanceOf(z.ZodNumber)
  })
})

describe("objectToCamelCaseArr", () => {
  const singleElement = {
    test_snake: 5,
    test_snake_other: 9,
  }
  it("properly handles single array value", () => {
    //arrange
    const inputArray = [singleElement]
    //act
    const result = objectToCamelCaseArr(inputArray)
    //assert
    expect(result).toEqual([
      {
        testSnake: singleElement.test_snake,
        testSnakeOther: singleElement.test_snake_other,
      },
    ])
  })
  it("properly handles an object with an array within", () => {
    //arrange
    const testObj = {
      my_array_field: [singleElement, singleElement],
    }
    //act
    const result = objectToCamelCaseArr(testObj)
    // assert
    expect(result).toEqual({
      myArrayField: [
        { testSnake: 5, testSnakeOther: 9 },
        { testSnake: 5, testSnakeOther: 9 },
      ],
    })
    //TODO:
  })
  it("properly handles an object with more than one field that is an array", () => {
    //arrange
    const testObj = {
      my_array_field: [singleElement, singleElement],
      my_array_field_other: [singleElement],
    }
    //act
    const result = objectToCamelCaseArr(testObj)
    // assert
    expect(result).toEqual({
      myArrayField: [
        { testSnake: 5, testSnakeOther: 9 },
        { testSnake: 5, testSnakeOther: 9 },
      ],
      myArrayFieldOther: [{ testSnake: 5, testSnakeOther: 9 }],
    })
  })
  it("properly handles an object with nested arrays", () => {
    //arrange
    const my_nested_array = [
      {
        nested_value: 10,
      },
    ]

    const testObj = {
      my_array_field: [
        {
          my_nested_array,
        },
      ],
    }
    //act
    const result = objectToCamelCaseArr(testObj)
    // assert
    expect(result).toEqual({
      myArrayField: [
        {
          myNestedArray: [
            {
              nestedValue: 10,
            },
          ],
        },
      ],
    })
  })

  it("handles a super nested array", () => {
    //arrange
    const createSuperNestedArrayWithClosure = (deepObject: any, levels: number) => {
      let currentLevel = levels
      const mainArray: any[] = []
      let lastLevel = mainArray
      while (currentLevel !== 0) {
        lastLevel[0] = []
        if (currentLevel === 1) {
          lastLevel[0] = deepObject
        } else {
          lastLevel = lastLevel[0]
        }
        currentLevel--
      }
      return mainArray
    }

    const testTwoLevels = createSuperNestedArrayWithClosure(singleElement, 2)
    const resultTwoLevels = objectToCamelCaseArr(testTwoLevels)
    const testFiveLevels = createSuperNestedArrayWithClosure(singleElement, 5)
    const resultFiveLevels = objectToCamelCaseArr(testFiveLevels)
    const expectedDeepObject = {
      testSnake: 5,
      testSnakeOther: 9,
    }
    2

    //act
    expect(resultTwoLevels).toEqual(createSuperNestedArrayWithClosure(expectedDeepObject, 2))
    expect(resultFiveLevels).toEqual(createSuperNestedArrayWithClosure(expectedDeepObject, 5))
  })
})
