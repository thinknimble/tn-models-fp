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
exports.createApi = void 0;
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
    .strict()
    .optional();
const filtersZod = zod_1.z
    .object({
    //TODO: add the ones that are always available on TN backend's for listing entities
    ordering: zod_1.z.string(),
})
    .partial()
    //prevent over passing values
    .strict()
    .optional();
const uuidZod = zod_1.z.string().uuid();
const getSnakeCasedZodRawShape = (zodShape) => {
    const unknownSnakeCasedZod = Object.fromEntries(Object.entries(zodShape).map(([k, v]) => {
        return [(0, tn_utils_1.toSnakeCase)(k), v];
    }));
    return unknownSnakeCasedZod;
};
const getPaginatedSnakeCasedZod = (zodShape) => {
    return (0, pagination_1.getPaginatedZod)(getSnakeCasedZodRawShape(zodShape));
};
//! doing overloads to improve UX is a bit of a double-edged sword here. We are risking the type safety within this method! We'd still get errors if we don't match the declared input-outputs from overloads so that's something.
function createApi({ models, client, endpoint }, customEndpoints = undefined) {
    const axiosClient = client;
    const createCustomServiceCallHandler = (serviceCall) => (inputs) => __awaiter(this, void 0, void 0, function* () {
        const snaked = typeof inputs !== "object" || !inputs ? inputs : (0, tn_utils_1.objectToSnakeCase)(inputs);
        const result = yield serviceCall(snaked);
        if (Array.isArray(result) || typeof result !== "object" || result === null)
            return result;
        return (0, tn_utils_1.objectToCamelCase)(result);
    });
    const modifiedCustomServiceCalls = customEndpoints
        ? Object.fromEntries(Object.entries(customEndpoints).map(([k, v]) => [
            k,
            createCustomServiceCallHandler(v),
        ]))
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
        return (0, tn_utils_1.objectToCamelCase)((0, utils_1.parseResponse)({
            uri: endpoint,
            data: res.data,
            zod: zod_1.z.object(snakedEntityShape),
        }));
    });
    const list = (params) => __awaiter(this, void 0, void 0, function* () {
        const filters = params ? params.filters : undefined;
        const pagination = params ? params.pagination : undefined;
        // Filters parsing, throws if the fields do not comply with the zod schema
        const allFilters = Object.assign(Object.assign({}, (filters !== null && filters !== void 0 ? filters : {})), (pagination ? { page: pagination.page, pageSize: pagination.size } : {}));
        const parsed = models.extraFilters
            ? zod_1.z.object(models.extraFilters).and(filtersZod).and(paginationFiltersZod).parse(allFilters)
            : filtersZod.and(paginationFiltersZod).parse(allFilters);
        const snaked = parsed ? (0, tn_utils_1.objectToSnakeCase)(parsed) : undefined;
        const snakedCleanParsed = snaked
            ? Object.fromEntries(Object.entries(snaked).flatMap(([k, v]) => {
                if (typeof v === "number")
                    return [[k, v.toString()]];
                if (!v)
                    return [];
                return [[k, v]];
            }))
            : undefined;
        const apiFilters = snakedCleanParsed ? new URLSearchParams(snakedCleanParsed) : undefined;
        const paginatedZod = getPaginatedSnakeCasedZod(models.entity);
        //TODO: check whether this needs the slash or we just append the params
        const res = yield axiosClient.get(`${endpoint}${apiFilters ? "/?" + apiFilters.toString() : "/"}`);
        const rawResponse = paginatedZod.parse(res);
        return Object.assign(Object.assign({}, rawResponse), { results: rawResponse.results.map((r) => (0, tn_utils_1.objectToCamelCase)(r)) });
    });
    const baseReturn = { client, retrieve, create, list };
    if (!modifiedCustomServiceCalls)
        return baseReturn;
    return Object.assign(Object.assign({}, baseReturn), { customEndpoints: modifiedCustomServiceCalls });
}
exports.createApi = createApi;
