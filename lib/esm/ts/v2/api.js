import { objectToCamelCase, objectToSnakeCase } from "@thinknimble/tn-utils";
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
const getPaginatedZod = (zod) => z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(zod),
});
export function createApi({ models, client, endpoint }, customEndpoints = undefined) {
    const createCustomServiceCallHandler = (serviceCall) => async (inputs) => {
        const snaked = typeof inputs !== "object" || !inputs ? inputs : objectToSnakeCase(inputs);
        const result = await serviceCall(snaked);
        if (typeof result !== "object" || result === null)
            return result;
        //TODO: what if result is array of objects? This does some isObject logic which leaves out arrays.
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
        const res = await client.get(uri);
        const parsed = parseResponse({
            uri,
            data: res.data,
            zod: models.entity,
        });
        return objectToCamelCase(parsed);
    };
    const create = async (inputs) => {
        const snaked = objectToSnakeCase(inputs);
        const res = await client.post(snaked);
        return objectToCamelCase(parseResponse({
            uri: endpoint,
            data: res.data,
            zod: models.entity,
        }));
    };
    const list = async (filters) => {
        //throws if the fields do not comply with the zod schema
        const parsed = models.extraFilters ? models.extraFilters.and(filtersZod).parse(filters) : filtersZod.parse(filters);
        const paginatedZod = getPaginatedZod(models.entity);
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
        //TODO: check whether this needs the slash or we just append the params
        const res = await client.get(`${endpoint}${apiFilters ? "/?" + apiFilters.toString() : ""}`);
        return paginatedZod.parse(res);
    };
    const baseReturn = { client, retrieve, create, list };
    if (!modifiedCustomServiceCalls)
        return baseReturn;
    return {
        ...baseReturn,
        customEndpoints: modifiedCustomServiceCalls,
    };
}
