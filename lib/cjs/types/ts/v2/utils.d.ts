import { SnakeCase, SnakeCasedPropertiesDeep } from "@thinknimble/tn-utils";
import { z } from "zod";
export declare type ZodPrimitives = z.ZodString | z.ZodNumber | z.ZodDate | z.ZodBigInt | z.ZodBoolean | z.ZodUndefined | z.ZodVoid;
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
declare type FromApiUtil<T extends z.ZodRawShape | ZodPrimitives> = {
    /**
     * Given an object, parses the response based on outputShape, it turns the result keys into camelCase. It also shows a warning if the outputShape does not match the passed object
     */
    fromApi: FromApiCall<T>;
};
declare type ToApiUtil<T extends z.ZodRawShape | ZodPrimitives> = {
    /**
     * Given an object, parses the input and turns its keys into snake_case
     */
    toApi: ToApiCall<T>;
};
export declare type CallbackUtils<TInput extends z.ZodRawShape | ZodPrimitives, TOutput extends z.ZodRawShape | ZodPrimitives, TInputIsPrimitive extends boolean = TInput extends ZodPrimitives ? true : false, TOutputIsPrimitive extends boolean = TOutput extends ZodPrimitives ? true : false> = TInput extends z.ZodVoid ? TOutput extends z.ZodVoid ? unknown : TOutputIsPrimitive extends true ? unknown : {
    utils: FromApiUtil<TOutput>;
} : TOutput extends z.ZodVoid ? TInputIsPrimitive extends true ? unknown : {
    utils: ToApiUtil<TInput>;
} : (TInputIsPrimitive extends true ? unknown : {
    utils: ToApiUtil<TInput>;
}) & (TOutputIsPrimitive extends true ? unknown : {
    utils: FromApiUtil<TOutput>;
});
export declare function createApiUtils<TInput extends z.ZodRawShape | ZodPrimitives, TOutput extends z.ZodRawShape | ZodPrimitives>(args: {
    name: string;
} & ({
    inputShape: TInput;
    outputShape: TOutput;
} | {
    inputShape: TInput;
} | {
    outputShape: TOutput;
})): CallbackUtils<TInput, TOutput, TInput extends ZodPrimitives ? true : false, TOutput extends ZodPrimitives ? true : false>;
export {};
//# sourceMappingURL=utils.d.ts.map