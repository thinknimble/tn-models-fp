import { faker } from "@faker-js/faker"
import { describe, expect, it } from "vitest"
import { z } from "zod"
import { parseFilters } from "../filters"

describe("parseFilters", () => {
  it("Snake cases keys", () => {
    const shape = {
      companyCategory: z.string(),
    }
    const filters = {
      companyCategory: faker.company.catchPhraseAdjective(),
    }
    expect(parseFilters({ shape, filters })).toEqual({
      company_category: filters.companyCategory,
    })
  })
  it("Throws error if passing a wrong type filter", () => {
    const shape = {
      allNames: z.string().array(),
    }
    const filters = {
      allNames: [faker.datatype.number(), faker.datatype.number()],
    }
    expect(() => {
      parseFilters({ shape, filters })
    }).toThrow()
  })
  it("Makes arrays into comma separated values", () => {
    const shape = {
      names: z.number().array(),
    }
    const names = [faker.datatype.number(), faker.datatype.number()]
    const filters = {
      names,
    }
    const parsedFilters = parseFilters({ shape, filters })
    expect(parsedFilters).toEqual({ names: names.join(",") })
  })
  it("allows modifying the default parser", () => {
    //trying to cover all possible types
    const shape = {
      regions: z.string().array(),
      points: z.number(),
      tier: z.string(),
    }
    const regions = Array.from({ length: 3 })
      .fill(undefined)
      .map(() => faker.datatype.string())
    const points = faker.datatype.number()
    const tier = faker.datatype.string()
    const filters = {
      regions,
      points,
      tier,
    }
    const customValueParser = (element: unknown) => {
      if (typeof element === "string") {
        return element + "+"
      }
      if (typeof element === "number") return element + "-"
      if (typeof element === "object" && Array.isArray(element)) return element.join("/")
      return element
    }
    const parsedFilters = parseFilters({ shape, filters, customValueParser })
    expect(parsedFilters).toEqual({
      regions: filters.regions.join("/"),
      points: filters.points + "-",
      tier: filters.tier + "+",
    })
  })
})
