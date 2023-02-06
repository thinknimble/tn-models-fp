"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApi = exports.getPaginatedSnakeCasedZod = exports.createCustomServiceCall = void 0;
const tn_utils_1 = require("@thinknimble/tn-utils");
const zod_1 = require("zod");
const pagination_1 = require("./pagination");
const utils_1 = require("./utils");
const paginationFiltersZod = zod_1.z
    .object({
    page: zod_1.z.number(),
    pageSize: zod_1.z.number(),
})
    .partial()
    .optional();
const filtersZod = zod_1.z
    .object({
    //TODO: (help wanted) add filter fields that are always available on TN backend's for listing entities -- Need Python guys here to chime in
    ordering: zod_1.z.string(),
})
    .partial()
    .optional();
const uuidZod = zod_1.z.string().uuid();
function createCustomServiceCall(...args) {
    const [first, second] = args;
    if (typeof first === "function") {
        return { callback: first, inputShape: zod_1.z.void(), outputShape: zod_1.z.void() };
    }
    if ("inputShape" in first && "outputShape" in first) {
        return {
            inputShape: first.inputShape,
            outputShape: first.outputShape,
            callback: second,
        };
    }
    if ("inputShape" in first) {
        return {
            inputShape: first.inputShape,
            outputShape: zod_1.z.void(),
            callback: second,
        };
    }
    // only output
    return {
        inputShape: zod_1.z.void(),
        outputShape: first.outputShape,
        callback: second,
    };
}
exports.createCustomServiceCall = createCustomServiceCall;
const getSnakeCasedZodRawShape = (zodShape) => {
    // objectToSnakeCase would mess up zod internal fields, so we must do the case conversion only on the keys of the shape
    const unknownSnakeCasedZod = Object.fromEntries(Object.entries(zodShape).map(([k, v]) => {
        return [(0, tn_utils_1.toSnakeCase)(k), v];
    }));
    return unknownSnakeCasedZod;
};
const getPaginatedSnakeCasedZod = (zodShape) => {
    return (0, pagination_1.getPaginatedZod)(getSnakeCasedZodRawShape(zodShape));
};
exports.getPaginatedSnakeCasedZod = getPaginatedSnakeCasedZod;
function createApi({ models, client, endpoint, }, customServiceCalls = undefined) {
    const createCustomServiceCallHandler = (serviceCallOpts, 
    /**
     * This name allow us to keep record of which method it is, so that we can identify in case of output mismatch
     */
    name) => (input) => __awaiter(this, void 0, void 0, function* () {
        // we have to identify if we have a shape or a plain zod (only primitives are allowed). Primitive zods do not get util functions since they don't require response case transformation
        const isInputZodPrimitive = serviceCallOpts.inputShape instanceof zod_1.z.ZodSchema;
        const isOutputZodPrimitive = serviceCallOpts.outputShape instanceof zod_1.z.ZodSchema;
        // since this checks for the api response, which we don't control, we can't strict parse, else we would break the flow. We'd rather safe parse and show a warning if there's a mismatch
        const fromApi = isOutputZodPrimitive
            ? undefined
            : (obj) => {
                var _a;
                return (0, utils_1.parseResponse)({
                    identifier: name,
                    data: (_a = (0, tn_utils_1.objectToCamelCase)(obj)) !== null && _a !== void 0 ? _a : {},
                    zod: zod_1.z.object(serviceCallOpts.outputShape),
                });
            };
        // Given that this is under our control, we should not do safe parse, if the parsing fails means something is wrong (you're not complying with the schema you defined)
        const toApi = isInputZodPrimitive
            ? undefined
            : (obj) => zod_1.z.object(getSnakeCasedZodRawShape(serviceCallOpts.inputShape)).parse((0, tn_utils_1.objectToSnakeCase)(obj));
        // avoid leaking the wrong fields to our callback (we already protect this through ts but it does not hurt to prevent it at runtime as well)
        const utilsResult = fromApi || toApi
            ? {
                utils: Object.assign(Object.assign({}, (fromApi ? { fromApi } : {})), (toApi ? { toApi } : {})),
            }
            : {};
        const inputResult = input ? { input } : {};
        return serviceCallOpts.callback(Object.assign(Object.assign({ client,
            endpoint }, inputResult), utilsResult));
    });
    const modifiedCustomServiceCalls = customServiceCalls
        ? Object.fromEntries(Object.entries(customServiceCalls).map(([k, v]) => [k, createCustomServiceCallHandler(v, k)]))
        : undefined;
    const retrieve = (id) => __awaiter(this, void 0, void 0, function* () {
        //TODO: should we allow the user to set their own id zod schema?
        if (!uuidZod.safeParse(id).success) {
            console.warn("The passed id is not a valid UUID, check your input");
        }
        const uri = `${endpoint}/${id}`;
        const res = yield client.get(uri);
        const parsed = (0, utils_1.parseResponse)({
            identifier: `${retrieve.name} ${uri}`,
            data: res.data,
            zod: zod_1.z.object(getSnakeCasedZodRawShape(models.entity)),
        });
        return (0, tn_utils_1.objectToCamelCase)(parsed);
    });
    const create = (inputs) => __awaiter(this, void 0, void 0, function* () {
        const snaked = (0, tn_utils_1.objectToSnakeCase)(inputs);
        const res = yield client.post(endpoint, snaked);
        const snakedEntityShape = getSnakeCasedZodRawShape(models.entity);
        const parsed = (0, utils_1.parseResponse)({
            identifier: `${create.name} ${endpoint}`,
            data: res.data,
            zod: zod_1.z.object(snakedEntityShape),
        });
        return (0, tn_utils_1.objectToCamelCase)(parsed);
    });
    const list = (params) => __awaiter(this, void 0, void 0, function* () {
        const filters = params ? params.filters : undefined;
        const pagination = params ? params.pagination : undefined;
        // Filters parsing, throws if the fields do not comply with the zod schema
        const allFilters = Object.assign(Object.assign({}, (filters !== null && filters !== void 0 ? filters : {})), (pagination ? { page: pagination.page, pageSize: pagination.size } : {}));
        const filtersParsed = models.extraFilters
            ? zod_1.z.object(models.extraFilters).partial().and(filtersZod).and(paginationFiltersZod).parse(allFilters)
            : filtersZod.and(paginationFiltersZod).parse(allFilters);
        const snakedFilters = filtersParsed ? (0, tn_utils_1.objectToSnakeCase)(filtersParsed) : undefined;
        const snakedCleanParsedFilters = snakedFilters
            ? Object.fromEntries(Object.entries(snakedFilters).flatMap(([k, v]) => {
                if (typeof v === "number")
                    return [[k, v.toString()]];
                if (!v)
                    return [];
                return [[k, v]];
            }))
            : undefined;
        const paginatedZod = (0, exports.getPaginatedSnakeCasedZod)(models.entity);
        const res = yield client.get(endpoint, {
            params: snakedCleanParsedFilters,
        });
        const rawResponse = paginatedZod.parse(res.data);
        return Object.assign(Object.assign({}, rawResponse), { results: rawResponse.results.map((r) => (0, tn_utils_1.objectToCamelCase)(r)) });
    });
    const baseReturn = { client, retrieve, create, list };
    if (!modifiedCustomServiceCalls)
        return baseReturn;
    return Object.assign(Object.assign({}, baseReturn), { customServiceCalls: modifiedCustomServiceCalls, csc: modifiedCustomServiceCalls });
}
exports.createApi = createApi;
