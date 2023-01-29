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
    const axiosClient = client;
    const createCustomServiceCallHandler = (serviceCallOpts) => (input) => __awaiter(this, void 0, void 0, function* () {
        const isInputZod = serviceCallOpts.inputShape instanceof zod_1.z.ZodSchema;
        const isOutputZod = serviceCallOpts.outputShape instanceof zod_1.z.ZodSchema;
        const fromApi = (obj) => isOutputZod
            ? serviceCallOpts.outputShape.parse(obj)
            : zod_1.z.object(serviceCallOpts.outputShape).parse((0, tn_utils_1.objectToCamelCase)(obj));
        const toApi = (obj) => isInputZod
            ? serviceCallOpts.inputShape.parse(obj)
            : zod_1.z.object(getSnakeCasedZodRawShape(serviceCallOpts.inputShape)).parse((0, tn_utils_1.objectToSnakeCase)(obj));
        return serviceCallOpts.callback({
            client,
            endpoint,
            input,
            utils: { fromApi, toApi },
        });
    });
    const modifiedCustomServiceCalls = customServiceCalls
        ? Object.fromEntries(Object.entries(customServiceCalls).map(([k, v]) => [k, createCustomServiceCallHandler(v)]))
        : undefined;
    const retrieve = (id) => __awaiter(this, void 0, void 0, function* () {
        if (uuidZod.safeParse(id).success) {
            console.warn("The passed id is not a valid UUID, check your input");
        }
        const uri = `${endpoint}/${id}`;
        const res = yield axiosClient.get(uri);
        const parsed = (0, utils_1.parseResponse)({
            uri,
            data: res.data,
            zod: zod_1.z.object(getSnakeCasedZodRawShape(models.entity)),
        });
        return (0, tn_utils_1.objectToCamelCase)(parsed);
    });
    const create = (inputs) => __awaiter(this, void 0, void 0, function* () {
        const snaked = (0, tn_utils_1.objectToSnakeCase)(inputs);
        const res = yield axiosClient.post(endpoint, snaked);
        const snakedEntityShape = getSnakeCasedZodRawShape(models.entity);
        const parsed = (0, utils_1.parseResponse)({
            uri: endpoint,
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
        const res = yield axiosClient.get(endpoint, {
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
