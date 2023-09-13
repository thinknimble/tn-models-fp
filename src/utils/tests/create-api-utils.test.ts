/* eslint-disable @typescript-eslint/no-unused-vars */
import { faker } from "@faker-js/faker"
import { describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { createApiUtils, objectToSnakeCaseArr, removeReadonlyFields } from "../api"
import { GetInferredFromRawWithBrand, readonly } from "../zod"
import { mockedAxios } from "../../api/tests/mocks"

describe("createApiUtils", () => {
  it("returns undefined when both input output are primitives", () => {
    const utils = createApiUtils({
      inputShape: z.string(),
      name: "input-output-primitives",
      outputShape: z.number(),
    })
    type tests = [Expect<Equals<typeof utils, unknown>>]
    expect(utils).toEqual({})
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
  it("toApi checks this", () => {
    const postSpy = vi.spyOn(mockedAxios, "post")
    const expoTokenInputShape = {
      expoToken: z.string(),
    }
    type ExpoTokenInput = GetInferredFromRawWithBrand<typeof expoTokenInputShape>
    const expoTokenTest: ExpoTokenInput = {
      expoToken: "my-expo-token",
    }
    const {
      utils: { toApi },
    } = createApiUtils({ inputShape: expoTokenInputShape, name: "postExpoToken" })
    const result = toApi(expoTokenTest)
    expect(result).toEqual({
      expo_token: expoTokenTest.expoToken,
    })
    mockedAxios.post("/api/test", toApi(expoTokenTest))
    expect(postSpy).toHaveBeenCalledWith("/api/test", objectToSnakeCaseArr(expoTokenTest))
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

  it("returns toApi when inputShape is zod array", () => {
    //arrange
    const { utils } = createApiUtils({
      outputShape: z.number(),
      inputShape: z.array(
        z.object({
          testString: z.string(),
          testNumber: z.number(),
        })
      ),
      name: "fromApiZodArray",
    })
    const input = [{ testString: "testString", testNumber: 9 }]
    //act
    const trial = utils.toApi(input)
    //assert
    expect(trial).toEqual([{ test_string: "testString", test_number: 9 }])
  })

  it("properly processes input and output as arrays", () => {
    const { utils } = createApiUtils({
      inputShape: z
        .object({
          testInput: z.number(),
        })
        .array(),
      outputShape: z
        .object({
          testOutput: z.string(),
        })
        .array(),
      name: "test input output array",
    })
    const input = [{ testInput: faker.datatype.number() }, { testInput: faker.datatype.number() }]
    const output = [{ test_output: faker.datatype.string() }, { test_output: faker.datatype.string() }]
    const [trialInput, trialOutput] = [utils.toApi(input), utils.fromApi(output)]
    expect(trialInput).toEqual([{ test_input: input[0]?.testInput }, { test_input: input[1]?.testInput }])
    expect(trialOutput).toEqual([{ testOutput: output[0]?.test_output }, { testOutput: output[1]?.test_output }])
  })
})

describe("removeReadonlyFields", () => {
  it("properly removes a readonly field", () => {
    const baseModelShape = {
      id: readonly(z.string().uuid()),
      datetimeCreated: readonly(z.string().datetime().optional()),
      lastEdited: readonly(z.string().datetime().optional()),
    }
    const userShape = {
      ...baseModelShape,
      email: z.string().email(),
      firstName: z.string(),
      lastName: z.string(),
      token: readonly(z.string().nullable().optional()),
    }

    const userCreateShape = {
      ...userShape,
      password: z.string(),
    }

    const withoutId = removeReadonlyFields(userCreateShape)
    expect(withoutId).not.toHaveProperty("id")
  })
})
