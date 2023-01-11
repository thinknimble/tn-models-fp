"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApi = void 0;
const createApi = ({ model, client, endpoint, }) => {
    return {
        endpoint,
        client,
    };
};
exports.createApi = createApi;
