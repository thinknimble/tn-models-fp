import { faker } from "@faker-js/faker"
import axios from "axios"
import { Mocked, vi } from "vitest"
import { z } from "zod"
import { GetInferredFromRawWithReadonly, getPaginatedSnakeCasedZod } from "../../utils"

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
  fullName: z.string().readonly(),
}
export const entityZodShapeWithReadonlyId = {
  ...createZodShape,
  id: entityZodShape.id.readonly(),
  fullName: entityZodShape.fullName.readonly(),
}
export const entityZodShapeWithIdNumber = {
  ...entityZodShape,
  id: z.number(),
}

type Entity = GetInferredFromRawWithReadonly<typeof entityZodShape>

export const createEntityMock: () => Entity = () => {
  const firstName = faker.name.firstName()
  const lastName = faker.name.lastName()
  return {
    id: faker.datatype.uuid(),
    age: faker.datatype.number({ min: 1, max: 100 }),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
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
      id: mockEntity1.id,
      age: mockEntity1.age,
      first_name: mockEntity1.firstName,
      last_name: mockEntity1.lastName,
      full_name: mockEntity1.fullName,
    },
    {
      id: mockEntity2.id,
      age: mockEntity2.age,
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
