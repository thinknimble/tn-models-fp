import { objectToCamelCase, objectToSnakeCase } from "@thinknimble/tn-utils";
import { z } from "zod";
import { parseResponse } from "./response";
import { createApiUtils } from "./utils";
import { getPaginatedSnakeCasedZod, getSnakeCasedZodRawShape } from "./utils";
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
export function createApi({ models, client, endpoint, }, customServiceCalls = undefined) {
    const createCustomServiceCallHandler = (serviceCallOpts, 
    /**
     * This name allow us to keep record of which method it is, so that we can identify in case of output mismatch
     */
    name) => async (input) => {
        const utilsResult = createApiUtils({
            name,
            inputShape: serviceCallOpts.inputShape,
            outputShape: serviceCallOpts.outputShape,
        });
        const inputResult = input ? { input } : {};
        return serviceCallOpts.callback({
            client,
            endpoint,
            ...inputResult,
            ...utilsResult,
        });
    };
    const modifiedCustomServiceCalls = customServiceCalls
        ? Object.fromEntries(Object.entries(customServiceCalls).map(([k, v]) => [k, createCustomServiceCallHandler(v, k)]))
        : undefined;
    const retrieve = async (id) => {
        //TODO: should we allow the user to set their own id zod schema?
        if (!uuidZod.safeParse(id).success) {
            console.warn("The passed id is not a valid UUID, check your input");
        }
        const uri = `${endpoint}/${id}`;
        const res = await client.get(uri);
        const parsed = parseResponse({
            identifier: `${retrieve.name} ${uri}`,
            data: res.data,
            zod: z.object(getSnakeCasedZodRawShape(models.entity)),
        });
        return objectToCamelCase(parsed);
    };
    const create = async (inputs) => {
        const snaked = objectToSnakeCase(inputs);
        const res = await client.post(endpoint, snaked);
        const snakedEntityShape = getSnakeCasedZodRawShape(models.entity);
        const parsed = parseResponse({
            identifier: `${create.name} ${endpoint}`,
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
        const res = await client.get(endpoint, {
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
