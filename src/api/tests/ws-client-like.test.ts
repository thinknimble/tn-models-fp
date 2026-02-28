import { describe, expect, it } from "vitest"
import { WSClientLike } from "../types"

describe("WSClientLike", () => {
  it("accepts a minimal implementation with all three methods", () => {
    const client: WSClientLike = {
      send: (_event: string, _data: unknown) => {},
      on: (_event: string, _handler: (data: unknown) => void) => {},
      off: (_event: string, _handler?: (data: unknown) => void) => {},
    }
    // Type-level check passed if this compiles; runtime sanity:
    expect(typeof client.send).toBe("function")
    expect(typeof client.on).toBe("function")
    expect(typeof client.off).toBe("function")
  })

  it("is importable from the api barrel export", async () => {
    const apiModule = await import("../index")
    // WSClientLike is a type-only export; verify the module itself loads
    expect(apiModule).toBeDefined()
  })
})
