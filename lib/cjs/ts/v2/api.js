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
const axios_1 = require("axios");
const zod_1 = require("zod");
const utils_1 = require("./utils");
const filtersZod = zod_1.z
    .object({
    //TODO: add the ones that are always available on TN backend's for listing entities
    page: zod_1.z.number(),
    pageSize: zod_1.z.number(),
    ordering: zod_1.z.string(),
})
    .partial()
    //prevent over passing values
    .strict()
    .optional();
const uuidZod = zod_1.z.string().uuid();
const getPaginatedZod = (zod) => zod_1.z.object({
    count: zod_1.z.number(),
    next: zod_1.z.string().nullable(),
    previous: zod_1.z.string().nullable(),
    results: zod_1.z.array(zod),
});
function createApi({ models, client, endpoint }, customEndpoints = undefined) {
    if (!(client instanceof axios_1.Axios)) {
        throw new Error("Need to provide an axios instance to create an api handler");
    }
    const createCustomServiceCallHandler = (serviceCall) => (inputs) => __awaiter(this, void 0, void 0, function* () {
        const snaked = typeof inputs !== "object" || !inputs
            ? inputs
            : (0, tn_utils_1.objectToSnakeCase)(inputs);
        const result = yield serviceCall(snaked);
        if (typeof result !== "object" || result === null)
            return result;
        return (0, tn_utils_1.objectToCamelCase)(result);
    });
    const modifiedCustomServiceCalls = customEndpoints
        ? Object.fromEntries(Object.entries(customEndpoints).map(([k, v]) => [k, createCustomServiceCallHandler(v)]))
        : undefined;
    const retrieve = (id) => __awaiter(this, void 0, void 0, function* () {
        if (uuidZod.safeParse(id).success) {
            console.warn("The passed id is not a valid UUID, check your input");
        }
        const uri = `${endpoint}/${id}`;
        const res = yield client.get(uri);
        const parsed = (0, utils_1.parseResponse)({
            uri,
            data: res.data,
            zod: models.entity,
        });
        return (0, tn_utils_1.objectToCamelCase)(parsed);
    });
    const create = (inputs) => __awaiter(this, void 0, void 0, function* () {
        const snaked = (0, tn_utils_1.objectToSnakeCase)(inputs);
        const res = yield client.post(snaked);
        return (0, tn_utils_1.objectToCamelCase)((0, utils_1.parseResponse)({
            uri: endpoint,
            data: res.data,
            zod: models.entity,
        }));
    });
    const list = (filters) => __awaiter(this, void 0, void 0, function* () {
        //throws if the fields do not comply with the zod schema
        const parsed = models.extraFilters
            ? models.extraFilters.and(filtersZod).parse(filters)
            : filtersZod.parse(filters);
        const paginatedZod = getPaginatedZod(models.entity);
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
        const apiFilters = snakedCleanParsed
            ? new URLSearchParams(snakedCleanParsed)
            : undefined;
        //TODO: check whether this needs the slash or we just append the params
        const res = yield client.get(`${endpoint}${apiFilters ? "/?" + apiFilters.toString() : ""}`);
        return paginatedZod.parse(res);
    });
    const baseReturn = { client, retrieve, create, list };
    if (!modifiedCustomServiceCalls)
        return baseReturn;
    return Object.assign(Object.assign({}, baseReturn), { customEndpoints: modifiedCustomServiceCalls });
}
exports.createApi = createApi;
