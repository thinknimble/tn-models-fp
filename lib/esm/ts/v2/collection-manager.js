import Pagination from "../pagination";
import { getPaginatedZod } from "./pagination";
//TODO: work in inference here
//TODO: probably move to another file such as it is with previous version.
export const createCollectionManager = ({ fetchList, list: feedList, filters, pagination: feedPagination = Pagination.create(), entityZodShape, refreshing: feedRefreshing = false, loadingNextPage: feedLoadingNextPage = false, }) => {
    let list = feedList ?? [];
    let pagination = feedPagination;
    //? how to manage state here and make it persistable? I am not sure whether primitives are going to work?
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
        return;
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
    const nextPage = () => {
        pagination.setNextPage();
        refresh();
    };
    const prevPage = () => {
        pagination.setPrevPage();
        refresh();
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
