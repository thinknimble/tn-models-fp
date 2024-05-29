import axios from "axios"

import { describe, it, expect } from "bun:test"
describe("testing this", () => {
  it("works as expected?", () => {
    console.log(
      "what do we have here?",
      Object.keys(axios).map((k) => k)
    )
    expect(true).toBe(true)
  })
})
