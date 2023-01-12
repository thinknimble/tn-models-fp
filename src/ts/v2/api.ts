import {
  objectToCamelCase,
  objectToSnakeCase,
  CamelCasedPropertiesDeep,
} from "@thinknimble/tn-utils";
import axios, { Axios, AxiosInstance } from "axios";
import { ZodType, z, ZodAny } from "zod";
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

export type CustomServiceCall = (inputs: any) => Promise<unknown>;

type ExtractCamelCaseValue<T extends object> = T extends undefined
  ? never
  : {
      [TKey in keyof T]: T[TKey] extends (
        input: infer TInput
      ) => Promise<infer TResult>
        ? (input: TInput) => Promise<CamelCasedPropertiesDeep<TResult>>
        : never;
    };

const getPaginatedZod = <T extends ZodType>(zod: T) =>
  z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(zod),
  });

type BareApiService<
  TEntity extends ZodType,
  TCreate extends ZodType,
  TExtraFilters extends ZodType = ZodAny
> = {
  client: AxiosInstance;
  retrieve(id: string): Promise<z.infer<TEntity>>;
  create(inputs: z.infer<TCreate>): Promise<z.infer<TCreate>>;
  list(
    filters: TExtraFilters extends ZodAny
      ? z.infer<typeof filtersZod>
      : z.infer<TExtraFilters> & z.infer<typeof filtersZod>
  ): Promise<z.infer<ReturnType<typeof getPaginatedZod<TEntity>>>>;
};
type ApiService<
  TEntity extends ZodType,
  TCreate extends ZodType,
  //extending from record makes it so that if you try to access anything it would not error, we want to actually error if there is no key in TCustomEndpoints that does not belong to it
  TCustomEndpoints extends object,
  TExtraFilters extends ZodType = ZodAny
> = BareApiService<TEntity, TCreate, TExtraFilters> & {
  customEndpoints: ExtractCamelCaseValue<TCustomEndpoints>;
};

type ApiBaseParams<
  TApiEntity extends ZodType,
  TApiCreate extends ZodType,
  TApiUpdate extends ZodType,
  TExtraFilters extends ZodType = ZodAny
> = {
  models: {
    entity: TApiEntity;
    create: TApiCreate;
    update: TApiUpdate;
    extraFilters?: TExtraFilters;
  };
  endpoint: string;
  client: AxiosInstance;
};

export function createApi<
  TApiEntity extends ZodType,
  TApiCreate extends ZodType,
  TApiUpdate extends ZodType,
  TCustomEndpoints extends Record<string, CustomServiceCall>,
  TExtraFilters extends ZodType = ZodAny
>(
  base: ApiBaseParams<TApiEntity, TApiCreate, TApiUpdate, TExtraFilters>,
  customEndpoints: TCustomEndpoints
): ApiService<TApiEntity, TApiCreate, TCustomEndpoints, TExtraFilters>;

export function createApi<
  TApiEntity extends ZodType,
  TApiCreate extends ZodType,
  TApiUpdate extends ZodType,
  TExtraFilters extends ZodType = ZodAny
>(
  base: ApiBaseParams<TApiEntity, TApiCreate, TApiUpdate, TExtraFilters>
): BareApiService<TApiEntity, TApiCreate, TExtraFilters>;

export function createApi(
  { models, client, endpoint },
  customEndpoints = undefined
) {
  if (!(client instanceof Axios)) {
    throw new Error(
      "Need to provide an axios instance to create an api handler"
    );
  }
  const createCustomServiceCallHandler =
    (serviceCall: CustomServiceCall) => async (inputs: unknown) => {
      const snaked =
        typeof inputs !== "object" || !inputs
          ? inputs
          : objectToSnakeCase(inputs);
      const result = await serviceCall(snaked);
      if (typeof result !== "object" || result === null) return result;
      return objectToCamelCase(result);
    };

  const modifiedCustomServiceCalls = customEndpoints
    ? Object.fromEntries(
        Object.entries(
          customEndpoints as Record<string, CustomServiceCall>
        ).map(([k, v]) => [k, createCustomServiceCallHandler(v)])
      )
    : undefined;

  const retrieve = async (id: string) => {
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
    return objectToCamelCase(
      parseResponse({
        uri: endpoint,
        data: res.data,
        zod: models.entity,
      })
    );
  };

  const list = async (filters) => {
    //throws if the fields do not comply with the zod schema
    const parsed = models.extraFilters
      ? models.extraFilters.and(filtersZod).parse(filters)
      : filtersZod.parse(filters);
    const paginatedZod = getPaginatedZod(models.entity);
    const snaked = parsed ? objectToSnakeCase(parsed) : undefined;
    const snakedCleanParsed = snaked
      ? Object.fromEntries(
          Object.entries(snaked).flatMap(([k, v]) => {
            if (typeof v === "number") return [[k, v.toString()]];
            if (!v) return [];
            return [[k, v]];
          })
        )
      : undefined;
    const apiFilters = snakedCleanParsed
      ? new URLSearchParams(snakedCleanParsed as any)
      : undefined;
    //TODO: check whether this needs the slash or we just append the params
    const res = await client.get(
      `${endpoint}${apiFilters ? "/?" + apiFilters.toString() : ""}`
    );
    return paginatedZod.parse(res);
  };

  const baseReturn = { client, retrieve, create, list };

  if (!modifiedCustomServiceCalls) return baseReturn;

  return {
    ...baseReturn,
    customEndpoints: modifiedCustomServiceCalls,
  };
}
