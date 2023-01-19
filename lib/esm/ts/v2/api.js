import { objectToCamelCase, objectToSnakeCase, toSnakeCase, } from "@thinknimble/tn-utils";
import { z } from "zod";
import { parseResponse } from "./utils";
const filtersZod = z
    .object({
    //TODO: add the ones that are always available on TN backend's for listing entities
    page: z.number(),
    pageSize: z.number(),
    ordering: z.string(),
})
    .partial()
    //prevent over passing values
    .strict()
    .optional();
const uuidZod = z.string().uuid();
const getSnakeCasedZodRawShape = (zodShape) => {
    const unknownSnakeCasedZod = Object.fromEntries(Object.entries(zodShape).map(([k, v]) => {
        return [toSnakeCase(k), v];
    }));
    return unknownSnakeCasedZod;
};
const getPaginatedZod = (zod) => z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(z.object(zod)),
});
const getPaginatedSnakeCasedZod = (zodShape) => {
    return getPaginatedZod(getSnakeCasedZodRawShape(zodShape));
};
//! doing overloads to improve UX is a bit of a double-edged sword here. We are risking the type safety within this method! We'd still get errors if we don't match the declared input-outputs from overloads so that's something.
export function createApi({ models, client, endpoint }, customEndpoints = undefined) {
    const axiosClient = client;
    const createCustomServiceCallHandler = (serviceCall) => async (inputs) => {
        const snaked = typeof inputs !== "object" || !inputs ? inputs : objectToSnakeCase(inputs);
        const result = await serviceCall(snaked);
        if (Array.isArray(result) || typeof result !== "object" || result === null)
            return result;
        return objectToCamelCase(result);
    };
    const modifiedCustomServiceCalls = customEndpoints
        ? Object.fromEntries(Object.entries(customEndpoints).map(([k, v]) => [
            k,
            createCustomServiceCallHandler(v),
        ]))
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
        return objectToCamelCase(parseResponse({
            uri: endpoint,
            data: res.data,
            zod: z.object(snakedEntityShape),
        }));
    };
    const list = async (filters) => {
        // Filters parsing, throws if the fields do not comply with the zod schema
        const parsed = models.extraFilters
            ? z.object(models.extraFilters).and(filtersZod).parse(filters)
            : filtersZod.parse(filters);
        const snaked = parsed ? objectToSnakeCase(parsed) : undefined;
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
        const res = await axiosClient.get(`${endpoint}${apiFilters ? "/?" + apiFilters.toString() : "/"}`);
        const rawResponse = paginatedZod.parse(res);
        return { ...rawResponse, results: rawResponse.results.map((r) => objectToCamelCase(r)) };
    };
    const baseReturn = { client, retrieve, create, list };
    if (!modifiedCustomServiceCalls)
        return baseReturn;
    return {
        ...baseReturn,
        customEndpoints: modifiedCustomServiceCalls,
    };
}
