const PaginationDefaults = {
    page: 1,
    totalCount: 0,
    next: null,
    previous: null,
    size: 25,
};
export { PaginationDefaults };
export default class Pagination {
    page;
    totalCount;
    next;
    previous;
    size;
    constructor(opts = {}) {
        const options = { ...PaginationDefaults, ...opts };
        this.page = options.page;
        this.totalCount = options.totalCount;
        this.next = options.next;
        this.previous = options.previous;
        this.size = options.size;
    }
    static create(opts = {}) {
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
        if (this.calcTotalPages) {
            return this.page !== this.calcTotalPages(this);
        }
        else {
            return false;
        }
    }
    get currentPageStart() {
        return this.page > 1 ? (this.page - 1) * this.size : 0;
    }
    get currentPageEnd() {
        return Math.min(this.page > 1 ? this.page * this.size : this.size, this.totalCount);
    }
}
