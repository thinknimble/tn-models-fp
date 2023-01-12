"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fields = exports.PaginationDefaults = exports.Pagination = exports.ModelField = exports.ArrayField = exports.IntegerField = exports.IdField = exports.Field = exports.CharField = exports.BooleanField = exports.CollectionManager = exports.ApiFilter = exports.ModelAPI = exports.createApi = void 0;
const api_1 = __importDefault(require("./ts/api"));
exports.ModelAPI = api_1.default;
const apiFilter_1 = __importDefault(require("./ts/apiFilter"));
exports.ApiFilter = apiFilter_1.default;
const collectionManager_1 = __importDefault(require("./ts/collectionManager"));
exports.CollectionManager = collectionManager_1.default;
const fields_1 = __importStar(require("./ts/fields"));
exports.fields = fields_1.default;
Object.defineProperty(exports, "BooleanField", { enumerable: true, get: function () { return fields_1.BooleanField; } });
Object.defineProperty(exports, "CharField", { enumerable: true, get: function () { return fields_1.CharField; } });
Object.defineProperty(exports, "Field", { enumerable: true, get: function () { return fields_1.Field; } });
Object.defineProperty(exports, "IdField", { enumerable: true, get: function () { return fields_1.IdField; } });
Object.defineProperty(exports, "IntegerField", { enumerable: true, get: function () { return fields_1.IntegerField; } });
Object.defineProperty(exports, "ArrayField", { enumerable: true, get: function () { return fields_1.ArrayField; } });
Object.defineProperty(exports, "ModelField", { enumerable: true, get: function () { return fields_1.ModelField; } });
const model_1 = __importDefault(require("./ts/model"));
const pagination_1 = __importStar(require("./ts/pagination"));
exports.Pagination = pagination_1.default;
Object.defineProperty(exports, "PaginationDefaults", { enumerable: true, get: function () { return pagination_1.PaginationDefaults; } });
var v2_1 = require("./ts/v2");
Object.defineProperty(exports, "createApi", { enumerable: true, get: function () { return v2_1.createApi; } });
exports.default = model_1.default;
