import axios from "axios"
import { z } from "zod"
import { createApi } from "./api"
import assert from "assert"

describe("v2 api tests", async () => {
  const updateZod = z.object({
    name: z.string(),
    age: z.number(),
  })

  const testApi = createApi(
    {
      client: axios.create(),
      endpoint: "users",
      models: {
        create: z.object({ hello: z.string() }),
        entity: z.object({
          name: z.string(),
          lastName: z.string(),
          age: z.number(),
        }),
        update: z.object({ name: z.string(), age: z.number() }),
        extraFilters: z.object({
          myFilter: z.string().optional(),
          yetAnotherFilter: z.number().optional(),
        }),
      },
    },
    {
      helloViper: async (inputs: z.infer<typeof updateZod>) => {
        return { this_is_a_viper: "Una vibora" }
      },
      test: async (testStr: string) => "hola",
      testNoParams: async () => "test",
      list: async () => {
        return 10
      },
    }
  )
  const result = await testApi.customEndpoints.helloViper({
    age: 10,
    name: "lala",
  })

  assert.notEqual(result.thisIsAViper, undefined)
  assert.equal(result.thisIsAViper, "Una vibora")

  const listed = await testApi.list({
    yetAnotherFilter: 4,
  })
  const stringparam = await testApi.customEndpoints.test("hello")
  const noparams = await testApi.customEndpoints.testNoParams()
  const listTest = await testApi.customEndpoints.list()
})
