//! using this file as a rubber duck and check types. Probably I'll remove it or find a way to test this properly
import { SnakeCasedPropertiesDeep } from "@thinknimble/tn-utils"
import axios from "axios"
import { v4 as uuid } from "uuid"
import { beforeEach, describe, expect, it, Mocked, vi } from "vitest"
import { z } from "zod"
import { createApi, GetZodInferredTypeFromRaw } from "./api"

vi.mock("axios")

const mockedAxios = axios as Mocked<typeof axios>

const createZodShape = {
  firstName: z.string(),
  lastName: z.string(),
  age: z.number(),
}
const entityZodShape = {
  ...createZodShape,
  id: z.string().uuid(),
}

describe("v2 api tests", async () => {
  const testApi = createApi({
    client: mockedAxios,
    endpoint: "users",
    models: {
      create: createZodShape,
      entity: entityZodShape,
      update: createZodShape,
      extraFilters: {
        anExtraFilter: z.string(),
      },
    },
  })

  describe("create", () => {
    beforeEach(() => {
      mockedAxios.post.mockReset()
    })

    const createInput: GetZodInferredTypeFromRaw<typeof createZodShape> = {
      age: 19,
      lastName: "Doe",
      firstName: "Jane",
    }
    const randomId: string = uuid()
    const createResponse: SnakeCasedPropertiesDeep<GetZodInferredTypeFromRaw<typeof entityZodShape>> = {
      age: createInput.age,
      last_name: createInput.lastName,
      first_name: createInput.firstName,
      id: randomId,
    }

    it("calls api with snake_case", async () => {
      //arrange
      const postSpy = vi.spyOn(mockedAxios, "post")
      mockedAxios.post.mockResolvedValueOnce({ data: createResponse })
      //assess
      await testApi.create(createInput)
      //assert
      expect(postSpy).toHaveBeenCalledWith("users", {
        age: createInput.age,
        last_name: createInput.lastName,
        first_name: createInput.firstName,
      })
    })
    it("returns camelCased response", async () => {
      //arrange
      mockedAxios.post.mockResolvedValueOnce({ data: createResponse })
      //assess
      const response = await testApi.create(createInput)
      //assert
      expect(response).toEqual({ ...createInput, id: randomId })
    })
  })

  describe("retrieve", () => {
    beforeEach(() => {
      mockedAxios.post.mockReset()
    })

    it("returns camelCased entity", async () => {
      //arrange
      const randomUuid = uuid()
      const entityResponse: SnakeCasedPropertiesDeep<GetZodInferredTypeFromRaw<typeof entityZodShape>> = {
        age: 18,
        first_name: "John",
        last_name: "Doe",
        id: randomUuid,
      }
      mockedAxios.get.mockResolvedValue({ data: entityResponse })
      const getSpy = vi.spyOn(mockedAxios, "get")
      //assess
      const response = await testApi.retrieve(randomUuid)
      //assert
      expect(getSpy).toHaveBeenCalledWith(`users/${randomUuid}`)
      expect(response).toEqual({
        age: entityResponse.age,
        firstName: entityResponse.first_name,
        lastName: entityResponse.last_name,
        id: randomUuid,
      })
    })
  })
})
