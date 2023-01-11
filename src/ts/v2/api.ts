import {
  objectToCamelCase,
  objectToSnakeCase,
  CamelCasedPropertiesDeep,
} from "@thinknimble/tn-utils";
import axios, { Axios, AxiosInstance } from "axios";
import { ZodType, z } from "zod";
import { parseResponse } from "./utils";

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

type BareApiService<
  TEntity extends ZodType,
  TCreate extends ZodType
  //extending from record makes it so that if you try to access anything it would not error, we want to actually error if there is no key in TCustomEndpoints that does not belong to it
> = {
  client: AxiosInstance;
  retrieve(id: string): Promise<z.infer<TEntity>>;
  create(inputs: z.infer<TCreate>): Promise<z.infer<TCreate>>;
};
type ApiService<
  TEntity extends ZodType,
  TCreate extends ZodType,
  //extending from record makes it so that if you try to access anything it would not error, we want to actually error if there is no key in TCustomEndpoints that does not belong to it
  TCustomEndpoints extends object
> = {
  client: AxiosInstance;
  retrieve(id: string): Promise<z.infer<TEntity>>;
  create(inputs: z.infer<TCreate>): Promise<z.infer<TCreate>>;
  customEndpoints: ExtractCamelCaseValue<TCustomEndpoints>;
};

type ApiBaseParams<
  TApiEntity extends ZodType,
  TApiCreate extends ZodType,
  TApiUpdate extends ZodType
> = {
  models: {
    entity: TApiEntity;
    create: TApiCreate;
    update: TApiUpdate;
  };
  endpoint: string;
  client: AxiosInstance;
};

export function createApi<
  TApiEntity extends ZodType,
  TApiCreate extends ZodType,
  TApiUpdate extends ZodType,
  TCustomEndpoints extends Record<string, CustomServiceCall>
>(
  base: ApiBaseParams<TApiEntity, TApiCreate, TApiUpdate>,
  customEndpoints: TCustomEndpoints
): ApiService<TApiEntity, TApiCreate, TCustomEndpoints>;

export function createApi<
  TApiEntity extends ZodType,
  TApiCreate extends ZodType,
  TApiUpdate extends ZodType
>(
  base: ApiBaseParams<TApiEntity, TApiCreate, TApiUpdate>
): BareApiService<TApiEntity, TApiCreate>;

export function createApi({ models, client, endpoint, ...rest }) {
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
  const modifiedCustomServiceCalls =
    "customEndpoints" in rest
      ? Object.fromEntries(
          Object.entries(
            rest.customEndpoints as Record<string, CustomServiceCall>
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
  if (!modifiedCustomServiceCalls) return { client, retrieve, create };
  return {
    client,
    retrieve,
    create,
    customEndpoints: modifiedCustomServiceCalls,
  };
}
