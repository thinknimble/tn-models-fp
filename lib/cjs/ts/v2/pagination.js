"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginatedZod = void 0;
const zod_1 = require("zod");
const getPaginatedZod = (zodRawShape) => zod_1.z.object({
    count: zod_1.z.number(),
    next: zod_1.z.string().nullable(),
    previous: zod_1.z.string().nullable(),
    results: zod_1.z.array(zod_1.z.object(zodRawShape)),
});
exports.getPaginatedZod = getPaginatedZod;
