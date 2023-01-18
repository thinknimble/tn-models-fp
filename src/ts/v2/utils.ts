import { ZodType, z } from "zod"

/**
 * Parse a backend response by providing a zod schema which will safe validate it and return the corresponding value typed. Will raise a warning if what we receive does not match our expected schema, thus we can update the schema and that will automatically update our types by inference.
 */
export const parseResponse = <T extends ZodType, Z = z.infer<T>>({
  uri,
  data,
  zod,
}: {
  uri: string
  data: any
  zod: T
}) => {
  const parsed = zod.safeParse(data)

  if (!parsed.success) {
    // If a request does not return what you expect, we don't let that go unnoticed, you'll get a warning that your frontend model has become outdated.
    console.warn(
      `Response to service call ${uri} did not match expected type,\n errors:`,
      parsed.error
    )
    // runtime will still have all the fields (no runtime obfuscation)
    return data as Z
  }
  return parsed.data as Z
}
