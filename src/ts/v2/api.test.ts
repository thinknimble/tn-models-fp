//! using this file as a rubber duck and check types. Probably I'll remove it or find a way to test this properly
import axios from "axios"
import { z } from "zod"
import { createApi, GetZodInferredTypeFromRaw } from "./api"
import assert from "assert"
import { createCollectionManager } from "./collection-manager"

describe("v2 api tests", async () => {
  const updateZodShape = {
    name: z.string(),
    age: z.number(),
  }

  const testApi = createApi(
    {
      client: axios.create(),
      endpoint: "users",
      models: {
        create: { hello: z.string() },
        entity: {
          name: z.string(),
          lastName: z.string(),
          age: z.number(),
        },
        update: { name: z.string(), age: z.number() },
        extraFilters: {
          anExtraFilter: z.string(),
        },
      },
    },
    {
      helloViper: async (inputs: GetZodInferredTypeFromRaw<typeof updateZodShape>) => {
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

  //customEndpoints ts tests
  //@ts-expect-error expects string rather than number
  const stringparam = await testApi.customEndpoints.test(5)
  const noparams = await testApi.customEndpoints.testNoParams()
  const listTest = await testApi.customEndpoints.list()

  // list ts tests
  const list = await testApi.list({ filters: { anExtraFilter: "ok funciona" } })
  const listError = await testApi.list()
  const listError2 = await testApi.list({
    filters: {
      //@ts-expect-error Do not allow passing any key
      nonExistant: "error",
    },
  })

  const collectionManager = createCollectionManager({
    fetchList: testApi.list,
    entityZodShape: updateZodShape,
    list: [],
  })
})
