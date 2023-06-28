import { describe, it } from "vitest"
import { z } from "zod"
import { IsBrand, ReadonlyTag, readonlyField } from "../zod"

describe("TS tests for zod utils", () => {
  it("checks on IsBrand util", () => {
    const zodStringTest = readonlyField(z.string())
    type zodStringTest = typeof zodStringTest
    const zodObjectTest = readonlyField(
      z.object({
        hello: z.string(),
      })
    )
    type zodObjectTest = typeof zodObjectTest
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type tests = [
      Expect<Equals<IsBrand<zodStringTest, "RandomBrand">, false>>,
      Expect<Equals<IsBrand<zodStringTest, ReadonlyTag>, true>>,
      Expect<Equals<IsBrand<zodObjectTest, "RandomBrand">, false>>,
      Expect<Equals<IsBrand<zodObjectTest, ReadonlyTag>, true>>
    ]
  })
})
