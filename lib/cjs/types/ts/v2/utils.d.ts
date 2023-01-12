import { ZodType, z } from "zod";
/**
 * Parse a backend response by providing a zod schema which will safe validate it and return the corresponding value typed. Will raise a warning if what we receive does not match our expected schema, thus we can update the schema and that will automatically update our types by inference.
 */
export declare const parseResponse: <T extends ZodType<any, z.ZodTypeDef, any>, Z = z.TypeOf<T>>({ uri, data, zod, }: {
    uri: string;
    data: any;
    zod: T;
}) => Z;
//# sourceMappingURL=utils.d.ts.map