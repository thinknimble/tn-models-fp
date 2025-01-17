"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Pagination: () => Pagination,
  PaginationDefaults: () => PaginationDefaults,
  createApi: () => createApi,
  createApiUtils: () => createApiUtils,
  createCollectionManager: () => createCollectionManager,
  createCustomServiceCall: () => createCustomServiceCall,
  createPaginatedServiceCall: () => createPaginatedServiceCall,
  getPaginatedZod: () => getPaginatedZod,
  parseResponse: () => parseResponse,
  readonly: () => readonly
});
module.exports = __toCommonJS(src_exports);

// src/api/create-api.ts
var import_zod10 = require("zod");

// src/utils/api/api.ts
var import_tn_utils2 = require("@thinknimble/tn-utils");
var import_zod5 = require("zod");

// src/utils/filters.ts
var import_zod = require("zod");
var paginationFiltersZodShape = {
  page: import_zod.z.number(),
  pageSize: import_zod.z.number()
};
var parseFilters = ({
  filters,
  shape
}) => {
  if (!filters || !shape)
    return;
  try {
    const filtersParsed = import_zod.z.object(shape).partial().parse(filters);
    const snakedFilters = objectToSnakeCaseArr(filtersParsed);
    return snakedFilters ? Object.fromEntries(
      Object.entries(snakedFilters).flatMap(([k, v]) => {
        if (["boolean", "number"].includes(typeof v))
          return [[k, v.toString()]];
        if (!v)
          return [];
        return [[k, v]];
      })
    ) : void 0;
  } catch (e) {
    console.error(`${parseFilters.name} - errors`);
    throw e;
  }
};

// src/utils/zod/zod.ts
var import_tn_utils = require("@thinknimble/tn-utils");
var import_zod3 = require("zod");

// src/utils/zod/types.ts
var import_zod2 = require("zod");
var zodPrimitivesList = [
  import_zod2.z.ZodString,
  import_zod2.z.ZodNumber,
  import_zod2.z.ZodDate,
  import_zod2.z.ZodBigInt,
  import_zod2.z.ZodBoolean,
  import_zod2.z.ZodUndefined,
  import_zod2.z.ZodVoid
];

// src/utils/zod/zod.ts
var isZod = (input) => {
  return Boolean(
    input && typeof input === "object" && "_def" in input && input._def && typeof input._def === "object" && "typeName" in input._def
  );
};
var isZodArray = (input) => {
  var _a;
  return isZod(input) && ((_a = input._def) == null ? void 0 : _a.typeName) === import_zod3.z.ZodFirstPartyTypeKind.ZodArray;
};
var isZodObject = (input) => {
  var _a;
  return isZod(input) && ((_a = input._def) == null ? void 0 : _a.typeName) === import_zod3.z.ZodFirstPartyTypeKind.ZodObject;
};
var isZodOptional = (input) => {
  var _a;
  return isZod(input) && ((_a = input._def) == null ? void 0 : _a.typeName) === import_zod3.z.ZodFirstPartyTypeKind.ZodOptional;
};
var isZodNullable = (input) => {
  var _a;
  return isZod(input) && ((_a = input._def) == null ? void 0 : _a.typeName) === import_zod3.z.ZodFirstPartyTypeKind.ZodNullable;
};
var isZodPrimitive = (input) => {
  return isZod(input) && zodPrimitivesList.some((inst) => {
    var _a;
    return ((_a = input._def) == null ? void 0 : _a.typeName) === inst.name;
  });
};
var isZodIntersection = (input) => {
  var _a;
  return isZod(input) && ((_a = input._def) == null ? void 0 : _a.typeName) === import_zod3.z.ZodFirstPartyTypeKind.ZodIntersection;
};
var isZodUnion = (input) => {
  var _a;
  return isZod(input) && ((_a = input._def) == null ? void 0 : _a.typeName) === import_zod3.z.ZodFirstPartyTypeKind.ZodUnion;
};
var isZodBrand = (input) => {
  var _a;
  return isZod(input) && ((_a = input._def) == null ? void 0 : _a.typeName) === import_zod3.z.ZodFirstPartyTypeKind.ZodBranded;
};
var isZodReadonly = (input) => {
  return isZod(input) && isZodBrand(input) && input.description === READONLY_TAG;
};
var isZodVoid = (input) => {
  return isZod(input) && input._def.typeName === import_zod3.z.ZodFirstPartyTypeKind.ZodVoid;
};
var isNativeZodReadonly = (input) => {
  return isZod(input) && input._def.typeName === import_zod3.z.ZodFirstPartyTypeKind.ZodReadonly;
};
function resolveRecursiveZod(zod) {
  if (isZodReadonly(zod)) {
    return zodReadonlyToSnakeRecursive(zod);
  }
  if (isZodBrand(zod)) {
    return zodBrandToSnakeRecursive(zod);
  }
  if (isZodObject(zod)) {
    return zodObjectToSnakeRecursive(zod);
  }
  if (isZodArray(zod)) {
    return zodArrayRecursive(zod);
  }
  if (isZodOptional(zod)) {
    return zodOptionalRecursive(zod);
  }
  if (isZodNullable(zod)) {
    return zodNullableRecursive(zod);
  }
  if (isZodIntersection(zod)) {
    return zodIntersectionRecursive(zod);
  }
  if (isZodUnion(zod)) {
    return zodUnionRecursive(zod);
  }
  if (isNativeZodReadonly(zod)) {
    return zodNativeReadonlyRecursive(zod);
  }
  return zod;
}
function zodArrayRecursive(zodArray) {
  const innerElement = zodArray.element;
  return resolveRecursiveZod(innerElement).array();
}
function zodNullableRecursive(zodNullable) {
  const unwrapped = zodNullable.unwrap();
  return resolveRecursiveZod(unwrapped).nullable();
}
function zodOptionalRecursive(zodOptional) {
  const unwrapped = zodOptional.unwrap();
  return resolveRecursiveZod(unwrapped).optional();
}
function zodIntersectionRecursive(zod) {
  const { left, right } = zod._def;
  return resolveRecursiveZod(left).and(resolveRecursiveZod(right));
}
function zodUnionRecursive(zod) {
  const allUnions = zod._def.options;
  const remapped = allUnions.map((u) => resolveRecursiveZod(u));
  return import_zod3.z.union(remapped);
}
function zodNativeReadonlyRecursive(zodReadonly) {
  const unwrapped = zodReadonly.unwrap();
  return resolveRecursiveZod(unwrapped).readonly();
}
function zodObjectToSnakeRecursive(zodObj) {
  const resultingShape = Object.fromEntries(
    Object.entries(zodObj.shape).map(([k, v]) => {
      const snakeCasedKey = (0, import_tn_utils.toSnakeCase)(k);
      return [snakeCasedKey, resolveRecursiveZod(v)];
    })
  );
  return zodObj._def.unknownKeys === "passthrough" ? import_zod3.z.object(resultingShape).passthrough() : import_zod3.z.object(resultingShape);
}
function zodReadonlyToSnakeRecursive(zodBrand) {
  return readonly(resolveRecursiveZod(zodBrand.unwrap()));
}
function zodBrandToSnakeRecursive(zodBrand) {
  return resolveRecursiveZod(zodBrand.unwrap()).brand();
}
var READONLY_TAG = "ReadonlyField";
var readonly = (zod) => {
  return zod.brand(READONLY_TAG).describe(READONLY_TAG);
};

// src/utils/response.ts
var parseResponse = ({
  identifier,
  data,
  zod,
  onError = (err) => {
    console.debug(
      `Response to service call with identifier < ${identifier} > did not match expected type,
 errors:`,
      err
    );
  }
}) => {
  const safeParse = isZodObject(zod) ? zod.passthrough().safeParse : zod.safeParse;
  const parsed = safeParse(data);
  if (!parsed.success) {
    onError == null ? void 0 : onError(parsed.error);
    return data;
  }
  return parsed.data;
};

// src/utils/api/api.ts
var objectToCamelCaseArr = (obj) => {
  if (typeof obj !== "object" || obj === null)
    return obj;
  if (Array.isArray(obj))
    return obj.map((o) => objectToCamelCaseArr(o));
  const entries = Object.entries(obj);
  const newEntries = [];
  for (const [k, v] of entries) {
    newEntries.push([(0, import_tn_utils2.toCamelCase)(k), objectToCamelCaseArr(v)]);
  }
  return Object.fromEntries(newEntries);
};
var objectToSnakeCaseArr = (obj) => {
  if (typeof obj !== "object" || obj === null)
    return obj;
  if (Array.isArray(obj))
    return obj.map((o) => objectToSnakeCaseArr(o));
  const entries = Object.entries(obj);
  const newEntries = [];
  for (const [k, v] of entries) {
    newEntries.push([(0, import_tn_utils2.toSnakeCase)(k), objectToSnakeCaseArr(v)]);
  }
  return Object.fromEntries(newEntries);
};
var createToApiHandler = (inputShape) => {
  if (isZodArray(inputShape)) {
    return (arr) => {
      try {
        if (typeof (arr == null ? void 0 : arr[0]) === "object") {
          return resolveRecursiveZod(inputShape).parse(arr.map((i) => objectToSnakeCaseArr(i)));
        }
      } catch (e) {
        console.error(`${createToApiHandler.name} - error`, e);
        throw e;
      }
      return arr;
    };
  }
  if (isZodPrimitive(inputShape))
    return;
  return (obj) => {
    try {
      const result = zodObjectToSnakeRecursive(import_zod5.z.object(inputShape)).parse(objectToSnakeCaseArr(obj));
      return result;
    } catch (e) {
      console.error(`${createToApiHandler.name} - error`, e);
      throw e;
    }
  };
};
var createFromApiHandler = ({
  outputShape,
  callerName,
  disableLoggingWarning
}) => {
  const isOutputZodArray = isZodArray(outputShape);
  const isOutputZodPrimitive = isZodPrimitive(outputShape);
  if (isOutputZodArray) {
    return (obj) => parseResponse({
      identifier: callerName,
      data: typeof (obj == null ? void 0 : obj[0]) === "object" && obj ? obj.map((o) => objectToCamelCaseArr(o)) : obj,
      zod: outputShape,
      onError: disableLoggingWarning ? null : void 0
    });
  }
  if (isOutputZodPrimitive)
    return;
  return (obj) => {
    var _a;
    return parseResponse({
      identifier: callerName,
      data: (_a = objectToCamelCaseArr(obj)) != null ? _a : {},
      zod: import_zod5.z.object(outputShape),
      onError: disableLoggingWarning ? null : void 0
    });
  };
};
function createApiUtils(args) {
  if (!("inputShape" in args || "outputShape" in args))
    return {};
  const fromApi = "outputShape" in args ? createFromApiHandler({
    outputShape: args.outputShape,
    callerName: args.name,
    disableLoggingWarning: args.disableLoggingWarning
  }) : void 0;
  const toApi = "inputShape" in args ? createToApiHandler(args.inputShape) : void 0;
  return fromApi || toApi ? {
    utils: __spreadValues(__spreadValues({}, fromApi ? { fromApi } : {}), toApi ? { toApi } : {})
  } : {};
}
var createCustomServiceCallHandler = ({
  client,
  serviceCallOpts,
  baseUri,
  name
}) => (args) => __async(void 0, null, function* () {
  const expectsInput = !isZodVoid(serviceCallOpts.inputShape);
  const hasPagination = (argCheck) => Boolean(
    typeof argCheck === "object" && argCheck && ("pagination" in argCheck || "input" in argCheck && typeof argCheck.input === "object" && argCheck.input && "pagination" in argCheck.input)
  );
  const expectsFilters = !isZodVoid(serviceCallOpts.filtersShape);
  const utils = createApiUtils({
    name: name != null ? name : "No-Name call",
    inputShape: serviceCallOpts.inputShape,
    outputShape: serviceCallOpts.outputShape
  });
  const baseArgs = __spreadValues({
    client,
    slashEndingBaseUri: baseUri
  }, utils);
  if (expectsFilters) {
    return serviceCallOpts.callback(__spreadProps(__spreadValues(__spreadValues({}, baseArgs), expectsInput || hasPagination(args) ? {
      input: args && typeof args === "object" && "input" in args ? args.input : (
        // TODO: probably can improve these below with two different type guards
        hasPagination(args) && !expectsInput && "pagination" in args ? { input: args.pagination } : hasPagination(args) && "input" in args ? { input: args.input } : void 0
      )
    } : {}), {
      parsedFilters: args && typeof args === "object" && "filters" in args ? parseFilters({ shape: serviceCallOpts.filtersShape, filters: args.filters }) : void 0
    }));
  }
  return serviceCallOpts.callback(__spreadValues(__spreadValues({}, baseArgs), expectsInput || hasPagination(args) ? { input: args } : {}));
});
var removeReadonlyFields = (shape, unwrap) => {
  const nonReadonlyEntries = [];
  const allEntries = Object.entries(shape);
  for (const [k, v] of allEntries) {
    if (isZodReadonly(v)) {
      if (unwrap && unwrap.includes(k)) {
        nonReadonlyEntries.push([k, v.unwrap()]);
        continue;
      }
      continue;
    }
    nonReadonlyEntries.push([k, v]);
  }
  return Object.fromEntries(nonReadonlyEntries);
};

// src/utils/pagination.ts
var import_zod7 = require("zod");
var getPaginatedShape = (zodRawShape, options = { allowPassthrough: false }) => {
  const zObject = options.allowPassthrough ? import_zod7.z.object(zodRawShape).passthrough() : import_zod7.z.object(zodRawShape);
  return {
    count: import_zod7.z.number(),
    next: import_zod7.z.string().nullable(),
    previous: import_zod7.z.string().nullable(),
    results: import_zod7.z.array(zodObjectToSnakeRecursive(zObject))
  };
};
var getPaginatedSnakeCasedZod = (zodRawShape) => import_zod7.z.object(getPaginatedShape(zodRawShape, { allowPassthrough: true })).passthrough();
var getPaginatedZod = (zodRawShape) => import_zod7.z.object({
  count: import_zod7.z.number(),
  next: import_zod7.z.string().nullable(),
  previous: import_zod7.z.string().nullable(),
  results: import_zod7.z.array(import_zod7.z.object(zodRawShape))
});
var PaginationDefaults = {
  page: 1,
  totalCount: 0,
  next: null,
  previous: null,
  size: 25
};
var Pagination = class {
  constructor(opts) {
    const options = __spreadValues(__spreadValues({}, PaginationDefaults), opts != null ? opts : {});
    this.page = options.page;
    this.totalCount = options.totalCount;
    this.next = options.next;
    this.previous = options.previous;
    this.size = options.size;
  }
  static create(opts) {
    return new Pagination(opts);
  }
  copy() {
    return Pagination.create(this);
  }
  update(data = {}) {
    return Object.assign(this.copy(), data);
  }
  calcTotalPages(pagination) {
    const { totalCount, size } = pagination;
    if (!totalCount) {
      return 0;
    }
    return Math.ceil(totalCount / size);
  }
  setNextPage() {
    if (this.page === this.calcTotalPages(this))
      return;
    this.page++;
  }
  setPrevPage() {
    if (this.page === 1)
      return;
    this.page--;
  }
  get hasPrevPage() {
    return this.page > 1;
  }
  get hasNextPage() {
    if (this.calcTotalPages(this)) {
      return this.page !== this.calcTotalPages(this);
    } else {
      return false;
    }
  }
  get currentPageStart() {
    return this.page > 1 ? (this.page - 1) * this.size : 0;
  }
  get currentPageEnd() {
    return Math.min(this.page > 1 ? this.page * this.size : this.size, this.totalCount);
  }
};

// src/utils/types.ts
{
}
{
}

// src/utils/common.ts
function defineProperty(obj, key, value) {
  Object.defineProperty(obj, key, {
    value
  });
}

// src/api/create-custom-call.ts
var import_zod9 = require("zod");
var createCustomServiceCall = (args) => {
  const inputShape = typeof args === "function" || !args.inputShape ? import_zod9.z.void() : args.inputShape;
  const outputShape = typeof args === "function" || !args.outputShape ? import_zod9.z.void() : args.outputShape;
  const filtersShape = typeof args === "function" || !args.outputShape || !("filtersShape" in args) ? import_zod9.z.void() : args.filtersShape;
  const callback = typeof args === "function" ? args : args.cb;
  return {
    inputShape,
    outputShape,
    callback,
    filtersShape
  };
};
var standAlone = (args) => {
  var _a, _b, _c;
  const inputShape = (_a = args.models && "inputShape" in args.models ? args.models.inputShape : void 0) != null ? _a : import_zod9.z.void();
  const outputShape = (_b = args.models && "outputShape" in args.models ? args.models.outputShape : void 0) != null ? _b : import_zod9.z.void();
  const filtersShape = (_c = args.models && "filtersShape" in args.models ? args.models.filtersShape : void 0) != null ? _c : import_zod9.z.void();
  const result = createCustomServiceCall({
    inputShape,
    outputShape,
    filtersShape,
    cb: args.cb
    //TODO: check whether we can avoid any in these situations
  });
  return createCustomServiceCallHandler({
    client: args.client,
    serviceCallOpts: result,
    name: args.name
  });
};
createCustomServiceCall.standAlone = standAlone;

// src/api/create-api.ts
var createApi = (args) => {
  var _a;
  const { baseUri, client, customCalls, models, options } = args;
  if (models && "create" in models && !("entity" in models)) {
    throw new Error("You should not pass `create` model without an `entity` model");
  }
  const parsedEndingSlash = (options == null ? void 0 : options.disableTrailingSlash) ? "" : "/";
  const slashEndingBaseUri = baseUri[baseUri.length - 1] === "/" ? baseUri : baseUri + "/";
  const parsedBaseUri = ((_a = args.options) == null ? void 0 : _a.disableTrailingSlash) ? slashEndingBaseUri.substring(0, slashEndingBaseUri.length - 1) : slashEndingBaseUri;
  const axiosLikeClient = client;
  const modifiedCustomServiceCalls = customCalls ? Object.fromEntries(
    Object.entries(customCalls).map(([k, v]) => [
      k,
      createCustomServiceCallHandler({
        client: axiosLikeClient,
        serviceCallOpts: v,
        baseUri: slashEndingBaseUri,
        name: k
      })
    ])
  ) : void 0;
  if (!models && modifiedCustomServiceCalls) {
    return {
      client: axiosLikeClient,
      customServiceCalls: modifiedCustomServiceCalls,
      csc: modifiedCustomServiceCalls
      //TODO: remove any
    };
  }
  if (!models || !models.entity) {
    return { client: axiosLikeClient };
  }
  const entityShapeWithoutReadonlyFields = removeReadonlyFields(models.entity, ["id"]);
  const create = (inputs) => __async(void 0, null, function* () {
    let entityShapeWithoutReadonlyFieldsNorId = entityShapeWithoutReadonlyFields;
    if ("id" in entityShapeWithoutReadonlyFields) {
      const _a2 = entityShapeWithoutReadonlyFields, { id: _ } = _a2, rest = __objRest(_a2, ["id"]);
      entityShapeWithoutReadonlyFieldsNorId = rest;
    }
    const inputShape = "create" in models && models.create ? removeReadonlyFields(models.create) : entityShapeWithoutReadonlyFieldsNorId;
    const { utils } = createApiUtils({
      inputShape,
      name: create.name,
      outputShape: models.entity
    });
    const res = yield axiosLikeClient.post(parsedBaseUri, utils.toApi(inputs));
    return utils.fromApi(res.data);
  });
  const retrieve = (id) => __async(void 0, null, function* () {
    const { utils } = createApiUtils({
      name: retrieve.name,
      outputShape: models.entity
    });
    const res = yield axiosLikeClient.get(`${slashEndingBaseUri}${id}${parsedEndingSlash}`);
    return utils.fromApi(res.data);
  });
  const list = (params) => __async(void 0, null, function* () {
    var _a2;
    const filters = params ? params.filters : void 0;
    const pagination = params ? params.pagination : void 0;
    const filtersParsed = models.extraFilters ? parseFilters({ shape: models.extraFilters, filters }) : void 0;
    const paginationFilters = parseFilters({
      shape: paginationFiltersZodShape,
      filters: pagination ? { page: pagination.page, pageSize: pagination.size } : void 0
    });
    const allFilters = filtersParsed || paginationFilters ? __spreadValues(__spreadValues({}, filtersParsed != null ? filtersParsed : {}), paginationFilters != null ? paginationFilters : {}) : void 0;
    const paginatedZod = getPaginatedSnakeCasedZod(models.entity);
    const res = yield axiosLikeClient.get(parsedBaseUri, {
      params: allFilters
    });
    const rawResponse = parseResponse({
      identifier: list.name,
      data: res.data,
      zod: paginatedZod,
      onError: ((_a2 = args.options) == null ? void 0 : _a2.disableWarningLogging) ? null : void 0
    });
    return __spreadProps(__spreadValues({}, rawResponse), { results: rawResponse.results.map((r) => objectToCamelCaseArr(r)) });
  });
  const remove = (id) => {
    return client.delete(`${slashEndingBaseUri}${id}${parsedEndingSlash}`);
  };
  const updateBase = (_0) => __async(void 0, [_0], function* ({
    httpMethod = "patch",
    type = "partial",
    newValue
  }) {
    if (!("id" in newValue)) {
      console.error("The update body needs an id to use this method");
      return;
    }
    const entityWithoutReadonlyFieldsZod = import_zod10.z.object(entityShapeWithoutReadonlyFields);
    const finalEntityZod = type === "partial" ? entityWithoutReadonlyFieldsZod.partial() : entityWithoutReadonlyFieldsZod;
    try {
      const parsedInput = finalEntityZod.parse(newValue);
      const updateCall = createCustomServiceCall.standAlone({
        client,
        models: {
          inputShape: finalEntityZod.shape,
          outputShape: models.entity
        },
        cb: (_02) => __async(void 0, [_02], function* ({ client: client2, input, utils }) {
          const _a2 = utils.toApi(input), { id } = _a2, body = __objRest(_a2, ["id"]);
          const result = yield client2[httpMethod](`${slashEndingBaseUri}${id}${parsedEndingSlash}`, body);
          return utils.fromApi(result == null ? void 0 : result.data);
        })
      });
      return updateCall(parsedInput);
    } catch (e) {
      console.error(`${updateBase.name} - error`, e);
      throw e;
    }
  });
  const update = (args2) => __async(void 0, null, function* () {
    return updateBase({ newValue: args2, httpMethod: "patch", type: "partial" });
  });
  defineProperty(
    update,
    "replace",
    (args2) => __async(void 0, null, function* () {
      return updateBase({ newValue: args2, httpMethod: "put", type: "total" });
    })
  );
  defineProperty(
    update.replace,
    "asPartial",
    (inputs) => updateBase({ newValue: inputs, httpMethod: "put", type: "partial" })
  );
  const upsert = (args2) => __async(void 0, null, function* () {
    if ("id" in args2 && args2.id) {
      return updateBase({
        newValue: args2
      });
    } else {
      return create(args2);
    }
  });
  const baseReturn = { client: axiosLikeClient, retrieve, list, remove, update, create, upsert };
  if (!modifiedCustomServiceCalls)
    return baseReturn;
  return __spreadProps(__spreadValues({}, baseReturn), {
    customServiceCalls: modifiedCustomServiceCalls,
    csc: modifiedCustomServiceCalls
  });
};

// src/api/create-paginated-call.ts
var import_zod11 = require("zod");
var paginationObjShape = {
  pagination: import_zod11.z.instanceof(Pagination)
};
var createPaginatedServiceCall = ({
  inputShape,
  outputShape,
  filtersShape,
  opts
}) => {
  var _a;
  const uri = opts == null ? void 0 : opts.uri;
  const httpMethod = (_a = opts == null ? void 0 : opts.httpMethod) != null ? _a : "get";
  const filtersShapeResolved = filtersShape && Object.keys(filtersShape).length ? filtersShape : void 0;
  if (!outputShape) {
    throw new Error("You should provide an output shape ");
  }
  if (inputShape && "urlParams" in inputShape && typeof (opts == null ? void 0 : opts.uri) !== "function") {
    throw new Error("If you provide url params you should pass an uri builder function in opts.uri");
  }
  const newOutputShape = getPaginatedShape(outputShape);
  const callback = (_0) => __async(void 0, [_0], function* ({ client, slashEndingBaseUri, utils, input, parsedFilters }) {
    var _a2, _c;
    const paginationFilters = input.pagination ? { page: input.pagination.page, pageSize: input.pagination.size } : void 0;
    const parsedPaginationFilters = (_a2 = parseFilters({ shape: paginationFiltersZodShape, filters: paginationFilters })) != null ? _a2 : {};
    const snakedCleanParsedFilters = __spreadValues(__spreadValues({}, parsedPaginationFilters), parsedFilters != null ? parsedFilters : {});
    let res;
    let parsedInput = input;
    let parsedUrlParams;
    if ("urlParams" in input) {
      const _b = input, { urlParams } = _b, rest = __objRest(_b, ["urlParams"]);
      parsedUrlParams = urlParams;
      parsedInput = rest;
    }
    const resolvedUri = parsedUrlParams && typeof uri === "function" ? uri(parsedUrlParams) : typeof uri !== "function" ? uri != null ? uri : "" : "";
    const makeSlashEnding = (str) => {
      return str ? str[str.length - 1] === "/" ? str : str + "/" : "";
    };
    const slashEndingUri = makeSlashEnding(resolvedUri);
    const fullUri = `${slashEndingBaseUri}${slashEndingUri}`;
    if (httpMethod === "get") {
      res = yield client.get(fullUri, {
        params: snakedCleanParsedFilters
      });
    } else {
      const _d = (_c = utils.toApi(parsedInput)) != null ? _c : {}, { pagination: _ } = _d, body = __objRest(_d, ["pagination"]);
      const validBody = Object.keys(body).length !== 0 ? body : void 0;
      res = yield client.post(fullUri, validBody, {
        params: snakedCleanParsedFilters
      });
    }
    const paginatedZod = getPaginatedSnakeCasedZod(outputShape);
    const rawResponse = parseResponse({
      data: res.data,
      identifier: "custom-paginated-call",
      zod: paginatedZod,
      onError: (opts == null ? void 0 : opts.disableLoggingWarning) ? null : void 0
    });
    const result = __spreadProps(__spreadValues({}, rawResponse), { results: rawResponse.results.map((r) => objectToCamelCaseArr(r)) });
    return result;
  });
  if (inputShape) {
    return {
      callback,
      inputShape,
      outputShape: newOutputShape,
      filtersShape: filtersShapeResolved != null ? filtersShapeResolved : import_zod11.z.void()
    };
  }
  return {
    callback,
    inputShape: import_zod11.z.void(),
    outputShape: newOutputShape,
    filtersShape: filtersShapeResolved != null ? filtersShapeResolved : import_zod11.z.void()
  };
};

// src/collection-manager/index.ts
var createCollectionManager = ({
  fetchList,
  list: feedList,
  filters,
  pagination: feedPagination = Pagination.create(),
  refreshing: feedRefreshing = false,
  loadingNextPage: feedLoadingNextPage = false
}) => {
  let list = feedList != null ? feedList : [];
  let pagination = feedPagination;
  let refreshing = feedRefreshing;
  let loadingNextPage = feedLoadingNextPage;
  const update = (data, append = false) => {
    list = [...append ? list : [], ...data.results];
    pagination = Pagination.create(__spreadProps(__spreadValues({}, pagination), {
      next: data.next,
      previous: data.previous,
      totalCount: data.count
    }));
  };
  const refresh = () => __async(void 0, null, function* () {
    refreshing = true;
    try {
      const res = yield fetchList({ filters, pagination });
      update(res);
    } finally {
      refreshing = false;
    }
  });
  const nextPage = () => __async(void 0, null, function* () {
    pagination.setNextPage();
    return refresh();
  });
  const prevPage = () => __async(void 0, null, function* () {
    pagination.setPrevPage();
    return refresh();
  });
  const addNextPage = () => __async(void 0, null, function* () {
    if (pagination.next === null) {
      return;
    }
    loadingNextPage = true;
    pagination = Pagination.create(__spreadProps(__spreadValues({}, pagination), {
      page: pagination.page + 1
    }));
    try {
      const res = yield fetchList({ filters, pagination });
      update(res, true);
    } finally {
      loadingNextPage = false;
    }
  });
  return {
    update,
    refresh,
    nextPage,
    prevPage,
    addNextPage,
    //TODO: I'd like someone to give this a shot in a vue app so that we can tell whether it works as expected (as a piece of state?)
    get list() {
      return list;
    },
    get refreshing() {
      return refreshing;
    },
    //? do we need a setter for this or should it just be changeable from within
    set refreshing(newValue) {
      refreshing = newValue;
    },
    get loadingNextPage() {
      return loadingNextPage;
    },
    //? same question for this setter
    set loadingNextPage(newValue) {
      loadingNextPage = newValue;
    },
    get pagination() {
      return pagination;
    },
    filters
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Pagination,
  PaginationDefaults,
  createApi,
  createApiUtils,
  createCollectionManager,
  createCustomServiceCall,
  createPaginatedServiceCall,
  getPaginatedZod,
  parseResponse,
  readonly
});
//! trying to use the above list to create these types is failing bc of the class nature of the zod types
//!Good attempt but cannot use this with generic in createApi
//! `instanceof` and `z.instanceof` (which might be using the built-in instanceof keyword) does not compile well when using this library in certain node environments so this has been causing a lot of trouble for some users and myself to debug. Will likely have to do
//! we can't use `instanceof` due to some weird compilation error which we need to investigate. So we're going to old-school duck type here
//! could not escape of these any here. in the three functions below
//! This would send all other things that are not shapes (and not primitives) such as unions and intersections down the drain since we don't have support for those in outputShapes.
//! this is a bit painful to look at but I feel it is a good UX so that we don't make Users go through updateBase params
//! although this claims not to be of the same type than our converted TOutput, it actually is, but all the added type complexity with camel casing util makes TS to think it is something different. It should be safe to cast this, we should definitely check this at runtime with tests
