import { objectToCamelCase, objectToSnakeCase, toSnakeCase, } from "@thinknimble/tn-utils";
import { z } from "zod";
import { getPaginatedZod } from "./pagination";
import { parseResponse } from "./utils";
const paginationFiltersZod = z
    .object({
    page: z.number(),
    pageSize: z.number(),
})
    .partial()
    .optional();
const filtersZod = z
    .object({
    //TODO: (help wanted) add filter fields that are always available on TN backend's for listing entities -- Need Python guys here to chime in
    ordering: z.string(),
})
    .partial()
    .optional();
const uuidZod = z.string().uuid();
export function createCustomServiceCall(...args) {
    const [first, second] = args;
    if (typeof first === "function") {
        return { callback: first, inputShape: z.void(), outputShape: z.void() };
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
            outputShape: z.void(),
            callback: second,
        };
    }
    // only output
    return {
        inputShape: z.void(),
        outputShape: first.outputShape,
        callback: second,
    };
}
const getSnakeCasedZodRawShape = (zodShape) => {
    const unknownSnakeCasedZod = Object.fromEntries(Object.entries(zodShape).map(([k, v]) => {
        return [toSnakeCase(k), v];
    }));
    return unknownSnakeCasedZod;
};
export const getPaginatedSnakeCasedZod = (zodShape) => {
    return getPaginatedZod(getSnakeCasedZodRawShape(zodShape));
};
//! doing overloads to improve UX is a bit of a double-edged sword here. We are risking the type safety within this method! We'd still get errors if we don't match the declared input-outputs from overloads so that's something.
export function createApi({ models, client, endpoint }, customServiceCalls = undefined) {
    const axiosClient = client;
    const createCustomServiceCallHandler = (serviceCallOpts) => async (input) => {
        const isInputZod = serviceCallOpts.inputShape instanceof z.ZodSchema;
        const isOutputZod = serviceCallOpts.outputShape instanceof z.ZodSchema;
        const fromApi = (obj) => isOutputZod
            ? serviceCallOpts.outputShape.parse(obj)
            : z.object(serviceCallOpts.outputShape).parse(objectToCamelCase(obj));
        const toApi = (obj) => isInputZod
            ? serviceCallOpts.inputShape.parse(obj)
            : z.object(getSnakeCasedZodRawShape(serviceCallOpts.inputShape)).parse(objectToSnakeCase(obj));
        return serviceCallOpts.callback({ client, endpoint, input, utils: { fromApi, toApi } });
    };
    const modifiedCustomServiceCalls = customServiceCalls
        ? Object.fromEntries(Object.entries(customServiceCalls).map(([k, v]) => [k, createCustomServiceCallHandler(v)]))
        : undefined;
    const retrieve = async (id) => {
        if (uuidZod.safeParse(id).success) {
            console.warn("The passed id is not a valid UUID, check your input");
        }
        const uri = `${endpoint}/${id}`;
        const res = await axiosClient.get(uri);
        const parsed = parseResponse({
            uri,
            data: res.data,
            zod: z.object(getSnakeCasedZodRawShape(models.entity)),
        });
        return objectToCamelCase(parsed);
    };
    const create = async (inputs) => {
        const snaked = objectToSnakeCase(inputs);
        const res = await axiosClient.post(endpoint, snaked);
        const snakedEntityShape = getSnakeCasedZodRawShape(models.entity);
        const parsed = parseResponse({
            uri: endpoint,
            data: res.data,
            zod: z.object(snakedEntityShape),
        });
        return objectToCamelCase(parsed);
    };
    const list = async (params) => {
        const filters = params ? params.filters : undefined;
        const pagination = params ? params.pagination : undefined;
        // Filters parsing, throws if the fields do not comply with the zod schema
        const allFilters = {
            ...(filters ?? {}),
            ...(pagination ? { page: pagination.page, pageSize: pagination.size } : {}),
        };
        const filtersParsed = models.extraFilters
            ? z.object(models.extraFilters).partial().and(filtersZod).and(paginationFiltersZod).parse(allFilters)
            : filtersZod.and(paginationFiltersZod).parse(allFilters);
        const snakedFilters = filtersParsed ? objectToSnakeCase(filtersParsed) : undefined;
        const snakedCleanParsedFilters = snakedFilters
            ? Object.fromEntries(Object.entries(snakedFilters).flatMap(([k, v]) => {
                if (typeof v === "number")
                    return [[k, v.toString()]];
                if (!v)
                    return [];
                return [[k, v]];
            }))
            : undefined;
        const paginatedZod = getPaginatedSnakeCasedZod(models.entity);
        const res = await axiosClient.get(endpoint, {
            params: snakedCleanParsedFilters,
        });
        const rawResponse = paginatedZod.parse(res.data);
        return { ...rawResponse, results: rawResponse.results.map((r) => objectToCamelCase(r)) };
    };
    const baseReturn = { client, retrieve, create, list };
    if (!modifiedCustomServiceCalls)
        return baseReturn;
    return {
        ...baseReturn,
        customServiceCalls: modifiedCustomServiceCalls,
        csc: modifiedCustomServiceCalls,
    };
}
