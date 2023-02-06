/**
 * Parse a backend response by providing a zod schema which will safe validate it and return the corresponding value typed. Will raise a warning if what we receive does not match our expected schema, thus we can update the schema and that will automatically update our types by inference.
 */
export const parseResponse = ({ identifier, data, zod, }) => {
    const parsed = zod.safeParse(data);
    if (!parsed.success) {
        // If a request does not return what you expect, we don't let that go unnoticed, you'll get a warning that your frontend model is/has become outdated.
        console.warn(`Response to service call with identifier < ${identifier} > did not match expected type,\n errors:`, parsed.error);
        // runtime will still have all the fields (no runtime obfuscation)
        return data;
    }
    return parsed.data;
};
