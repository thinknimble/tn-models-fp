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
const getToApiHandler = (inputShape) => {
    const isInputZodPrimitive = inputShape instanceof zod_1.z.ZodSchema;
    // Given that this is under our control, we should not do safe parse, if the parsing fails means something is wrong (you're not complying with the schema you defined)
    return isInputZodPrimitive
        ? undefined
        : ((obj) => zod_1.z.object((0, exports.getSnakeCasedZodRawShape)(inputShape)).parse((0, tn_utils_1.objectToSnakeCase)(obj)));
};
const getFromApiHandler = (outputShape, callerName) => {
    const isOutputZodPrimitive = outputShape instanceof zod_1.z.ZodSchema;
    // since this checks for the api response, which we don't control, we can't strict parse, else we would break the flow. We'd rather safe parse and show a warning if there's a mismatch
    return isOutputZodPrimitive
        ? undefined
        : ((obj) => {
            var _a;
            return (0, response_1.parseResponse)({
                identifier: callerName,
                data: (_a = (0, tn_utils_1.objectToCamelCase)(obj)) !== null && _a !== void 0 ? _a : {},
                zod: zod_1.z.object(outputShape),
            });
        });
};
function createApiUtils(args) {
    if (!("inputShape" in args || "outputShape" in args))
        return {};
    const fromApi = "outputShape" in args ? getFromApiHandler(args.outputShape, args.name) : undefined;
    const toApi = "inputShape" in args ? getToApiHandler(args.inputShape) : undefined;
    return (fromApi || toApi
        ? {
            utils: Object.assign(Object.assign({}, (fromApi ? { fromApi } : {})), (toApi ? { toApi } : {})),
        }
        : null);
}
exports.createApiUtils = createApiUtils;
