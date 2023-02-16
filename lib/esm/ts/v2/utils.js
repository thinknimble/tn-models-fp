import { objectToCamelCase, objectToSnakeCase, toSnakeCase, } from "@thinknimble/tn-utils";
import { z } from "zod";
import { getPaginatedZod } from "./pagination";
import { parseResponse } from "./response";
export const getSnakeCasedZodRawShape = (zodShape) => {
    // objectToSnakeCase would mess up zod internal fields, so we must do the case conversion only on the keys of the shape
    const unknownSnakeCasedZod = Object.fromEntries(Object.entries(zodShape).map(([k, v]) => {
        return [toSnakeCase(k), v];
    }));
    return unknownSnakeCasedZod;
};
export const getPaginatedSnakeCasedZod = (zodShape) => {
    return getPaginatedZod(getSnakeCasedZodRawShape(zodShape));
};
const getToApiHandler = (inputShape) => {
    const isInputZodPrimitive = inputShape instanceof z.ZodSchema;
    // Given that this is under our control, we should not do safe parse, if the parsing fails means something is wrong (you're not complying with the schema you defined)
    return isInputZodPrimitive
        ? undefined
        : ((obj) => z.object(getSnakeCasedZodRawShape(inputShape)).parse(objectToSnakeCase(obj)));
};
const getFromApiHandler = (outputShape, callerName) => {
    const isOutputZodPrimitive = outputShape instanceof z.ZodSchema;
    // since this checks for the api response, which we don't control, we can't strict parse, else we would break the flow. We'd rather safe parse and show a warning if there's a mismatch
    return isOutputZodPrimitive
        ? undefined
        : ((obj) => parseResponse({
            identifier: callerName,
            data: objectToCamelCase(obj) ?? {},
            zod: z.object(outputShape),
        }));
};
export function createApiUtils(args) {
    if (!("inputShape" in args || "outputShape" in args))
        return {};
    const fromApi = "outputShape" in args ? getFromApiHandler(args.outputShape, args.name) : undefined;
    const toApi = "inputShape" in args ? getToApiHandler(args.inputShape) : undefined;
    return (fromApi || toApi
        ? {
            utils: {
                ...(fromApi ? { fromApi } : {}),
                ...(toApi ? { toApi } : {}),
            },
        }
        : null);
}
