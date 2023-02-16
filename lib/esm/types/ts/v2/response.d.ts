import { z } from "zod";
/**
 * Parse a backend response by providing a zod schema which will safe validate it and return the corresponding value typed. Will raise a warning if what we receive does not match our expected schema, thus we can update the schema and that will automatically update our types by inference.
 */
export declare const parseResponse: <T extends z.ZodType<any, z.ZodTypeDef, any>, Z = z.TypeOf<T>>({ identifier, data, zod, }: {
    /**
     * Give a relevant name to identify the source request of this response (A good option is to use the name of the function that performs the request)
     */
    identifier: string;
    data: object;
    zod: T;
}) => Z;
//# sourceMappingURL=response.d.ts.map