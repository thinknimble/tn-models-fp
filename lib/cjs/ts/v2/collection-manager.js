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
const createCollectionManager = ({ fetchList, list: feedList, filters, pagination: feedPagination = pagination_1.default.create(), entityZodShape, refreshing: feedRefreshing = false, loadingNextPage: feedLoadingNextPage = false, }) => {
    let list = feedList !== null && feedList !== void 0 ? feedList : [];
    let pagination = feedPagination;
    let refreshing = feedRefreshing;
    let loadingNextPage = feedLoadingNextPage;
    const update = (data, append = false) => {
        list = [...(append ? list : []), ...data.results];
        pagination = pagination_1.default.create(Object.assign(Object.assign({}, pagination), { next: data.next, previous: data.previous, totalCount: data.count }));
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
    const nextPage = () => __awaiter(void 0, void 0, void 0, function* () {
        pagination.setNextPage();
        return refresh();
    });
    const prevPage = () => __awaiter(void 0, void 0, void 0, function* () {
        pagination.setPrevPage();
        return refresh();
    });
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
    };
};
exports.createCollectionManager = createCollectionManager;
