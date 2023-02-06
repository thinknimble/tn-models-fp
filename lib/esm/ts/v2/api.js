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
    // objectToSnakeCase would mess up zod internal fields, so we must do the case conversion only on the keys of the shape
    const unknownSnakeCasedZod = Object.fromEntries(Object.entries(zodShape).map(([k, v]) => {
        return [toSnakeCase(k), v];
    }));
    return unknownSnakeCasedZod;
};
export const getPaginatedSnakeCasedZod = (zodShape) => {
    return getPaginatedZod(getSnakeCasedZodRawShape(zodShape));
};
export function createApi({ models, client, endpoint, }, customServiceCalls = undefined) {
    const createCustomServiceCallHandler = (serviceCallOpts, 
    /**
     * This name allow us to keep record of which method it is, so that we can identify in case of output mismatch
     */
    name) => async (input) => {
        // we have to identify if we have a shape or a plain zod (only primitives are allowed). Primitive zods do not get util functions since they don't require response case transformation
        const isInputZodPrimitive = serviceCallOpts.inputShape instanceof z.ZodSchema;
        const isOutputZodPrimitive = serviceCallOpts.outputShape instanceof z.ZodSchema;
        // since this checks for the api response, which we don't control, we can't strict parse, else we would break the flow. We'd rather safe parse and show a warning if there's a mismatch
        const fromApi = isOutputZodPrimitive
            ? undefined
            : (obj) => parseResponse({
                identifier: name,
                data: objectToCamelCase(obj) ?? {},
                zod: z.object(serviceCallOpts.outputShape),
            });
        // Given that this is under our control, we should not do safe parse, if the parsing fails means something is wrong (you're not complying with the schema you defined)
        const toApi = isInputZodPrimitive
            ? undefined
            : (obj) => z.object(getSnakeCasedZodRawShape(serviceCallOpts.inputShape)).parse(objectToSnakeCase(obj));
        // avoid leaking the wrong fields to our callback (we already protect this through ts but it does not hurt to prevent it at runtime as well)
        const utilsResult = fromApi || toApi
            ? {
                utils: {
                    ...(fromApi ? { fromApi } : {}),
                    ...(toApi ? { toApi } : {}),
                },
            }
            : {};
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
