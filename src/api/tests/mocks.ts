import { faker } from "@faker-js/faker"
import axios from "axios"
import { Mocked, vi } from "vitest"
import { z } from "zod"
import { GetInferredFromRawWithBrand, ReadonlyField, getPaginatedSnakeCasedZod, readonly } from "../../utils"

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
  fullName: readonly(z.string()),
}
export const entityZodShapeWithReadonlyId = {
  ...createZodShape,
  id: readonly(entityZodShape.id),
  fullName: readonly(entityZodShape.fullName),
}
export const entityZodShapeWithIdNumber = {
  ...entityZodShape,
  id: z.number(),
}

type Entity = GetInferredFromRawWithBrand<typeof entityZodShape>

export const createEntityMock: () => Entity = () => {
  const firstName = faker.name.firstName()
  const lastName = faker.name.lastName()
  return {
    id: faker.datatype.uuid(),
    age: faker.datatype.number({ min: 1, max: 100 }),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}` as ReadonlyField<string>,
  }
}
export const mockEntity1 = createEntityMock()
export const mockEntity2 = createEntityMock()
type ListResponse = z.infer<ReturnType<typeof getPaginatedSnakeCasedZod<typeof entityZodShape>>>
export const listResponse: ListResponse = {
  count: 10,
  next: null,
  previous: null,
  results: [
    {
      ...mockEntity1,
      first_name: mockEntity1.firstName,
      last_name: mockEntity1.lastName,
      full_name: mockEntity1.fullName,
    },
    {
      ...mockEntity2,
      first_name: mockEntity2.firstName,
      last_name: mockEntity2.lastName,
      full_name: mockEntity2.fullName,
    },
  ],
}
export const [mockEntity1Snaked, mockEntity2Snaked] = listResponse.results as [
  ListResponse["results"][0],
  ListResponse["results"][0],
]
