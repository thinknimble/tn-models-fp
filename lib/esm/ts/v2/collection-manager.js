import Pagination from "../pagination";
import { getPaginatedZod } from "./pagination";
export const createCollectionManager = ({ fetchList, list: feedList, filters, pagination: feedPagination = Pagination.create(), entityZodShape, refreshing: feedRefreshing = false, loadingNextPage: feedLoadingNextPage = false, }) => {
    let list = feedList ?? [];
    let pagination = feedPagination;
    let refreshing = feedRefreshing;
    let loadingNextPage = feedLoadingNextPage;
    const update = (data, append = false) => {
        list = [...(append ? list : []), ...data.results];
        pagination = Pagination.create({
            ...pagination,
            next: data.next,
            previous: data.previous,
            totalCount: data.count,
        });
    };
    const refresh = async () => {
        refreshing = true;
        try {
            const res = await fetchList({ filters, pagination: pagination });
            const parsed = getPaginatedZod(entityZodShape).parse(res);
            update(parsed);
        }
        finally {
            refreshing = false;
        }
    };
    const nextPage = async () => {
        pagination.setNextPage();
        return refresh();
    };
    const prevPage = async () => {
        pagination.setPrevPage();
        return refresh();
    };
    const addNextPage = async () => {
        if (pagination.next === null) {
            return;
        }
        loadingNextPage = true;
        pagination = Pagination.create({
            ...pagination,
            page: pagination.page + 1,
        });
        try {
            const res = await fetchList({ filters, pagination });
            const parsed = getPaginatedZod(entityZodShape).parse(res);
            update(parsed, true);
        }
        finally {
            loadingNextPage = false;
        }
    };
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
