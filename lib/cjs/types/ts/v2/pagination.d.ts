import { z } from "zod";
export declare const getPaginatedZod: <T extends z.ZodRawShape>(zodRawShape: T) => z.ZodObject<{
    count: z.ZodNumber;
    next: z.ZodNullable<z.ZodString>;
    previous: z.ZodNullable<z.ZodString>;
    results: z.ZodArray<z.ZodObject<T, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_output"]; }> extends infer T_1 ? { [k_1 in keyof T_1]: z.objectUtil.addQuestionMarks<{ [k in keyof T]: T[k]["_output"]; }>[k_1]; } : never, z.objectUtil.addQuestionMarks<{ [k_2_1 in keyof T]: T[k_2_1]["_input"]; }> extends infer T_2 ? { [k_3 in keyof T_2]: z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_input"]; }>[k_3]; } : never>, "many">;
}, "strip", z.ZodTypeAny, {
    next: string | null;
    previous: string | null;
    count: number;
    results: (z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_output"]; }> extends infer T_1 ? { [k_1 in keyof T_1]: z.objectUtil.addQuestionMarks<{ [k in keyof T]: T[k]["_output"]; }>[k_1]; } : never)[];
}, {
    next: string | null;
    previous: string | null;
    count: number;
    results: (z.objectUtil.addQuestionMarks<{ [k_2_1 in keyof T]: T[k_2_1]["_input"]; }> extends infer T_2 ? { [k_3 in keyof T_2]: z.objectUtil.addQuestionMarks<{ [k_2 in keyof T]: T[k_2]["_input"]; }>[k_3]; } : never)[];
}>;
//# sourceMappingURL=pagination.d.ts.map