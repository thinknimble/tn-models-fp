import { describe, expect, it } from "vitest"
import { z } from "zod"
import { HandleZodReadonly, isZodReadonly, StripZodReadonly, UnwrapZodReadonly } from "../zod"

/**
 * Simplifies the zod object type to the plain zod object with shape.
 */
type SimplifyZodObject<T extends z.ZodObject<z.ZodRawShape>> =
  T extends z.ZodObject<infer TObjShape> ? z.ZodObject<TObjShape> : T

type GetZodArrayElementType<T extends z.ZodArray<z.ZodType>> =
  T extends z.ZodArray<infer TArrElement> ? TArrElement : never

describe("Check on the zod readonly feature", () => {
  it("TS - UnwrapReadonlyFields simple shape", () => {
    const simpleShape = {
      id: z.string().uuid().readonly(),
      name: z.string(),
    }
    type TestIfUnwrapsId = UnwrapZodReadonly<typeof simpleShape>
    type tests = [Expect<Equals<TestIfUnwrapsId, { id: z.ZodString; name: z.ZodString }>>]
  })
  it("TS - HandleZodReadonly - Unwrap readonly array primitive", () => {
    /**
     * An array readonly shape
     */
    const arrayROZodString = z.string().array().readonly()
    type TestIfUnwrapsZodStringReadonly = HandleZodReadonly<typeof arrayROZodString>
    const arrayROZodNumber = z.number().array().readonly()
    type TestIfUnwrapsZodNumberReadonly = HandleZodReadonly<typeof arrayROZodNumber>
    const arrayROObject = z
      .object({
        id: z.string(),
        name: z.string(),
      })
      .array()
      .readonly()
    type unwrappedArrayOfObjectsReadonly = HandleZodReadonly<typeof arrayROObject>
    type arrElementType = GetZodArrayElementType<unwrappedArrayOfObjectsReadonly>
    type TestIfUnwrapsZodObjectReadonly = SimplifyZodObject<arrElementType>

    type tests = [
      Expect<Equals<TestIfUnwrapsZodStringReadonly, z.ZodArray<z.ZodString>>>,
      Expect<Equals<TestIfUnwrapsZodNumberReadonly, z.ZodArray<z.ZodNumber>>>,
      Expect<
        Equals<
          TestIfUnwrapsZodObjectReadonly,
          z.ZodObject<{
            id: z.ZodString
            name: z.ZodString
          }>
        >
      >,
    ]
  })
  it("TS - UnwrapZodReadonly - Unwrap readonly complex", () => {
    /**
     * An array readonly shape
     */
    const objReadonlyNestedOneLevel = {
      id: z.string().readonly(),
      name: z.string(),
      profile: z.object({
        id: z.string().readonly(),
        name: z.string(),
      }),
      relatedFieldIds: z.string().readonly().array(),
      wallets: z
        .object({
          id: z.string().readonly(),
          name: z.string(),
        })
        .array(),
    }
    type unwrappedResult = UnwrapZodReadonly<typeof objReadonlyNestedOneLevel>
    type baseIdUnwrappedResult = unwrappedResult["id"]
    type walletIdUnwrappedResult = unwrappedResult["wallets"]["element"]["shape"]["id"]

    type ExpectedNestedOneLevel = {
      id: z.ZodString
      name: z.ZodString
      profile: z.ZodObject<{
        id: z.ZodString
        name: z.ZodString
      }>
      wallets: z.ZodArray<
        z.ZodObject<{
          id: z.ZodString
          name: z.ZodString
        }>
      >
      relatedFieldIds: z.ZodArray<z.ZodString>
    }
    type tests = [
      Expect<Equals<baseIdUnwrappedResult, ExpectedNestedOneLevel["id"]>>,
      Expect<Equals<unwrappedResult["profile"]["shape"]["id"], ExpectedNestedOneLevel["profile"]["shape"]["id"]>>,
      Expect<Equals<walletIdUnwrappedResult, ExpectedNestedOneLevel["wallets"]["element"]["shape"]["id"]>>,
      Expect<Equals<unwrappedResult["relatedFieldIds"], ExpectedNestedOneLevel["relatedFieldIds"]>>,
    ]
  })

  it("isReadonly", () => {
    const aReadonlyZod = z.string().readonly()
    expect(isZodReadonly(aReadonlyZod)).toBe(true)
  })
  it("TS - StripZodReadonly - strip readonly types", () => {
    /**
     * An array readonly shape
     */
    const objReadonlyNestedOneLevel = {
      id: z.string().readonly(),
      name: z.string(),
      profile: z.object({
        id: z.string().readonly(),
        name: z.string(),
      }),
      relatedFieldIds: z.string().readonly().array(),
      wallets: z
        .object({
          id: z.string().readonly(),
          name: z.string(),
        })
        .array(),
    }
    type unwrappedResult = StripZodReadonly<typeof objReadonlyNestedOneLevel>

    type tests = [
      //@ts-expect-error ID should have been stripped
      unwrappedResult["id"],
      //@ts-expect-error ID should have been stripped
      unwrappedResult["profile"]["shape"]["id"],
      //@ts-expect-error relatedFieldIds should have been stripped
      unwrappedResult["relatedFieldIds"],
      //@ts-expect-error ID should have been stripped
      unwrappedResult["wallets"]["element"]["shape"]["id"],
    ]
  })
})
