"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiUtils = exports.getPaginatedSnakeCasedZod = exports.getSnakeCasedZodRawShape = void 0;
const tn_utils_1 = require("@thinknimble/tn-utils");
const zod_1 = require("zod");
const pagination_1 = require("./pagination");
const response_1 = require("./response");
const getSnakeCasedZodRawShape = (zodShape) => {
    // objectToSnakeCase would mess up zod internal fields, so we must do the case conversion only on the keys of the shape
    const unknownSnakeCasedZod = Object.fromEntries(Object.entries(zodShape).map(([k, v]) => {
        return [(0, tn_utils_1.toSnakeCase)(k), v];
    }));
    return unknownSnakeCasedZod;
};
exports.getSnakeCasedZodRawShape = getSnakeCasedZodRawShape;
const getPaginatedSnakeCasedZod = (zodShape) => {
    return (0, pagination_1.getPaginatedZod)((0, exports.getSnakeCasedZodRawShape)(zodShape));
};
exports.getPaginatedSnakeCasedZod = getPaginatedSnakeCasedZod;
const createApiUtils = ({ inputShape, outputShape, name, }) => {
    // we have to identify if we have a shape or a plain zod (only primitives are allowed). Primitive zods do not get util functions since they don't require response case transformation
    const isInputZodPrimitive = inputShape instanceof zod_1.z.ZodSchema;
    const isOutputZodPrimitive = outputShape instanceof zod_1.z.ZodSchema;
    // since this checks for the api response, which we don't control, we can't strict parse, else we would break the flow. We'd rather safe parse and show a warning if there's a mismatch
    const fromApi = isOutputZodPrimitive
        ? undefined
        : (obj) => {
            var _a;
            return (0, response_1.parseResponse)({
                identifier: name,
                data: (_a = (0, tn_utils_1.objectToCamelCase)(obj)) !== null && _a !== void 0 ? _a : {},
                zod: zod_1.z.object(outputShape),
            });
        };
    // Given that this is under our control, we should not do safe parse, if the parsing fails means something is wrong (you're not complying with the schema you defined)
    const toApi = isInputZodPrimitive
        ? undefined
        : (obj) => zod_1.z.object((0, exports.getSnakeCasedZodRawShape)(inputShape)).parse((0, tn_utils_1.objectToSnakeCase)(obj));
    // avoid leaking the wrong fields to our callback (we already protect this through ts but it does not hurt to prevent it at runtime as well)
    return fromApi || toApi
        ? {
            utils: Object.assign(Object.assign({}, (fromApi ? { fromApi } : {})), (toApi ? { toApi } : {})),
        }
        : {};
};
exports.createApiUtils = createApiUtils;
