const mockSet = jest.fn();
const mockGet = jest.fn();
const mockDel = jest.fn();
const mockCreateStore = jest.fn(() => ({ dbName: "caddy-cache", storeName: "query-cache" }));

jest.mock("idb-keyval", () => ({
  createStore: mockCreateStore,
  set: mockSet,
  get: mockGet,
  del: mockDel,
}));

import {
  createIDBPersister,
  getQueryCacheKey,
  QUERY_CACHE_SCHEMA_VERSION,
  QUERY_CACHE_STORE,
} from "@/lib/query/persister";
import type { PersistedClient } from "@tanstack/react-query-persist-client";

describe("query persister", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds a user-scoped cache key with the schema version", () => {
    expect(getQueryCacheKey("user-42")).toBe(
      `tanstack-query-cache:${QUERY_CACHE_SCHEMA_VERSION}:user:user-42`
    );
  });

  it("reads and writes persisted data using the active user's cache scope", async () => {
    const persister = createIDBPersister({ userId: "user-42" });
    const client = { timestamp: 1, buster: "b", clientState: { queries: [], mutations: [] } } as PersistedClient;
    mockGet.mockResolvedValue(client);
    mockSet.mockResolvedValue(undefined);
    mockDel.mockResolvedValue(undefined);

    await persister.persistClient(client);
    await persister.restoreClient();
    await persister.removeClient();

    const expectedKey = getQueryCacheKey("user-42");

    expect(mockSet).toHaveBeenCalledWith(expectedKey, client, QUERY_CACHE_STORE);
    expect(mockGet).toHaveBeenCalledWith(expectedKey, QUERY_CACHE_STORE);
    expect(mockDel).toHaveBeenCalledWith(expectedKey, QUERY_CACHE_STORE);
  });
});
