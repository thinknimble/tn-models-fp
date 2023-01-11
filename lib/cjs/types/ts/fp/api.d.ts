import { ZodType } from "zod";
export declare const createApi: <T extends ZodType<any, import("zod").ZodTypeDef, any>>({ model, client, endpoint, }: {
    model: T;
    endpoint: string;
    client: any;
}) => {
    endpoint: string;
    client: any;
};
//# sourceMappingURL=api.d.ts.map