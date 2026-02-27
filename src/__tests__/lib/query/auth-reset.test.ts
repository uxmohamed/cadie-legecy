const mockDel = jest.fn();
const mockCreateStore = jest.fn(() => ({ dbName: "caddy-cache", storeName: "query-cache" }));

jest.mock("idb-keyval", () => ({
  createStore: mockCreateStore,
  set: jest.fn(),
  get: jest.fn(),
  del: mockDel,
}));

import { clearAllCaches } from "@/lib/query/auth-reset";
import { CACHE_KEY, QUERY_CACHE_STORE } from "@/lib/query/persister";
import type { QueryClient } from "@tanstack/react-query";

describe("clearAllCaches", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("clears query client and removes persisted cache from the custom IndexedDB store", async () => {
    const queryClient = { clear: jest.fn() } as unknown as QueryClient;
    mockDel.mockResolvedValue(undefined);

    await clearAllCaches(queryClient);

    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(mockDel).toHaveBeenCalledTimes(1);
    expect(mockDel).toHaveBeenCalledWith(CACHE_KEY, QUERY_CACHE_STORE);
  });

  it("logs a warning when IndexedDB cache deletion fails", async () => {
    const queryClient = { clear: jest.fn() } as unknown as QueryClient;
    const error = new Error("idb failed");
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockDel.mockRejectedValue(error);

    await clearAllCaches(queryClient);

    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(mockDel).toHaveBeenCalledWith(CACHE_KEY, QUERY_CACHE_STORE);
    expect(warnSpy).toHaveBeenCalledWith("Failed to clear IndexedDB cache:", error);

    warnSpy.mockRestore();
  });
});
