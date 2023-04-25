import { faker } from "@faker-js/faker"
import axios from "axios"
import { Mocked, vi } from "vitest"
import { z } from "zod"
import type { GetInferredFromRaw, getPaginatedSnakeCasedZod } from "../../utils"

vi.mock("axios")

export const mockedAxios = axios as Mocked<typeof axios>

export const createZodShape = {
  firstName: z.string(),
  lastName: z.string(),
  age: z.number(),
}
export const entityZodShape = {
  ...createZodShape,
  id: z.string().uuid(),
}

type Entity = GetInferredFromRaw<typeof entityZodShape>

export const createEntityMock: () => Entity = () => ({
  id: faker.datatype.uuid(),
  age: faker.datatype.number({ min: 1, max: 100 }),
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
})
export const mockEntity1 = createEntityMock()
export const mockEntity2 = createEntityMock()
type ListResponse = z.infer<ReturnType<typeof getPaginatedSnakeCasedZod<typeof entityZodShape>>>
export const listResponse: ListResponse = {
  count: 10,
  next: null,
  previous: null,
  results: [
    { ...mockEntity1, first_name: mockEntity1.firstName, last_name: mockEntity1.lastName },
    {
      ...mockEntity2,
      first_name: mockEntity2.firstName,
      last_name: mockEntity2.lastName,
    },
  ],
}
export const [mockEntity1Snaked, mockEntity2Snaked] = listResponse.results as [
  ListResponse["results"][0],
  ListResponse["results"][0]
]
