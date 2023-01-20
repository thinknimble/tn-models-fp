"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCollectionManager = void 0;
const pagination_1 = __importDefault(require("../pagination"));
const pagination_2 = require("./pagination");
//TODO: work in inference here
//TODO: probably move to another file such as it is with previous version.
const createCollectionManager = ({ fetchList, list: feedList, filters, pagination: feedPagination = pagination_1.default.create(), entityZodShape, refreshing: feedRefreshing = false, loadingNextPage: feedLoadingNextPage = false, }) => {
    let list = feedList !== null && feedList !== void 0 ? feedList : [];
    let pagination = feedPagination;
    //? how to manage state here and make it persistable? I am not sure whether primitives are going to work?
    let refreshing = feedRefreshing;
    let loadingNextPage = feedLoadingNextPage;
    const update = (data, append = false) => {
        list = [...(append ? list : []), ...data.results];
        pagination = pagination_1.default.create(Object.assign(Object.assign({}, pagination), { next: data.next, previous: data.previous, totalCount: data.count }));
        return;
    };
    const refresh = () => __awaiter(void 0, void 0, void 0, function* () {
        refreshing = true;
        try {
            const res = yield fetchList({ filters, pagination: pagination });
            const parsed = (0, pagination_2.getPaginatedZod)(entityZodShape).parse(res);
            update(parsed);
        }
        finally {
            refreshing = false;
        }
    });
    const nextPage = () => {
        pagination.setNextPage();
        refresh();
    };
    const prevPage = () => {
        pagination.setPrevPage();
        refresh();
    };
    const addNextPage = () => __awaiter(void 0, void 0, void 0, function* () {
        if (pagination.next === null) {
            return;
        }
        loadingNextPage = true;
        pagination = pagination_1.default.create(Object.assign(Object.assign({}, pagination), { page: pagination.page + 1 }));
        try {
            const res = yield fetchList({ filters, pagination });
            const parsed = (0, pagination_2.getPaginatedZod)(entityZodShape).parse(res);
            update(parsed, true);
        }
        finally {
            loadingNextPage = false;
        }
    });
    return {
        update,
        refresh,
        nextPage,
        prevPage,
        addNextPage,
        get refreshing() {
            return refreshing;
        },
        set refreshing(newValue) {
            refreshing = newValue;
        },
        get loadingNextPage() {
            return loadingNextPage;
        },
        set loadingNextPage(newValue) {
            loadingNextPage = newValue;
        },
    };
};
exports.createCollectionManager = createCollectionManager;
