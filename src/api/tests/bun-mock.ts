import { mock } from "bun:test"

const myAxiosMock = {
  post: mock(),
  get: mock(),
  put: mock(),
  delete: mock(),
}

mock.module("axios", () => ({
  default: {
    post: mock(),
    get: mock(),
    put: mock(),
    delete: mock(),
  },
}))
