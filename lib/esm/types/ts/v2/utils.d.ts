import { SnakeCase, SnakeCasedPropertiesDeep } from "@thinknimble/tn-utils";
import { z } from "zod";
/**
 * Get the resulting inferred type from a zod shape
 */
export declare type GetZodInferredTypeFromRaw<T extends z.ZodRawShape> = z.infer<ReturnType<typeof z.object<T>>>;
declare type ZodRawShapeSnakeCased<T extends z.ZodRawShape> = {
    [TKey in keyof T as SnakeCase<TKey>]: T[TKey];
};
export declare type ToApiCall<TInput extends z.ZodRawShape | z.ZodTypeAny> = (obj: object) => TInput extends z.ZodRawShape ? SnakeCasedPropertiesDeep<GetZodInferredTypeFromRaw<TInput>> : TInput extends z.ZodTypeAny ? z.infer<TInput> : never;
export declare type FromApiCall<TOutput extends z.ZodRawShape | z.ZodTypeAny> = (obj: object) => TOutput extends z.ZodRawShape ? GetZodInferredTypeFromRaw<TOutput> : TOutput extends z.ZodTypeAny ? z.infer<TOutput> : never;
export declare const getSnakeCasedZodRawShape: <T extends z.ZodRawShape>(zodShape: T) => ZodRawShapeSnakeCased<T>;
export declare const getPaginatedSnakeCasedZod: <T extends z.ZodRawShape>(zodShape: T) => z.ZodObject<{
    count: z.ZodNumber;
    next: z.ZodNullable<z.ZodString>;
    previous: z.ZodNullable<z.ZodString>;
    results: z.ZodArray<z.ZodObject<ZodRawShapeSnakeCased<T>, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<ZodRawShapeSnakeCased<T> extends infer T_3 extends z.ZodRawShape ? { [k_2 in keyof T_3]: ZodRawShapeSnakeCased<T>[k_2]["_output"]; } : never> extends infer T_1 ? { [k_1 in keyof T_1]: z.objectUtil.addQuestionMarks<ZodRawShapeSnakeCased<T> extends infer T_2 extends z.ZodRawShape ? { [k in keyof T_2]: ZodRawShapeSnakeCased<T>[k]["_output"]; } : never>[k_1]; } : never, z.objectUtil.addQuestionMarks<ZodRawShapeSnakeCased<T> extends infer T_6 extends z.ZodRawShape ? { [k_2_1 in keyof T_6]: ZodRawShapeSnakeCased<T>[k_2_1]["_input"]; } : never> extends infer T_4 ? { [k_3 in keyof T_4]: z.objectUtil.addQuestionMarks<ZodRawShapeSnakeCased<T> extends infer T_5 extends z.ZodRawShape ? { [k_2 in keyof T_5]: ZodRawShapeSnakeCased<T>[k_2]["_input"]; } : never>[k_3]; } : never>, "many">;
}, "strip", z.ZodTypeAny, {
    next: string | null;
    previous: string | null;
    count: number;
    results: (z.objectUtil.addQuestionMarks<ZodRawShapeSnakeCased<T> extends infer T_3 extends z.ZodRawShape ? { [k_2 in keyof T_3]: ZodRawShapeSnakeCased<T>[k_2]["_output"]; } : never> extends infer T_1 ? { [k_1 in keyof T_1]: z.objectUtil.addQuestionMarks<ZodRawShapeSnakeCased<T> extends infer T_2 extends z.ZodRawShape ? { [k in keyof T_2]: ZodRawShapeSnakeCased<T>[k]["_output"]; } : never>[k_1]; } : never)[];
}, {
    next: string | null;
    previous: string | null;
    count: number;
    results: (z.objectUtil.addQuestionMarks<ZodRawShapeSnakeCased<T> extends infer T_6 extends z.ZodRawShape ? { [k_2_1 in keyof T_6]: ZodRawShapeSnakeCased<T>[k_2_1]["_input"]; } : never> extends infer T_4 ? { [k_3 in keyof T_4]: z.objectUtil.addQuestionMarks<ZodRawShapeSnakeCased<T> extends infer T_5 extends z.ZodRawShape ? { [k_2 in keyof T_5]: ZodRawShapeSnakeCased<T>[k_2]["_input"]; } : never>[k_3]; } : never)[];
}>;
export declare const createApiUtils: <TInput extends z.ZodRawShape | z.ZodTypeAny, TOutput extends z.ZodRawShape | z.ZodTypeAny>({ inputShape, outputShape, name, }: {
    inputShape: TInput;
    outputShape: TOutput;
    name: string;
}) => {
    utils: {
        toApi?: ((obj: object) => {
            [x: string]: any;
        }) | undefined;
        fromApi?: FromApiCall<TOutput> | undefined;
    };
} | {
    utils?: undefined;
};
export {};
//# sourceMappingURL=utils.d.ts.map