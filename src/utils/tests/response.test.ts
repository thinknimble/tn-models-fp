import { faker } from "@faker-js/faker"
import { describe, expect, it } from "vitest"
import { z } from "zod"
import { parseResponse } from "../response"

describe("parseResponse", () => {
  it("does not obfuscate extra fields if data exceeds the amount of keys that zod expects", () => {
    //arrange
    const data = {
      name: faker.name.firstName(),
      last_name: faker.name.lastName(),
      number_of_children: faker.datatype.number({ min: 1, max: 5 }),
    }
    const zod = z.object({
      name: z.string(),
      last_name: z.string(),
    })
    //act
    const parsed = parseResponse({
      data,
      identifier: "obfuscationTest",
      zod,
    })
    //assert
    expect(parsed).toHaveProperty("number_of_children")
  })
})
