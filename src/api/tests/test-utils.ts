import axios from "axios"
import { createApi } from "../create-api"
import { createCustomServiceCall } from "../create-custom-call"
import { CustomServiceCallOpts, CustomServiceCallPlaceholder, CustomServiceCallsRecord } from "../types"
import { z } from "zod"

const noInputNorOutput = createCustomServiceCall(async () => {
  //
})
type noInputNorOutput = typeof noInputNorOutput

type setupTests<
  T,
  TRecord = { test: T },
  TCall = CustomServiceCallsRecord<{ test: T }>,
  TEntryType = TCall extends { test: any } ? TCall["test"] : never,
  TPlaceholderInferAll = T extends CustomServiceCallPlaceholder<infer TInput, infer TOutput, infer TFilters>
    ? [TInput, TOutput, TFilters]
    : never,
  TPlaceholderInferInput = T extends CustomServiceCallPlaceholder<infer TInput, any, any> ? [TInput] : never,
  TPlaceholderInferInputOutput = T extends CustomServiceCallPlaceholder<infer TInput, infer TOutput, any>
    ? [TInput, TOutput]
    : never
> = {
  record: TRecord
  recordResult: TCall
  obtainedType: TEntryType
  placeholderInference: TPlaceholderInferAll
  inputOnly: TPlaceholderInferInput
  inputOutput: TPlaceholderInferInputOutput
}

type testNoInputNorOutput = setupTests<noInputNorOutput>["obtainedType"]
//    ^?

const myApi = createApi(
  {
    baseUri: "hello",
    client: axios,
  },
  {
    noInputNorOutput,
  }
)

myApi.csc.noInputNorOutput()

/// okay that looks good...

const plainZodOutput: CustomServiceCallOpts<z.ZodVoid, z.ZodString, z.ZodVoid> = createCustomServiceCall(
  {
    outputShape: z.string(),
  },
  async () => {
    return "test"
  }
)
type plainZodOutput = typeof plainZodOutput
type plainZodOutputTest = setupTests<plainZodOutput>["inputOutput"]
//    ^?

const callWithFilter = createCustomServiceCall(
  {
    inputShape: {
      testInput: z.string(),
    },
    outputShape: {
      testOutput: z.string(),
    },
    filtersShape: {
      testFilter: z.string(),
    },
  },
  async ({ client, slashEndingBaseUri, parsedFilters }) => {
    const result = await client.get(slashEndingBaseUri, { params: parsedFilters })
    return result.data
  }
)

type callWithFilter = typeof callWithFilter
type callWithFilterTest = setupTests<callWithFilter>["recordResult"]
//    ^?
